'use client';

import { useState } from 'react';
import axios from 'axios';
import { ProductDetails } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import CreateProductModal from '@/components/CreateProductModal';
import { Search, Loader2, ChevronDown, Package, X, Plus } from 'lucide-react';

type Supplier = 'motovan' | 'thibault' | 'both';

export default function Home() {
    const [partNumber, setPartNumber] = useState('');
    const [supplier, setSupplier] = useState<Supplier>('thibault');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<{ thibault: ProductDetails | null; motovan: ProductDetails | null } | null>(null);
    const [error, setError] = useState('');

    // Variant collection state
    const [variantCollection, setVariantCollection] = useState<ProductDetails[]>([]);
    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!partNumber.trim()) return;

        setLoading(true);
        setError('');
        setResults(null);

        try {
            const response = await axios.get(`/api/search?partNumber=${encodeURIComponent(partNumber)}&supplier=${supplier}`);

            // Check if multi-SKU response
            if (response.data.multiSku) {
                // Auto-add all found products as variants
                const foundProducts: ProductDetails[] = response.data.results;
                if (foundProducts.length > 0) {
                    // Add to variant collection (avoid duplicates)
                    setVariantCollection(prev => {
                        const newProducts = foundProducts.filter(
                            p => !prev.some(existing => existing.sku === p.sku)
                        );
                        return [...prev, ...newProducts];
                    });
                    // Clear the single results view
                    setResults(null);
                } else {
                    setError('No products found for the entered SKUs');
                }
            } else {
                // Single SKU - show in normal results view
                setResults(response.data);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to fetch results. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const addAsVariant = (product: ProductDetails) => {
        // Prevent duplicates
        if (variantCollection.some(p => p.sku === product.sku)) {
            return;
        }
        setVariantCollection(prev => [...prev, product]);
    };

    const removeVariant = (sku: string) => {
        setVariantCollection(prev => prev.filter(p => p.sku !== sku));
    };

    const clearVariants = () => {
        setVariantCollection([]);
    };

    return (
        <main className="min-h-screen bg-gray-50/50">
            {/* Hero Section */}
            <div className="bg-white border-b border-gray-200 pb-12 pt-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
                        Supplier Part Finder
                    </h1>
                    <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto">
                        Instantly search and sync products from Importation Thibault and Motovan directly to your Shopify store.
                    </p>

                    <div className="max-w-2xl mx-auto space-y-4">
                        <div className="bg-white p-2 rounded-2xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col md:flex-row gap-2">
                            {/* Supplier Selector */}
                            <div className="relative min-w-[180px]">
                                <select
                                    value={supplier}
                                    onChange={(e) => setSupplier(e.target.value as Supplier)}
                                    className="w-full appearance-none bg-gray-50 hover:bg-gray-100 px-4 py-3.5 pr-10 text-sm font-semibold text-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer border border-transparent focus:border-blue-500"
                                >
                                    <option value="both">All Suppliers</option>
                                    <option value="motovan">Motovan</option>
                                    <option value="thibault">Imp. Thibault</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>

                            {/* Search Bar */}
                            <form onSubmit={handleSearch} className="flex-1 flex relative items-start">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                                    <textarea
                                        value={partNumber}
                                        onChange={(e) => setPartNumber(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSearch(e);
                                            }
                                        }}
                                        placeholder="Enter SKU(s) - one per line or comma separated"
                                        className="w-full pl-12 pr-10 py-3.5 text-base text-gray-900 placeholder:text-gray-400 bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all border border-transparent focus:border-blue-500 min-h-[100px] resize-y"
                                    />
                                    {partNumber && (
                                        <button
                                            type="button"
                                            onClick={() => setPartNumber('')}
                                            className="absolute right-4 top-4 p-1 text-gray-400 hover:text-gray-600 bg-white/50 hover:bg-white rounded-md transition-all"
                                            title="Clear search"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="ml-2 bg-blue-600 text-white px-8 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none font-medium flex items-center justify-center min-w-[100px] h-[52px]"
                                >
                                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Search'}
                                </button>
                            </form>
                        </div>

                        {/* Multi-SKU hint */}
                        <p className="text-xs text-gray-400">
                            Tip: Enter multiple SKUs separated by commas or spaces to add them all as variants
                        </p>

                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-medium border border-red-100 animate-in fade-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <div className="max-w-6xl mx-auto px-4 py-12">
                {results && (
                    <div className="grid gap-8 md:grid-cols-2">
                        {(supplier === 'thibault' || supplier === 'both') && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                                    <h2 className="text-xl font-bold text-gray-900">Importation Thibault</h2>
                                    {results.thibault && <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">Found</span>}
                                </div>
                                {results.thibault ? (
                                    <ProductCard
                                        product={results.thibault}
                                        onAddAsVariant={addAsVariant}
                                        isInVariantCollection={variantCollection.some(p => p.sku === results.thibault?.sku)}
                                    />
                                ) : (
                                    <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Search className="text-gray-300 w-6 h-6" />
                                        </div>
                                        <p className="text-gray-500 font-medium">No results found</p>
                                        <p className="text-sm text-gray-400 mt-1">Try checking the part number or supplier</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {(supplier === 'motovan' || supplier === 'both') && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                                    <h2 className="text-xl font-bold text-gray-900">Motovan</h2>
                                    {results.motovan && <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">Found</span>}
                                </div>
                                {results.motovan ? (
                                    <ProductCard
                                        product={results.motovan}
                                        onAddAsVariant={addAsVariant}
                                        isInVariantCollection={variantCollection.some(p => p.sku === results.motovan?.sku)}
                                    />
                                ) : (
                                    <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Search className="text-gray-300 w-6 h-6" />
                                        </div>
                                        <p className="text-gray-500 font-medium">No results found</p>
                                        <p className="text-sm text-gray-400 mt-1">Try checking the part number or supplier</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Variant Collection Panel */}
            {variantCollection.length > 0 && (
                <div className="fixed bottom-6 right-6 z-40">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 w-80">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Package size={18} className="text-blue-600" />
                                Variant Collection
                            </h3>
                            <button
                                onClick={clearVariants}
                                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                            >
                                Clear All
                            </button>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                            {variantCollection.map((product, idx) => (
                                <div key={product.sku} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-900 truncate">{product.description}</p>
                                        <p className="text-xs text-gray-400 font-mono">{product.sku}</p>
                                    </div>
                                    <button
                                        onClick={() => removeVariant(product.sku)}
                                        className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setIsVariantModalOpen(true)}
                            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 font-medium"
                        >
                            <Package size={16} />
                            Create Product ({variantCollection.length} variant{variantCollection.length > 1 ? 's' : ''})
                        </button>
                    </div>
                </div>
            )}

            {/* Multi-Variant Modal */}
            {isVariantModalOpen && variantCollection.length > 0 && (
                <CreateProductModal
                    isOpen={isVariantModalOpen}
                    onClose={() => {
                        setIsVariantModalOpen(false);
                        clearVariants();
                    }}
                    product={variantCollection[0]}
                    variants={variantCollection}
                />
            )}
        </main>
    );
}
