
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root .env.local or .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SHOP_NAME = process.env.SHOPIFY_SHOP_NAME || process.env.NEXT_PUBLIC_SHOPIFY_SHOP_NAME;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2024-01';

async function listLocations() {
    console.log('--- Debugging Shopify Locations ---');
    console.log(`Shop: ${SHOP_NAME}`);
    if (!SHOP_NAME || !ACCESS_TOKEN) {
        console.error('Missing SHOPIFY_SHOP_NAME or SHOPIFY_ACCESS_TOKEN');
        return;
    }

    const query = `
    {
      locations(first: 10) {
        edges {
          node {
            id
            name
            address {
              address1
              city
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
            const locations = response.data.data.locations.edges;
            console.log(`Found ${locations.length} locations:`);
            locations.forEach((edge: any) => {
                const node = edge.node;
                console.log(`- Name: ${node.name}`);
                console.log(`  ID: ${node.id}`);
                console.log(`  Address: ${node.address?.address1}, ${node.address?.city}`);
                console.log('-----------------------------------');
            });
        }

    } catch (error: any) {
        console.error('Request failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

listLocations();
