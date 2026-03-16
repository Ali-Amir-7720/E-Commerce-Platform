const db = require('../config/db');
const { placeOrder } = require('../services/orderService');

const createOrder = async (req, res) => {
    const { payment_type, shipping_amount, coupon_code } = req.body;

    if (!payment_type) {
        return res.status(400).json({ error: 'payment_type is required' });
    }
    if (!['netbanking', 'upi', 'cod'].includes(payment_type)) {
        return res.status(400).json({
            error: "payment_type must be 'netbanking', 'upi', or 'cod'",
        });
    }

    const shippingAmt = parseFloat(shipping_amount) || 0;
    if (isNaN(shippingAmt) || shippingAmt < 0) {
        return res.status(400).json({ error: 'shipping_amount must be a non-negative number' });
    }

    try {
        const result = await placeOrder({
            userId: req.user.id,
            paymentType: payment_type,
            shippingAmount: shippingAmt,
            couponCode: coupon_code,
        });

        return res.status(201).json({
            message: result.flagged
                ? 'Order placed but flagged for review. Our team will verify it shortly.'
                : 'Order created successfully',
            order_id: result.orderId,
            order_number: result.orderNumber,
            total_amount: result.totalAmount,
            discount_amount: result.discountAmount,
            shipping_amount: result.shippingAmount,
            net_amount: result.netAmount,
            flagged: result.flagged,
        });

    } catch (err) {
        if (err.statusCode) {
            const body = typeof err.message === 'object'
                ? err.message
                : { error: err.message };
            return res.status(err.statusCode).json(body);
        }
        console.error('Error creating order:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getOrders = async (req, res) => {
    const { id: userId, role_name } = req.user;

    try {
        if (role_name === 'Admin') {
            const { rows } = await db.query(
                `SELECT o.id, o.order_number, o.net_amount, o.status,
                        o.payment_status, o.created_at, u.email AS user_email
                 FROM Orders o
                 JOIN Users u ON o.user_id = u.id
                 ORDER BY o.created_at DESC`
            );
            return res.status(200).json(rows);
        }

        if (role_name === 'Customer') {
            const { rows } = await db.query(
                `SELECT id, order_number, total_amount, discount_amount,
                        shipping_amount, net_amount, status,
                        payment_status, payment_type, created_at
                 FROM Orders
                 WHERE user_id = $1
                 ORDER BY created_at DESC`,
                [userId]
            );
            return res.status(200).json(rows);
        }

        return res.status(403).json({ error: 'Forbidden' });

    } catch (err) {
        console.error('Error fetching orders:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getOrderById = async (req, res) => {
    const { id } = req.params;
    const { id: userId, role_name } = req.user;

    try {
        let query = `
            SELECT o.*,
                   sa.full_address, sa.city, sa.state, sa.zip_code
            FROM Orders o
            LEFT JOIN LATERAL (
                SELECT full_address, city, state, zip_code
                FROM Shipping_addresses
                WHERE user_id = o.user_id
                ORDER BY created_at DESC
                LIMIT 1
            ) sa ON TRUE
            WHERE o.id = $1`;
        const params = [id];

        if (role_name === 'Customer') {
            query += ` AND o.user_id = $2`;
            params.push(userId);
        }

        const orderResult = await db.query(query, params);

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orderResult.rows[0];

        const itemsResult = await db.query(
            `SELECT oi.variant_name, oi.price, oi.quantity, oi.total_amount, pv.product_id
             FROM Order_items oi
             JOIN Product_variants pv ON oi.product_variant_id = pv.id
             WHERE oi.order_id = $1`,
            [id]
        );

        order.items = itemsResult.rows;

        return res.status(200).json(order);

    } catch (err) {
        console.error('Error fetching order by ID:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
module.exports = { createOrder, getOrders, getOrderById };