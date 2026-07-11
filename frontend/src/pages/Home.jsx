import React, { useEffect, useState, useMemo } from 'react';
import { getProducts } from '../api/api';
import ProductCard from '../components/ProductCard';
import Loader, { ProductGridSkeleton } from '../components/Loader';
import { Search, SlidersHorizontal, Package } from 'lucide-react';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('default');
    const [category, setCategory] = useState('all');

    useEffect(() => {
        getProducts()
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                setProducts(data);
            })
            .catch(() => setError('Failed to load products.'))
            .finally(() => setLoading(false));
    }, []);

    // Unique categories from loaded products
    const categories = useMemo(() => {
        const cats = [...new Set(products.map(p => p.category_name).filter(Boolean))];
        return cats.sort();
    }, [products]);

    // Filter + sort — memoized so it only recalculates when deps change
    const filtered = useMemo(() => {
        let result = products.filter(p => {
            // exclude banned products
            if (p.status === 'banned') return false;
            const q = search.toLowerCase();
            const matchesSearch = !q ||
                p.product_name?.toLowerCase().includes(q) ||
                p.category_name?.toLowerCase().includes(q);
            const matchesCat = category === 'all' || p.category_name === category;
            return matchesSearch && matchesCat;
        });

        switch (sortBy) {
            case 'name_asc': return [...result].sort((a, b) => a.product_name.localeCompare(b.product_name));
            case 'name_desc': return [...result].sort((a, b) => b.product_name.localeCompare(a.product_name));
            default: return result;
        }
    }, [search, sortBy, category, products]);

    return (
        <div className="animate-fade-up">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-3xl mb-10 px-8 py-16 text-center bg-gradient-to-br from-[#0e1117] via-[#141a24] to-[#0e1117] border border-white/5">
                <div className="absolute inset-0 opacity-[0.05]"
                    style={{ backgroundImage: 'radial-gradient(circle, #22d3ee 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
                <h1 className="relative text-4xl sm:text-5xl font-black tracking-tight mb-3 text-white">
                    Shop the <span className="bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">Best</span> Deals
                </h1>
                <p className="relative text-white/50 text-lg max-w-xl mx-auto mb-8">
                    Thousands of products, delivered fast. Find what you love.
                </p>
 
                {/* Search bar */}
                <div className="relative max-w-2xl mx-auto flex flex-col sm:flex-row items-stretch gap-2">
                    <div className="flex-grow relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input type="text" placeholder="Search products or categories..."
                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm text-white outline-none transition-all placeholder:text-white/40 bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                        <select value={category} onChange={e => setCategory(e.target.value)}
                            className="px-4 py-3.5 rounded-2xl text-sm text-white/80 outline-none cursor-pointer bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-all">
                            <option value="all" className="bg-[#0e1117]">All Categories</option>
                            {categories.map(c => <option key={c} value={c} className="bg-[#0e1117]">{c}</option>)}
                        </select>
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                            className="px-4 py-3.5 rounded-2xl text-sm text-white/80 outline-none cursor-pointer bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-all">
                            <option value="default" className="bg-[#0e1117]">Default</option>
                            <option value="name_asc" className="bg-[#0e1117]">A → Z</option>
                            <option value="name_desc" className="bg-[#0e1117]">Z → A</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black text-white">
                    {search ? `Results for "${search}"` : category !== 'all' ? category : 'All Products'}
                </h2>
                {!loading && <span className="text-sm text-white/50">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>}
            </div>

            {/* Grid */}
            {loading ? <ProductGridSkeleton count={8} /> : error ? (
                <div className="text-center text-red-400 bg-red-500/10 rounded-2xl py-12 border border-red-500/20">{error}</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                        <Package className="w-8 h-8 text-white/40" />
                    </div>
                    <p className="text-white/60 font-semibold text-base mb-1">No products found</p>
                    <p className="text-white/40 text-sm">Try a different search or category.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {filtered.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Home;