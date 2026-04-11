require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const offerRoutes = require('./routes/offerRoutes');
const courierRoutes = require('./routes/courierRoutes');
const reportRoutes = require('./routes/reportRoutes');
const addressRoutes = require('./routes/addressRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const chatRoutes = require('./routes/chatRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'https://e-commerce-platform-six-umber.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});
try {
    const swaggerDocument = YAML.load(path.join(__dirname, 'swagger', 'swagger.yaml'));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    console.log(`Swagger docs → http://localhost:${PORT}/api-docs`);
} catch (err) {
    console.warn('Swagger failed to load:', err.message);
}

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/offers', offerRoutes);
app.use('/api/v1/courier', courierRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/address', addressRoutes);
app.use('/api/v1/vendor', vendorRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

app.get('/health', (_req, res) =>
    res.status(200).json({ status: 'OK', uptime: process.uptime() })
);

app.get('/', (_req, res) => {
    res.json({ message: 'E-Commerce API', docs: '/api-docs' });
});

app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.use((err, _req, res, _next) => {
    console.error(`[ERROR] ${err.message}`);
    if (process.env.NODE_ENV === 'development') console.error(err.stack);

    if (err.statusCode)
        return res.status(err.statusCode).json({ error: err.message });
    if (err.code === '23505')
        return res.status(409).json({ error: 'Duplicate entry', detail: err.detail });
    if (err.code === '23503')
        return res.status(400).json({ error: 'Referenced record does not exist', detail: err.detail });
    if (err.code === '23514')
        return res.status(400).json({ error: 'Constraint violation', detail: err.detail });
    if (err.message?.includes('Insufficient stock available'))
        return res.status(409).json({ error: err.message });

    res.status(500).json({ error: 'Internal Server Error' });
});

const server = http.createServer(app);
const initSocket = require('./socket');
initSocket(server);

server.listen(PORT, () => {
    console.log(`Server running  → http://localhost:${PORT}`);
    console.log(`Environment     → ${process.env.NODE_ENV || 'development'}`);
    console.log(`WebSocket       → ws://localhost:${PORT}`);
});

module.exports = app;