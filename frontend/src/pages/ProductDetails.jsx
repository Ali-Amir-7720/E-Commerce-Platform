import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductDetails, addToCart, addToWishlist } from '../api/api';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import Loader from '../components/Loader';
import { ShoppingCart, Heart, Package, ChevronLeft, CheckCircle2, Star, MessageCircle } from 'lucide-react';
import ChatWindow from '../components/chatWindow';

const StarDisplay = ({ rating }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(n => (
            <Star key={n} className="w-4 h-4"
                style={{ fill: n <= rating ? '#f59e0b' : 'transparent', color: n <= rating ? '#f59e0b' : 'rgba(255,255,255,0.15)' }} />
        ))}
    </div>
);

const ReviewsSection = ({ productId }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lightbox, setLightbox] = useState(null);

    useEffect(() => {
        api.get(`/reviews/product/${productId}`)
            .then(res => setReviews(Array.isArray(res.data) ? res.data : []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [productId]);

    const avg = reviews.length
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    return (
        <div className="mt-10">
            <div className="flex items-center gap-3 mb-5">
                <h2 className="text-lg font-black text-white">Customer Reviews</h2>
                {avg && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-sm font-bold"
                        style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <Star className="w-3.5 h-3.5 fill-current" /> {avg} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>

            {loading ? <Loader /> : reviews.length === 0 ? (
                <div className="py-12 text-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Star className="w-10 h-10 mx-auto mb-3 text-white/10" />
                    <p className="text-white/30 text-sm">No reviews yet. Be the first!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map(r => (
                        <div key={r.id} className="p-5 rounded-2xl" style={{ background: '#0e1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div>
                                    <p className="font-bold text-white/80 text-sm">{r.reviewer_name}</p>
                                    <p className="text-xs text-white/25 mt-0.5">
                                        {new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                                <StarDisplay rating={r.rating} />
                            </div>
                            {r.comment && <p className="text-white/55 text-sm leading-relaxed mt-2">{r.comment}</p>}
                            {r.image_url && (
                                <div className="mt-3">
                                    <img
                                        src={r.image_url}
                                        alt="Review"
                                        className="h-28 w-28 object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                                        onClick={() => setLightbox(r.image_url)}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {lightbox && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setLightbox(null)}>
                    <img src={lightbox} alt="Review" className="max-w-full max-h-[85vh] rounded-2xl object-contain" />
                </div>
            )}
        </div>
    );
};

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { refreshCart } = useCart();
    const toast = useToast();

    const [product, setProduct] = useState(null);
    const [variants, setVariants] = useState([]);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [chatOpen, setChatOpen] = useState(false);

    useEffect(() => {
        if (!id || id === 'undefined') { navigate('/'); return; }
        getProductDetails(id)
            .then(res => {
                const raw = res.data;
                if (raw && raw.product) {
                    setProduct(raw.product);
                    const v = raw.variants || [];
                    setVariants(v);
                    if (v.length > 0) setSelectedVariant(v[0]);
                } else if (raw && raw.product_name) {
                    setProduct(raw);
                    const v = raw.variants || [];
                    setVariants(v);
                    if (v.length > 0) setSelectedVariant(v[0]);
                } else {
                    setProduct(null);
                }
            })
            .catch(() => toast.error('Failed to load product.'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleAddToCart = async () => {
        if (!user || user.role_name !== 'Customer') { toast.error('Please login as a Customer.'); return; }
        if (!selectedVariant) { toast.error('Please select a variant.'); return; }
        try {
            await addToCart(selectedVariant.id, quantity);
            refreshCart();
            toast.success('Added to cart!');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Could not add to cart.');
        }
    };

    const handleWishlist = async () => {
        if (!user || user.role_name !== 'Customer') { toast.error('Please login as a Customer.'); return; }
        if (!selectedVariant) return;
        try {
            await addToWishlist(selectedVariant.id);
            toast.success('Saved to wishlist!');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Already in wishlist.');
        }
    };

    if (loading) return <Loader />;
    if (!product) return <p className="text-center text-white/30 py-20">Product not found.</p>;

    return (
        <div className="animate-fade-up">
            <button onClick={() => navigate(-1)}
                className="flex items-center gap-1 text-sm text-white/30 hover:text-white mb-6 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <div className="rounded-2xl p-8" style={{ background: '#0e1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Image */}
                    <div className="rounded-2xl flex items-center justify-center aspect-square overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {product.image_url
                            ? <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover" />
                            : <Package className="w-32 h-32 text-white/10" />
                        }
                    </div>

                    {/* Info */}
                    <div className="flex flex-col">
                        {product.category_name && (
                            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">{product.category_name}</span>
                        )}
                        <h1 className="text-3xl font-black text-white mb-3 leading-tight">{product.product_name}</h1>
                        {product.description && (
                            <p className="text-white/45 leading-relaxed mb-6">{product.description}</p>
                        )}

                        {variants.length > 0 && (
                            <div className="mb-6">
                                <p className="text-sm font-semibold text-white/50 mb-2">Select Variant</p>
                                <div className="flex flex-wrap gap-2">
                                    {variants.map(v => (
                                        <button key={v.id} onClick={() => setSelectedVariant(v)}
                                            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                                            style={selectedVariant?.id === v.id
                                                ? { background: '#22d3ee20', color: '#22d3ee', border: '2px solid #22d3ee60' }
                                                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '2px solid rgba(255,255,255,0.1)' }}>
                                            {v.variant_name || `Variant #${v.id}`}
                                        </button>
                                    ))}
                                </div>
                                {selectedVariant && (
                                    <div className="mt-4 p-4 rounded-xl flex items-center gap-4"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <span className="text-2xl font-extrabold text-white">PKR {parseFloat(selectedVariant.price).toFixed(2)}</span>
                                        <span className={`flex items-center gap-1.5 text-sm px-3 py-1 rounded-full font-semibold ${selectedVariant.stock_quantity > 0
                                            ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {selectedVariant.stock_quantity > 0
                                                ? <><CheckCircle2 className="w-3.5 h-3.5" /> {selectedVariant.stock_quantity} in stock</>
                                                : 'Out of stock'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-sm font-semibold text-white/50">Quantity</span>
                            <div className="flex items-center rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    className="px-4 py-2 text-white/40 hover:bg-white/5 font-bold transition-colors">−</button>
                                <span className="w-10 text-center font-bold text-white">{quantity}</span>
                                <button onClick={() => setQuantity(q => q + 1)}
                                    className="px-4 py-2 text-white/40 hover:bg-white/5 font-bold transition-colors">+</button>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-auto flex-wrap">
                            <button onClick={handleAddToCart}
                                className="flex-grow flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl active:scale-95 transition-all text-black"
                                style={{ background: '#22d3ee', boxShadow: '0 4px 20px rgba(34,211,238,0.25)' }}>
                                <ShoppingCart className="w-5 h-5" /> Add to Cart
                            </button>
                            <button onClick={handleWishlist}
                                className="p-3.5 rounded-xl transition-all active:scale-95"
                                style={{ border: '2px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}
                                title="Save to Wishlist">
                                <Heart className="w-5 h-5" />
                            </button>
                            {user?.role_name === 'Customer' && (
                                <button onClick={() => setChatOpen(true)}
                                    className="flex items-center gap-2 px-4 py-3.5 rounded-xl transition-all active:scale-95 font-bold text-sm"
                                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '2px solid rgba(255,255,255,0.1)' }}
                                    title="Ask Vendor">
                                    <MessageCircle className="w-5 h-5" /> Ask Vendor
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <ReviewsSection productId={id} />

            {/* Chat Window */}
            {chatOpen && product && (
                <div className="fixed bottom-6 right-6 z-50">
                    <ChatWindow
                        roomType="product"
                        roomId={parseInt(id)}
                        title={product.product_name}
                        onClose={() => setChatOpen(false)}
                    />
                </div>
            )}
        </div>
    );
};

export default ProductDetails;