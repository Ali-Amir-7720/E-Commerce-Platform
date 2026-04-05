import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getCart } from '../api/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartCount, setCartCount] = useState(0);
    const [cartItems, setCartItems] = useState([]);
    const { user } = useAuth();

    const fetchCart = useCallback(async () => {
        if (user && user.role_name === 'Customer') {
            try {
                const res = await getCart();
                const items = res.data.items || [];
                setCartItems(items);
                const count = items.reduce((acc, item) => acc + item.quantity, 0);
                setCartCount(count);
            } catch (error) {
                console.error('Failed to fetch cart:', error);
                setCartItems([]);
                setCartCount(0);
            }
        } else {
            setCartItems([]);
            setCartCount(0);
        }
    }, [user]);  // ← depends only on user, not recreated every render

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);  // ← stable now

    return (
        <CartContext.Provider value={{ cartCount, cartItems, refreshCart: fetchCart }}>
            {children}
        </CartContext.Provider>
    );
};