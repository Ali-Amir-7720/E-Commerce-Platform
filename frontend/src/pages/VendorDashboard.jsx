import React, { useEffect, useState, useCallback, useRef } from 'react';
import VendorChat from '../components/vendorChat';
import api from '../api/api';
import { useToast } from '../context/ToastContext';
import Loader from '../components/Loader';
import {
    Store, Plus, Edit2, X, Layers, Trash2,
    Package, ChevronDown, ChevronUp, Tag, BarChart2, Save, Upload
} from 'lucide-react';

// ── Image Upload (inline, no separate file needed) ─────────────────────────────
const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

const ImageUpload = ({ value, onChange }) => {
    const inputRef = useRef();
    const handleFile = async (file) => {
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB.'); return; }
        const b64 = await toBase64(file);
        onChange(b64);
    };
    return (
        <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Product Image</label>
            {value ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10 group">
                    <img src={value} alt="Product" className="w-full h-40 object-cover" />
                    <button type="button" onClick={() => onChange(null)}
                        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/60 hover:bg-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <X className="w-3.5 h-3.5 text-white" />
                    </button>
                </div>
            ) : (
                <div onClick={() => inputRef.current.click()}
                    onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                    onDragOver={e => e.preventDefault()}
                    className="border-2 border-dashed border-white/10 hover:border-cyan-500/40 rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-cyan-500/5">
                    <Upload className="w-7 h-7 mx-auto mb-2 text-white/20" />
                    <p className="text-sm text-white/30 font-semibold">Click or drag image here</p>
                    <p className="text-xs text-white/15 mt-1">PNG, JPG up to 2MB</p>
                </div>
            )}
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
                onChange={e => handleFile(e.target.files[0])} />
        </div>
    );
};

