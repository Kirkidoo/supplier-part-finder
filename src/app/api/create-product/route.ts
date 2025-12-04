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
        return NextResponse.json({ product });
    } catch (error: any) {
        console.error('Create product error:', error);
        return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
    }
}
