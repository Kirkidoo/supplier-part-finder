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

        const [infoResult, stockResult, priceResult] = await Promise.allSettled([
            client.get(`/part_info`, { params: { sku, language: 'en' } }),
            client.get(`/stock`, { params: { sku, language: 'en' } }),
            client.get(`/pricing`, { params: { sku, language: 'en' } })
        ]);

        // Helper to extract data or log error
        const getData = (result: PromiseSettledResult<any>, name: string) => {
            if (result.status === 'fulfilled') {
                const items = result.value.data.items;
                return Array.isArray(items) ? items[0] : items;
            } else {
                console.error(`Error fetching ${name}:`, result.reason?.message || result.reason);
                return null;
            }
        };

        const infoItem = getData(infoResult, 'part_info');
        const stockItem = getData(stockResult, 'stock');
        const priceItem = getData(priceResult, 'pricing');




        if (!infoItem && !stockItem && !priceItem) {
            console.log('No data found from any endpoint');
            return null;
        }

        // Fallback values if infoItem is missing but others exist
        const description = infoItem?.description || `Product ${sku}`;
        const weightValue = infoItem?.weight?.value || 0;
        const weightUnit = infoItem?.weight?.unit?.code || 'lb';
        const upc = infoItem?.upc || '';

        const productDetails: ProductDetails = {
            supplier: 'Thibault',
            sku: sku, // Use requested SKU if infoItem is missing
            description: description,
            price: {
                retail: priceItem?.retail || 0,
                dealer: priceItem?.discount?.dealer || 0,
                net: priceItem?.net || priceItem?.discount?.net || 0,
                additionalDiscount: priceItem?.discount?.additional || 0,
                dealerDiscount: priceItem?.discount?.dealer || 0,
                currency: 'CAD',
            },
            stock: [{
                quantity: stockItem?.quantity?.value || 0,
                status: stockItem?.status?.back_order ? 'Backorder' : 'In Stock',
                warehouse: 'Main',
            }],
            productStatus: {
                discontinued: infoItem?.status?.discontinued || stockItem?.status?.discontinued || false,
                specialOrder: infoItem?.status?.special_order || stockItem?.status?.special_order || false,
                seasonal: infoItem?.status?.seasonal || stockItem?.status?.seasonal || false,
                oversized: infoItem?.status?.oversized || stockItem?.status?.oversized || false,
            },
            weight: {
                value: weightValue,
                unit: weightUnit,
            },
            upc: upc,
        };

        return productDetails;
    } catch (error: unknown) {
        console.error('Unexpected error in searchThibaultPart:', error);
        return null;
    }
}
