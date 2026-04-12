import React, { useEffect, useState, useCallback } from 'react';
import { getAssignedOrders, markOrderPicked, markOrderDelivered } from '../api/api';
import api from '../api/api';
import { useToast } from '../context/ToastContext';
import Loader from '../components/Loader';
import { Truck, PackageCheck, CheckCircle2, MapPin, XCircle, AlertTriangle, Package } from 'lucide-react';

const STATUS_CONFIG = {
    assigned: { color: '#f59e0b', label: 'Assigned', icon: Truck },
    picked: { color: '#22d3ee', label: 'In Transit', icon: PackageCheck },
    delivered: { color: '#34d399', label: 'Delivered', icon: CheckCircle2 },
    failed: { color: '#f87171', label: 'Failed', icon: XCircle },
};

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.assigned;
    return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold capitalize"
            style={{ background: cfg.color + '18', color: cfg.color, border: `1px solid ${cfg.color}30` }}>
            {cfg.label}
        </span>
    );
};

// Card for AVAILABLE orders (not yet accepted)
const AvailableCard = ({ order, onAccept }) => {
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const handleAccept = async () => {
        setLoading(true);
        try {
            await api.post(`/courier/orders/${order.order_id}/accept`);
            toast.success('Order accepted!');
            onAccept();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to accept order.');
        } finally { setLoading(false); }
    };

    return (
        <div className="bg-[#0e1117] border border-white/8 rounded-2xl overflow-hidden hover:border-white/15 transition-all">
            <div className="h-1 rounded-t-2xl" style={{ background: '#a78bfa' }} />
            <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                        <p className="font-bold text-white text-sm mb-1">{order.order_number || `Order #${order.order_id}`}</p>
                        <p className="text-xs text-white/40 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {order.full_address ? `${order.full_address}, ${order.city} ${order.zip_code}` : 'No address'}
                        </p>
                        <p className="text-xs text-white/30 mt-1">Customer: {order.customer_name}</p>
                    </div>
                    <p className="font-black text-cyan-400 text-sm shrink-0">PKR {parseFloat(order.net_amount || 0).toFixed(2)}</p>
                </div>
                <button onClick={handleAccept} disabled={loading}
                    className="w-full py-2 text-xs font-bold rounded-xl transition-all disabled:opacity-60 active:scale-95"
                    style={{ background: '#a78bfa20', color: '#a78bfa', border: '1px solid #a78bfa30' }}>
                    {loading ? 'Accepting...' : 'Accept Order'}
                </button>
            </div>
        </div>
    );
};

