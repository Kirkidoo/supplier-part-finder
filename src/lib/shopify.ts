import axios from 'axios';
import { ProductDetails } from './types';

const SHOP_NAME = process.env.SHOPIFY_SHOP_NAME;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2024-01';

const getClient = () => {
    if (!SHOP_NAME || !ACCESS_TOKEN) {
        console.warn('Shopify credentials missing');
        return null;
    }
    return axios.create({
        baseURL: `https://${SHOP_NAME}/admin/api/${API_VERSION}`,
        headers: {
            'X-Shopify-Access-Token': ACCESS_TOKEN,
            'Content-Type': 'application/json',
        },
    });
};

// GraphQL queries
const GET_ALL_PUBLICATIONS_QUERY = `
    query {
        publications(first: 20) {
            edges {
                node {
                    id
                    name
                }
            }
        }
    }
`;

const PRODUCT_PUBLISH_MUTATION = `
    mutation productPublish($input: ProductPublishInput!) {
        productPublish(input: $input) {
            product {
                id
                publishedOnCurrentPublication
            }
            userErrors {
                field
                message
            }
        }
    }
`;

// Convert plain text to HTML
function textToHtml(text: string): string {
    if (!text) return '';
    return text
        .split(/\n\n+/)
        .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
        .join('');
}

// GraphQL helper
async function graphqlRequest(query: string, variables?: any) {
    if (!SHOP_NAME || !ACCESS_TOKEN) return null;

    const graphqlUrl = `https://${SHOP_NAME}/admin/api/${API_VERSION}/graphql.json`;

    const response = await axios.post(
        graphqlUrl,
        { query, variables },
        {
            headers: {
                'X-Shopify-Access-Token': ACCESS_TOKEN,
                'Content-Type': 'application/json',
            },
        }
    );

    return response.data;
}

// Publish product to all sales channels using GraphQL productPublish mutation
async function publishToSalesChannels(productId: string) {
    try {
        // 1. Fetch all available publications
        const pubResponse = await graphqlRequest(GET_ALL_PUBLICATIONS_QUERY);
        const publications = pubResponse?.data?.publications?.edges?.map((edge: any) => edge.node) || [];

        if (publications.length === 0) {
            console.warn('No sales channel publications found');
            return;
        }

        console.log(`Found ${publications.length} publications:`, publications.map((p: any) => `${p.name} (${p.id})`));

        const productGid = `gid://shopify/Product/${productId}`;
        const productPublications = publications.map((pub: { id: string }) => ({ publicationId: pub.id }));

        // 2. Use productPublish mutation
        const result = await graphqlRequest(PRODUCT_PUBLISH_MUTATION, {
            input: {
                id: productGid,
                productPublications: productPublications,
            },
        });

        console.log('Publish result:', JSON.stringify(result, null, 2));

        const userErrors = result?.data?.productPublish?.userErrors;
        if (userErrors && userErrors.length > 0) {
            console.warn('Publishing errors:', userErrors.map((e: any) => `${e.field}: ${e.message}`).join('; '));
        } else {
            console.log(`Successfully published product to ${publications.length} sales channels`);
        }
    } catch (error: any) {
        console.error('Error publishing to sales channels:', error?.response?.data || error);
    }
}

// Set cost per item on inventory item
async function setCostPerItem(inventoryItemId: string, cost: number) {
    const client = getClient();
    if (!client || !cost) return;

    try {
        await client.put(`/inventory_items/${inventoryItemId}.json`, {
            inventory_item: {
                cost: cost.toFixed(2),
            },
        });
        console.log(`Set cost ${cost.toFixed(2)} for inventory item ${inventoryItemId}`);
    } catch (error: any) {
        console.error('Error setting cost:', error?.response?.data || error);
    }
}

interface VariantData {
    sku: string;
    optionValue: string;
    price: number;
    compareAtPrice: number;
    cost: number;
    upc: string;
    weight: number;
    weightUnit: string;
    stock: number;
    image: string;
}

