'use client';

import { useState } from 'react';
import { ProductDetails } from '@/lib/types';
import CreateProductModal from './CreateProductModal';
import { Package, Tag, DollarSign, Layers } from 'lucide-react';

interface ProductCardProps {
    product: ProductDetails;
}

export default function ProductCard({ product }: ProductCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mb-2 ${product.supplier === 'Thibault' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                            {product.supplier}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900">{product.description}</h3>
                        <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex items-center text-gray-700">
                        <DollarSign size={18} className="mr-2 text-gray-400" />
                        <span className="font-medium">Retail: ${product.price.retail.toFixed(2)}</span>
                        {product.price.dealer && (
                            <span className="ml-2 text-sm text-gray-500">(Dealer: ${product.price.dealer.toFixed(2)})</span>
                        )}
                    </div>

                    <div className="flex items-center text-gray-700">
                        <Layers size={18} className="mr-2 text-gray-400" />
                        <div className="flex flex-col">
                            {product.stock.map((s, idx) => (
                                <span key={idx} className="text-sm">
                                    {s.warehouse ? `${s.warehouse}: ` : ''}
                                    <span className={s.quantity > 0 ? 'text-green-600 font-medium' : 'text-red-600'}>
                                        {s.quantity} available
                                    </span>
                                    <span className="text-gray-400 text-xs ml-1">({s.status})</span>
                                </span>
                            ))}
                        </div>
                    </div>

                    {product.brand && (
                        <div className="flex items-center text-gray-700">
                            <Tag size={18} className="mr-2 text-gray-400" />
                            <span>{product.brand}</span>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                    <Package size={18} />
                    Create on Shopify
                </button>
            </div>

            <CreateProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={product}
            />
        </>
    );
}
