import { loadItlFeed, searchItlFeed } from '../src/lib/api/itl';
import path from 'path';

// Mock process.cwd for the test script context if needed, 
// but since we run with ts-node or similar from root, it should be fine.
// However, the ITL feed path logic uses process.cwd().
// If we run from project root, process.cwd() is project root.
// The code expects '..', 'itlCanada.csv'.
// Let's ensure the environment is set up correctly.

async function test() {
    console.log('Testing ITL Feed...');

    // 1. Test Loading
    const products = await loadItlFeed();
    console.log(`Loaded ${products.length} products.`);

    if (products.length > 0) {
        console.log('First product:', products[0]);
    } else {
        console.error('No products loaded. Check file path.');
    }

    // 2. Test Search
    const query = '002-505';
    console.log(`Searching for "${query}"...`);
    const results = await searchItlFeed(query);
    console.log(`Found ${results.length} results.`);
    results.forEach(p => console.log(`- ${p.partNo}: ${p.descriptionEn}`));

    // 3. Test Search by Description
    console.log('--- Testing Token Search Logic ---');

    const broadQuery = 'Jacket';
    console.log(`Searching for Broad: "${broadQuery}"...`);
    const broadResults = await searchItlFeed(broadQuery);
    console.log(`Found ${broadResults.length} results for "${broadQuery}".`);

    const narrowQuery = 'WOMENS JACKET';
    console.log(`Searching for Narrow: "${narrowQuery}"...`);
    const narrowResults = await searchItlFeed(narrowQuery);
    console.log(`Found ${narrowResults.length} results for "${narrowQuery}".`);

    if (narrowResults.length < broadResults.length) {
        console.log('SUCCESS: Narrow search returned fewer results than broad search.');
    } else {
        console.warn('WARNING: Narrow search returned same or more results? (Check logic)');
    }

    if (narrowResults.length > 0) {
        console.log(`First narrow result: ${narrowResults[0].partNo} - ${narrowResults[0].descriptionEn}`);
    }
}

test().catch(console.error);