// ── Shared ─────────────────────────────────────────────────────────────────────
const DarkInput = ({ label, ...props }) => (
    <div>
        {label && <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">{label}</label>}
        <input className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/40 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-white/20" {...props} />
    </div>
);

const Modal = ({ title, onClose, children, wide }) => (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
        <div className={`bg-[#0e1117] border border-white/10 rounded-2xl shadow-xl w-full my-8 ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/8">
                <h3 className="font-bold text-white text-sm">{title}</h3>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div className="p-6">{children}</div>
        </div>
    </div>
);

const CategorySelect = ({ value, onChange, categories, required }) => (
    <div>
        <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">
            Category {required && <span className="text-red-400">*</span>}
        </label>
        <select required={required} value={value} onChange={onChange}
            className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/40 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all">
            <option value="" className="bg-[#0e1117]">— Select a category —</option>
            {categories.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0e1117]">{c.category_name}</option>
            ))}
        </select>
    </div>
);

const emptyVariant = () => ({ variant_name: '', sku: '', price: '', stock_quantity: '' });

const VariantInputRow = ({ index, variant, onChange, onRemove, canRemove }) => (
    <div className="p-4 bg-white/[0.03] border border-white/8 rounded-xl">
        <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white/30 uppercase tracking-wider">Variant {index + 1}</span>
            {canRemove && (
                <button type="button" onClick={onRemove}
                    className="w-6 h-6 flex items-center justify-center rounded-md text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
        <div className="grid grid-cols-2 gap-3">
            {[
                { key: 'variant_name', label: 'Name', placeholder: 'e.g. 128GB Black', type: 'text' },
                { key: 'sku', label: 'SKU', placeholder: 'e.g. SKU-001', type: 'text' },
                { key: 'price', label: 'Price *', placeholder: '0.00', type: 'number', step: '0.01', min: '0', req: true },
                { key: 'stock_quantity', label: 'Stock', placeholder: '0', type: 'number', min: '0' },
            ].map(f => (
                <div key={f.key}>
                    <label className="block text-xs text-white/30 mb-1.5">{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} step={f.step} min={f.min} required={f.req}
                        className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/40 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-all placeholder:text-white/20"
                        value={variant[f.key]}
                        onChange={e => onChange(index, f.key, e.target.value)} />
                </div>
            ))}
        </div>
    </div>
);

// ── Create Product Modal ───────────────────────────────────────────────────────
const CreateProductModal = ({ categories, onSubmit, onClose }) => {
    const [form, setForm] = useState({ product_name: '', category_id: '', description: '', status: 'active', image_url: null });
    const [variants, setVariants] = useState([emptyVariant()]);

    const updateVariant = (i, field, value) =>
        setVariants(prev => prev.map((v, idx) => idx === i ? { ...v, [field]: value } : v));

    const handleSubmit = (e) => {
        e.preventDefault();
        for (let i = 0; i < variants.length; i++) {
            if (!variants[i].price) { alert(`Variant ${i + 1} needs a price.`); return; }
        }
        onSubmit(form, variants);
    };

    return (
        <Modal title="New Product" onClose={onClose} wide>
            <form onSubmit={handleSubmit} className="space-y-5">
                <DarkInput label="Product Name *" required placeholder="e.g. iPhone 14"
                    value={form.product_name} onChange={e => setForm(p => ({ ...p, product_name: e.target.value }))} />
                <CategorySelect required value={form.category_id} categories={categories}
                    onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} />
                <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Description</label>
                    <textarea rows={2} placeholder="Brief product description..."
                        className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/40 rounded-xl px-4 py-3 text-sm text-white outline-none resize-none transition-all placeholder:text-white/20"
                        value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Status</label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none">
                        <option value="active" className="bg-[#0e1117]">Active</option>
                        <option value="inactive" className="bg-[#0e1117]">Inactive</option>
                    </select>
                </div>

                <ImageUpload value={form.image_url} onChange={val => setForm(p => ({ ...p, image_url: val }))} />

                <div className="border-t border-white/8 pt-5">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-sm font-bold text-white/70">Variants</p>
                            <p className="text-xs text-white/25 mt-0.5">Price lives on variants — at least one required.</p>
                        </div>
                        <button type="button" onClick={() => setVariants(p => [...p, emptyVariant()])}
                            className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-bold border border-violet-500/20 px-3 py-1.5 rounded-lg hover:bg-violet-500/10 transition-all">
                            <Plus className="w-3.5 h-3.5" /> Add Variant
                        </button>
                    </div>
                    <div className="space-y-3">
                        {variants.map((v, i) => (
                            <VariantInputRow key={i} index={i} variant={v}
                                onChange={updateVariant}
                                onRemove={() => setVariants(p => p.filter((_, idx) => idx !== i))}
                                canRemove={variants.length > 1} />
                        ))}
                    </div>
                </div>

                <button type="submit"
                    className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl transition-all active:scale-[0.98]">
                    Create Product · {variants.length} Variant{variants.length !== 1 ? 's' : ''}
                </button>
            </form>
        </Modal>
    );
};

// ── Edit Product Modal ─────────────────────────────────────────────────────────
const EditProductModal = ({ product, categories, onSave, onClose, toast }) => {
    const [form, setForm] = useState({
        product_name: product.product_name,
        category_id: String(product.category_id || ''),
        description: product.description || '',
        status: product.status || 'active',
        image_url: product.image_url || null,
    });
    const [variants, setVariants] = useState([]);
    const [loadingV, setLoadingV] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [addingNew, setAddingNew] = useState(false);
    const [newVariant, setNewVariant] = useState(emptyVariant());

    const fetchVariants = useCallback(async () => {
        setLoadingV(true);
        try {
            const res = await api.get(`/vendor/products/${product.id}/variants`);
            const data = res.data;
            setVariants(Array.isArray(data) ? data : (data?.data || data?.variants || []));
        } catch (err) {
            toast.error('Failed to load variants.');
        } finally { setLoadingV(false); }
    }, [product.id]);

    useEffect(() => { fetchVariants(); }, []);

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(`/vendor/products/${product.id}`, form);
            toast.success('Product updated!');
            onSave();
            onClose();
        } catch (err) { toast.error(err.response?.data?.error || 'Failed to update.'); }
        finally { setSaving(false); }
    };

    const handleSaveVariant = async (vid) => {
        try {
            await api.put(`/vendor/products/${product.id}/variants/${vid}`, editForm);
            toast.success('Variant updated!');
            setEditingId(null);
            fetchVariants();
        } catch (err) { toast.error(err.response?.data?.error || 'Failed.'); }
    };

    const handleDeleteVariant = async (vid) => {
        if (!window.confirm('Delete this variant?')) return;
        try {
            await api.delete(`/vendor/products/${product.id}/variants/${vid}`);
            toast.success('Variant deleted.');
            fetchVariants();
        } catch (err) { toast.error(err.response?.data?.error || 'Failed.'); }
    };

    const handleAddVariant = async (e) => {
        e.preventDefault();
        if (!newVariant.price) { alert('Price is required.'); return; }
        try {
            await api.post(`/vendor/products/${product.id}/variants`, newVariant);
            toast.success('Variant added!');
            setAddingNew(false);
            setNewVariant(emptyVariant());
            fetchVariants();
        } catch (err) { toast.error(err.response?.data?.error || 'Failed.'); }
    };

    const startEdit = (v) => {
        setEditingId(v.id);
        setEditForm({ variant_name: v.variant_name || '', sku: v.sku || '', price: v.price, stock_quantity: v.stock_quantity });
    };

    const variantField = (label, field, type = 'text', extra = {}) => (
        <div key={field}>
            <label className="block text-xs text-white/30 mb-1">{label}</label>
            <input type={type} {...extra}
                className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/40 rounded-lg px-3 py-2 text-sm text-white outline-none transition-all placeholder:text-white/20"
                value={editForm[field] ?? ''}
                onChange={e => setEditForm(p => ({ ...p, [field]: e.target.value }))} />
        </div>
    );

    return (
        <Modal title={`Edit — ${product.product_name}`} onClose={onClose} wide>
            <div className="space-y-6">
                <form onSubmit={handleSaveProduct} className="space-y-4">
                    <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Product Info</p>
                    <DarkInput label="Product Name *" required value={form.product_name}
                        onChange={e => setForm(p => ({ ...p, product_name: e.target.value }))} />
                    <CategorySelect required value={form.category_id} categories={categories}
                        onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} />
                    <div>
                        <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Description</label>
                        <textarea rows={2} value={form.description}
                            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/40 rounded-xl px-4 py-3 text-sm text-white outline-none resize-none transition-all placeholder:text-white/20" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Status</label>
                        <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none">
                            <option value="active" className="bg-[#0e1117]">Active</option>
                            <option value="inactive" className="bg-[#0e1117]">Inactive</option>
                        </select>
                    </div>
                    <ImageUpload value={form.image_url} onChange={val => setForm(p => ({ ...p, image_url: val }))} />
                    <button type="submit" disabled={saving}
                        className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Product Info'}
                    </button>
                </form>

                <div className="border-t border-white/8 pt-5">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-bold text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" /> Variants
                        </p>
                        {!addingNew && (
                            <button onClick={() => setAddingNew(true)}
                                className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-bold border border-violet-500/20 px-3 py-1.5 rounded-lg hover:bg-violet-500/10 transition-all">
                                <Plus className="w-3.5 h-3.5" /> Add Variant
                            </button>
                        )}
                    </div>

                    {addingNew && (
                        <form onSubmit={handleAddVariant} className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-xl mb-3 space-y-3">
                            <p className="text-xs font-bold text-violet-400 mb-2">New Variant</p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Name', field: 'variant_name', placeholder: '128GB Black' },
                                    { label: 'SKU', field: 'sku', placeholder: 'SKU-001' },
                                    { label: 'Price *', field: 'price', type: 'number', step: '0.01', min: '0', placeholder: '0.00' },
                                    { label: 'Stock', field: 'stock_quantity', type: 'number', min: '0', placeholder: '0' },
                                ].map(f => (
                                    <div key={f.field}>
                                        <label className="block text-xs text-white/30 mb-1">{f.label}</label>
                                        <input type={f.type || 'text'} placeholder={f.placeholder} step={f.step} min={f.min}
                                            className="w-full bg-white/5 border border-white/10 focus:border-violet-500/40 rounded-lg px-3 py-2 text-sm text-white outline-none transition-all placeholder:text-white/20"
                                            value={newVariant[f.field]}
                                            onChange={e => setNewVariant(p => ({ ...p, [f.field]: e.target.value }))} />
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 py-2 bg-violet-500 hover:bg-violet-400 text-white text-sm font-bold rounded-lg transition-colors">Add</button>
                                <button type="button" onClick={() => { setAddingNew(false); setNewVariant(emptyVariant()); }}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/50 text-sm rounded-lg transition-colors">Cancel</button>
                            </div>
                        </form>
                    )}

                    {loadingV ? (
                        <p className="text-white/20 text-xs py-4 text-center">Loading variants...</p>
                    ) : variants.length === 0 ? (
                        <p className="text-white/20 text-xs py-4 text-center">No variants yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {variants.map(v => (
                                <div key={v.id} className="border border-white/8 rounded-xl overflow-hidden">
                                    {editingId === v.id ? (
                                        <div className="p-4 bg-cyan-500/5">
                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                {variantField('Name', 'variant_name')}
                                                {variantField('SKU', 'sku')}
                                                {variantField('Price *', 'price', 'number', { step: '0.01', min: '0' })}
                                                {variantField('Stock', 'stock_quantity', 'number', { min: '0' })}
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleSaveVariant(v.id)}
                                                    className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5">
                                                    <Save className="w-3.5 h-3.5" /> Save
                                                </button>
                                                <button onClick={() => setEditingId(null)}
                                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/50 text-sm rounded-lg transition-colors">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 p-3 group hover:bg-white/[0.02] transition-colors">
                                            <div className="flex-grow min-w-0">
                                                <p className="text-sm font-semibold text-white/80">{v.variant_name || `Variant #${v.id}`}</p>
                                                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                                    <span className="text-xs font-mono text-white/25">{v.sku || 'No SKU'}</span>
                                                    <span className="text-xs font-black text-cyan-400">${parseFloat(v.price).toFixed(2)}</span>
                                                    <span className="text-xs text-white/25">{v.stock_quantity} in stock</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                <button onClick={() => startEdit(v)}
                                                    className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => handleDeleteVariant(v.id)}
                                                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

// ── Product Row ────────────────────────────────────────────────────────────────
const ProductRow = ({ product, categories, onEdit, onDelete, toast }) => {
    const [expanded, setExpanded] = useState(false);
    const [variants, setVariants] = useState([]);
    const [loadingV, setLoadingV] = useState(false);
    const [fetched, setFetched] = useState(false);

    const fetchVariants = useCallback(async () => {
        setLoadingV(true);
        try {
            const res = await api.get(`/vendor/products/${product.id}/variants`);
            const data = res.data;
            setVariants(Array.isArray(data) ? data : (data?.data || data?.variants || []));
            setFetched(true);
        } catch { toast.error('Failed to load variants.'); }
        finally { setLoadingV(false); }
    }, [product.id]);

    const handleExpand = () => {
        if (!fetched) fetchVariants();
        setExpanded(e => !e);
    };

    return (
        <>
            <tr className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-4 text-white/20 text-xs font-mono">#{product.id}</td>
                <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                        {product.image_url
                            ? <img src={product.image_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0" />
                            : <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0"><Package className="w-4 h-4 text-white/15" /></div>
                        }
                        <div>
                            <p className="font-semibold text-white/85 text-sm">{product.product_name}</p>
                            {product.description && <p className="text-xs text-white/25 mt-0.5 line-clamp-1">{product.description}</p>}
                        </div>
                    </div>
                </td>
                <td className="px-4 py-4 text-white/40 text-xs">{product.category_name || '—'}</td>
                <td className="px-4 py-4">
                    <span style={product.status === 'active'
                        ? { background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }
                        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold capitalize">
                        {product.status}
                    </span>
                </td>
                <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <button onClick={handleExpand}
                            className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 font-semibold px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
                            <Layers className="w-3.5 h-3.5" />
                            {product.variant_count} variant{product.variant_count !== 1 ? 's' : ''}
                            {expanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                        </button>
                        <span className="text-white/10">|</span>
                        <button onClick={() => onEdit(product)}
                            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold px-2 py-1 rounded-lg hover:bg-cyan-500/10 transition-colors">
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <span className="text-white/10">|</span>
                        <button onClick={() => onDelete(product.id)}
                            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-semibold px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                    </div>
                </td>
            </tr>
            {expanded && (
                <tr style={{ background: 'rgba(255,255,255,0.012)' }}>
                    <td colSpan={5} className="px-6 py-4">
                        <p className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" /> Variants
                        </p>
                        {loadingV ? <p className="text-white/20 text-xs">Loading...</p>
                            : variants.length === 0 ? <p className="text-white/20 text-xs">No variants. Click Edit to add.</p>
                                : (
                                    <div className="flex flex-wrap gap-2">
                                        {variants.map(v => (
                                            <div key={v.id} className="px-3 py-2 bg-white/[0.04] border border-white/8 rounded-xl">
                                                <p className="text-xs font-semibold text-white/70">{v.variant_name || `Variant #${v.id}`}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs font-black text-cyan-400">${parseFloat(v.price).toFixed(2)}</span>
                                                    <span className="text-white/10">·</span>
                                                    <span className="text-xs text-white/30">{v.stock_quantity} in stock</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                    </td>
                </tr>
            )}
        </>
    );
};

// ── Main ───────────────────────────────────────────────────────────────────────
const VendorDashboard = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const toast = useToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [pRes, cRes] = await Promise.all([
                api.get('/vendor/products'),
                api.get('/categories'),
            ]);
            setProducts(Array.isArray(pRes.data) ? pRes.data : (pRes.data?.data || []));
            setCategories(Array.isArray(cRes.data) ? cRes.data : (cRes.data?.data || []));
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to load data.');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, []);

    const handleCreate = async (form, variants) => {
        try {
            const pRes = await api.post('/vendor/products', form);
            const newId = pRes.data.id;
            await Promise.all(variants.map(v => api.post(`/vendor/products/${newId}/variants`, v)));
            toast.success(`Product created with ${variants.length} variant${variants.length !== 1 ? 's' : ''}!`);
            setModal(null);
            fetchData();
        } catch (err) { toast.error(err.response?.data?.error || 'Failed to create product.'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this product and all its variants?')) return;
        try {
            await api.delete(`/vendor/products/${id}`);
            toast.success('Product deleted.');
            fetchData();
        } catch (err) { toast.error(err.response?.data?.error || 'Failed to delete.'); }
    };

    const activeCount = products.filter(p => p.status === 'active').length;
    const variantTotal = products.reduce((s, p) => s + (parseInt(p.variant_count) || 0), 0);

    return (
        <div className="animate-fade-up">
            <div className="flex items-center justify-between mb-7">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                        <Store className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white">Vendor Dashboard</h2>
                        <p className="text-xs text-white/30 mt-0.5">Your products only</p>
                    </div>
                </div>
                <button onClick={() => setModal('create')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-bold rounded-xl transition-all active:scale-95">
                    <Plus className="w-4 h-4" /> New Product
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-7">
                {[
                    { label: 'Total Products', value: products.length, color: '#22d3ee', icon: Package },
                    { label: 'Active', value: activeCount, color: '#34d399', icon: BarChart2 },
                    { label: 'Total Variants', value: variantTotal, color: '#a78bfa', icon: Tag },
                ].map(s => (
                    <div key={s.label} className="bg-[#0e1117] border border-white/8 rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.color + '18' }}>
                            <s.icon className="w-5 h-5" style={{ color: s.color }} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white leading-none">{s.value}</p>
                            <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {loading ? <Loader /> : products.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] rounded-2xl border border-white/5">
                    <Package className="w-12 h-12 mx-auto mb-3 text-white/10" />
                    <p className="text-white/30 font-semibold">No products yet</p>
                    <p className="text-white/15 text-sm mt-1">Click "New Product" to get started.</p>
                </div>
            ) : (
                <div className="bg-[#0e1117] border border-white/8 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[700px]">
                            <thead className="border-b border-white/8">
                                <tr>
                                    {['ID', 'Product', 'Category', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="px-4 py-3.5 text-left text-[10px] font-mono font-bold text-white/25 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(p => (
                                    <ProductRow key={p.id} product={p} categories={categories}
                                        onEdit={prod => { setSelectedProduct(prod); setModal('edit'); }}
                                        onDelete={handleDelete} toast={toast} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {modal === 'create' && (
                <CreateProductModal categories={categories} onSubmit={handleCreate} onClose={() => setModal(null)} />
            )}
            {modal === 'edit' && selectedProduct && (
                <EditProductModal
                    product={selectedProduct}
                    categories={categories}
                    onSave={fetchData}
                    onClose={() => { setModal(null); setSelectedProduct(null); }}
                    toast={toast}
                />
            )}

            <VendorChat />
        </div>
    );
};

export default VendorDashboard;