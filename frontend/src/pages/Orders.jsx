import React, { useEffect, useState } from 'react';
import { getOrders, getOrderDetails } from '../api/api';
import api from '../api/api';
import { useToast } from '../context/ToastContext';
import Loader from '../components/Loader';
import { Package, ChevronDown, ChevronUp, Clock, Star, Image as ImageIcon, X, MessageCircle } from 'lucide-react';

const STATUS = {
    pending: { dot: 'bg-yellow-400', badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    placed: { dot: 'bg-blue-400', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    processing: { dot: 'bg-blue-400', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    shipping: { dot: 'bg-violet-400', badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
    delivered: { dot: 'bg-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    cancelled: { dot: 'bg-red-400', badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
    failed: { dot: 'bg-red-400', badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

const StarRating = ({ value, onChange }) => (
    <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => onChange(n)} type="button">
                <Star className="w-6 h-6 transition-colors"
                    style={{ fill: n <= value ? '#f59e0b' : 'transparent', color: n <= value ? '#f59e0b' : 'rgba(255,255,255,0.2)' }} />
            </button>
        ))}
    </div>
);

const ReviewModal = ({ orderId, items, onClose, onSubmit }) => {
    const [reviews, setReviews] = useState(
        items.map(i => ({ product_id: i.product_id, variant_name: i.variant_name, rating: 0, comment: '', image_url: null, preview: null }))
    );
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    const updateReview = (idx, field, val) => {
        setReviews(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
    };

    const handleImageUpload = (idx, file) => {
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            updateReview(idx, 'image_url', e.target.result);
            updateReview(idx, 'preview', e.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        const toSubmit = reviews.filter(r => r.rating > 0);
        if (toSubmit.length === 0) { toast.error('Please rate at least one item.'); return; }
        setSubmitting(true);
        try {
            await Promise.all(toSubmit.map(r =>
                api.post('/reviews', {
                    order_id: orderId,
                    product_id: r.product_id,
                    rating: r.rating,
                    comment: r.comment || null,
                    image_url: r.image_url || null,
                })
            ));
            toast.success('Review submitted!');
            onSubmit();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to submit review.');
        } finally { setSubmitting(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: '#141a24', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex justify-between items-center px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <h3 className="font-black text-white">Rate Your Order</h3>
                    <button onClick={onClose} className="text-white/30 hover:text-white text-xl font-bold leading-none">×</button>
                </div>
                <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                    {reviews.map((r, i) => (
                        <div key={i} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <p className="font-semibold text-white/80 text-sm mb-3">{r.variant_name}</p>
                            <StarRating value={r.rating} onChange={val => updateReview(i, 'rating', val)} />
                            <textarea
                                value={r.comment}
                                onChange={e => updateReview(i, 'comment', e.target.value)}
                                placeholder="Leave a comment (optional)..."
                                rows={2}
                                className="w-full mt-3 px-3 py-2 rounded-xl text-sm text-white outline-none resize-none placeholder:text-white/20"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                            />
                            <div className="mt-3">
                                {r.preview ? (
                                    <div className="relative inline-block">
                                        <img src={r.preview} alt="preview" className="h-20 w-20 object-cover rounded-xl"
                                            style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                                        <button onClick={() => { updateReview(i, 'image_url', null); updateReview(i, 'preview', null); }}
                                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center"
                                            style={{ background: '#f87171' }}>
                                            <X className="w-3 h-3 text-white" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold px-3 py-2 rounded-xl w-fit transition-all"
                                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <ImageIcon className="w-3.5 h-3.5" /> Add Photo
                                        <input type="file" accept="image/*" className="hidden"
                                            onChange={e => handleImageUpload(i, e.target.files[0])} />
                                    </label>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <button onClick={handleSubmit} disabled={submitting}
                        className="w-full py-3 rounded-xl font-bold text-black transition-all disabled:opacity-60"
                        style={{ background: '#22d3ee' }}>
                        {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState({});
    const [details, setDetails] = useState({});
    const [reviewed, setReviewed] = useState({});
    const [reviewModal, setReviewModal] = useState(null);
    const toast = useToast();

    useEffect(() => {
        const loadOrders = async () => {
            try {
                const res = await getOrders();
                const data = Array.isArray(res.data) ? res.data : [];
                setOrders(data);

                const deliveredIds = data.filter(o => o.status === 'delivered').map(o => o.id);
                if (deliveredIds.length > 0) {
                    try {
                        const reviewRes = await api.get('/reviews/my');
                        const myReviews = Array.isArray(reviewRes.data) ? reviewRes.data : [];
                        const reviewedOrders = {};
                        myReviews.forEach(r => { reviewedOrders[r.order_id] = true; });
                        setReviewed(reviewedOrders);
                    } catch { }
                }
            } catch {
                toast.error('Failed to load orders.');
            } finally {
                setLoading(false);
            }
        };
        loadOrders();
    }, []);

    const toggleOrder = async (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
        if (!details[id]) {
            try {
                const res = await getOrderDetails(id);
                setDetails(prev => ({ ...prev, [id]: res.data }));
            } catch { toast.error('Could not fetch order details.'); }
        }
    };

    const openReview = (orderId) => {
        const d = details[orderId];
        if (!d?.items?.length) { toast.error('No items found.'); return; }
        setReviewModal({ orderId, items: d.items });
    };

    if (loading) return <Loader />;

    return (
        <div className="animate-fade-up">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2.5">
                <Package className="w-5 h-5 text-cyan-400" />
                Order History
                {orders.length > 0 && (
                    <span className="text-xs font-mono text-white/25 bg-white/5 border border-white/8 px-2.5 py-1 rounded-full">
                        {orders.length}
                    </span>
                )}
            </h2>

            {orders.length === 0 ? (
                <div className="text-center py-24 bg-white/[0.02] rounded-2xl border border-white/5">
                    <Clock className="w-14 h-14 mx-auto mb-4 text-white/8" />
                    <p className="text-white/30 font-medium">No orders yet</p>
                    <p className="text-white/15 text-sm mt-1">Place your first order from the cart.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {orders.map(order => {
                        const s = STATUS[order.status] || STATUS.pending;
                        const isDelivered = order.status === 'delivered';
                        const alreadyReviewed = reviewed[order.id];
                        const canChat = ['processing', 'shipping'].includes(order.status);
                        return (
                            <div key={order.id} className="bg-[#0e1117] border border-white/8 rounded-2xl overflow-hidden hover:border-white/12 transition-colors">
                                <button className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors text-left"
                                    onClick={() => toggleOrder(order.id)}>
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <div className={`w-2 h-2 rounded-full ${s.dot} shrink-0`} />
                                        <div>
                                            <p className="font-bold text-white/85 text-sm">{order.order_number}</p>
                                            <p className="text-xs text-white/25 font-mono mt-0.5">
                                                {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${s.badge}`}>
                                            {order.status}
                                        </span>
                                        <span className="text-xs text-white/20 font-mono capitalize">{order.payment_type}</span>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0">
                                        <span className="text-base font-black text-white">${parseFloat(order.net_amount).toFixed(2)}</span>
                                        {expanded[order.id] ? <ChevronUp className="w-4 h-4 text-white/25" /> : <ChevronDown className="w-4 h-4 text-white/25" />}
                                    </div>
                                </button>

                                {expanded[order.id] && (
                                    <div className="border-t border-white/5 px-5 py-4 bg-white/[0.015]">
                                        {!details[order.id] ? <Loader /> : (
                                            <>
                                                <p className="text-[10px] font-mono font-bold text-white/25 uppercase tracking-[0.15em] mb-3">Items</p>
                                                <div className="space-y-1.5">
                                                    {(details[order.id].items || []).map((item, i) => (
                                                        <div key={i} className="flex justify-between text-sm py-2 border-b border-white/[0.04] last:border-0">
                                                            <span className="text-white/60">
                                                                {item.variant_name}
                                                                <span className="text-white/25 ml-2 font-mono">×{item.quantity}</span>
                                                            </span>
                                                            <span className="font-semibold text-white/80">${parseFloat(item.total_amount).toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex justify-between pt-3 text-sm font-bold text-white/85 border-t border-white/8 mt-2">
                                                    <span>Total Paid</span>
                                                    <span className="text-cyan-400">${parseFloat(order.net_amount).toFixed(2)}</span>
                                                </div>

                                                <div className="flex gap-2 mt-4 flex-wrap">


                                                    {/* Review */}
                                                    {isDelivered && (
                                                        alreadyReviewed ? (
                                                            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                                                                <Star className="w-3.5 h-3.5 fill-current" /> Review submitted — thank you!
                                                            </div>
                                                        ) : (
                                                            <button onClick={() => openReview(order.id)}
                                                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                                                                style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}>
                                                                <Star className="w-3.5 h-3.5" /> Leave a Review
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {reviewModal && (
                <ReviewModal
                    orderId={reviewModal.orderId}
                    items={reviewModal.items}
                    onClose={() => setReviewModal(null)}
                    onSubmit={() => setReviewed(prev => ({ ...prev, [reviewModal.orderId]: true }))}
                />
            )}
        </div>
    );
};

export default Orders;