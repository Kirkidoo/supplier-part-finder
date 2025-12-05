import { NextResponse } from 'next/server';
import { searchThibaultPart } from '@/lib/api/thibault';
import { searchMotovanPart } from '@/lib/api/motovan';
import { searchItlFeedGrouped, mapItlToProductDetails } from '@/lib/api/itl';
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

    // Heuristic: Part Number vs Keyword
    const isLikelyPartNumber = (str: string) => {
        const hasDigits = /\d/.test(str);
        if (hasDigits) return true;
        if (str.length > 3) return false;
        return true;
    };

    // If single SKU/Query
    if (skuList.length === 1) {
        const partNumber = skuList[0];
        try {
            let itl: ProductDetails | null = null;
            let thibault: ProductDetails | null = null;
            let motovan: ProductDetails | null = null;

            const isSku = isLikelyPartNumber(partNumber);
            console.log(`Search: "${partNumber}" (Likely SKU: ${isSku})`);

            if (supplier === 'both') {
                const promises: any[] = [
                    // Always search ITL. If Keyword, enrich results (Batch API).
                    searchItlFeedGrouped(partNumber, !isSku)
                ];

                if (isSku) {
                    promises.push(searchThibaultPart(partNumber));
                    promises.push(searchMotovanPart(partNumber));
                }

                const results = await Promise.all(promises);
                const itlRes = results[0];
                const thibaultRes = isSku ? results[1] : null;
                const motovanRes = isSku ? results[2] : null;

                thibault = thibaultRes;
                motovan = motovanRes;

                // Match ITL
                const itlMatch = itlRes.find((p: ProductDetails) => p.sku === partNumber || (p.variants && p.variants.some(v => v.sku === partNumber)));
                if (itlMatch) {
                    itl = itlMatch;
                } else if (itlRes.length > 0) {
                    // Keyword fallback: Return first found (Enriched)
                    itl = itlRes[0];
                }
            } else if (supplier === 'thibault') {
                if (isSku) {
                    thibault = await searchThibaultPart(partNumber);
                }

                // Fallback to CSV Discovery if not found in API or if it was a Keyword
                if (!thibault) {
                    const itlRes = await searchItlFeedGrouped(partNumber, true);
                    if (itlRes.length > 0) {
                        itl = itlRes[0];
                        // "Smart" behavior: If user asked for Thibault but we found it via ITL CSV -> Thibault API,
                        // we can treat it as Thibault result if we enriched it?
                        // For now, return it as 'itl' but client should display it.
                    }
                }
            } else if (supplier === 'motovan') {
                motovan = await searchMotovanPart(partNumber);
            } else if (supplier === 'itl') {
                const itlRes = await searchItlFeedGrouped(partNumber, true);
                const itlMatch = itlRes.find((p: ProductDetails) => p.sku === partNumber || (p.variants && p.variants.some(v => v.sku === partNumber)));
                if (itlMatch) {
                    itl = itlMatch;
                } else if (itlRes.length > 0) {
                    itl = itlRes[0];
                }
            }

            return NextResponse.json({ thibault, motovan, itl });
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
            let itl = null;

            // For multi-sku, we assume they are SKUs.
            if (supplier === 'both') {
                const [thibaultRes, motovanRes, itlRes] = await Promise.all([
                    searchThibaultPart(sku),
                    searchMotovanPart(sku),
                    searchItlFeedGrouped(sku),
                ]);
                thibault = thibaultRes;
                motovan = motovanRes;

                const itlMatch = itlRes.find((p: ProductDetails) => p.sku === sku || (p.variants && p.variants.some(v => v.sku === sku)));
                if (itlMatch) {
                    itl = itlMatch;
                }
            } else if (supplier === 'thibault') {
                thibault = await searchThibaultPart(sku);
            } else if (supplier === 'motovan') {
                motovan = await searchMotovanPart(sku);
            } else if (supplier === 'itl') {
                const itlRes = await searchItlFeedGrouped(sku, true);
                const itlMatch = itlRes.find((p: ProductDetails) => p.sku === sku || (p.variants && p.variants.some(v => v.sku === sku)));
                if (itlMatch) {
                    itl = itlMatch;
                } else if (itlRes.length > 0) {
                    itl = itlRes[0];
                }
            }

            // Add found products to results
            if (thibault) results.push(thibault);
            if (motovan) results.push(motovan);
            if (itl) results.push(itl);
        }

        return NextResponse.json({ multiSku: true, results });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