export async function createShopifyProduct(details: ProductDetails | ProductDetails[], customData?: any) {
    const client = getClient();
    if (!client) return null;

    const productsArray = Array.isArray(details) ? details : [details];
    const firstProduct = productsArray[0];
    const isMultiVariant = customData?.isMultiVariant && customData?.variants?.length > 1;
    const primaryImage = customData?.image || firstProduct.image || '';

    // Convert plain text description to HTML
    const descriptionHtml = customData?.description
        ? textToHtml(customData.description)
        : `<strong>Brand:</strong> ${firstProduct.brand || 'N/A'}<br><strong>Supplier:</strong> ${firstProduct.supplier}`;

    // Build variants array
    let variants: any[] = [];
    let options: any[] = [];

    if (isMultiVariant && customData.variants) {
        const optionName = customData.optionName || 'Variant';
        options = [{ name: optionName }];

        variants = customData.variants.map((v: VariantData) => ({
            option1: v.optionValue,
            price: v.price,
            compare_at_price: v.compareAtPrice || null,
            sku: v.sku,
            inventory_management: 'shopify',
            inventory_policy: 'deny',
            barcode: v.upc || '',
            weight: v.weight || 0,
            weight_unit: (v.weightUnit || 'lb').toLowerCase(),
        }));
    } else {
        const variantData = customData?.variants?.[0];
        variants = [{
            price: variantData?.price || firstProduct.price.retail,
            compare_at_price: variantData?.compareAtPrice || null,
            sku: variantData?.sku || firstProduct.sku,
            inventory_management: 'shopify',
            inventory_policy: 'deny',
            barcode: variantData?.upc || firstProduct.upc,
            weight: variantData?.weight || firstProduct.weight?.value,
            weight_unit: (variantData?.weightUnit || firstProduct.weight?.unit || 'lb').toLowerCase(),
        }];
    }

    // Build images array - only primary image initially
    const images: any[] = [];
    if (primaryImage) {
        if (primaryImage.startsWith('data:image')) {
            images.push({ attachment: primaryImage.split(',')[1] });
        } else {
            images.push({ src: primaryImage });
        }
    }

    const product: any = {
        title: customData?.title || firstProduct.description,
        body_html: descriptionHtml,
        vendor: customData?.vendor || firstProduct.brand || firstProduct.supplier,
        product_type: customData?.type || 'Part',
        tags: customData?.tags || '',
        template_suffix: customData?.templateSuffix || '',
        status: customData?.status || 'active',
        variants,
        images,
    };

    if (options.length > 0) {
        product.options = options;
    }

    try {
        // 1. Create Product
        const response = await client.post('/products.json', { product });
        const createdProduct = response.data.product;

        // Get the primary image ID (first image uploaded with product)
        const primaryImageId = createdProduct.images?.[0]?.id;

        // 2. Handle variant images
        if (isMultiVariant && customData.variants) {
            // Collect variant IDs that need the primary image
            const variantsNeedingPrimaryImage: number[] = [];

            for (let i = 0; i < customData.variants.length; i++) {
                const variantData = customData.variants[i] as VariantData;
                const createdVariant = createdProduct.variants[i];

                if (variantData.image && createdVariant) {
                    // This variant has its own image - upload it
                    try {
                        const imagePayload: any = {
                            variant_ids: [createdVariant.id],
                        };

                        if (variantData.image.startsWith('data:image')) {
                            imagePayload.attachment = variantData.image.split(',')[1];
                        } else {
                            imagePayload.src = variantData.image;
                        }

                        await client.post(`/products/${createdProduct.id}/images.json`, {
                            image: imagePayload,
                        });
                    } catch (imgError: any) {
                        console.error(`Error uploading image for variant ${variantData.sku}:`, imgError?.response?.data || imgError);
                    }
                } else if (primaryImageId && createdVariant) {
                    // No variant-specific image - will assign primary image
                    variantsNeedingPrimaryImage.push(createdVariant.id);
                }
            }

            // Assign primary image to all variants that don't have their own
            if (primaryImageId && variantsNeedingPrimaryImage.length > 0) {
                try {
                    await client.put(`/products/${createdProduct.id}/images/${primaryImageId}.json`, {
                        image: {
                            id: primaryImageId,
                            variant_ids: variantsNeedingPrimaryImage,
                        },
                    });
                    console.log(`Assigned primary image to ${variantsNeedingPrimaryImage.length} variants`);
                } catch (imgError: any) {
                    console.error('Error assigning primary image to variants:', imgError?.response?.data || imgError);
                }
            }
        }

        // 3. Set Inventory Levels and Cost for all variants
        for (let i = 0; i < createdProduct.variants.length; i++) {
            const variant = createdProduct.variants[i];
            const stockData = customData?.variants?.[i]?.stock
                || productsArray[i]?.stock?.reduce((sum: number, s: any) => sum + s.quantity, 0)
                || 0;
            const costData = customData?.variants?.[i]?.cost || productsArray[i]?.price?.net || 0;

            // Set inventory level
            if (customData?.locationId) {
                try {
                    await client.post('/inventory_levels/set.json', {
                        location_id: customData.locationId,
                        inventory_item_id: variant.inventory_item_id,
                        available: stockData,
                    });
                } catch (invError: any) {
                    console.error(`Error setting inventory for ${variant.sku}:`, invError?.response?.data || invError);
                }
            }

            // Set cost per item
            if (costData > 0) {
                await setCostPerItem(variant.inventory_item_id, costData);
            }
        }

        // 4. Publish to all sales channels
        await publishToSalesChannels(createdProduct.id);

        return createdProduct;
    } catch (error: any) {
        console.error('Error creating Shopify product:', error?.response?.data || error);
        throw error;
    }
}
