import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Only unwrap when .data is an array (list endpoints)
api.interceptors.response.use((response) => {
    if (response.data && Array.isArray(response.data.data)) {
        response.data = response.data.data;
    }
    return response;
});

// -- AUTH --
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);

// -- PRODUCTS --
export const getProducts = () => api.get('/products');
export const getProductDetails = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);

// -- CART --
export const getCart = () => api.get('/cart');
export const addToCart = (product_variant_id, quantity) => api.post('/cart', { product_variant_id, quantity });
export const removeFromCart = (id) => api.delete(`/cart/item/${id}`);

// -- WISHLIST --
export const getWishlist = () => api.get('/wishlist');
export const addToWishlist = (product_variant_id) => api.post('/wishlist', { product_variant_id });
export const removeFromWishlist = (id) => api.delete(`/wishlist/${id}`);

// -- ORDERS --
export const placeOrder = (data) => api.post('/orders', data);
export const getOrders = () => api.get('/orders');
export const getOrderDetails = (id) => api.get(`/orders/${id}`);

// -- ADDRESS --
export const getAddresses = () => api.get('/address');
export const createAddress = (data) => api.post('/address', data);
export const deleteAddress = (id) => api.delete(`/address/${id}`);

// -- OFFERS --
export const validateCoupon = (coupon_code) => api.post('/offers/validate', { coupon_code });
export const manageOffers = {
    getAll: () => api.get('/offers'),
    create: (data) => api.post('/offers', data),
    delete: (id) => api.delete(`/offers/${id}`),
};

// -- ADMIN --
export const getUsers = () => api.get('/admin/users');
export const blockUser = (id) => api.patch(`/admin/users/${id}/block`);
export const unblockUser = (id) => api.patch(`/admin/users/${id}/unblock`);
export const changeUserRole = (id, role_id) => api.patch(`/admin/users/${id}/role`, { role_id });
export const manageCategories = {
    getAll: () => api.get('/categories'),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
};

// -- COURIER --
export const getAssignedOrders = () => api.get('/courier/orders');
export const acceptOrder = (id) => api.post(`/courier/orders/${id}/accept`);
export const markOrderPicked = (id) => api.patch(`/courier/orders/${id}/pick`);
export const markOrderDelivered = (id) => api.patch(`/courier/orders/${id}/deliver`);
export const failOrder = (id, reason) => api.patch(`/courier/orders/${id}/fail`, { reason });

export default api;