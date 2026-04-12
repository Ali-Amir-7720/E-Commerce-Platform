import React, { useEffect, useState } from 'react';
import { getCart, removeFromCart, placeOrder, validateCoupon, getAddresses, createAddress } from '../api/api';
import api from '../api/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import Loader from '../components/Loader';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package, MapPin } from 'lucide-react';

const Cart = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentType, setPaymentType] = useState('cod');
    const [placing, setPlacing] = useState(false);
    const [coupon, setCoupon] = useState('');
    const [discount, setDiscount] = useState(0);
    const [couponMsg, setCouponMsg] = useState('');
    const [couponApplied, setCouponApplied] = useState(false);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [addrForm, setAddrForm] = useState({ full_address: '', city: '', state: '', zip_code: '' });
    const { refreshCart } = useCart();
    const toast = useToast();

    const fetchCart = async () => {
        try {
            const res = await getCart();
            setItems(res.data?.items || []);
        } catch {
            toast.error('Failed to load cart.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCart(); loadAddresses(); }, []);

    const loadAddresses = async () => {
        try {
            const res = await getAddresses();
            const addrs = Array.isArray(res.data) ? res.data : [];
            setAddresses(addrs);
            if (addrs.length > 0) setSelectedAddress(addrs[0].id);
        } catch { }
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        try {
            await createAddress(addrForm);
            setShowAddressForm(false);
            setAddrForm({ full_address: '', city: '', state: '', zip_code: '' });
            await loadAddresses();
            toast.success('Address added!');
        } catch {
            toast.error('Failed to add address.');
        }
    };

    const handleRemove = async (itemId) => {
        try {
            await removeFromCart(itemId);
            setItems(prev => prev.filter(i => (i.cart_item_id || i.id) !== itemId));
            refreshCart();
            toast.success('Item removed.');
        } catch {
            toast.error('Failed to remove item.');
        }
    };

    const handleQtyChange = async (item, delta) => {
        const newQty = item.quantity + delta;
        const itemId = item.cart_item_id || item.id;
        if (newQty < 1) { handleRemove(itemId); return; }
        try {
            await api.patch(`/cart/items/${itemId}`, { quantity: newQty });
            setItems(prev => prev.map(i =>
                (i.cart_item_id || i.id) === itemId ? { ...i, quantity: newQty } : i
            ));
            refreshCart();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Could not update quantity.');
        }
    };

    const handleApplyCoupon = async () => {
        if (!coupon.trim()) return;
        try {
            const res = await validateCoupon(coupon.trim());
            const d = res.data?.offer || res.data?.data || res.data;
            const discountType = d?.discount_type;
            const discountValue = parseFloat(d?.discount_value);
            if (!discountType || isNaN(discountValue)) throw new Error('Invalid response');
            const sub = items.reduce((s, i) => s + parseFloat(i.price || 0) * i.quantity, 0);
            const amt = discountType === 'rate' ? (sub * discountValue / 100) : discountValue;
            setDiscount(Math.min(amt, sub));
            setCouponMsg(`✓ "${coupon}" applied — ${discountType === 'rate' ? discountValue + '%' : '$' + discountValue} off`);
            setCouponApplied(true);
        } catch {
            setDiscount(0);
            setCouponMsg('Invalid or expired coupon.');
            setCouponApplied(false);
        }
    };

    const handlePlaceOrder = async () => {
        setPlacing(true);
        try {
            const orderRes = await placeOrder({ payment_type: paymentType, coupon_code: couponApplied ? coupon : null, shipping_amount: 0, address_id: selectedAddress });
            const flagged = orderRes?.data?.flagged;
            toast.success(flagged
                ? '⚠️ Order placed but flagged for review. Our team will verify it shortly.'
                : '🎉 Order placed successfully!');
            setItems([]);
            refreshCart();
        } catch (err) {
            const d = err.response?.data;
            const msg = d?.message || d?.error || 'Failed to place order.';
            toast.error(typeof msg === 'string' ? msg : 'Failed to place order.');
        } finally {
            setPlacing(false);
        }
    };

    const subtotal = items.reduce((sum, i) => sum + parseFloat(i.price || 0) * i.quantity, 0);
    const total = Math.max(0, subtotal - discount);

    if (loading) return <Loader />;

    return (
        <div className="animate-fade-up">
            <div className="flex items-center gap-3 mb-7">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-white">Shopping Cart</h2>
                    <p className="text-xs text-white/30 mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-24 bg-white/[0.02] rounded-2xl border border-white/5">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-white/10" />
                    <p className="text-white/30 text-lg font-semibold">Your cart is empty</p>
                    <p className="text-white/15 text-sm mt-1">Start shopping to add items here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Items */}
                    <div className="lg:col-span-2 space-y-3">
                        {items.map(item => {
                            const itemId = item.cart_item_id || item.id;
                            return (
                                <div key={itemId} className="bg-[#0e1117] border border-white/8 rounded-2xl p-4 flex items-center gap-4 hover:border-white/15 transition-colors">
                                    <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/8 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                        {item.image_url
                                            ? <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                                            : <Package className="w-6 h-6 text-white/15" />
                                        }
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-semibold text-white/85 truncate text-sm">{item.product_name}</p>
                                        <p className="text-xs text-white/35 mt-0.5">{item.variant_name}</p>
                                        <p className="text-cyan-400 font-black mt-0.5">${parseFloat(item.price || 0).toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <button onClick={() => handleQtyChange(item, -1)}
                                            className="px-3 py-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="w-8 text-center text-sm font-black text-white">{item.quantity}</span>
                                        <button onClick={() => handleQtyChange(item, 1)}
                                            className="px-3 py-2 text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <p className="font-black text-white w-20 text-right text-sm">
                                        ${(parseFloat(item.price || 0) * item.quantity).toFixed(2)}
                                    </p>
                                    <button onClick={() => handleRemove(itemId)}
                                        className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors ml-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#0e1117] border border-white/8 rounded-2xl p-6 sticky top-24">
                            <h3 className="text-sm font-black text-white/50 uppercase tracking-widest mb-5">Order Summary</h3>
                            <div className="space-y-3 mb-5">
                                <div className="flex justify-between text-sm text-white/40">
                                    <span>Subtotal</span><span className="text-white/70">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-white/40">
                                    <span>Shipping</span><span className="text-emerald-400 font-semibold">Free</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-sm text-white/40">
                                        <span>Discount</span><span className="text-emerald-400 font-semibold">-${discount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="border-t border-white/8 pt-3 flex justify-between font-black text-white text-lg">
                                    <span>Total</span><span>${total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="mb-5">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Shipping Address</p>
                                    <button onClick={() => setShowAddressForm(v => !v)}
                                        className="text-xs text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
                                        + Add New
                                    </button>
                                </div>
                                {showAddressForm && (
                                    <form onSubmit={handleAddAddress} className="space-y-2 mb-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        {[['full_address', 'Full Address'], ['city', 'City'], ['state', 'State'], ['zip_code', 'ZIP Code']].map(([k, p]) => (
                                            <input key={k} placeholder={p} value={addrForm[k]}
                                                onChange={e => setAddrForm(f => ({ ...f, [k]: e.target.value }))}
                                                className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none placeholder:text-white/20"
                                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                                                required />
                                        ))}
                                        <button type="submit" className="w-full py-2 rounded-lg text-xs font-bold text-black" style={{ background: '#22d3ee' }}>Save Address</button>
                                    </form>
                                )}
                                {addresses.length === 0 ? (
                                    <p className="text-xs text-white/25 italic">No addresses saved. Add one above.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {addresses.map(a => (
                                            <div key={a.id} onClick={() => setSelectedAddress(a.id)}
                                                className="flex items-start gap-2 p-3 rounded-xl cursor-pointer transition-all"
                                                style={selectedAddress === a.id
                                                    ? { background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)' }
                                                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                <MapPin className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${selectedAddress === a.id ? 'text-cyan-400' : 'text-white/25'}`} />
                                                <div>
                                                    <p className="text-xs text-white/70 font-semibold">{a.full_address}</p>
                                                    <p className="text-xs text-white/35">{a.city}, {a.state} {a.zip_code}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Coupon */}
                            <div className="mb-5">
                                <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-2">Coupon Code</p>
                                <div className="flex gap-2">
                                    <input
                                        value={coupon}
                                        onChange={e => { setCoupon(e.target.value); setCouponMsg(''); setCouponApplied(false); setDiscount(0); }}
                                        placeholder="Enter coupon..."
                                        className="flex-grow px-3 py-2 rounded-xl text-sm text-white outline-none placeholder:text-white/20"
                                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                    <button onClick={handleApplyCoupon}
                                        className="px-4 py-2 rounded-xl text-xs font-bold text-black"
                                        style={{ background: '#22d3ee' }}>
                                        Apply
                                    </button>
                                </div>
                                {couponMsg && (
                                    <p className={`text-xs mt-2 font-semibold ${couponApplied ? 'text-emerald-400' : 'text-red-400'}`}>{couponMsg}</p>
                                )}
                            </div>

                            {/* Payment Method */}
                            <div className="mb-5">
                                <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Payment Method</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {['cod', 'upi', 'netbanking'].map(m => (
                                        <button key={m} onClick={() => setPaymentType(m)}
                                            className="py-2 rounded-xl text-xs font-bold transition-all"
                                            style={paymentType === m
                                                ? { background: '#22d3ee', color: '#000' }
                                                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            {m.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button onClick={handlePlaceOrder} disabled={placing || !selectedAddress}
                                className="w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                style={selectedAddress ? { background: '#22d3ee', color: '#000', boxShadow: '0 4px 20px rgba(34,211,238,0.25)' } : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.25)' }}>
                                {placing ? 'Placing Order...' : <><span>Place Order</span><ArrowRight className="w-4 h-4" /></>}
                            </button>
                            {!selectedAddress && (
                                <p className="text-xs text-center text-white/25 mt-2">Select a shipping address to continue</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;