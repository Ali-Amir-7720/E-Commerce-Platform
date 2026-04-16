import React, { useEffect, useState } from 'react';
import { getUsers, blockUser, unblockUser, changeUserRole, manageCategories, manageOffers } from '../api/api';
import api from '../api/api';
import { useToast } from '../context/ToastContext';
import Loader from '../components/Loader';
import { Users, Tag, Percent, ShieldX, ShieldCheck, Plus, X, Package, Crown, Star, Trash2, ShieldAlert, Ban, ClipboardList } from 'lucide-react';

const TabBtn = ({ active, onClick, Icon, children }) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${active ? 'text-black' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
        style={active ? { background: '#22d3ee' } : {}}>
        <Icon className="w-4 h-4" />{children}
    </button>
);

const Badge = ({ color, children }) => {
    const colors = {
        blue: 'bg-blue-500/15 text-blue-400',
        green: 'bg-emerald-500/15 text-emerald-400',
        red: 'bg-red-500/15 text-red-400',
        yellow: 'bg-yellow-500/15 text-yellow-400',
        purple: 'bg-violet-500/15 text-violet-400',
    };
    return <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${colors[color] || colors.blue}`}>{children}</span>;
};

const Modal = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="rounded-2xl shadow-2xl w-full max-w-md" style={{ background: '#141a24', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex justify-between items-center px-6 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 className="font-black text-white">{title}</h3>
                <button onClick={onClose} className="text-white/30 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">{children}</div>
        </div>
    </div>
);

const StarDisplay = ({ rating }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(n => (
            <Star key={n} className="w-3.5 h-3.5"
                style={{ fill: n <= rating ? '#f59e0b' : 'transparent', color: n <= rating ? '#f59e0b' : 'rgba(255,255,255,0.15)' }} />
        ))}
    </div>
);

const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all placeholder:text-white/20";
const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };

const AdminDashboard = () => {
    const [tab, setTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [offers, setOffers] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [fraudFlags, setFraudFlags] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCatModal, setShowCatModal] = useState(false);
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [catForm, setCatForm] = useState({ category_name: '' });
    const [offerForm, setOfferForm] = useState({ coupon_code: '', discount_type: 'rate', discount_value: '', start_date: '', end_date: '' });
    const [lightbox, setLightbox] = useState(null);
    const toast = useToast();

    const fetchTab = async (t) => {
        setLoading(true);
        try {
            if (t === 'users') { const r = await getUsers(); setUsers(Array.isArray(r.data) ? r.data : []); }
            if (t === 'products') { const r = await api.get('/admin/products'); setProducts(Array.isArray(r.data) ? r.data : []); }
            if (t === 'categories') { const r = await manageCategories.getAll(); setCategories(Array.isArray(r.data) ? r.data : []); }
            if (t === 'offers') { const r = await manageOffers.getAll(); setOffers(Array.isArray(r.data) ? r.data : []); }
            if (t === 'reviews') { const r = await api.get('/reviews'); setReviews(Array.isArray(r.data) ? r.data : []); }
            if (t === 'fraud') { const r = await api.get('/admin/fraud'); setFraudFlags(Array.isArray(r.data) ? r.data : []); }
            if (t === 'orders') { const r = await api.get('/orders'); setOrders(Array.isArray(r.data) ? r.data : []); }
        } catch { toast.error('Failed to load data.'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchTab(tab); }, [tab]);

    const handleBlock = async (id) => {
        try { await blockUser(id); toast.success('User blocked.'); fetchTab('users'); }
        catch (e) { toast.error(e.response?.data?.error || 'Failed to block user.'); }
    };

    const handleUnblock = async (id) => {
        try { await unblockUser(id); toast.success('User unblocked.'); fetchTab('users'); }
        catch (e) { toast.error(e.response?.data?.error || 'Failed to unblock user.'); }
    };

    const handleMakeAdmin = async (id) => {
        if (!window.confirm('Promote this user to Admin?')) return;
        try { await changeUserRole(id, 1); toast.success('User promoted to Admin.'); fetchTab('users'); }
        catch (e) { toast.error(e.response?.data?.error || 'Failed to change role.'); }
    };

    const handleBan = async (id) => {
        try { await api.patch(`/admin/products/${id}/ban`); toast.success('Product banned.'); fetchTab('products'); }
        catch (e) { toast.error(e.response?.data?.error || 'Failed to ban product.'); }
    };

    const handleUnban = async (id) => {
        try { await api.patch(`/admin/products/${id}/unban`); toast.success('Product unbanned.'); fetchTab('products'); }
        catch (e) { toast.error(e.response?.data?.error || 'Failed to unban product.'); }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        try { await manageCategories.create(catForm); toast.success('Category created!'); setShowCatModal(false); setCatForm({ category_name: '' }); fetchTab('categories'); }
        catch (e) { toast.error(e.response?.data?.error || 'Failed to create.'); }
    };

    const handleDeleteCategory = async (id) => {
        try { await manageCategories.delete(id); toast.success('Category removed.'); fetchTab('categories'); }
        catch (e) { toast.error(e.response?.data?.error || 'Failed to delete.'); }
    };

    const handleCreateOffer = async (e) => {
        e.preventDefault();
        const today = new Date().toISOString().split('T')[0];
        if (offerForm.start_date < today) {
            toast.error('Start date cannot be in the past.');
            return;
        }
        if (offerForm.end_date < today) {
            toast.error('End date cannot be in the past.');
            return;
        }
        if (offerForm.end_date < offerForm.start_date) {
            toast.error('End date cannot be before start date.');
            return;
        }
        try { await manageOffers.create(offerForm); toast.success('Offer created!'); setShowOfferModal(false); setOfferForm({ coupon_code: '', discount_type: 'rate', discount_value: '', start_date: '', end_date: '' }); fetchTab('offers'); }
        catch (e) { toast.error(e.response?.data?.error || 'Failed to create.'); }
    };

    const handleDeleteOffer = async (id) => {
        try { await manageOffers.delete(id); toast.success('Offer removed.'); fetchTab('offers'); }
        catch (e) { toast.error(e.response?.data?.error || 'Failed.'); }
    };

    const handleDeleteReview = async (id) => {
        try { await api.delete(`/reviews/${id}`); toast.success('Review deleted.'); fetchTab('reviews'); }
        catch (e) { toast.error(e.response?.data?.error || 'Failed to delete review.'); }
    };

    const handleBanFraudUser = async (userId, userName) => {
        if (!window.confirm(`Ban ${userName}? This will cancel ALL their active orders and restore stock.`)) return;
        try {
            const res = await api.patch(`/admin/fraud/ban/${userId}`);
            toast.success(res.data?.message || 'User banned and orders cancelled.');
            fetchTab('fraud');
        }
        catch (e) { toast.error(e.response?.data?.error || 'Failed to ban user.'); }
    };

    const thCls = "px-5 py-3 text-left text-xs font-black text-white/30 uppercase tracking-wider";
    const tdCls = "px-5 py-3.5";

    return (
        <div>
            <div className="flex items-center gap-3 mb-7">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#22d3ee,#a78bfa)' }}>
                    <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-white">Admin Dashboard</h2>
                    <p className="text-xs text-white/30 mt-0.5">Manage users, products, categories, offers & reviews</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6 p-1.5 rounded-2xl w-fit" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <TabBtn active={tab === 'users'} onClick={() => setTab('users')} Icon={Users}>Users</TabBtn>
                <TabBtn active={tab === 'products'} onClick={() => setTab('products')} Icon={Package}>Products</TabBtn>
                <TabBtn active={tab === 'categories'} onClick={() => setTab('categories')} Icon={Tag}>Categories</TabBtn>
                <TabBtn active={tab === 'offers'} onClick={() => setTab('offers')} Icon={Percent}>Offers</TabBtn>
                <TabBtn active={tab === 'reviews'} onClick={() => setTab('reviews')} Icon={Star}>Reviews</TabBtn>
                <TabBtn active={tab === 'fraud'} onClick={() => setTab('fraud')} Icon={ShieldAlert}>Fraud</TabBtn>
                <TabBtn active={tab === 'orders'} onClick={() => setTab('orders')} Icon={ClipboardList}>Orders</TabBtn>
            </div>

            {loading ? <Loader /> : (
                <>
                    {/* USERS */}
                    {tab === 'users' && (
                        <div className="rounded-2xl overflow-x-auto" style={{ background: '#0e1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <table className="w-full text-sm min-w-[650px]">
                                <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                    <tr>{['ID', 'Name', 'Email', 'Role', 'Status', 'Actions'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td className={`${tdCls} text-white/25 text-xs`}>{u.id}</td>
                                            <td className={`${tdCls} font-semibold text-white/85`}>{u.full_name}</td>
                                            <td className={`${tdCls} text-white/45`}>{u.email}</td>
                                            <td className={tdCls}><Badge color="blue">{u.role_name}</Badge></td>
                                            <td className={tdCls}><Badge color={u.status === 'active' ? 'green' : 'red'}>{u.status}</Badge></td>
                                            <td className={`${tdCls} flex gap-2`}>
                                                {u.role_name === 'Admin' ? (
                                                    <span className="text-xs text-white/20 italic">Protected</span>
                                                ) : (
                                                    <>
                                                        {u.status === 'active'
                                                            ? <button onClick={() => handleBlock(u.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">Block</button>
                                                            : <button onClick={() => handleUnblock(u.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors">Unblock</button>
                                                        }
                                                        <button onClick={() => handleMakeAdmin(u.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 transition-colors flex items-center gap-1">
                                                            <Crown className="w-3 h-3" /> Admin
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* PRODUCTS */}
                    {tab === 'products' && (
                        <div className="rounded-2xl overflow-x-auto" style={{ background: '#0e1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <table className="w-full text-sm min-w-[600px]">
                                <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                    <tr>{['Image', 'Product', 'Category', 'Vendor', 'Status', 'Action'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr>
                                </thead>
                                <tbody>
                                    {products.map(p => (
                                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td className={tdCls}>
                                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center border border-white/8">
                                                    {p.image_url
                                                        ? <img src={p.image_url} alt={p.product_name} className="w-full h-full object-cover" />
                                                        : <Package className="w-4 h-4 text-white/15" />
                                                    }
                                                </div>
                                            </td>
                                            <td className={`${tdCls} font-semibold text-white/85`}>{p.product_name}</td>
                                            <td className={`${tdCls} text-white/40`}>{p.category_name || '—'}</td>
                                            <td className={`${tdCls} text-white/40`}>{p.vendor_name || p.vendor_id || '—'}</td>
                                            <td className={tdCls}><Badge color={p.status === 'active' ? 'green' : p.status === 'banned' ? 'red' : 'yellow'}>{p.status}</Badge></td>
                                            <td className={tdCls}>
                                                {p.status === 'banned'
                                                    ? <button onClick={() => handleUnban(p.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors">Unban</button>
                                                    : <button onClick={() => handleBan(p.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">Ban</button>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* CATEGORIES */}
                    {tab === 'categories' && (
                        <div>
                            <div className="flex justify-end mb-4">
                                <button onClick={() => setShowCatModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-black transition-all" style={{ background: '#22d3ee' }}>
                                    <Plus className="w-4 h-4" /> Add Category
                                </button>
                            </div>
                            <div className="rounded-2xl overflow-hidden" style={{ background: '#0e1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <table className="w-full text-sm">
                                    <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                        <tr>{['ID', 'Name', 'Action'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr>
                                    </thead>
                                    <tbody>
                                        {categories.map(c => (
                                            <tr key={c.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td className={`${tdCls} text-white/25 text-xs`}>{c.id}</td>
                                                <td className={`${tdCls} font-semibold text-white/85`}>{c.category_name}</td>
                                                <td className={tdCls}>
                                                    <button onClick={() => handleDeleteCategory(c.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* OFFERS */}
                    {tab === 'offers' && (
                        <div>
                            <div className="flex justify-end mb-4">
                                <button onClick={() => setShowOfferModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-black transition-all" style={{ background: '#22d3ee' }}>
                                    <Plus className="w-4 h-4" /> Add Offer
                                </button>
                            </div>
                            <div className="rounded-2xl overflow-x-auto" style={{ background: '#0e1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <table className="w-full text-sm min-w-[600px]">
                                    <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                        <tr>{['Code', 'Type', 'Value', 'Start', 'End', 'Status', 'Action'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr>
                                    </thead>
                                    <tbody>
                                        {offers.map(o => (
                                            <tr key={o.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td className={`${tdCls} font-mono font-bold text-cyan-400`}>{o.coupon_code}</td>
                                                <td className={`${tdCls} text-white/50`}>{o.discount_type}</td>
                                                <td className={`${tdCls} text-white/70 font-bold`}>{o.discount_type === 'rate' ? `${o.discount_value}%` : `$${o.discount_value}`}</td>
                                                <td className={`${tdCls} text-white/40 text-xs`}>{o.start_date?.slice(0, 10)}</td>
                                                <td className={`${tdCls} text-white/40 text-xs`}>{o.end_date?.slice(0, 10)}</td>
                                                <td className={tdCls}><Badge color={o.status === 'active' ? 'green' : 'red'}>{o.status}</Badge></td>
                                                <td className={tdCls}>
                                                    <button onClick={() => handleDeleteOffer(o.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* REVIEWS */}
                    {tab === 'reviews' && (
                        reviews.length === 0 ? (
                            <div className="text-center py-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <Star className="w-12 h-12 mx-auto mb-3 text-white/10" />
                                <p className="text-white/30 font-semibold">No reviews yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {reviews.map(r => (
                                    <div key={r.id} className="p-5 rounded-2xl" style={{ background: '#0e1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 flex-wrap mb-2">
                                                    <p className="font-bold text-white/85 text-sm">{r.reviewer_name}</p>
                                                    <span className="text-xs text-white/30">{r.reviewer_email}</span>
                                                    <StarDisplay rating={r.rating} />
                                                    <span className="text-xs text-white/25">{new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                </div>
                                                <div className="flex gap-2 flex-wrap mb-2">
                                                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/10 text-cyan-400">{r.product_name}</span>
                                                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono text-white/30" style={{ background: 'rgba(255,255,255,0.05)' }}>{r.order_number}</span>
                                                </div>
                                                {r.comment && <p className="text-white/50 text-sm leading-relaxed">{r.comment}</p>}
                                                {r.image_url && (
                                                    <img src={r.image_url} alt="Review"
                                                        className="mt-3 h-24 w-24 object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                                                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                                                        onClick={() => setLightbox(r.image_url)} />
                                                )}
                                            </div>
                                            <button onClick={() => handleDeleteReview(r.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all bg-red-500/10 text-red-400 hover:bg-red-500/20">
                                                <Trash2 className="w-3.5 h-3.5" /> Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {/* FRAUD FLAGS */}
                    {tab === 'fraud' && (
                        fraudFlags.length === 0 ? (
                            <div className="text-center py-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-white/10" />
                                <p className="text-white/30 font-semibold">No fraud flags</p>
                                <p className="text-white/15 text-sm mt-1">All orders are clean</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {fraudFlags.map(f => (
                                    <div key={f.flag_id} className="p-5 rounded-2xl" style={{ background: '#0e1117', border: `1px solid ${f.flag_status === 'pending' ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                                        <div className="flex items-start justify-between gap-4 flex-wrap">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                                    <span className="text-xs font-black px-2.5 py-1 rounded-lg"
                                                        style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                                                        {f.rule_triggered}
                                                    </span>
                                                    <Badge color={f.flag_status === 'pending' ? 'yellow' : f.flag_status === 'approved' ? 'green' : 'red'}>
                                                        {f.flag_status}
                                                    </Badge>
                                                    <span className="text-xs text-white/25">{new Date(f.created_at).toLocaleString()}</span>
                                                </div>
                                                <p className="text-white/55 text-sm mb-2">{f.detail}</p>
                                                <div className="flex gap-2 flex-wrap">
                                                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono text-cyan-400" style={{ background: 'rgba(34,211,238,0.08)' }}>{f.order_number}</span>
                                                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>${parseFloat(f.net_amount).toFixed(2)}</span>
                                                    <span className="px-2.5 py-1 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>{f.full_name} — {f.email}</span>
                                                </div>
                                                {f.flag_status !== 'pending' && f.reviewed_by_name && (
                                                    <p className="text-xs text-white/20 mt-2">Reviewed by {f.reviewed_by_name} on {new Date(f.reviewed_at).toLocaleString()}</p>
                                                )}
                                            </div>
                                            {f.flag_status === 'pending' && f.user_status !== 'blocked' && (
                                                <button onClick={() => handleBanFraudUser(f.user_id, f.full_name)}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0"
                                                    style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                                                    <Ban className="w-3.5 h-3.5" /> Ban User
                                                </button>
                                            )}
                                            {f.user_status === 'blocked' && (
                                                <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shrink-0"
                                                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)' }}>
                                                    <Ban className="w-3.5 h-3.5" /> Already Banned
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {/* ORDERS */}
                    {tab === 'orders' && (
                        orders.length === 0 ? (
                            <div className="text-center py-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-white/10" />
                                <p className="text-white/30 font-semibold">No orders yet</p>
                            </div>
                        ) : (
                            <div className="rounded-2xl overflow-x-auto" style={{ background: '#0e1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <table className="w-full text-sm min-w-[750px]">
                                    <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                        <tr>{['Order #', 'Customer', 'Amount', 'Payment', 'Status', 'Date'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(o => (
                                            <tr key={o.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td className={`${tdCls} font-mono font-bold text-cyan-400 text-xs`}>{o.order_number}</td>
                                                <td className={`${tdCls} text-white/60 text-xs`}>{o.user_email}</td>
                                                <td className={`${tdCls} font-bold text-white/85`}>${parseFloat(o.net_amount).toFixed(2)}</td>
                                                <td className={`${tdCls} text-white/40 capitalize text-xs`}>{o.payment_status}</td>
                                                <td className={tdCls}>
                                                    <Badge color={
                                                        o.status === 'delivered' ? 'green' :
                                                            o.status === 'placed' ? 'blue' :
                                                                o.status === 'shipping' ? 'purple' :
                                                                    o.status === 'flagged' ? 'yellow' :
                                                                        o.status === 'cancelled' || o.status === 'failed' ? 'red' : 'blue'
                                                    }>{o.status}</Badge>
                                                </td>
                                                <td className={`${tdCls} text-white/30 text-xs`}>
                                                    {new Date(o.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </>
            )}

            {/* Category Modal */}
            {showCatModal && (
                <Modal title="New Category" onClose={() => setShowCatModal(false)}>
                    <form onSubmit={handleCreateCategory} className="space-y-4">
                        <input className={inputCls} style={inputStyle} placeholder="Category name" value={catForm.category_name}
                            onChange={e => setCatForm({ category_name: e.target.value })} required />
                        <button type="submit" className="w-full py-2.5 rounded-xl font-bold text-black" style={{ background: '#22d3ee' }}>Create</button>
                    </form>
                </Modal>
            )}

            {/* Offer Modal */}
            {showOfferModal && (
                <Modal title="New Offer" onClose={() => setShowOfferModal(false)}>
                    <form onSubmit={handleCreateOffer} className="space-y-4">
                        <input className={inputCls} style={inputStyle} placeholder="Coupon code" value={offerForm.coupon_code}
                            onChange={e => setOfferForm(f => ({ ...f, coupon_code: e.target.value }))} required />
                        <select className={inputCls} style={inputStyle} value={offerForm.discount_type}
                            onChange={e => setOfferForm(f => ({ ...f, discount_type: e.target.value }))}>
                            <option value="rate" className="bg-[#141a24]">Percentage (%)</option>
                            <option value="fixed" className="bg-[#141a24]">Fixed ($)</option>
                        </select>
                        <input className={inputCls} style={inputStyle} placeholder="Discount value" type="number" value={offerForm.discount_value}
                            onChange={e => setOfferForm(f => ({ ...f, discount_value: e.target.value }))} required />
                        <input className={inputCls} style={inputStyle} type="date" value={offerForm.start_date}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={e => setOfferForm(f => ({ ...f, start_date: e.target.value }))} required />
                        <input className={inputCls} style={inputStyle} type="date" value={offerForm.end_date}
                            min={offerForm.start_date || new Date().toISOString().split('T')[0]}
                            onChange={e => setOfferForm(f => ({ ...f, end_date: e.target.value }))} required />
                        <button type="submit" className="w-full py-2.5 rounded-xl font-bold text-black" style={{ background: '#22d3ee' }}>Create Offer</button>
                    </form>
                </Modal>
            )}

            {/* Lightbox */}
            {lightbox && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setLightbox(null)}>
                    <img src={lightbox} alt="Review" className="max-w-full max-h-[85vh] rounded-2xl object-contain" />
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;