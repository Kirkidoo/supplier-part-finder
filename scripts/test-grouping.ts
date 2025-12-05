import { searchItlFeedGrouped } from '../src/lib/api/itl';

async function testGrouping() {
    console.log('Testing Grouping Logic...');

    // Test Case 1: Search for related items that should be grouped
    // Based on previous analysis: "RZR XP 2024 REAR WINDSHIELD"
    const query = 'RZR XP 2024 REAR WINDSHIELD';
    console.log(`Searching for "${query}"...`);

    const results = await searchItlFeedGrouped(query);
    console.log(`Found ${results.length} grouped results.`);

    results.forEach(p => {
        if (p.isGrouped) {
            console.log(`\nGroup Parent: ${p.description}`);
            console.log(`   Base SKU: ${p.sku}`);
            console.log(`   Option Name: ${p.optionName}`);
            console.log(`   Variants (${p.variants?.length}):`);
            p.variants?.forEach(v => {
                console.log(`     - SKU: ${v.sku} | Opt: ${v.optionValue} | Stock: ${v.stock}`);
            });
        } else {
            console.log(`Single Item: ${p.description} (${p.sku})`);
        }
    });

    // Test Case 2: Search for items with Size pattern
    // e.g. "PRIORITY GTX" or "JACKET"
    // I don't have exact SKU for the user example, but I remember seeing "LENS (SMOKED)" patterns

    const query2 = 'LENS GRAND PRIX';
    console.log(`\nSearching for "${query2}"...`);
    const results2 = await searchItlFeedGrouped(query2);

    results2.forEach(p => {
        if (p.isGrouped) {
            console.log(`\nGroup Parent: ${p.description}`);
            console.log(`   Variants: ${p.variants?.length}`);
            p.variants?.forEach(v => {
                console.log(`     - ${v.optionValue} (${v.sku})`);
            });
        }
    });

}

testGrouping().catch(console.error);
