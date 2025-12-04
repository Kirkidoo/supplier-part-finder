import axios from 'axios';
import { ProductDetails } from '../types';

const BASE_URL = 'https://api.importationsthibault.com/api/v1';

const getClient = () => {
    const token = process.env.THIBAULT_API_KEY;
    console.log('THIBAULT TOKEN:', token ? `${token.substring(0, 10)}...` : 'NOT SET');
    if (!token) {
        // throw new Error('THIBAULT_API_KEY is not set');
        console.warn('THIBAULT_API_KEY is not set');
        return null;
    }
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });
};

export async function searchThibaultPart(sku: string): Promise<ProductDetails | null> {
    const client = getClient();
    if (!client) return null;

    try {
        console.log('Searching Thibault for SKU:', sku);

        // 1. Get Part Info
        console.log('Calling /part_info...');
        const infoRes = await client.get(`/part_info`, { params: { sku, language: 'en' } });
        console.log('Part Info Response:', JSON.stringify(infoRes.data, null, 2));
        const infoItem = Array.isArray(infoRes.data.items) ? infoRes.data.items[0] : infoRes.data.items;

        if (!infoItem) {
            console.log('No items found in part_info response');
            return null;
        }

        // 2. Get Stock
        const stockRes = await client.get(`/stock`, { params: { sku, language: 'en' } });
        const stockItem = Array.isArray(stockRes.data.items) ? stockRes.data.items[0] : stockRes.data.items;

        // 3. Get Pricing
        const priceRes = await client.get(`/pricing`, { params: { sku, language: 'en' } });
        const priceItem = Array.isArray(priceRes.data.items) ? priceRes.data.items[0] : priceRes.data.items;

        return {
            supplier: 'Thibault',
            sku: infoItem.sku,
            description: infoItem.description,
            price: {
                retail: priceItem?.retail || 0,
                dealer: priceItem?.discount?.dealer, // Using dealer discount percentage or value? Docs say "dealer": 30. "net": 52.49.
                net: priceItem?.discount?.net,
                currency: 'CAD', // Assuming CAD
            },
            stock: [{
                quantity: stockItem?.quantity?.value || 0,
                status: stockItem?.status?.back_order ? 'Backorder' : 'In Stock',
                warehouse: 'Main',
            }],
            weight: infoItem.weight ? {
                value: infoItem.weight.value,
                unit: infoItem.weight.unit.code,
            } : undefined,
            upc: infoItem.upc,
        };
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error('Thibault API Error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                url: error.config?.url,
                params: error.config?.params,
            });
        } else {
            console.error('Error fetching Thibault data:', error);
        }
        return null;
    }
}
