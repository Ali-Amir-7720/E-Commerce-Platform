import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import {
    TrendingUp, ShoppingBag, Users, Package, DollarSign,
    CheckCircle2, XCircle, Clock, Truck, Star, BarChart2
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n) => parseFloat(n || 0).toFixed(2);
const fmtInt = (n) => parseInt(n || 0).toLocaleString();

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
    <div className="p-5 rounded-2xl flex items-center gap-4"
        style={{ background: '#0e1117', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: color + '18' }}>
            <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <div>
            <p className="text-2xl font-black text-white leading-none">{value}</p>
            <p className="text-xs text-white/40 mt-1">{label}</p>
            {sub && <p className="text-xs mt-0.5" style={{ color }}>{sub}</p>}
        </div>
    </div>
);

const SectionTitle = ({ title }) => (
    <h3 className="text-xs font-black text-white/30 uppercase tracking-widest mb-4 mt-8">{title}</h3>
);

const StatusBadge = ({ status }) => {
    const colors = {
        delivered: '#34d399', placed: '#60a5fa', processing: '#818cf8',
        shipping: '#a78bfa', failed: '#f87171', cancelled: '#f87171',
        flagged: '#fbbf24', assigned: '#f59e0b', picked: '#22d3ee',
    };
    return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold capitalize"
            style={{ background: (colors[status] || '#888') + '18', color: colors[status] || '#888' }}>
            {status}
        </span>
    );
};

