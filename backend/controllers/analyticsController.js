const db = require('../config/db');

// ── Admin Analytics ────────────────────────────────────────────────────────────
// GET /api/v1/analytics/admin
const getAdminAnalytics = async (req, res) => {
    try {
        const [
            overview,
            ordersByStatus,
            revenueByDay,
            topProducts,
            topCustomers,
            newUsersToday,
        ] = await Promise.all([
            // Overview stats
            db.query(`
                SELECT
                    (SELECT COUNT(*) FROM Orders) AS total_orders,
                    (SELECT COALESCE(SUM(net_amount),0) FROM Orders WHERE status = 'delivered') AS total_revenue,
                    (SELECT COUNT(*) FROM Users) AS total_users,
                    (SELECT COUNT(*) FROM Products WHERE status = 'active') AS total_products,
                    (SELECT COUNT(*) FROM Orders WHERE status = 'placed') AS pending_orders,
                    (SELECT COUNT(*) FROM fraud_flags WHERE status = 'pending') AS pending_fraud_flags
            `),
            // Orders by status
            db.query(`
                SELECT status, COUNT(*) AS count
                FROM Orders
                GROUP BY status
                ORDER BY count DESC
            `),
            // Revenue last 7 days
            db.query(`
                SELECT
                    DATE(created_at) AS day,
                    COALESCE(SUM(net_amount), 0) AS revenue,
                    COUNT(*) AS orders
                FROM Orders
                WHERE created_at >= NOW() - INTERVAL '7 days'
                  AND status = 'delivered'
                GROUP BY DATE(created_at)
                ORDER BY day ASC
            `),
            // Top 5 selling products
            db.query(`
                SELECT
                    p.product_name,
                    SUM(oi.quantity) AS total_sold,
                    SUM(oi.total_amount) AS total_revenue
                FROM Order_items oi
                JOIN Product_variants pv ON oi.product_variant_id = pv.id
                JOIN Products p ON pv.product_id = p.id
                JOIN Orders o ON oi.order_id = o.id
                WHERE o.status = 'delivered'
                GROUP BY p.id, p.product_name
                ORDER BY total_sold DESC
                LIMIT 5
            `),
            // Top 5 customers by spend
            db.query(`
                SELECT
                    u.full_name, u.email,
                    COUNT(o.id) AS total_orders,
                    SUM(o.net_amount) AS total_spent
                FROM Orders o
                JOIN Users u ON o.user_id = u.id
                WHERE o.status = 'delivered'
                GROUP BY u.id, u.full_name, u.email
                ORDER BY total_spent DESC
                LIMIT 5
            `),
            // New users today
            db.query(`
                SELECT COUNT(*) AS count FROM Users
                WHERE created_at >= CURRENT_DATE
            `),
        ]);

        return res.status(200).json({
            overview: overview.rows[0],
            orders_by_status: ordersByStatus.rows,
            revenue_by_day: revenueByDay.rows,
            top_products: topProducts.rows,
            top_customers: topCustomers.rows,
            new_users_today: newUsersToday.rows[0].count,
        });
    } catch (err) {
        console.error('Admin analytics error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ── Vendor Analytics ───────────────────────────────────────────────────────────
// GET /api/v1/analytics/vendor
const getVendorAnalytics = async (req, res) => {
    const vendorId = req.user.id;
    try {
        const [overview, topVariants, revenueByDay, ordersByStatus] = await Promise.all([
            // Overview
            db.query(`
                SELECT
                    COUNT(DISTINCT o.id) AS total_orders,
                    COALESCE(SUM(oi.total_amount), 0) AS total_revenue,
                    COALESCE(SUM(oi.quantity), 0) AS total_units_sold,
                    COUNT(DISTINCT p.id) AS total_products
                FROM Orders o
                JOIN Order_items oi ON oi.order_id = o.id
                JOIN Product_variants pv ON oi.product_variant_id = pv.id
                JOIN Products p ON pv.product_id = p.id
                WHERE p.vendor_id = $1 AND o.status = 'delivered'
            `, [vendorId]),
            // Top variants
            db.query(`
                SELECT
                    oi.variant_name,
                    p.product_name,
                    SUM(oi.quantity) AS total_sold,
                    SUM(oi.total_amount) AS total_revenue
                FROM Order_items oi
                JOIN Product_variants pv ON oi.product_variant_id = pv.id
                JOIN Products p ON pv.product_id = p.id
                JOIN Orders o ON oi.order_id = o.id
                WHERE p.vendor_id = $1 AND o.status = 'delivered'
                GROUP BY oi.variant_name, p.product_name
                ORDER BY total_sold DESC
                LIMIT 5
            `, [vendorId]),
            // Revenue last 7 days
            db.query(`
                SELECT
                    DATE(o.created_at) AS day,
                    COALESCE(SUM(oi.total_amount), 0) AS revenue
                FROM Orders o
                JOIN Order_items oi ON oi.order_id = o.id
                JOIN Product_variants pv ON oi.product_variant_id = pv.id
                JOIN Products p ON pv.product_id = p.id
                WHERE p.vendor_id = $1
                  AND o.status = 'delivered'
                  AND o.created_at >= NOW() - INTERVAL '7 days'
                GROUP BY DATE(o.created_at)
                ORDER BY day ASC
            `, [vendorId]),
            // Orders by status for vendor products
            db.query(`
                SELECT o.status, COUNT(DISTINCT o.id) AS count
                FROM Orders o
                JOIN Order_items oi ON oi.order_id = o.id
                JOIN Product_variants pv ON oi.product_variant_id = pv.id
                JOIN Products p ON pv.product_id = p.id
                WHERE p.vendor_id = $1
                GROUP BY o.status
            `, [vendorId]),
        ]);

        return res.status(200).json({
            overview: overview.rows[0],
            top_variants: topVariants.rows,
            revenue_by_day: revenueByDay.rows,
            orders_by_status: ordersByStatus.rows,
        });
    } catch (err) {
        console.error('Vendor analytics error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ── Customer Analytics ─────────────────────────────────────────────────────────
// GET /api/v1/analytics/customer
const getCustomerAnalytics = async (req, res) => {
    const userId = req.user.id;
    try {
        const [overview, ordersByStatus, recentOrders, topCategories] = await Promise.all([
            // Overview
            db.query(`
                SELECT
                    COUNT(*) AS total_orders,
                    COALESCE(SUM(net_amount), 0) AS total_spent,
                    COALESCE(AVG(net_amount), 0) AS avg_order_value,
                    COUNT(CASE WHEN status = 'delivered' THEN 1 END) AS delivered_orders
                FROM Orders WHERE user_id = $1
            `, [userId]),
            // Orders by status
            db.query(`
                SELECT status, COUNT(*) AS count
                FROM Orders WHERE user_id = $1
                GROUP BY status
            `, [userId]),
            // Last 5 orders
            db.query(`
                SELECT order_number, net_amount, status, created_at
                FROM Orders WHERE user_id = $1
                ORDER BY created_at DESC LIMIT 5
            `, [userId]),
            // Top categories purchased
            db.query(`
                SELECT
                    c.category_name,
                    SUM(oi.quantity) AS total_bought,
                    SUM(oi.total_amount) AS total_spent
                FROM Orders o
                JOIN Order_items oi ON oi.order_id = o.id
                JOIN Product_variants pv ON oi.product_variant_id = pv.id
                JOIN Products p ON pv.product_id = p.id
                JOIN Categories c ON p.category_id = c.id
                WHERE o.user_id = $1 AND o.status = 'delivered'
                GROUP BY c.category_name
                ORDER BY total_spent DESC
                LIMIT 5
            `, [userId]),
        ]);

        return res.status(200).json({
            overview: overview.rows[0],
            orders_by_status: ordersByStatus.rows,
            recent_orders: recentOrders.rows,
            top_categories: topCategories.rows,
        });
    } catch (err) {
        console.error('Customer analytics error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// ── Courier Analytics ──────────────────────────────────────────────────────────
// GET /api/v1/analytics/courier
const getCourierAnalytics = async (req, res) => {
    const userId = req.user.id;
    try {
        const [overview, deliveriesByStatus, recentDeliveries] = await Promise.all([
            // Overview
            db.query(`
                SELECT
                    COUNT(*) AS total_assigned,
                    COUNT(CASE WHEN od.status = 'delivered' THEN 1 END) AS total_delivered,
                    COUNT(CASE WHEN od.status = 'failed' THEN 1 END) AS total_failed,
                    COUNT(CASE WHEN od.status IN ('assigned','picked') THEN 1 END) AS active,
                    ROUND(
                        COUNT(CASE WHEN od.status = 'delivered' THEN 1 END) * 100.0
                        / NULLIF(COUNT(*), 0), 1
                    ) AS success_rate,
                    ROUND(AVG(
                        EXTRACT(EPOCH FROM (od.delivered_at - od.assigned_at))/3600
                    )::numeric, 1) AS avg_delivery_hours
                FROM order_deliveries od
                WHERE od.courier_id = $1
            `, [userId]),
            // By status
            db.query(`
                SELECT od.status, COUNT(*) AS count
                FROM order_deliveries od
                WHERE od.courier_id = $1
                GROUP BY od.status
            `, [userId]),
            // Recent 5 deliveries
            db.query(`
                SELECT
                    o.order_number,
                    o.net_amount,
                    od.status,
                    od.assigned_at,
                    od.delivered_at
                FROM order_deliveries od
                JOIN Orders o ON od.order_id = o.id
                WHERE od.courier_id = $1
                ORDER BY od.assigned_at DESC
                LIMIT 5
            `, [userId]),
        ]);

        return res.status(200).json({
            overview: overview.rows[0],
            deliveries_by_status: deliveriesByStatus.rows,
            recent_deliveries: recentDeliveries.rows,
        });
    } catch (err) {
        console.error('Courier analytics error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getAdminAnalytics, getVendorAnalytics, getCustomerAnalytics, getCourierAnalytics };