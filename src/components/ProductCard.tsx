'use client';

import { useState } from 'react';
import { ProductDetails } from '@/lib/types';
import CreateProductModal from './CreateProductModal';
import { Package, Tag, DollarSign, Layers, Plus, Check } from 'lucide-react';

interface ProductCardProps {
    product: ProductDetails;
    onAddAsVariant?: (product: ProductDetails) => void;
    isInVariantCollection?: boolean;
}

export default function ProductCard({ product, onAddAsVariant, isInVariantCollection }: ProductCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:border-blue-100 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:opacity-100 transition-opacity" />

                <div className="flex justify-between items-start mb-6 relative">
                    <div>
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full mb-3 ${product.supplier === 'Thibault'
                            ? 'bg-red-50 text-red-700 border border-red-100'
                            : 'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                            {product.supplier}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{product.description}</h3>
                        <p className="text-sm text-gray-400 font-mono">SKU: {product.sku}</p>
                    </div>
                </div>

                <div className="space-y-4 mb-8 relative">
                    <div className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-lg">
                        <DollarSign size={18} className="mr-3 text-gray-400" />
                        <div className="flex-1">
                            <div className="flex justify-between items-baseline">
                                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Retail Price</span>
                                <span className="font-bold text-lg text-gray-900">${product.price.retail.toFixed(2)}</span>
                            </div>

                            {product.price.net && (
                                <div className="flex justify-between items-baseline mt-1 pt-1 border-t border-gray-200">
                                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Cost (Net)</span>
                                    <span className="font-bold text-base text-blue-700">${product.price.net.toFixed(2)}</span>
                                </div>
                            )}

                            {(product.price.dealerDiscount !== undefined || product.price.additionalDiscount !== undefined) && (
                                <div className="mt-2 text-xs text-gray-500 flex gap-3">
                                    {product.price.dealerDiscount !== undefined ? (
                                        <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-100">
                                            Dealer: {product.price.dealerDiscount}%
                                        </span>
                                    ) : null}
                                    {product.price.additionalDiscount ? (
                                        <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                                            Add'l: {product.price.additionalDiscount}%
                                        </span>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-start text-gray-700">
                        <Layers size={18} className="mr-3 text-gray-400 mt-1" />
                        <div className="flex flex-col gap-2 w-full">
                            {product.stock.map((s, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center">
                                        {s.warehouse && <span className="text-gray-500 mr-1">{s.warehouse}:</span>}
                                        <span className={`font-medium ${s.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {s.quantity} available
                                        </span>
                                    </div>
                                    <span className="text-gray-400 text-xs px-1.5 py-0.5 bg-gray-100 rounded">
                                        {s.status}
                                    </span>
                                </div>
                            ))}

                            {/* Product Status Badges */}
                            {product.productStatus && (
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {product.productStatus.discontinued && (
                                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                                            Discontinued
                                        </span>
                                    )}
                                    {product.productStatus.specialOrder && (
                                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                                            Special Order
                                        </span>
                                    )}
                                    {product.productStatus.seasonal && (
                                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                                            Seasonal
                                        </span>
                                    )}
                                    {product.productStatus.oversized && (
                                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">
                                            Oversized
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {product.brand && (
                        <div className="flex items-center text-gray-700">
                            <Tag size={18} className="mr-3 text-gray-400" />
                            <span className="font-medium">{product.brand}</span>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-600/20 transition-all duration-300 flex items-center justify-center gap-2 font-medium"
                    >
                        <Package size={18} />
                        Create on Shopify
                    </button>

                    {onAddAsVariant && (
                        <button
                            onClick={() => onAddAsVariant(product)}
                            disabled={isInVariantCollection}
                            className={`py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 font-medium ${isInVariantCollection
                                    ? 'bg-green-100 text-green-700 cursor-default'
                                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                }`}
                            title={isInVariantCollection ? 'Added to variants' : 'Add as variant'}
                        >
                            {isInVariantCollection ? <Check size={18} /> : <Plus size={18} />}
                        </button>
                    )}
                </div>
            </div>

            <CreateProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={product}
            />
        </>
    );
}
