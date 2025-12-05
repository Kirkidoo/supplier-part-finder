import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import * as ftp from 'basic-ftp';
import { ProductDetails } from '../types';
import { VariantParser } from '../variant-parser';
import { searchThibaultPart } from './thibault';

// Limit concurrency for API calls
// Limit concurrency for API calls
const ENRICH_CONCURRENCY = 5;
// Limit total items to enrich to prevent timeouts
const ENRICH_LIMIT = 50;


export interface ItlProduct {
    partNo: string;
    descriptionFr: string;
    descriptionEn: string;
    cost: number;
    retail: number;
    qty: number;
    map: number;
    oem: string;
    partNoWithoutHyphen: string;
    upc1: string;
    upc2: string;
}

const FEED_PATH = process.env.ITL_FEED_PATH || path.join(process.cwd(), '..', 'itlCanada.csv');

export async function loadItlFeed(): Promise<ItlProduct[]> {
    console.log(`[ITL] Loading feed from: ${FEED_PATH}`);
    try {
        if (!fs.existsSync(FEED_PATH)) {
            console.warn(`[ITL] Feed file not found at ${FEED_PATH}`);
            return [];
        }

        const fileContent = fs.readFileSync(FEED_PATH, 'utf-8');
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true,
            // relax_quotes: true, // Not needed if quoting is disabled
            quote: false, // Treat quotes as normal characters
            skip_records_with_error: true,
        });
        console.log(`[ITL] Parsed ${records.length} records.`);
        if (records.length > 0) {
            console.log('[ITL] First record sample:', JSON.stringify(records[0], null, 2));
        }

        const validRecords = records.map((record: any) => ({
            partNo: record['Part no'],
            descriptionFr: record['DescriptionFR'],
            descriptionEn: record['DescriptionEN'],
            cost: parseFloat(record['Cost']) || 0,
            retail: parseFloat(record['Retail']) || 0,
            qty: parseInt(record['qty']) || 0,
            map: parseFloat(record['MAP']) || 0,
            oem: record['OEM'],
            partNoWithoutHyphen: record['Part no without hyphen'],
            upc1: record['UPC 1'],
            upc2: record['UPC 2'],
        }));

        // Debug: Check if DescriptionEN is actually populated
        const sample = validRecords.find((r: any) => r.descriptionEn && r.descriptionEn.length > 0);
        if (sample) {
            console.log('[ITL] Valid sample with DescEN:', JSON.stringify(sample, null, 2));
        } else {
            console.warn('[ITL] WARNING: No records found with populated descriptionEn!');
            if (records.length > 0) {
                console.log('[ITL] Raw Record Keys:', Object.keys(records[0] as object));
            }
        }

        return validRecords;
    } catch (error) {
        console.error('Error loading ITL feed:', error);
        return [];
    }
}

export async function searchItlFeed(query: string): Promise<ItlProduct[]> {
    const products = await loadItlFeed();
    const lowerQuery = query.toLowerCase();

    // Split query into tokens (clean spaces)
    const tokens = lowerQuery.split(/\s+/).filter(t => t.length > 0);

    return products.filter(p => {
        // Concatenate all searchable fields to search once
        const searchText = `${p.partNo} ${p.partNoWithoutHyphen} ${p.descriptionEn} ${p.descriptionFr} ${p.oem}`.toLowerCase();

        // Strict AND logic: All tokens must be present in the search text
        return tokens.every(token => searchText.includes(token));
    });
}

