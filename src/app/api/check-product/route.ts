import { NextResponse } from 'next/server';
import { findProductsBySku } from '@/lib/shopify';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { skus } = body;

        if (!skus || !Array.isArray(skus) || skus.length === 0) {
            return NextResponse.json({ error: 'SKUs array is required' }, { status: 400 });
        }

        const existingProducts = await findProductsBySku(skus);

        return NextResponse.json({
            exists: existingProducts.length > 0,
            products: existingProducts
        });
    } catch (error: any) {
        console.error('Check product error:', error);
        return NextResponse.json({ error: 'Failed to check product existence' }, { status: 500 });
    }
}
