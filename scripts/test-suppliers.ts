import axios from 'axios';
import * as dotenv from 'dotenv';
import path from 'path';
import https from 'https';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function testThibault() {
    const apiKey = process.env.THIBAULT_API_KEY;
    if (!apiKey) {
        console.log('Skipping Thibault test: API Key not found');
        return;
    }

    console.log('Testing Thibault API...');
    const sku = '304-1234'; // Example SKU format?

    try {
        const response = await axios.get('https://api.importationsthibault.com/api/v1/part_info', {
            params: { sku: sku, language: 'en' },
            headers: {
                Authorization: `Bearer ${apiKey}`,
                Accept: 'application/json'
            },
            httpsAgent
        });
        console.log('Thibault Response:', JSON.stringify(response.data, null, 2));
    } catch (error: any) {
        console.error('Thibault Error:', error.response?.status, error.response?.data || error.message);
    }
}

async function testMotovanScrape() {
    console.log('Testing Motovan Scrape...');
    const sku = '88-35241';
    const url = `https://motovan.com/en_CA/search?q=${sku}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            httpsAgent
        });
        console.log('Motovan Status:', response.status);
        console.log('Motovan Content Length:', response.data.length);
        if (response.data.includes('88-35241')) {
            console.log('Found SKU in response!');
        } else {
            console.log('SKU not found in response.');
        }
    } catch (error: any) {
        console.error('Motovan Error:', error.response?.status, error.message);
    }
}

async function main() {
    await testThibault();
    await testMotovanScrape();
}

main();
