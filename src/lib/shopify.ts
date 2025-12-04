import axios from 'axios';
import { ProductDetails } from './types';

const SHOP_NAME = process.env.SHOPIFY_SHOP_NAME;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2024-01';

const getClient = () => {
    if (!SHOP_NAME || !ACCESS_TOKEN) {
        console.warn('Shopify credentials missing');
        return null;
    }
    return axios.create({
        baseURL: `https://${SHOP_NAME}/admin/api/${API_VERSION}`,
        headers: {
            'X-Shopify-Access-Token': ACCESS_TOKEN,
            'Content-Type': 'application/json',
        },
    });
};

export async function createShopifyProduct(details: ProductDetails, customData?: any) {
    const client = getClient();
    if (!client) return null;

    const product = {
        title: customData?.title || details.description,
        body_html: customData?.description || `<strong>Brand:</strong> ${details.brand || 'N/A'}<br><strong>Supplier:</strong> ${details.supplier}`,
        vendor: details.brand || details.supplier,
        product_type: 'Part',
        variants: [
            {
                price: customData?.price || details.price.retail,
                sku: details.sku,
                inventory_management: 'shopify',
                inventory_policy: 'deny',
                barcode: details.upc,
                weight: details.weight?.value,
                weight_unit: details.weight?.unit?.toLowerCase(),
                // Set initial inventory if needed, but usually requires a separate call to inventory levels in newer API versions
                // For simple creation, we can try setting it here, but it might be ignored.
            }
        ],
        images: details.image ? [{ src: details.image }] : [],
    };

    try {
        const response = await client.post('/products.json', { product });
        return response.data.product;
    } catch (error: any) {
        console.error('Error creating Shopify product:', error?.response?.data || error);
        throw error;
    }
}
