import { loadItlFeed } from '../src/lib/api/itl';
import path from 'path';

async function analyzePatterns() {
    console.log('Loading ITL Feed...');
    const products = await loadItlFeed();

    // Pattern looking for (Size) at the end, e.g., (S), (XL), (10)
    // Also pattern for " - Color (Size)"

    // Regex for typical size suffix:  \(([^)]+)\)$
    const sizeRegex = /\(([^)]+)\)$/;

    const possibleVariants: any = {};
    const samples: string[] = [];

    let matchCount = 0;

    products.forEach(p => {
        if (!p.descriptionEn) return;

        const match = p.descriptionEn.match(sizeRegex);
        if (match) {
            matchCount++;
            const fullDesc = p.descriptionEn;
            const size = match[1];
            // Normalize: Remove the (Size) part
            const normalized = fullDesc.replace(sizeRegex, '').trim();

            if (!possibleVariants[normalized]) {
                possibleVariants[normalized] = [];
            }
            possibleVariants[normalized].push({ sku: p.partNo, size });

            if (samples.length < 20) {
                samples.push(`${fullDesc}  ->  BASE: "${normalized}" | SIZE: "${size}"`);
            }
        }
    });

    console.log(`Found ${matchCount} products with potential size patterns out of ${products.length}.`);
    console.log('\nSample Matches:');
    samples.forEach(s => console.log(s));

    // Check for groups with multiple items
    let groupCount = 0;
    Object.keys(possibleVariants).forEach(key => {
        if (possibleVariants[key].length > 1) {
            groupCount++;
            if (groupCount < 6) {
                console.log(`\nGroup: "${key}"`);
                possibleVariants[key].forEach((v: any) => console.log(`  - P: ${v.sku}, Size: ${v.size}`));
            }
        }
    });
    console.log(`\nFound ${groupCount} groups with >1 variants.`);
}

analyzePatterns().catch(console.error);
