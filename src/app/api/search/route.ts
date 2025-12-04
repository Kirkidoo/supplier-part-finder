import { NextResponse } from 'next/server';
import { searchThibaultPart } from '@/lib/api/thibault';
import { searchMotovanPart } from '@/lib/api/motovan';
import { ProductDetails } from '@/lib/types';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const partNumbers = searchParams.get('partNumber');
    const supplier = searchParams.get('supplier') || 'both';

    if (!partNumbers) {
        return NextResponse.json({ error: 'Part number is required' }, { status: 400 });
    }

    // Split by comma, space, or newline and clean up
    const skuList = partNumbers
        .split(/[,\s\n]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

    // If single SKU, return old format for backward compatibility
    if (skuList.length === 1) {
        const partNumber = skuList[0];
        try {
            let thibault = null;
            let motovan = null;

            if (supplier === 'both') {
                [thibault, motovan] = await Promise.all([
                    searchThibaultPart(partNumber),
                    searchMotovanPart(partNumber),
                ]);
            } else if (supplier === 'thibault') {
                thibault = await searchThibaultPart(partNumber);
            } else if (supplier === 'motovan') {
                motovan = await searchMotovanPart(partNumber);
            }

            return NextResponse.json({ thibault, motovan });
        } catch (error) {
            console.error('Search error:', error);
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
    }

    // Multiple SKUs - return array of results
    try {
        const results: ProductDetails[] = [];

        for (const sku of skuList) {
            let thibault = null;
            let motovan = null;

            if (supplier === 'both') {
                [thibault, motovan] = await Promise.all([
                    searchThibaultPart(sku),
                    searchMotovanPart(sku),
                ]);
            } else if (supplier === 'thibault') {
                thibault = await searchThibaultPart(sku);
            } else if (supplier === 'motovan') {
                motovan = await searchMotovanPart(sku);
            }

            // Add found products to results
            if (thibault) results.push(thibault);
            if (motovan) results.push(motovan);
        }

        return NextResponse.json({ multiSku: true, results });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