// Card for MY assigned orders
const OrderCard = ({ order, onStatusChange }) => {
    const id = order.order_id || order.id;
    const status = order.delivery_status || 'assigned';
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.assigned;
    const [loading, setLoading] = useState(false);
    const [showFailReason, setShowFailReason] = useState(false);
    const [failReason, setFailReason] = useState('');
    const toast = useToast();

    const act = async (fn, successMsg) => {
        setLoading(true);
        try { await fn(); toast.success(successMsg); onStatusChange(); }
        catch (err) { toast.error(err.response?.data?.error || 'Failed.'); }
        finally { setLoading(false); }
    };

    const handleFail = async () => {
        if (!failReason.trim()) { toast.error('Please enter a reason.'); return; }
        setLoading(true);
        try {
            await api.patch(`/courier/orders/${id}/fail`, { reason: failReason });
            toast.success('Order marked as failed.');
            setShowFailReason(false);
            onStatusChange();
        } catch (err) { toast.error(err.response?.data?.error || 'Failed.'); }
        finally { setLoading(false); }
    };

    return (
        <div className="bg-[#0e1117] border border-white/8 rounded-2xl overflow-hidden hover:border-white/15 transition-all">
            <div className="h-1 rounded-t-2xl" style={{ background: cfg.color }} />
            <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-white text-sm">{order.order_number || `Order #${id}`}</p>
                            <StatusBadge status={status} />
                        </div>
                        <p className="text-xs text-white/40 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {order.full_address ? `${order.full_address}, ${order.city} ${order.zip_code}` : order.customer_name || 'No address'}
                        </p>
                    </div>
                    <p className="font-black text-cyan-400 text-sm shrink-0">PKR {parseFloat(order.net_amount || 0).toFixed(2)}</p>
                </div>

                {showFailReason && (
                    <div className="mb-3 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                        <p className="text-xs text-red-400 font-bold mb-2">Reason for failure</p>
                        <input
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder:text-white/20 mb-2"
                            placeholder="e.g. Customer not available..."
                            value={failReason}
                            onChange={e => setFailReason(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <button onClick={handleFail} disabled={loading}
                                className="flex-1 py-2 bg-red-500 hover:bg-red-400 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60">
                                Confirm Failed
                            </button>
                            <button onClick={() => { setShowFailReason(false); setFailReason(''); }}
                                className="px-3 py-2 bg-white/5 text-white/50 text-xs rounded-lg hover:bg-white/10 transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex gap-2 flex-wrap">
                    {status === 'assigned' && (<>
                        <button onClick={() => act(() => markOrderPicked(id), 'Picked up!')} disabled={loading}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all disabled:opacity-60 active:scale-95"
                            style={{ background: '#22d3ee20', color: '#22d3ee', border: '1px solid #22d3ee30' }}>
                            <PackageCheck className="w-3.5 h-3.5" /> Pick Up
                        </button>
                        {!showFailReason && (
                            <button onClick={() => setShowFailReason(true)}
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all active:scale-95"
                                style={{ background: '#f8717120', color: '#f87171', border: '1px solid #f8717130' }}>
                                <AlertTriangle className="w-3.5 h-3.5" /> Mark Failed
                            </button>
                        )}
                    </>)}
                    {status === 'picked' && (<>
                        <button onClick={() => act(() => markOrderDelivered(id), 'Delivered!')} disabled={loading}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all disabled:opacity-60 active:scale-95"
                            style={{ background: '#34d39920', color: '#34d399', border: '1px solid #34d39930' }}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Delivered
                        </button>
                        {!showFailReason && (
                            <button onClick={() => setShowFailReason(true)}
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all active:scale-95"
                                style={{ background: '#f8717120', color: '#f87171', border: '1px solid #f8717130' }}>
                                <AlertTriangle className="w-3.5 h-3.5" /> Mark Failed
                            </button>
                        )}
                    </>)}
                    {status === 'delivered' && (
                        <span className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl"
                            style={{ background: '#34d39910', color: '#34d399', border: '1px solid #34d39920' }}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                    )}
                    {status === 'failed' && (
                        <span className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl"
                            style={{ background: '#f8717110', color: '#f87171', border: '1px solid #f8717120' }}>
                            <XCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const CourierDashboard = () => {
    const [available, setAvailable] = useState([]);
    const [mine, setMine] = useState([]);
    const [courierZip, setCourierZip] = useState('');
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('available');
    const [message, setMessage] = useState('');
    const toast = useToast();

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAssignedOrders();
            const d = res.data;
            setAvailable(Array.isArray(d?.available) ? d.available : []);
            setMine(Array.isArray(d?.mine) ? d.mine : []);
            setCourierZip(d?.courier_zip || '');
            if (d?.message) setMessage(d.message);
        } catch { toast.error('Failed to load deliveries.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchOrders(); }, []);

    const active = mine.filter(o => ['assigned', 'picked'].includes(o.delivery_status));
    const completed = mine.filter(o => o.delivery_status === 'delivered');
    const failed = mine.filter(o => o.delivery_status === 'failed');

    const tabs = [
        { key: 'available', label: 'Available', count: available.length, color: '#a78bfa' },
        { key: 'active', label: 'Active', count: active.length, color: '#22d3ee' },
        { key: 'completed', label: 'Delivered', count: completed.length, color: '#34d399' },
        { key: 'failed', label: 'Failed', count: failed.length, color: '#f87171' },
    ];

    const stats = [
        { label: 'Available', value: available.length, color: '#a78bfa' },
        { label: 'Active', value: active.length, color: '#22d3ee' },
        { label: 'Delivered', value: completed.length, color: '#34d399' },
        { label: 'Failed', value: failed.length, color: '#f87171' },
    ];

    const shown = tab === 'available' ? null
        : tab === 'active' ? active
            : tab === 'completed' ? completed
                : failed;

    return (
        <div className="animate-fade-up">
            <div className="flex items-center justify-between gap-3 mb-7">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white">Courier Dashboard</h2>
                        <p className="text-xs text-white/30 mt-0.5">Manage your deliveries</p>
                    </div>
                </div>
                {courierZip && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                        <MapPin className="w-3 h-3" /> ZIP: {courierZip}
                    </div>
                )}
            </div>

            {message && (
                <div className="mb-5 p-4 rounded-2xl text-sm text-yellow-400 font-semibold"
                    style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                    ⚠ {message}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                {stats.map(s => (
                    <div key={s.label} className="bg-[#0e1117] border border-white/8 rounded-2xl p-4 text-center">
                        <p className="text-2xl font-black text-white leading-none">{s.value}</p>
                        <p className="text-xs mt-1 font-semibold" style={{ color: s.color }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-5 flex-wrap">
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                        style={tab === t.key
                            ? { background: t.color + '20', color: t.color, border: `1px solid ${t.color}40` }
                            : { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {t.label}
                        <span className="px-1.5 py-0.5 rounded-md text-xs font-black"
                            style={{ background: tab === t.key ? t.color + '30' : 'rgba(255,255,255,0.06)' }}>
                            {t.count}
                        </span>
                    </button>
                ))}
            </div>

            {loading ? <Loader /> : (
                <>
                    {tab === 'available' && (
                        available.length === 0 ? (
                            <div className="text-center py-20 bg-white/[0.02] rounded-2xl border border-white/5">
                                <Package className="w-12 h-12 mx-auto mb-3 text-white/10" />
                                <p className="text-white/30 font-semibold">No available orders in your area</p>
                                <p className="text-white/15 text-sm mt-1">Orders matching ZIP {courierZip} will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {available.map(o => (
                                    <AvailableCard key={o.order_id} order={o} onAccept={fetchOrders} />
                                ))}
                            </div>
                        )
                    )}
                    {tab !== 'available' && (
                        shown.length === 0 ? (
                            <div className="text-center py-20 bg-white/[0.02] rounded-2xl border border-white/5">
                                <Truck className="w-12 h-12 mx-auto mb-3 text-white/10" />
                                <p className="text-white/30 font-semibold">No {tab} orders</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {shown.map(o => (
                                    <OrderCard key={o.delivery_id || o.order_id} order={o} onStatusChange={fetchOrders} />
                                ))}
                            </div>
                        )
                    )}
                </>
            )}
        </div>
    );
};

export default CourierDashboard;