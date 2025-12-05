'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Package, LayoutGrid } from 'lucide-react';

export default function Navbar() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="fixed top-0 left-0 h-full w-20 bg-gray-900 flex flex-col items-center py-8 z-50 border-r border-gray-800 shadow-xl transition-all hover:w-64 group overflow-hidden">
            {/* Logo / Brand Icon */}
            <div className="mb-12 flex items-center justify-center w-full px-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                    <LayoutGrid className="text-white w-6 h-6" />
                </div>
                <span className="ml-4 text-white font-bold text-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">
                    Nexus Admin
                </span>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 w-full space-y-2 px-3">
                <Link href="/" className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 group/item ${isActive('/') ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                    <Search className="w-6 h-6 shrink-0" />
                    <span className="ml-4 font-medium opacity-0 group-hover:opacity-100 transition-all duration-300">
                        Part Finder
                    </span>
                </Link>

                <Link href="/product-manager" className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 group/item ${isActive('/product-manager') ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                    <Package className="w-6 h-6 shrink-0" />
                    <span className="ml-4 font-medium opacity-0 group-hover:opacity-100 transition-all duration-300">
                        Product Manager
                    </span>
                </Link>
            </div>

            {/* Footer / User Profile (Static for now) */}
            <div className="mt-auto w-full px-3 mb-4">
                <div className="flex items-center px-3 py-3 rounded-xl bg-gray-800/50 border border-gray-700/50">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 shrink-0" />
                    <div className="ml-3 overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <p className="text-sm font-medium text-white truncate">Admin User</p>
                        <p className="text-xs text-gray-400 truncate">Store Manager</p>
                    </div>
                </div>
            </div>
        </nav>
    );
}
