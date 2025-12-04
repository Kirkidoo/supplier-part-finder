export interface ProductDetails {
    supplier: 'Thibault' | 'Motovan';
    sku: string;
    description: string;
    price: {
        retail: number;
        dealer?: number;
        net?: number;
        currency?: string;
        additionalDiscount?: number;
        dealerDiscount?: number;
    };
    stock: {
        quantity: number;
        status: string; // e.g., 'In Stock', 'Backorder', 'Discontinued'
        warehouse?: string;
    }[];
    productStatus?: {
        discontinued?: boolean;
        specialOrder?: boolean;
        seasonal?: boolean;
        oversized?: boolean;
    };
    weight?: {
        value: number;
        unit: string;
    };
    brand?: string;
    upc?: string;
    image?: string;
}
