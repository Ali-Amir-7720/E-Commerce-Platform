const db = require('../config/db');

const getFraudFlags = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT
                ff.id            AS flag_id,
                ff.rule_triggered,
                ff.detail,
                ff.status        AS flag_status,
                ff.created_at,
                ff.reviewed_at,
                o.id             AS order_id,
                o.order_number,
                o.net_amount,
                o.status         AS order_status,
                o.payment_type,
                u.id             AS user_id,
                u.full_name,
                u.email,
                u.status         AS user_status,
                rv.full_name     AS reviewed_by_name
             FROM fraud_flags ff
             JOIN Orders o ON ff.order_id = o.id
             JOIN Users u ON ff.user_id = u.id
             LEFT JOIN Users rv ON ff.reviewed_by = rv.id
             ORDER BY ff.created_at DESC`
        );
        return res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching fraud flags:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const banFraudUser = async (req, res) => {
    const { userId } = req.params;
    const adminId = req.user.id;
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const { rows: userRows } = await client.query(
            `SELECT id, full_name, status FROM Users WHERE id = $1`, [userId]
        );
        if (userRows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'User not found' });
        }
        if (userRows[0].status === 'blocked') {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'User is already blocked' });
        }

        await client.query(
            `UPDATE Users SET status = 'blocked', updated_at = NOW() WHERE id = $1`,
            [userId]
        );
        const { rows: activeOrders } = await client.query(
            `SELECT id FROM Orders
             WHERE user_id = $1
               AND status IN ('placed', 'flagged', 'processing')`,
            [userId]
        );

        for (const order of activeOrders) {
            await client.query(
                `UPDATE Product_variants pv
                 SET stock_quantity = stock_quantity + oi.quantity
                 FROM Order_items oi
                 WHERE oi.order_id = $1 AND oi.product_variant_id = pv.id`,
                [order.id]
            );

            await client.query(
                `UPDATE Orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
                [order.id]
            );
        }

        await client.query(
            `UPDATE fraud_flags
             SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW()
             WHERE user_id = $2 AND status = 'pending'`,
            [adminId, userId]
        );

        await client.query('COMMIT');

        return res.status(200).json({
            message: `User banned. ${activeOrders.length} order(s) cancelled and stock restored.`,
            orders_cancelled: activeOrders.length,
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error banning fraud user:', err);
        return res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
};

module.exports = { getFraudFlags, banFraudUser };