// ── Simple Bar Chart ───────────────────────────────────────────────────────────
const BarChart = ({ data, valueKey, labelKey, color = '#22d3ee', prefix = 'PKR' }) => {
    if (!data?.length) return <p className="text-white/20 text-sm py-4 text-center">No data yet</p>;
    const max = Math.max(...data.map(d => parseFloat(d[valueKey] || 0)));
    return (
        <div className="space-y-2">
            {data.map((d, i) => {
                const val = parseFloat(d[valueKey] || 0);
                const pct = max > 0 ? (val / max) * 100 : 0;
                return (
                    <div key={i} className="flex items-center gap-3">
                        <p className="text-xs text-white/40 w-24 shrink-0 truncate">{d[labelKey]}</p>
                        <div className="flex-1 h-6 rounded-lg overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <div className="h-full rounded-lg transition-all duration-500 flex items-center px-2"
                                style={{ width: `${pct}%`, background: color, minWidth: pct > 0 ? '2px' : 0 }}>
                            </div>
                        </div>
                        <p className="text-xs font-bold text-white/70 w-20 text-right shrink-0">
                            {prefix}{parseFloat(val).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </p>
                    </div>
                );
            })}
        </div>
    );
};

// ── Donut Chart ────────────────────────────────────────────────────────────────
const DonutChart = ({ data, labelKey, valueKey }) => {
    if (!data?.length) return <p className="text-white/20 text-sm py-4 text-center">No data yet</p>;
    const colors = ['#22d3ee', '#34d399', '#f59e0b', '#f87171', '#a78bfa', '#60a5fa'];
    const total = data.reduce((s, d) => s + parseInt(d[valueKey] || 0), 0);
    return (
        <div className="flex items-center gap-6 flex-wrap">
            <svg width="120" height="120" viewBox="0 0 42 42">
                {(() => {
                    let offset = 25;
                    return data.map((d, i) => {
                        const val = parseInt(d[valueKey] || 0);
                        const pct = total > 0 ? (val / total) * 100 : 0;
                        const dash = `${pct} ${100 - pct}`;
                        const el = (
                            <circle key={i} cx="21" cy="21" r="15.9"
                                fill="transparent"
                                stroke={colors[i % colors.length]}
                                strokeWidth="4"
                                strokeDasharray={dash}
                                strokeDashoffset={offset}
                            />
                        );
                        offset -= pct;
                        return el;
                    });
                })()}
                <text x="21" y="21" textAnchor="middle" dy="0.3em"
                    fill="white" fontSize="6" fontWeight="bold">{total}</text>
            </svg>
            <div className="space-y-2">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0"
                            style={{ background: colors[i % colors.length] }} />
                        <span className="text-xs text-white/60 capitalize">{d[labelKey]}</span>
                        <span className="text-xs font-bold text-white/80 ml-1">{d[valueKey]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Role Views ─────────────────────────────────────────────────────────────────
const AdminAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/analytics/admin')
            .then(r => setData(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loader />;
    if (!data) return <p className="text-white/30 text-center py-20">Failed to load analytics.</p>;

    const o = data.overview;

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard icon={DollarSign} label="Total Revenue" value={`PKR ${parseFloat(o.total_revenue || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`} color="#22d3ee" />
                <StatCard icon={ShoppingBag} label="Total Orders" value={fmtInt(o.total_orders)} color="#a78bfa" />
                <StatCard icon={Users} label="Total Users" value={fmtInt(o.total_users)} color="#34d399" sub={`+${data.new_users_today} today`} />
                <StatCard icon={Package} label="Active Products" value={fmtInt(o.total_products)} color="#f59e0b" />
                <StatCard icon={Clock} label="Pending Orders" value={fmtInt(o.pending_orders)} color="#60a5fa" />
                <StatCard icon={XCircle} label="Fraud Flags" value={fmtInt(o.pending_fraud_flags)} color="#f87171" />
            </div>

            <SectionTitle title="Orders by Status" />
            <div className="p-5 rounded-2xl" style={{ background: '#0e1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                <DonutChart data={data.orders_by_status} labelKey="status" valueKey="count" />
            </div>

            <SectionTitle title="Revenue — Last 7 Days" />
            <div className="p-5 rounded-2xl" style={{ background: '#0e1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                <BarChart data={data.revenue_by_day} valueKey="revenue" labelKey="day" color="#22d3ee" />
            </div>

            <SectionTitle title="Top Selling Products" />
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0e1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                <table className="w-full text-sm">
                    <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <tr>{['Product', 'Units Sold', 'Revenue'].map(h => (
                            <th key={h} className="px-5 py-3 text-left text-xs font-black text-white/30 uppercase tracking-wider">{h}</th>
                        ))}</tr>
                    </thead>
                    <tbody>
                        {data.top_products.map((p, i) => (
                            <tr key={i} className="hover:bg-white/[0.02]" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td className="px-5 py-3 font-semibold text-white/80 text-sm">{p.product_name}</td>
                                <td className="px-5 py-3 text-cyan-400 font-bold">{p.total_sold}</td>
                                <td className="px-5 py-3 text-emerald-400 font-bold">PKR {parseFloat(p.total_revenue).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <SectionTitle title="Top Customers" />
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0e1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                <table className="w-full text-sm">
                    <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <tr>{['Customer', 'Orders', 'Total Spent'].map(h => (
                            <th key={h} className="px-5 py-3 text-left text-xs font-black text-white/30 uppercase tracking-wider">{h}</th>
                        ))}</tr>
                    </thead>
                    <tbody>
                        {data.top_customers.map((c, i) => (
                            <tr key={i} className="hover:bg-white/[0.02]" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td className="px-5 py-3">
                                    <p className="font-semibold text-white/80 text-sm">{c.full_name}</p>
                                    <p className="text-xs text-white/30">{c.email}</p>
                                </td>
                                <td className="px-5 py-3 text-white/60">{c.total_orders}</td>
                                <td className="px-5 py-3 text-emerald-400 font-bold">PKR {parseFloat(c.total_spent).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

const VendorAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/analytics/vendor')
            .then(r => setData(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loader />;
    if (!data) return <p className="text-white/30 text-center py-20">Failed to load analytics.</p>;

    const o = data.overview;

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={DollarSign} label="Total Revenue" value={`PKR ${parseFloat(o.total_revenue || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`} color="#22d3ee" />
                <StatCard icon={ShoppingBag} label="Orders" value={fmtInt(o.total_orders)} color="#a78bfa" />
                <StatCard icon={Package} label="Units Sold" value={fmtInt(o.total_units_sold)} color="#34d399" />
                <StatCard icon={BarChart2} label="Products" value={fmtInt(o.total_products)} color="#f59e0b" />
            </div>

            <SectionTitle title="Orders by Status" />
            <div className="p-5 rounded-2xl" style={{ background: '#0e1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                <DonutChart data={data.orders_by_status} labelKey="status" valueKey="count" />
            </div>

            <SectionTitle title="Revenue — Last 7 Days" />
            <div className="p-5 rounded-2xl" style={{ background: '#0e1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                <BarChart data={data.revenue_by_day} valueKey="revenue" labelKey="day" color="#a78bfa" />
            </div>

            <SectionTitle title="Top Performing Variants" />
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0e1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                <table className="w-full text-sm">
                    <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <tr>{['Product / Variant', 'Units Sold', 'Revenue'].map(h => (
                            <th key={h} className="px-5 py-3 text-left text-xs font-black text-white/30 uppercase tracking-wider">{h}</th>
                        ))}</tr>
                    </thead>
                    <tbody>
                        {data.top_variants.map((v, i) => (
                            <tr key={i} className="hover:bg-white/[0.02]" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td className="px-5 py-3">
                                    <p className="font-semibold text-white/80 text-sm">{v.product_name}</p>
                                    <p className="text-xs text-white/35">{v.variant_name}</p>
                                </td>
                                <td className="px-5 py-3 text-cyan-400 font-bold">{v.total_sold}</td>
                                <td className="px-5 py-3 text-emerald-400 font-bold">PKR {parseFloat(v.total_revenue).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

const CustomerAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/analytics/customer')
            .then(r => setData(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loader />;
    if (!data) return <p className="text-white/30 text-center py-20">Failed to load analytics.</p>;

    const o = data.overview;

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={ShoppingBag} label="Total Orders" value={fmtInt(o.total_orders)} color="#22d3ee" />
                <StatCard icon={DollarSign} label="Total Spent" value={`PKR ${parseFloat(o.total_spent || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`} color="#a78bfa" />
                <StatCard icon={TrendingUp} label="Avg Order Value" value={`PKR ${fmt(o.avg_order_value)}`} color="#f59e0b" />
                <StatCard icon={CheckCircle2} label="Delivered" value={fmtInt(o.delivered_orders)} color="#34d399" />
            </div>

            <SectionTitle title="Orders by Status" />
            <div className="p-5 rounded-2xl" style={{ background: '#0e1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                <DonutChart data={data.orders_by_status} labelKey="status" valueKey="count" />
            </div>

            <SectionTitle title="Top Categories Purchased" />
            <div className="p-5 rounded-2xl" style={{ background: '#0e1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                <BarChart data={data.top_categories} valueKey="total_spent" labelKey="category_name" color="#f59e0b" />
            </div>

            <SectionTitle title="Recent Orders" />
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0e1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                <table className="w-full text-sm">
                    <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <tr>{['Order #', 'Amount', 'Status', 'Date'].map(h => (
                            <th key={h} className="px-5 py-3 text-left text-xs font-black text-white/30 uppercase tracking-wider">{h}</th>
                        ))}</tr>
                    </thead>
                    <tbody>
                        {data.recent_orders.map((o, i) => (
                            <tr key={i} className="hover:bg-white/[0.02]" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td className="px-5 py-3 font-mono text-cyan-400 text-xs">{o.order_number}</td>
                                <td className="px-5 py-3 font-bold text-white/80">PKR {fmt(o.net_amount)}</td>
                                <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                                <td className="px-5 py-3 text-white/30 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

const CourierAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/analytics/courier')
            .then(r => setData(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loader />;
    if (!data) return <p className="text-white/30 text-center py-20">Failed to load analytics.</p>;

    const o = data.overview;

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard icon={Truck} label="Total Assigned" value={fmtInt(o.total_assigned)} color="#22d3ee" />
                <StatCard icon={CheckCircle2} label="Delivered" value={fmtInt(o.total_delivered)} color="#34d399" />
                <StatCard icon={XCircle} label="Failed" value={fmtInt(o.total_failed)} color="#f87171" />
                <StatCard icon={Clock} label="Active" value={fmtInt(o.active)} color="#f59e0b" />
                <StatCard icon={TrendingUp} label="Success Rate" value={`${o.success_rate || 0}%`} color="#a78bfa" />
                <StatCard icon={BarChart2} label="Avg Delivery Time" value={`${o.avg_delivery_hours || 0}h`} color="#60a5fa" />
            </div>

            <SectionTitle title="Deliveries by Status" />
            <div className="p-5 rounded-2xl" style={{ background: '#0e1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                <DonutChart data={data.deliveries_by_status} labelKey="status" valueKey="count" />
            </div>

            <SectionTitle title="Recent Deliveries" />
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0e1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                <table className="w-full text-sm">
                    <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <tr>{['Order #', 'Amount', 'Status', 'Assigned'].map(h => (
                            <th key={h} className="px-5 py-3 text-left text-xs font-black text-white/30 uppercase tracking-wider">{h}</th>
                        ))}</tr>
                    </thead>
                    <tbody>
                        {data.recent_deliveries.map((d, i) => (
                            <tr key={i} className="hover:bg-white/[0.02]" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td className="px-5 py-3 font-mono text-cyan-400 text-xs">{d.order_number}</td>
                                <td className="px-5 py-3 font-bold text-white/80">PKR {fmt(d.net_amount)}</td>
                                <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                                <td className="px-5 py-3 text-white/30 text-xs">{new Date(d.assigned_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

// ── Main Page ──────────────────────────────────────────────────────────────────
const Analytics = () => {
    const { user } = useAuth();

    const roleMap = {
        Admin: { component: <AdminAnalytics />, color: '#22d3ee', label: 'Platform Analytics' },
        Vendor: { component: <VendorAnalytics />, color: '#a78bfa', label: 'Store Analytics' },
        Customer: { component: <CustomerAnalytics />, color: '#f59e0b', label: 'My Shopping Stats' },
        Courier: { component: <CourierAnalytics />, color: '#34d399', label: 'Delivery Analytics' },
    };

    const config = roleMap[user?.role_name];
    if (!config) return null;

    return (
        <div className="animate-fade-up">
            <div className="flex items-center gap-3 mb-7">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background: config.color + '20' }}>
                    <BarChart2 className="w-5 h-5" style={{ color: config.color }} />
                </div>
                <div>
                    <h2 className="text-xl font-black text-white">{config.label}</h2>
                    <p className="text-xs text-white/30 mt-0.5">Live data from your database</p>
                </div>
            </div>
            {config.component}
        </div>
    );
};

export default Analytics;