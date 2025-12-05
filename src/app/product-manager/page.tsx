'use client';

import React, { useEffect, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Search,
    Filter,
    RefreshCcw,
    Package as PackageIcon,
    ArrowUpDown,
    MoreHorizontal,
    ExternalLink,
    Loader2
} from 'lucide-react';

interface ComparisonResult {
    status: string;
    mismatches: string[];
    shopify: {
        productTitle: string;
        variantTitle: string;
        sku: string;
        price: number;
        cost: number;
        available: number;
        barcode: string;
        status: string;
        productId: string;
    };
    thibault: {
        price: {
            retail: number;
            net: number;
        };
        stock: Array<{
            quantity: number;
        }>;
        upc: string;
        productStatus?: {
            discontinued?: boolean;
            specialOrder?: boolean;
            seasonal?: boolean;
            oversized?: boolean;
        };
    } | null;
}

export default function ProductManager() {
    const [data, setData] = useState<ComparisonResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async (manual = false) => {
        setLoading(true);
        try {
            const endpoint = manual ? '/api/inventory/compare?refresh=true' : '/api/inventory/compare';
            const res = await fetch(endpoint);
            const result = await res.json();
            if (result.data) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch comparison data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredData = data.filter(item => {
        const matchesFilter =
            filter === 'All' ? true :
                filter === 'Mismatch' ? item.status === 'Mismatch' :
                    filter === 'Match' ? item.status === 'Match' :
                        item.status === 'Not Found in Thibault';

        const matchesSearch =
            item.shopify.productTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.shopify.sku.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const stats = {
        total: data.length,
        mismatch: data.filter(i => i.status === 'Mismatch').length,
        match: data.filter(i => i.status === 'Match').length,
        notFound: data.filter(i => i.status === 'Not Found in Thibault').length,
    };

    // Helper to render status badges
    const renderThibaultBadges = (status: any) => {
        if (!status) return null;
        return (
            <div className="flex flex-wrap gap-1 mt-1">
                {status.discontinued && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Discontinued
                    </span>
                )}
                {status.specialOrder && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Special Order
                    </span>
                )}
                {status.seasonal && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Seasonal
                    </span>
                )}
                {status.oversized && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                        Oversized
                    </span>
                )}
            </div>
        );
    };



    return (
        <div className="min-h-screen bg-gray-50/50 p-8 pb-32">

            {/* Header Section */}
            <div className="max-w-[1600px] mx-auto mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                            <PackageIcon className="w-8 h-8 text-blue-600" />
                            Use Location Inventory
                        </h1>
                        <p className="text-gray-500 mt-2">
                            Analysis for Thibault Location (ID: 105008496957)
                        </p>
                    </div>
                    <button
                        onClick={() => fetchData(true)}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-xl border border-gray-200 shadow-sm transition-all disabled:opacity-50"
                    >
                        <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Fetching...' : 'Refresh Data'}
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        label="Total Products"
                        value={stats.total}
                        icon={<PackageIcon className="text-blue-500" />}
                        loading={loading}
                    />
                    <StatCard
                        label="In Sync"
                        value={stats.match}
                        icon={<CheckCircle2 className="text-green-500" />}
                        subtext="Perfect match"
                        loading={loading}
                    />
                    <StatCard
                        label="Mismatches"
                        value={stats.mismatch}
                        icon={<AlertTriangle className="text-amber-500" />}
                        color="amber"
                        loading={loading}
                    />
                    <StatCard
                        label="Not Found"
                        value={stats.notFound}
                        icon={<XCircle className="text-red-500" />}
                        color="red"
                        loading={loading}
                    />
                </div>

                {/* Filters & Actions Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                        <FilterBtn active={filter === 'All'} onClick={() => setFilter('All')} label="All Items" />
                        <FilterBtn active={filter === 'Mismatch'} onClick={() => setFilter('Mismatch')} label="Mismatches" count={stats.mismatch} type="warning" />
                        <FilterBtn active={filter === 'Match'} onClick={() => setFilter('Match')} label="Synced" type="success" />
                        <FilterBtn active={filter === 'Not Found'} onClick={() => setFilter('Not Found')} label="Not Found" type="error" />
                    </div>

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by product name or SKU..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Main Table */}
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center text-gray-400">
                            <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
                            <p className="font-medium">Analyzing inventory differences...</p>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-gray-400">
                            <Search className="w-12 h-12 mb-4 text-gray-200" />
                            <p className="text-lg font-medium text-gray-500">No products found</p>
                            <p className="text-sm">Try adjusting your filters or search terms.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                        <th className="p-6">Status</th>
                                        <th className="p-6">Product Information</th>
                                        <th className="p-6 text-right">Stock</th>
                                        <th className="p-6 text-right">Price (Retail)</th>
                                        <th className="p-6 text-right">Cost (Net)</th>
                                        <th className="p-6 text-center">Reference</th>
                                        <th className="p-6"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredData.map((row, index) => (
                                        <tr
                                            key={index}
                                            className="group hover:bg-blue-50/30 transition-colors"
                                        >
                                            <td className="p-6 align-top">
                                                <StatusBadge status={row.status} />
                                                {row.mismatches.length > 0 && (
                                                    <div className="mt-3 space-y-1">
                                                        {row.mismatches.map((m, i) => (
                                                            <div key={i} className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 inline-block mr-1">
                                                                {m}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-6 align-top max-w-sm">
                                                <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                                    {row.shopify.productTitle}
                                                </div>
                                                <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                                                    {row.shopify.variantTitle !== 'Default Title' ? row.shopify.variantTitle : 'Standard Variant'}
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs font-mono font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                        {row.shopify.sku}
                                                    </span>
                                                    {renderThibaultBadges(row.thibault?.productStatus)}
                                                </div>
                                            </td>

                                            <ComparisonCell
                                                shopifyVal={row.shopify.available}
                                                thibaultVal={row.thibault?.stock[0]?.quantity}
                                                type="number"
                                            />

                                            <ComparisonCell
                                                shopifyVal={row.shopify.price}
                                                thibaultVal={row.thibault?.price?.retail}
                                                type="currency"
                                            />

                                            <ComparisonCell
                                                shopifyVal={row.shopify.cost}
                                                thibaultVal={row.thibault?.price?.net}
                                                type="currency"
                                            />

                                            <td className="p-6 text-center align-top">
                                                <div className="text-xs text-gray-500 font-mono space-y-1">
                                                    <div className={row.shopify.barcode !== row.thibault?.upc && row.thibault ? "text-red-500 font-bold" : ""}>
                                                        S: {row.shopify.barcode || '—'}
                                                    </div>
                                                    <div className={row.shopify.barcode !== row.thibault?.upc && row.thibault ? "text-green-600 font-bold" : "text-gray-400"}>
                                                        T: {row.thibault?.upc || '—'}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="p-6 text-right align-top">
                                                <a
                                                    href={`https://${process.env.NEXT_PUBLIC_SHOPIFY_SHOP_NAME || 'admin.shopify.com'}/store/${process.env.NEXT_PUBLIC_SHOPIFY_SHOP_NAME?.replace('.myshopify.com', '') || 'my-store'}/products/${row.shopify.productId.split('/').pop()}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                                    title="Open in Shopify"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination or Footer info */}
                    {!loading && filteredData.length > 0 && (
                        <div className="bg-gray-50 p-4 text-center text-xs text-gray-400 border-t border-gray-100">
                            Showing {filteredData.length} records
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Sub Components ---

function StatCard({ label, value, icon, subtext, color = 'blue', loading }: any) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between group hover:shadow-md transition-shadow">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
                {loading ? (
                    <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
                ) : (
                    <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
                )}
                {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-xl bg-${color}-50`}>
                {icon}
            </div>
        </div>
    );
}

function FilterBtn({ active, onClick, label, count, type = 'default' }: any) {
    const baseClass = "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2";

    let activeClass = "bg-gray-900 text-white shadow-lg shadow-gray-900/20";
    let inactiveClass = "text-gray-500 hover:bg-gray-100 hover:text-gray-900";

    if (type === 'warning' && active) activeClass = "bg-amber-500 text-white shadow-lg shadow-amber-500/20";
    if (type === 'success' && active) activeClass = "bg-green-600 text-white shadow-lg shadow-green-600/20";
    if (type === 'error' && active) activeClass = "bg-red-600 text-white shadow-lg shadow-red-600/20";

    return (
        <button
            onClick={onClick}
            className={`${baseClass} ${active ? activeClass : inactiveClass}`}
        >
            {label}
            {count !== undefined && <span className="opacity-80 text-xs bg-white/20 px-1.5 py-0.5 rounded-md ml-1">{count}</span>}
        </button>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'Match') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Synced
            </span>
        );
    }
    if (status === 'Mismatch') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                <AlertTriangle className="w-3.5 h-3.5" />
                Mismatch
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
            <XCircle className="w-3.5 h-3.5" />
            Not Found
        </span>
    );
}

function ComparisonCell({ shopifyVal, thibaultVal, type = 'text' }: any) {
    const isMismatch = shopifyVal !== thibaultVal && thibaultVal !== undefined;
    const format = (val: any) => {
        if (val === undefined || val === null) return '—';
        if (type === 'currency') return `$${Number(val).toFixed(2)}`;
        return val;
    };

    return (
        <td className="p-6 text-right align-top">
            <div className="flex flex-col items-end gap-1">
                <div className="font-semibold text-gray-900">
                    {format(shopifyVal)}
                </div>
                {thibaultVal !== undefined && (
                    <div className={`text-xs font-medium px-1.5 py-0.5 rounded ${isMismatch ? 'bg-red-50 text-red-600' : 'text-gray-400'}`}>
                        {format(thibaultVal)}
                    </div>
                )}
            </div>
        </td>
    );
}