export async function searchItlFeedGrouped(query: string, enrichFromApi: boolean = false): Promise<ProductDetails[]> {
    console.log(`[ITL] Searching Grouped for: "${query}" (Enrich: ${enrichFromApi})`);
    const rawProducts = await searchItlFeed(query);
    console.log(`[ITL] Found ${rawProducts.length} raw matches.`);

    // Convert to simplified items for grouping
    const items = rawProducts.map(p => ({
        ...p,
        description: p.descriptionEn || p.descriptionFr // Use English preferred
    }));

    const grouped = VariantParser.groupItems(items);
    const results: ProductDetails[] = [];

    // Process groups
    grouped.forEach((groupItems, baseName) => {
        if (groupItems.length === 0) return;

        let finalProduct: ProductDetails;
        if (groupItems.length === 1) {
            finalProduct = mapItlToProductDetails(groupItems[0]);
        } else {
            // Create grouped product
            const first = groupItems[0];
            const parent = mapItlToProductDetails(first);
            parent.description = baseName;
            parent.isGrouped = true;
            parent.optionName = VariantParser.parse(first.description).optionName;
            parent.variants = groupItems.map(item => {
                const parsed = VariantParser.parse(item.description);
                return {
                    sku: item.partNo,
                    optionValue: parsed.optionValue,
                    price: item.retail,
                    stock: item.qty
                };
            });
            finalProduct = parent;
        }
        results.push(finalProduct);
    });

    // API Enrichment (Batch)
    if (enrichFromApi && results.length > 0) {
        // Collect all SKUs that need fetching.
        const skusToFetch: string[] = [];
        const taskMap = new Map<string, (details: ProductDetails) => void>();

        // Sort results to prioritize best matches? Or just take first N.
        let enrichmentCount = 0;

        for (const p of results) {
            if (enrichmentCount >= ENRICH_LIMIT) break;

            if (p.isGrouped && p.variants) {
                for (const v of p.variants) {
                    if (enrichmentCount >= ENRICH_LIMIT) break;

                    skusToFetch.push(v.sku);
                    taskMap.set(v.sku, (details) => {
                        if (details && details.price) {
                            v.price = details.price.retail;
                            v.stock = details.stock.reduce((a, b) => a + b.quantity, 0);
                        }
                    });
                    enrichmentCount++;
                }
            } else {
                skusToFetch.push(p.sku);
                taskMap.set(p.sku, (details) => {
                    if (details) {
                        p.price = details.price;
                        p.stock = details.stock;
                        if (details.image) p.image = details.image;
                        if (details.weight) p.weight = details.weight;
                    }
                });
                enrichmentCount++;
            }
        }

        if (skusToFetch.length > 0) {
            console.log(`[ITL] Enriching ${skusToFetch.length} SKUs (Limited from potentially more)...`);
        }

        // Execute batch with concurrency limit
        for (let i = 0; i < skusToFetch.length; i += ENRICH_CONCURRENCY) {
            const chunk = skusToFetch.slice(i, i + ENRICH_CONCURRENCY);
            // console.log(`[ITL] Enriching batch ${i} - ${i + ENRICH_CONCURRENCY} of ${skusToFetch.length}`);

            await Promise.all(chunk.map(sku =>
                searchThibaultPart(sku).then(details => {
                    if (details) {
                        const updater = taskMap.get(sku);
                        if (updater) updater(details);
                    }
                }).catch(err => console.error(`Failed to enrich ${sku}`, err))
            ));
        }
    }

    return results;
}

// Fetch ITL Feed from FTP
export async function fetchItlFeedFromFtp(): Promise<boolean> {
    const client = new ftp.Client();

    const host = process.env.ITL_FTP_HOST;
    const user = process.env.ITL_FTP_USER;
    const password = process.env.ITL_FTP_PASSWORD;

    if (!host || !user || !password) {
        console.error('Missing ITL FTP credentials');
        return false;
    }

    try {
        console.log(`Connecting to FTP ${host}...`);
        await client.access({
            host,
            user,
            password,
        });

        console.log('Connected. Downloading itlCanada.csv...');
        await client.downloadTo(FEED_PATH, 'itlCanada.csv');
        console.log('Download complete.');

        return true;
    } catch (error) {
        console.error('Error fetching ITL feed from FTP:', error);
        return false;
    } finally {
        client.close();
    }
}

export function mapItlToProductDetails(itl: ItlProduct): ProductDetails {
    return {
        supplier: 'ITL',
        sku: itl.partNo,
        description: itl.descriptionEn || itl.descriptionFr,
        price: {
            retail: itl.retail,
            net: itl.cost,
            currency: 'CAD',
        },
        stock: [{
            quantity: itl.qty,
            status: itl.qty > 0 ? 'In Stock' : 'Out of Stock',
        }],
        productStatus: {
            oversized: false,
        },
        brand: itl.oem,
        upc: itl.upc1 || itl.upc2,
    };
}
