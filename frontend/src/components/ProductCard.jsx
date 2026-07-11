import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { addToCart, addToWishlist } from '../api/api';

const ProductCard = ({ product }) => {
    const { user } = useAuth();
    const { refreshCart } = useCart();
    const toast = useToast();
    const isCustomer = user?.role_name === 'Customer';

    const handleAddToCart = async (e) => {
        e.preventDefault();
        if (!isCustomer) { toast.error('Please login as a Customer to add to cart.'); return; }
        if (!product.variants || product.variants.length === 0) { toast.error('No variants available.'); return; }
        try {
            await addToCart(product.variants[0].id, 1);
            refreshCart();
            toast.success(`"${product.product_name}" added to cart!`);
        } catch (err) { toast.error(err.response?.data?.error || 'Could not add to cart.'); }
    };

    const handleAddToWishlist = async (e) => {
        e.preventDefault();
        if (!isCustomer) { toast.error('Please login as a Customer.'); return; }
        if (!product.variants || product.variants.length === 0) { toast.error('No variants available.'); return; }
        try {
            await addToWishlist(product.variants[0].id);
            toast.success('Saved to wishlist!');
        } catch (err) { toast.error(err.response?.data?.error || 'Already in wishlist.'); }
    };

    const price = product.variants?.[0]?.price;

    return (
        <div className="group rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 bg-[#0e1117] border border-white/8 hover:border-cyan-400/30 focus-within:border-cyan-400/30">

            {/* Image */}
            <Link to={`/products/${product.id}`} className="block focus-visible:outline-none">
                <div className="aspect-[4/3] w-full flex items-center justify-center relative overflow-hidden bg-white/[0.03]">
                    {product.image_url
                        ? <img src={product.image_url} alt={product.product_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <Package className="w-14 h-14 text-white/10 group-hover:scale-110 transition-transform duration-300" />
                    }
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                </div>
            </Link>

            {/* Body */}
            <div className="p-4 flex flex-col flex-grow">
                {product.category_name && (
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide mb-1">{product.category_name}</span>
                )}
                <Link to={`/products/${product.id}`} className="focus-visible:outline-none">
                    <h3 className="font-semibold text-white/85 leading-tight line-clamp-2 hover:text-white transition-colors mb-1">{product.product_name}</h3>
                </Link>
                {product.description && (
                    <p className="text-xs text-white/50 line-clamp-2 mb-3">{product.description}</p>
                )}

                <div className="mt-auto">
                    {price && (
                        <p className="text-lg font-black text-white mb-3">PKR {parseFloat(price).toFixed(2)}</p>
                    )}
                    <div className="flex gap-2">
                        <Link
                            to={`/products/${product.id}`}
                            className="flex-grow flex items-center justify-center gap-1.5 py-2 px-3 text-black text-sm font-bold rounded-xl active:scale-95 transition-all bg-[#22d3ee] hover:bg-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1117]"
                        >
                            <ShoppingCart className="w-4 h-4" /> View Product
                        </Link>
                        <button onClick={handleAddToWishlist}
                            className="p-2 rounded-xl text-white/50 hover:text-red-400 hover:bg-white/5 active:scale-95 transition-all border border-white/10 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1117]"
                            title="Save to Wishlist">
                            <Heart className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;