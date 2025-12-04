import axios from 'axios';
import { ProductDetails } from '../types';

const BASE_URL = 'https://api.motovan.com';

const getClient = () => {
    const token = process.env.MOTOVAN_API_KEY;
    if (!token) {
        // throw new Error('MOTOVAN_API_KEY is not set');
        console.warn('MOTOVAN_API_KEY is not set');
        return null;
    }
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            'X-Api-Key': token,
            'Content-Type': 'application/json',
        },
    });
};

export async function searchMotovanPart(partNumber: string): Promise<ProductDetails | null> {
    const client = getClient();
    const customerNumber = process.env.MOTOVAN_CUSTOMER_NUMBER;

    if (!client || !customerNumber) {
        console.warn('MOTOVAN credentials missing');
        return null;
    }

    try {
        // 1. Get Part Info
        const infoRes = await client.get(`/part_info`, {
            params: { customerNumber, partNumber, language: 'en' }
        });
        const info = infoRes.data;

        // 2. Get Inventory
        const stockRes = await client.get(`/inventory`, {
            params: { customerNumber, partNumber }
        });
        const stock = stockRes.data;

        // 3. Get Pricing
        const priceRes = await client.get(`/pricing`, {
            params: { customerNumber, partNumber }
        });
        const price = priceRes.data;

        return {
            supplier: 'Motovan',
            sku: info.partNumber || partNumber,
            description: info.description,
            price: {
                retail: price.retailPrice || 0,
                dealer: price.dealerPrice,
                net: price.netPrice,
                currency: price.currency,
            },
            stock: stock.inventoryLvl?.map((inv: any) => ({
                quantity: inv.quantity,
                status: stock.partStatus,
                warehouse: inv.warehouse,
            })) || [],
            brand: info.brand,
            upc: info.upcCode,
        };
    } catch (error) {
        console.error('Error fetching Motovan data:', error);
        return null;
    }
}
