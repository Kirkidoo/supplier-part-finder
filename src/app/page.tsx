'use client';

import { useState } from 'react';
import axios from 'axios';
import { ProductDetails } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import { Search, Loader2, ChevronDown } from 'lucide-react';

type Supplier = 'motovan' | 'thibault' | 'both';

export default function Home() {
    const [partNumber, setPartNumber] = useState('');
    const [supplier, setSupplier] = useState<Supplier>('both');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<{ thibault: ProductDetails | null; motovan: ProductDetails | null } | null>(null);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!partNumber.trim()) return;

        setLoading(true);
        setError('');
        setResults(null);

        try {
            const response = await axios.get(`/api/search?partNumber=${encodeURIComponent(partNumber)}&supplier=${supplier}`);
            setResults(response.data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch results. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getSupplierLabel = (s: Supplier) => {
        switch (s) {
            case 'motovan': return 'Motovan';
            case 'thibault': return 'Importation Thibault';
            case 'both': return 'Both Suppliers';
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Supplier Part Finder</h1>
                    <p className="text-lg text-gray-600">Search across Importation Thibault and Motovan catalogs</p>
                </div>

                <div className="max-w-2xl mx-auto mb-12 space-y-4">
                    {/* Supplier Selector */}
                    <div className="flex justify-center">
                        <div className="relative inline-block">
                            <select
                                value={supplier}
                                onChange={(e) => setSupplier(e.target.value as Supplier)}
                                className="appearance-none bg-white px-6 py-3 pr-12 text-base font-medium rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-sm cursor-pointer"
                            >
                                <option value="both">Both Suppliers</option>
                                <option value="motovan">Motovan</option>
                                <option value="thibault">Importation Thibault</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="relative flex items-center">
                        <input
                            type="text"
                            value={partNumber}
                            onChange={(e) => setPartNumber(e.target.value)}
                            placeholder="Enter Part Number (e.g. 123456)"
                            className="w-full px-6 py-4 text-lg rounded-full border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-sm placeholder:text-gray-500"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="absolute right-2 bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Search />}
                        </button>
                    </form>
                    {error && <p className="text-red-500 text-center mt-4">{error}</p>}
                </div>

                {results && (
                    <div className={`grid gap-8 ${supplier === 'both' ? 'md:grid-cols-2' : 'max-w-xl mx-auto'}`}>
                        {(supplier === 'thibault' || supplier === 'both') && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Importation Thibault</h2>
                                {results.thibault ? (
                                    <ProductCard product={results.thibault} />
                                ) : (
                                    <div className="bg-white p-6 rounded-lg border border-gray-200 text-center text-gray-500">
                                        No results found
                                    </div>
                                )}
                            </div>
                        )}

                        {(supplier === 'motovan' || supplier === 'both') && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Motovan</h2>
                                {results.motovan ? (
                                    <ProductCard product={results.motovan} />
                                ) : (
                                    <div className="bg-white p-6 rounded-lg border border-gray-200 text-center text-gray-500">
                                        No results found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
