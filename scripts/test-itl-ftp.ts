import { fetchItlFeedFromFtp, loadItlFeed } from '../src/lib/api/itl';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testFtp() {
    console.log('Testing ITL FTP Fetch...');

    // 1. Fetch
    const success = await fetchItlFeedFromFtp();
    console.log('Fetch result:', success);

    if (success) {
        // 2. Load to verify content
        const products = await loadItlFeed();
        console.log(`Loaded ${products.length} products after fetch.`);
        if (products.length > 0) {
            console.log('Sample product:', products[0]);
        }
    }
}

testFtp().catch(console.error);
