import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, LogOut, Zap, Heart, Package, LayoutDashboard, Menu, X, BarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => setMobileOpen(false), [location]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getDashboardLink = () => {
        if (!user) return '/login';
        switch (user.role_name) {
            case 'Admin': return '/admin';
            case 'Vendor': return '/vendor';
            case 'Courier': return '/courier';
            default: return '/';
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className={`sticky top-0 z-40 transition-all duration-300 ${scrolled
            ? 'bg-[#080c10]/95 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.4)]'
            : 'bg-[#080c10]/80 backdrop-blur-md border-b border-white/5'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-[0_0_16px_rgba(6,182,212,0.4)] group-hover:shadow-[0_0_24px_rgba(6,182,212,0.6)] transition-shadow">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-black tracking-tight text-white">
                            NEX<span className="text-cyan-400">US</span>
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {user ? (
                            <>
                                <NavLink to={getDashboardLink()} active={isActive(getDashboardLink())}>
                                    <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                                </NavLink>

                                {user.role_name === 'Customer' && (
                                    <>
                                        <NavLink to="/wishlist" active={isActive('/wishlist')}>
                                            <Heart className="w-3.5 h-3.5" /> Wishlist
                                        </NavLink>
                                        <NavLink to="/orders" active={isActive('/orders')}>
                                            <Package className="w-3.5 h-3.5" /> Orders
                                        </NavLink>
                                        <Link
                                            to="/cart"
                                            className={`relative p-2.5 rounded-lg transition-all duration-150 ${isActive('/cart')
                                                ? 'text-cyan-400 bg-cyan-500/10'
                                                : 'text-white/50 hover:text-cyan-400 hover:bg-white/5'
                                                }`}
                                        >
                                            <ShoppingCart className="w-5 h-5" />
                                            {cartCount > 0 && (
                                                <span className="absolute -top-0.5 -right-0.5 bg-cyan-500 text-black text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(6,182,212,0.8)]">
                                                    {cartCount > 9 ? '9+' : cartCount}
                                                </span>
                                            )}
                                        </Link>
                                    </>
                                )}

                                {/* Analytics — visible to all logged in roles */}
                                <NavLink to="/analytics" active={isActive('/analytics')}>
                                    <BarChart2 className="w-3.5 h-3.5" /> Analytics
                                </NavLink>

                                {/* User pill */}
                                <div className="flex items-center gap-3 ml-3 pl-3 border-l border-white/10">
                                    <div className="text-right">
                                        <p className="text-xs font-semibold text-white/80 leading-none">{user.full_name}</p>
                                        <p className="text-[10px] text-cyan-400/70 mt-0.5 font-mono">{user.role_name}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
                                        title="Logout"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-150"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-2 text-sm font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-[0_0_16px_rgba(6,182,212,0.35)] hover:shadow-[0_0_24px_rgba(6,182,212,0.55)] transition-all duration-150"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile toggle */}
                    <button
                        className="md:hidden p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5"
                        onClick={() => setMobileOpen(o => !o)}
                    >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-white/5 bg-[#080c10]/98 backdrop-blur-xl px-4 py-3 flex flex-col gap-1">
                    {user ? (
                        <>
                            <div className="flex items-center gap-3 px-3 py-3 mb-1 border-b border-white/5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
                                    {user.full_name?.[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">{user.full_name}</p>
                                    <p className="text-xs text-cyan-400/70 font-mono">{user.role_name}</p>
                                </div>
                            </div>
                            <MobileNavLink to={getDashboardLink()}>Dashboard</MobileNavLink>
                            {user.role_name === 'Customer' && (
                                <>
                                    <MobileNavLink to="/wishlist">Wishlist</MobileNavLink>
                                    <MobileNavLink to="/orders">My Orders</MobileNavLink>
                                    <MobileNavLink to="/cart">Cart {cartCount > 0 && `(${cartCount})`}</MobileNavLink>
                                </>
                            )}
                            <MobileNavLink to="/analytics">Analytics</MobileNavLink>
                            <button
                                onClick={handleLogout}
                                className="mt-2 flex items-center gap-2 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors"
                            >
                                <LogOut className="w-4 h-4" /> Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <MobileNavLink to="/login">Login</MobileNavLink>
                            <MobileNavLink to="/register">Register</MobileNavLink>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
};

const NavLink = ({ to, active, children }) => (
    <Link
        to={to}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${active
            ? 'text-cyan-400 bg-cyan-500/10'
            : 'text-white/50 hover:text-white/90 hover:bg-white/5'
            }`}
    >
        {children}
    </Link>
);

const MobileNavLink = ({ to, children }) => (
    <Link
        to={to}
        className="px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
    >
        {children}
    </Link>
);

export default Navbar;