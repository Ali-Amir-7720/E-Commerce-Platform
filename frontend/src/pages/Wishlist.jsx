import React, { useEffect, useState } from 'react';
import { getWishlist, removeFromWishlist } from '../api/api';
import { useToast } from '../context/ToastContext';
import Loader, { ProductGridSkeleton } from '../components/Loader';
import { Heart, Trash2, Package, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const Wishlist = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        getWishlist()
            .then(res => setItems(Array.isArray(res.data) ? res.data : []))
            .catch(() => toast.error('Failed to load wishlist.'))
            .finally(() => setLoading(false));
    }, []);

    const handleRemove = async (id) => {
        try {
            await removeFromWishlist(id);
            setItems(prev => prev.filter(i => i.id !== id));
            toast.success('Removed from wishlist.');
        } catch {
            toast.error('Failed to remove item.');
        }
    };

    return (
        <div className="animate-fade-up">
            <div className="flex items-center gap-3 mb-7">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white fill-white" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-white">My Wishlist</h2>
                    <p className="text-xs text-white/50 mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                </div>
            </div>

            {loading ? (
                <ProductGridSkeleton count={4} />
            ) : items.length === 0 ? (
                <div className="text-center py-24 bg-white/[0.02] rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                        <Heart className="w-8 h-8 text-white/40" />
                    </div>
                    <p className="text-white/60 text-lg font-semibold mb-1">Your wishlist is empty</p>
                    <p className="text-white/40 text-sm">Browse products and save your favourites.</p>
                    <Link to="/" className="mt-5 inline-block px-5 py-2.5 rounded-xl text-sm font-bold text-black bg-[#22d3ee] hover:bg-cyan-300 transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080c10]">
                        Browse Products
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.map(item => (
                        <div key={item.id} className="bg-[#0e1117] border border-white/8 rounded-2xl overflow-hidden hover:border-cyan-400/30 focus-within:border-cyan-400/30 transition-all group">
                            {/* Image */}
                            <div className="aspect-video bg-white/5 flex items-center justify-center overflow-hidden">
                                {item.image_url
                                    ? <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    : <Package className="w-12 h-12 text-white/10" />
                                }
                            </div>
                            <div className="p-4">
                                <p className="font-bold text-white/85 leading-tight truncate">{item.product_name}</p>
                                <p className="text-xs text-white/60 mt-0.5">{item.variant_name}</p>
                                <p className="text-cyan-400 font-black text-lg mt-2">PKR {parseFloat(item.price || 0).toFixed(2)}</p>
                                <div className="flex gap-2 mt-3">
                                    <Link to={`/products/${item.product_id}`}
                                        className="flex-grow flex items-center justify-center gap-1.5 py-2 text-sm font-bold rounded-xl text-black bg-[#22d3ee] hover:bg-cyan-300 transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1117]">
                                        <Eye className="w-3.5 h-3.5" /> View
                                    </Link>
                                    <button onClick={() => handleRemove(item.id)}
                                        className="p-2 border border-white/10 rounded-xl text-white/50 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1117]"
                                        aria-label={`Remove ${item.product_name} from wishlist`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Wishlist;