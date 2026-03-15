const db = require('../config/db');

const getProductMessages = async (req, res) => {
    const { productId } = req.params;
    const userId = req.user.id;

    try {
        const { rows: product } = await db.query(
            `SELECT id, vendor_id FROM Products WHERE id = $1`, [productId]
        );
        if (product.length === 0)
            return res.status(404).json({ error: 'Product not found' });

        const isVendor = product[0].vendor_id === userId;

        let query, params;
        if (isVendor) {
            query = `
                SELECT m.id, m.message, m.created_at, m.sender_id,
                       u.full_name AS sender_name, u.role_id AS sender_role
                FROM messages m
                JOIN Users u ON m.sender_id = u.id
                WHERE m.room_type = 'product' AND m.room_id = $1
                ORDER BY m.created_at ASC`;
            params = [productId];
        } else {
            query = `
                SELECT m.id, m.message, m.created_at, m.sender_id,
                       u.full_name AS sender_name, u.role_id AS sender_role
                FROM messages m
                JOIN Users u ON m.sender_id = u.id
                WHERE m.room_type = 'product' AND m.room_id = $1
                  AND (m.sender_id = $2 OR m.sender_id = $3)
                ORDER BY m.created_at ASC`;
            params = [productId, userId, product[0].vendor_id];
        }

        const { rows } = await db.query(query, params);
        return res.status(200).json({ messages: rows, vendor_id: product[0].vendor_id });
    } catch (err) {
        console.error('Error fetching product messages:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getOrderMessages = async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;

    try {
        const { rows: orderRows } = await db.query(
            `SELECT o.id, o.user_id AS customer_id, od.courier_id
             FROM Orders o
             LEFT JOIN order_deliveries od ON od.order_id = o.id
             WHERE o.id = $1`, [orderId]
        );
        if (orderRows.length === 0)
            return res.status(404).json({ error: 'Order not found' });

        const order = orderRows[0];
        const isCustomer = order.customer_id === userId;
        const isCourier = order.courier_id === userId;

        if (!isCustomer && !isCourier)
            return res.status(403).json({ error: 'Not authorized to view this chat' });

        const { rows } = await db.query(
            `SELECT m.id, m.message, m.created_at, m.sender_id,
                    u.full_name AS sender_name, u.role_id AS sender_role
             FROM messages m
             JOIN Users u ON m.sender_id = u.id
             WHERE m.room_type = 'order' AND m.room_id = $1
             ORDER BY m.created_at ASC`,
            [orderId]
        );

        return res.status(200).json({
            messages: rows,
            customer_id: order.customer_id,
            courier_id: order.courier_id,
        });
    } catch (err) {
        console.error('Error fetching order messages:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getConversations = async (req, res) => {
    const userId = req.user.id;
    const roleId = req.user.role_id;

    try {
        let rows = [];
        if (roleId === 4) {
            const result = await db.query(
                `SELECT DISTINCT ON (m.room_id)
                    'product' AS room_type,
                    m.room_id,
                    p.product_name AS title,
                    m.message AS last_message,
                    m.created_at AS last_at,
                    u.full_name AS other_name,
                    u.id AS other_id
                 FROM messages m
                 JOIN Products p ON m.room_id = p.id
                 JOIN Users u ON m.sender_id = u.id
                 WHERE m.room_type = 'product'
                   AND p.vendor_id = $1
                   AND m.sender_id != $1
                 ORDER BY m.room_id, m.created_at DESC`,
                [userId]
            );
            rows = result.rows;
        }

        if (roleId === 2) {
            const productChats = await db.query(
                `SELECT DISTINCT ON (m.room_id)
                    'product' AS room_type,
                    m.room_id,
                    p.product_name AS title,
                    m.message AS last_message,
                    m.created_at AS last_at,
                    u.full_name AS other_name,
                    u.id AS other_id
                 FROM messages m
                 JOIN Products p ON m.room_id = p.id
                 JOIN Users u ON u.id = p.vendor_id
                 WHERE m.room_type = 'product'
                   AND m.room_id IN (
                       SELECT DISTINCT room_id FROM messages
                       WHERE room_type = 'product' AND sender_id = $1
                   )
                 ORDER BY m.room_id, m.created_at DESC`,
                [userId]
            );

            const orderChats = await db.query(
                `SELECT DISTINCT ON (m.room_id)
                    'order' AS room_type,
                    m.room_id,
                    o.order_number AS title,
                    m.message AS last_message,
                    m.created_at AS last_at,
                    u.full_name AS other_name,
                    u.id AS other_id
                 FROM messages m
                 JOIN Orders o ON m.room_id = o.id
                 JOIN order_deliveries od ON od.order_id = o.id
                 JOIN Users u ON u.id = od.courier_id
                 WHERE m.room_type = 'order'
                   AND o.user_id = $1
                 ORDER BY m.room_id, m.created_at DESC`,
                [userId]
            );

            rows = [...productChats.rows, ...orderChats.rows];
        }

        if (roleId === 3) {
            const result = await db.query(
                `SELECT DISTINCT ON (m.room_id)
                    'order' AS room_type,
                    m.room_id,
                    o.order_number AS title,
                    m.message AS last_message,
                    m.created_at AS last_at,
                    u.full_name AS other_name,
                    u.id AS other_id
                 FROM messages m
                 JOIN Orders o ON m.room_id = o.id
                 JOIN Users u ON u.id = o.user_id
                 WHERE m.room_type = 'order'
                   AND o.id IN (
                       SELECT order_id FROM order_deliveries WHERE courier_id = $1
                   )
                 ORDER BY m.room_id, m.created_at DESC`,
                [userId]
            );
            rows = result.rows;
        }

        return res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching conversations:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getProductMessages, getOrderMessages, getConversations };