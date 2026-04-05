import React from 'react';
import { Trash2 } from 'lucide-react';

const CartItem = ({ item, onRemove }) => {
    return (
        <div className="group flex items-center gap-5 py-4 px-5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors duration-200">
            {/* Product image placeholder */}
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">img</span>
            </div>

            {/* Info */}
            <div className="flex-grow min-w-0">
                <h4 className="font-semibold text-white/90 text-sm leading-snug truncate">{item.product_name}</h4>
                <p className="text-xs text-white/35 mt-0.5 font-mono">{item.variant_name}</p>
            </div>

            {/* Price & qty */}
            <div className="text-right shrink-0">
                <p className="font-bold text-cyan-400 text-sm">${parseFloat(item.price).toFixed(2)}</p>
                <p className="text-xs text-white/30 mt-0.5">×{item.quantity}</p>
            </div>

            {/* Remove */}
            <button
                onClick={() => onRemove(item.cart_item_id)}
                className="ml-2 p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 opacity-0 group-hover:opacity-100"
                title="Remove item"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
};

export default CartItem;