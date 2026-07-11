import React from 'react';
import { Trash2, Package } from 'lucide-react';

const CartItem = ({ item, onRemove }) => {
    return (
        <div className="group flex items-center gap-5 py-4 px-5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors duration-200">
            {/* Product image placeholder */}
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                <Package className="w-6 h-6 text-white/30" />
            </div>

            {/* Info */}
            <div className="flex-grow min-w-0">
                <h4 className="font-semibold text-white/90 text-sm leading-snug truncate">{item.product_name}</h4>
                <p className="text-xs text-white/60 mt-0.5 font-mono">{item.variant_name}</p>
            </div>

            {/* Price & qty */}
            <div className="text-right shrink-0">
                <p className="font-bold text-cyan-400 text-sm">PKR {parseFloat(item.price).toFixed(2)}</p>
                <p className="text-xs text-white/50 mt-0.5">×{item.quantity}</p>
            </div>

            {/* Remove */}
            <button
                onClick={() => onRemove(item.cart_item_id)}
                className="ml-2 p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-cyan-400 transition-all duration-150 md:opacity-0 group-hover:opacity-100"
                title="Remove item"
                aria-label={`Remove ${item.product_name} from cart`}
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
};

export default CartItem;