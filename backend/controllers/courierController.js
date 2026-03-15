const db = require('../config/db');

const getCourierId = async (userId) => {
    return userId;
};

const getAssignedOrders = async (req, res) => {
    const userId = req.user.id;

    try {
        const { rows: addrRows } = await db.query(
            `SELECT zip_code FROM Shipping_addresses
             WHERE user_id = $1
             ORDER BY created_at DESC LIMIT 1`,
            [userId]
        );

        if (addrRows.length === 0) {
            return res.status(200).json({
                available: [],
                mine: [],
                message: 'Please save your address first to see deliveries in your area.'
            });
        }

        const courierId = userId;
        const courierZip = addrRows[0].zip_code;

        const { rows: available } = await db.query(
            `SELECT
                o.id             AS order_id,
                o.order_number,
                o.net_amount,
                o.status         AS order_status,
                o.payment_type,
                u.full_name      AS customer_name,
                u.email          AS user_email,
                sa.full_address,
                sa.city,
                sa.state,
                sa.zip_code,
                od.id            AS delivery_id,
                od.status        AS delivery_status
             FROM Orders o
             JOIN Users u ON o.user_id = u.id
             JOIN Shipping_addresses sa ON sa.user_id = o.user_id
             LEFT JOIN order_deliveries od ON od.order_id = o.id
             WHERE sa.zip_code = $1
               AND sa.id = (
                   SELECT id FROM Shipping_addresses
                   WHERE user_id = o.user_id
                   ORDER BY created_at DESC LIMIT 1
               )
               AND (od.id IS NULL OR od.courier_id IS NULL)
               AND o.status NOT IN ('delivered', 'cancelled', 'failed')
             ORDER BY o.id DESC`,
            [courierZip]
        );

        const { rows: mine } = await db.query(
            `SELECT
                od.id            AS delivery_id,
                od.order_id,
                od.status        AS delivery_status,
                o.order_number,
                o.net_amount,
                o.status         AS order_status,
                o.payment_type,
                u.full_name      AS customer_name,
                u.email          AS user_email,
                sa.full_address,
                sa.city,
                sa.state,
                sa.zip_code
             FROM order_deliveries od
             JOIN Orders o  ON od.order_id = o.id
             JOIN Users u   ON o.user_id = u.id
             JOIN Shipping_addresses sa ON sa.user_id = o.user_id
             WHERE od.courier_id = $1
               AND sa.id = (
                   SELECT id FROM Shipping_addresses
                   WHERE user_id = o.user_id
                   ORDER BY created_at DESC LIMIT 1
               )
             ORDER BY od.id DESC`,
            [courierId]
        );

        return res.status(200).json({ available, mine, courier_zip: courierZip });

    } catch (err) {
        if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
        console.error('Error fetching courier orders:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const acceptOrder = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const courierId = await getCourierId(userId);

        const { rows } = await db.query(
            `SELECT id, courier_id FROM order_deliveries WHERE order_id = $1`,
            [id]
        );

        if (rows.length > 0 && rows[0].courier_id) {
            return res.status(409).json({ error: 'This order has already been claimed by another courier' });
        }

        if (rows.length === 0) {
            await db.query(
                `INSERT INTO order_deliveries (order_id, courier_id, status, assigned_at)
                 VALUES ($1, $2, 'assigned', NOW())`,
                [id, courierId]
            );
        } else {
            await db.query(
                `UPDATE order_deliveries SET courier_id = $1, status = 'assigned', assigned_at = NOW()
                 WHERE order_id = $2`,
                [courierId, id]
            );
        }

        return res.status(200).json({ message: 'Order accepted' });

    } catch (err) {
        if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
        console.error('Error accepting order:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const pickOrder = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const courierId = await getCourierId(userId);

        const { rowCount } = await db.query(
            `UPDATE order_deliveries
             SET status = 'picked', picked_at = NOW()
             WHERE order_id = $2 AND courier_id = $1 AND status = 'assigned'`,
            [courierId, id]
        );

        if (rowCount === 0) return res.status(404).json({ error: 'Order not found or already picked' });

        await db.query(`UPDATE Orders SET status = 'shipping', updated_at = NOW() WHERE id = $1`, [id]);

        return res.status(200).json({ message: 'Order marked as picked up' });

    } catch (err) {
        if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
        console.error('Error picking order:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const deliverOrder = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const courierId = await getCourierId(userId);

        const { rowCount } = await db.query(
            `UPDATE order_deliveries
             SET status = 'delivered', delivered_at = NOW()
             WHERE order_id = $2 AND courier_id = $1 AND status = 'picked'`,
            [courierId, id]
        );

        if (rowCount === 0) return res.status(404).json({ error: 'Order not found or not in picked status' });

        await db.query(`UPDATE Orders SET status = 'delivered', updated_at = NOW() WHERE id = $1`, [id]);

        return res.status(200).json({ message: 'Order marked as delivered' });

    } catch (err) {
        if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
        console.error('Error delivering order:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const failOrder = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    try {
        const courierId = await getCourierId(req.user.id);

        const { rowCount } = await db.query(
            `UPDATE order_deliveries
             SET status = 'failed', failed_at = NOW(), fail_reason = $3
             WHERE order_id = $2 AND courier_id = $1 AND status IN ('assigned','picked')`,
            [courierId, id, reason || null]
        );

        if (rowCount === 0) return res.status(404).json({ error: 'Order not found or cannot be failed.' });

        await db.query(`UPDATE Orders SET status = 'failed', updated_at = NOW() WHERE id = $1`, [id]);

        return res.status(200).json({ message: 'Order marked as failed.' });

    } catch (err) {
        if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getAssignedOrders, acceptOrder, pickOrder, deliverOrder, failOrder };