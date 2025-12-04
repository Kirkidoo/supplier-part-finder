import { useState, useCallback, useEffect } from 'react';
import { ProductDetails } from '@/lib/types';
import axios from 'axios';
import { X, Package, Tag, DollarSign, Layers, FileText, Box, MapPin, Upload, CheckCircle, AlertCircle, Settings, Image as ImageIcon } from 'lucide-react';

interface VariantData {
    sku: string;
    optionValue: string;
    price: number;
    compareAtPrice: number;
    cost: number;
    margin: number;
    upc: string;
    weight: number;
    weightUnit: string;
    stock: number;
    image: string; // Per-variant image
}

interface CreateProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: ProductDetails;
    variants?: ProductDetails[];
}

export default function CreateProductModal({ isOpen, onClose, product, variants }: CreateProductModalProps) {
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const isMultiVariant = variants && variants.length > 1;
    const allProducts = variants || [product];

    // Product-level form data
    const [formData, setFormData] = useState({
        title: product.description,
        description: '',
        image: product.image || '',
        type: 'Part',
        vendor: product.brand || product.supplier,
        tags: '',
        templateSuffix: '',
        optionName: 'Size',
        locationId: '105008496957',
        status: 'active' as 'active' | 'draft',
    });

    // Variant-level form data
    const [variantsData, setVariantsData] = useState<VariantData[]>([]);

    // Initialize variants data
    useEffect(() => {
        const initialVariants = allProducts.map(p => ({
            sku: p.sku,
            optionValue: p.sku,
            price: p.price.retail,
            compareAtPrice: p.price.retail,
            cost: p.price.net || 0,
            margin: p.price.retail && p.price.net
                ? parseFloat((((p.price.retail - p.price.net) / p.price.retail) * 100).toFixed(2))
                : 0,
            upc: p.upc || '',
            weight: p.weight?.value || 0,
            weightUnit: p.weight?.unit || 'lb',
            stock: p.stock.reduce((sum, s) => sum + s.quantity, 0),
            image: p.image || '', // Initialize with product image
        }));
        setVariantsData(initialVariants);
    }, []);

    const handleChange = useCallback((field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleVariantChange = useCallback((index: number, field: string, value: any) => {
        setVariantsData(prev => {
            const updated = [...prev];
            const variant = { ...updated[index], [field]: value };

            if (field === 'price') {
                const newPrice = parseFloat(value) || 0;
                if (newPrice > 0) {
                    variant.margin = parseFloat((((newPrice - variant.cost) / newPrice) * 100).toFixed(2));
                }
                variant.compareAtPrice = newPrice;
            }

            if (field === 'margin') {
                const newMargin = parseFloat(value) || 0;
                if (newMargin < 100) {
                    variant.price = parseFloat((variant.cost / (1 - newMargin / 100)).toFixed(2));
                }
            }

            updated[index] = variant;
            return updated;
        });
    }, []);

    const handleVariantImageUpload = (index: number, file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            handleVariantChange(index, 'image', reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            handleChange('image', reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/create-product', {
                productDetails: allProducts,
                customData: {
                    ...formData,
                    variants: variantsData,
                    isMultiVariant,
                },
            });
            alert('Product created successfully!');
            onClose();
        } catch (error: any) {
            console.error(error);
            alert('Failed to create product: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto transition-all">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Package className="text-blue-600" />
                            Create on Shopify
                            {isMultiVariant && (
                                <span className="text-sm font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                    {variantsData.length} Variants
                                </span>
                            )}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Review and edit product details before publishing.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    <form id="create-product-form" onSubmit={handleSubmit} className="space-y-8">

                        {/* Variants Section - Show when multi-variant */}
                        {isMultiVariant && (
                            <section className="bg-purple-50 rounded-xl border border-purple-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <Settings size={18} className="text-purple-600" />
                                        Variant Settings
                                    </h3>
                                </div>

                                <div className="mb-4">
                                    <label className="label-premium">Option Name</label>
                                    <input
                                        type="text"
                                        value={formData.optionName}
                                        onChange={(e) => handleChange('optionName', e.target.value)}
                                        className="input-premium max-w-xs"
                                        placeholder="e.g. Size, Color, Model"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">This groups your variants (e.g., "Size" with values "Small", "Large")</p>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-gray-500 border-b border-purple-200">
                                                <th className="pb-2 pr-4 font-medium">Image</th>
                                                <th className="pb-2 pr-4 font-medium">{formData.optionName || 'Option'}</th>
                                                <th className="pb-2 pr-4 font-medium">SKU</th>
                                                <th className="pb-2 pr-4 font-medium">Cost</th>
                                                <th className="pb-2 pr-4 font-medium">Margin %</th>
                                                <th className="pb-2 pr-4 font-medium">Price</th>
                                                <th className="pb-2 font-medium">Stock</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {variantsData.map((variant, idx) => (
                                                <tr key={variant.sku} className="border-b border-purple-100 last:border-b-0">
                                                    <td className="py-2 pr-2">
                                                        <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden group">
                                                            {variant.image ? (
                                                                <>
                                                                    <img src={variant.image} alt="" className="w-full h-full object-cover" />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleVariantChange(idx, 'image', '')}
                                                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <label className="cursor-pointer w-full h-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors">
                                                                    <ImageIcon size={16} />
                                                                    <input
                                                                        type="file"
                                                                        className="hidden"
                                                                        accept="image/*"
                                                                        onChange={(e) => e.target.files?.[0] && handleVariantImageUpload(idx, e.target.files[0])}
                                                                    />
                                                                </label>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 pr-2">
                                                        <input
                                                            type="text"
                                                            value={variant.optionValue}
                                                            onChange={(e) => handleVariantChange(idx, 'optionValue', e.target.value)}
                                                            className="input-premium text-sm py-1.5"
                                                        />
                                                    </td>
                                                    <td className="py-2 pr-2">
                                                        <input
                                                            type="text"
                                                            value={variant.sku}
                                                            onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                                                            className="input-premium text-sm py-1.5 font-mono"
                                                        />
                                                    </td>
                                                    <td className="py-2 pr-2">
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={variant.cost}
                                                                readOnly
                                                                className="input-premium text-sm py-1.5 pl-5 w-24 bg-gray-50"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="py-2 pr-2">
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            value={variant.margin || ''}
                                                            onChange={(e) => handleVariantChange(idx, 'margin', e.target.value)}
                                                            className="input-premium text-sm py-1.5 w-20"
                                                        />
                                                    </td>
                                                    <td className="py-2 pr-2">
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={variant.price || ''}
                                                                onChange={(e) => handleVariantChange(idx, 'price', parseFloat(e.target.value) || 0)}
                                                                className="input-premium text-sm py-1.5 pl-5 w-24"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="py-2">
                                                        <span className={`font-medium ${variant.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                            {variant.stock}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Main Info */}
                            <div className="lg:col-span-2 space-y-6">
                                <section className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                            <FileText size={18} className="text-gray-400" />
                                            Product Details
                                        </h3>

                                        {/* Status Toggle */}
                                        <div className="flex bg-gray-100 p-1 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => handleChange('status', 'active')}
                                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${formData.status === 'active'
                                                    ? 'bg-white text-green-700 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                <CheckCircle size={14} />
                                                Active
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleChange('status', 'draft')}
                                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${formData.status === 'draft'
                                                    ? 'bg-white text-gray-700 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                <AlertCircle size={14} />
                                                Draft
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="label-premium">Title</label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => handleChange('title', e.target.value)}
                                                className="input-premium font-medium text-lg"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="label-premium">Description</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => handleChange('description', e.target.value)}
                                                className="input-premium h-40 text-sm"
                                                placeholder="Paste description from supplier website..."
                                            />
                                            <p className="text-xs text-gray-400 mt-1">Line breaks will be preserved automatically.</p>
                                        </div>

                                        {/* Image Upload Section */}
                                        <div>
                                            <label className="label-premium">Primary Image {isMultiVariant && '(Used for variants without images)'}</label>
                                            <div
                                                className={`relative border-2 border-dashed rounded-xl p-6 transition-all text-center ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                                                    }`}
                                                onDragEnter={handleDrag}
                                                onDragLeave={handleDrag}
                                                onDragOver={handleDrag}
                                                onDrop={handleDrop}
                                            >
                                                <input
                                                    type="file"
                                                    id="image-upload"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                />

                                                {formData.image ? (
                                                    <div className="relative group">
                                                        <img
                                                            src={formData.image}
                                                            alt="Preview"
                                                            className="h-48 mx-auto object-contain rounded-lg shadow-sm bg-white"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleChange('image', '')}
                                                                className="bg-white text-red-600 px-4 py-2 rounded-lg font-medium shadow-lg hover:bg-red-50"
                                                            >
                                                                Remove Image
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="py-8">
                                                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                                            <Upload size={32} />
                                                        </div>
                                                        <p className="text-gray-900 font-medium mb-1">
                                                            Drag & drop an image here, or <label htmlFor="image-upload" className="text-blue-600 hover:underline cursor-pointer">browse</label>
                                                        </p>
                                                        <p className="text-sm text-gray-500">Supports JPG, PNG, WEBP</p>

                                                        <div className="mt-4 flex items-center gap-3">
                                                            <div className="h-px bg-gray-200 flex-1" />
                                                            <span className="text-xs text-gray-400 font-medium uppercase">OR</span>
                                                            <div className="h-px bg-gray-200 flex-1" />
                                                        </div>

                                                        <input
                                                            type="text"
                                                            placeholder="Paste image URL here"
                                                            value={formData.image}
                                                            onChange={(e) => handleChange('image', e.target.value)}
                                                            className="mt-4 input-premium text-sm"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Pricing section - only show for single variant */}
                                {!isMultiVariant && variantsData[0] && (
                                    <section className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <DollarSign size={18} className="text-gray-400" />
                                            Pricing
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="label-premium">Cost per Item (Net)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={variantsData[0].cost}
                                                        className="input-premium pl-7 bg-gray-50 text-gray-500"
                                                        readOnly
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="label-premium">Margin (%)</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={variantsData[0].margin || ''}
                                                    onChange={(e) => handleVariantChange(0, 'margin', e.target.value)}
                                                    className="input-premium"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="label-premium">Price</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={variantsData[0].price || ''}
                                                        onChange={(e) => handleVariantChange(0, 'price', parseFloat(e.target.value) || 0)}
                                                        className="input-premium pl-7"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="label-premium">Compare at Price</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={variantsData[0].compareAtPrice || ''}
                                                        onChange={(e) => handleVariantChange(0, 'compareAtPrice', parseFloat(e.target.value) || 0)}
                                                        className="input-premium pl-7"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </div>

                            {/* Right Column: Organization & Inventory */}
                            <div className="space-y-6">
                                <section className="bg-gray-50/50 rounded-xl border border-gray-100 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Layers size={18} className="text-gray-400" />
                                        Organization
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="label-premium">Product Type</label>
                                            <input
                                                type="text"
                                                value={formData.type}
                                                onChange={(e) => handleChange('type', e.target.value)}
                                                className="input-premium"
                                            />
                                        </div>
                                        <div>
                                            <label className="label-premium">Vendor</label>
                                            <input
                                                type="text"
                                                value={formData.vendor}
                                                onChange={(e) => handleChange('vendor', e.target.value)}
                                                className="input-premium"
                                            />
                                        </div>
                                        <div>
                                            <label className="label-premium">Tags</label>
                                            <div className="relative">
                                                <Tag className="absolute left-3 top-3 text-gray-400" size={16} />
                                                <input
                                                    type="text"
                                                    value={formData.tags}
                                                    onChange={(e) => handleChange('tags', e.target.value)}
                                                    className="input-premium pl-9"
                                                    placeholder="tag1, tag2..."
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label-premium">Template</label>
                                            <select
                                                value={formData.templateSuffix}
                                                onChange={(e) => handleChange('templateSuffix', e.target.value)}
                                                className="input-premium"
                                            >
                                                <option value="">Default</option>
                                                <option value="clearance">Clearance</option>
                                            </select>
                                        </div>
                                    </div>
                                </section>

                                {/* Inventory section - only show for single variant */}
                                {!isMultiVariant && variantsData[0] && (
                                    <section className="bg-gray-50/50 rounded-xl border border-gray-100 p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Box size={18} className="text-gray-400" />
                                            Inventory
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="label-premium">SKU</label>
                                                <input
                                                    type="text"
                                                    value={variantsData[0].sku}
                                                    onChange={(e) => handleVariantChange(0, 'sku', e.target.value)}
                                                    className="input-premium font-mono text-sm"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="label-premium">UPC / Barcode</label>
                                                <input
                                                    type="text"
                                                    value={variantsData[0].upc}
                                                    onChange={(e) => handleVariantChange(0, 'upc', e.target.value)}
                                                    className="input-premium font-mono text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="label-premium">Location ID</label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                    <input
                                                        type="text"
                                                        value={formData.locationId}
                                                        onChange={(e) => handleChange('locationId', e.target.value)}
                                                        className="input-premium pl-9 bg-gray-100 text-gray-500"
                                                        readOnly
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="label-premium">Weight</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={variantsData[0].weight}
                                                        onChange={(e) => handleVariantChange(0, 'weight', parseFloat(e.target.value))}
                                                        className="input-premium"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="label-premium">Unit</label>
                                                    <select
                                                        value={variantsData[0].weightUnit}
                                                        onChange={(e) => handleVariantChange(0, 'weightUnit', e.target.value)}
                                                        className="input-premium"
                                                    >
                                                        <option value="lb">lb</option>
                                                        <option value="kg">kg</option>
                                                        <option value="oz">oz</option>
                                                        <option value="g">g</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 sticky bottom-0 z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-gray-700 font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="create-product-form"
                        disabled={loading}
                        className="px-6 py-2.5 text-white font-medium bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Package size={18} />
                                Create Product
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
