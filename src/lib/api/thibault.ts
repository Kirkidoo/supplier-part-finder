import axios from 'axios';
import { ProductDetails } from '../types';

const BASE_URL = 'https://api.importationsthibault.com/api/v1';

const getClient = () => {
    const token = process.env.THIBAULT_API_KEY;
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
        // 1. Get Part Info
        const infoRes = await client.get(`/part_info`, { params: { sku, language: 'en' } });
        const infoItem = infoRes.data.items?.[0];

        if (!infoItem) return null;

        // 2. Get Stock
        const stockRes = await client.get(`/stock`, { params: { sku, language: 'en' } });
        const stockItem = stockRes.data.items?.[0];

        // 3. Get Pricing
        const priceRes = await client.get(`/pricing`, { params: { sku, language: 'en' } });
        const priceItem = priceRes.data.items?.[0];

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
    } catch (error) {
        console.error('Error fetching Thibault data:', error);
        return null;
    }
}
