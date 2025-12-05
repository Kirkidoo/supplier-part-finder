
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SHOP_NAME = process.env.SHOPIFY_SHOP_NAME || process.env.NEXT_PUBLIC_SHOPIFY_SHOP_NAME;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2024-01';

async function debugInventory() {
    console.log('--- Debugging Inventory Levels ---');
    if (!SHOP_NAME || !ACCESS_TOKEN) {
        console.error('Missing credentials');
        return;
    }

    const LOCATION_ID = '105008496957';
    // Reverting to location query but simplified to check if InventoryLevel is accessible
    const query = `
        query {
            location(id: "gid://shopify/Location/${LOCATION_ID}") {
                id
                name
                inventoryLevels(first: 10) {
                    edges {
                        node {
                            id
                            quantities(names: ["available"]) {
                                quantity
                            }
                            item {
                                __typename
                                id
                                variant {
                                    id
                                    title
                                    # weightUnit # Check this later if variant exists
                                }
                            }
                        }
                    }
                }
            }
        }
    `;

    try {
        const response = await axios.post(
            `https://${SHOP_NAME}/admin/api/${API_VERSION}/graphql.json`,
            { query },
            {
                headers: {
                    'X-Shopify-Access-Token': ACCESS_TOKEN,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (response.data.errors) {
            console.error('GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
        } else {
            console.log('Response Data:', JSON.stringify(response.data.data, null, 2));
        }

    } catch (error: any) {
        console.error('Request failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

debugInventory();
