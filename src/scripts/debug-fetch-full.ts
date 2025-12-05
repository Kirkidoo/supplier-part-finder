
import dotenv from 'dotenv';
import path from 'path';

// distinct loop to wait for config to load before import
const loadEnv = () => {
    dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
    console.log('Env loaded. Shop:', process.env.SHOPIFY_SHOP_NAME);
};

loadEnv();

async function run() {
    try {
        // Dynamic import to ensure env vars are ready
        const { getProductsByLocation } = await import('../lib/shopify');

        console.log('Calling getProductsByLocation...');
        const LOCATION_ID = '105008496957';
        const items = await getProductsByLocation(LOCATION_ID);

        console.log('------------------------------------------------');
        console.log('Final Result Count:', items.length);
        if (items.length > 0) {
            console.log('First item sample:', JSON.stringify(items[0], null, 2));
        }
    } catch (err) {
        console.error('Script error:', err);
    }
}

run();
