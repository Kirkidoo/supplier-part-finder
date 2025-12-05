import { NextResponse } from 'next/server';
import { getProductsByLocation } from '@/lib/shopify';
import { searchThibaultPart } from '@/lib/api/thibault';

// Force dynamic to avoid caching issues with inventory data
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const forceRefresh = searchParams.get('refresh') === 'true';

        const LOCATION_ID = '105008496957';

        // 1. Fetch products from Shopify Location
        const shopifyProducts = await getProductsByLocation(LOCATION_ID, forceRefresh);

        if (!shopifyProducts || shopifyProducts.length === 0) {
            return NextResponse.json({
                message: 'No products found in the specified location.',
                data: []
            });
        }

        console.log(`Analyzing ${shopifyProducts.length} products for discrepancies...`);

        // 2. Fetch Thibault Data for each product
        const BATCH_SIZE = 5;
        const results = [];

        for (let i = 0; i < shopifyProducts.length; i += BATCH_SIZE) {
            const batch = shopifyProducts.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(async (sp) => {
                const sku = sp.sku;
                if (!sku) {
                    return {
                        shopify: sp,
                        thibault: null,
                        status: 'Error: No SKU',
                    };
                }

                try {
                    const thibaultData = await searchThibaultPart(sku);

                    // Determine status logic
                    let status = 'Match';
                    const mismatches = [];

                    if (!thibaultData) {
                        return {
                            shopify: sp,
                            thibault: null,
                            status: 'Not Found in Thibault',
                            mismatches: ['Product not found'],
                        };
                    }

                    // Compare Stock
                    const shopifyStock = sp.available;
                    const thibaultStock = thibaultData.stock[0]?.quantity || 0;

                    if (shopifyStock !== thibaultStock) {
                        mismatches.push(`Stock: ${shopifyStock} vs ${thibaultStock}`);
                    }

                    // Compare Price (Retail)
                    const shopifyPrice = sp.price;
                    const thibaultPrice = thibaultData.price.retail;
                    if (Math.abs(shopifyPrice - thibaultPrice) > 0.01) {
                        mismatches.push(`Price: $${shopifyPrice} vs $${thibaultPrice}`);
                    }

                    // Compare Cost
                    const shopifyCost = Number(sp.cost) || 0;
                    const thibaultCost = thibaultData?.price?.net || 0;
                    if (Math.abs(shopifyCost - thibaultCost) > 0.01) {
                        mismatches.push(`Cost: $${shopifyCost} vs $${thibaultCost}`);
                    }

                    // Compare Barcode
                    if (sp.barcode !== thibaultData.upc) {
                        mismatches.push(`Barcode: ${sp.barcode} vs ${thibaultData.upc}`);
                    }

                    if (mismatches.length > 0) {
                        status = 'Mismatch';
                    }

                    return {
                        shopify: sp,
                        thibault: thibaultData,
                        status,
                        mismatches,
                    };

                } catch (err) {
                    console.error(`Error processing SKU ${sku}:`, err);
                    return {
                        shopify: sp,
                        thibault: null,
                        status: 'Error Fetching Thibault',
                    };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);

            // tiny delay to breathe
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        return NextResponse.json({
            count: results.length,
            data: results,
        });

    } catch (error: any) {
        console.error('Error in comparison API:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
