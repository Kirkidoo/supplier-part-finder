export interface ProductDetails {
    supplier: 'Thibault' | 'Motovan';
    sku: string;
    description: string;
    price: {
        retail: number;
        dealer?: number;
        net?: number;
        currency?: string;
    };
    stock: {
        quantity: number;
        status: string; // e.g., 'In Stock', 'Backorder', 'Discontinued'
        warehouse?: string;
    }[];
    weight?: {
        value: number;
        unit: string;
    };
    brand?: string;
    upc?: string;
    image?: string;
}
