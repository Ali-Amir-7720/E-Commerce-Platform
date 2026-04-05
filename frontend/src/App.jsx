import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { ChatProvider } from './context/chatContext';
import { useAuth } from './context/AuthContext';

import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductDetails from './pages/ProductDetails';
import Analytics from './pages/Analytics';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Orders from './pages/Orders';
import AdminDashboard from './pages/AdminDashboard';
import VendorDashboard from './pages/VendorDashboard';
import CourierDashboard from './pages/CourierDashboard';

const HomeOrDashboard = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Home />;
  switch (user.role_name) {
    case 'Admin': return <Navigate to="/admin" replace />;
    case 'Vendor': return <Navigate to="/vendor" replace />;
    case 'Courier': return <Navigate to="/courier" replace />;
    default: return <Home />;
  }
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <ChatProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<MainLayout />}>
                  {/* Public */}
                  <Route index element={<HomeOrDashboard />} />
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                  <Route path="products/:id" element={<ProductDetails />} />

                  {/* Customer only */}
                  <Route element={<ProtectedRoute allowedRoles={['Customer']} />}>
                    <Route path="cart" element={<Cart />} />
                    <Route path="wishlist" element={<Wishlist />} />
                    <Route path="orders" element={<Orders />} />
                  </Route>

                  {/* Admin only */}
                  <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                    <Route path="admin" element={<AdminDashboard />} />
                  </Route>

                  {/* Vendor */}
                  <Route element={<ProtectedRoute allowedRoles={['Vendor', 'Admin']} />}>
                    <Route path="vendor" element={<VendorDashboard />} />
                  </Route>

                  {/* Courier */}
                  <Route element={<ProtectedRoute allowedRoles={['Courier']} />}>
                    <Route path="courier" element={<CourierDashboard />} />
                  </Route>

                  {/* Analytics — shared across all roles, auth required */}
                  <Route element={<ProtectedRoute allowedRoles={['Admin', 'Vendor', 'Customer', 'Courier']} />}>
                    <Route path="analytics" element={<Analytics />} />
                  </Route>

                  {/* Catch-all */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ChatProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;