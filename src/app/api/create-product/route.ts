import { NextResponse } from 'next/server';
import { createShopifyProduct } from '@/lib/shopify';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { productDetails, customData } = body;

        if (!productDetails) {
            return NextResponse.json({ error: 'Product details are required' }, { status: 400 });
        }

        const product = await createShopifyProduct(productDetails, customData);

        if (!product) {
            return NextResponse.json({ error: 'Failed to create product. Check Shopify credentials in .env.local' }, { status: 500 });
        }

        return NextResponse.json({ product });
    } catch (error: any) {
        console.error('Create product error:', error);
        console.error('Error response data:', error?.response?.data);
        const errorMessage = error?.response?.data?.errors || error.message || 'Failed to create product';
        return NextResponse.json({ error: JSON.stringify(errorMessage) }, { status: 500 });
    }
}
