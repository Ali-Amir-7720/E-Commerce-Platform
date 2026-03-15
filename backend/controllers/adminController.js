const db = require('../config/db');

const getUsers = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT u.id, u.full_name, u.email, u.status, u.phone_number, r.role_name
             FROM Users u JOIN user_roles r ON u.role_id = r.id
             ORDER BY u.id`
        );
        return res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getAllProducts = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT p.id, p.product_name, p.description, p.status,
                    p.image_url, p.created_at, c.category_name,
                    u.full_name AS vendor_name
             FROM Products p
             JOIN Categories c ON p.category_id = c.id
             LEFT JOIN Users u ON p.vendor_id = u.id
             ORDER BY p.created_at DESC`
        );
        return res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const blockUser = async (req, res) => {
    try {
        await db.query(`UPDATE Users SET status = 'blocked' WHERE id = $1`, [req.params.id]);
        return res.status(200).json({ message: 'User blocked' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const unblockUser = async (req, res) => {
    try {
        await db.query(`UPDATE Users SET status = 'active' WHERE id = $1`, [req.params.id]);
        return res.status(200).json({ message: 'User unblocked' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const changeUserRole = async (req, res) => {
    const { role_id } = req.body;
    try {
        await db.query(`UPDATE Users SET role_id = $1 WHERE id = $2`, [role_id, req.params.id]);
        return res.status(200).json({ message: 'Role updated' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const banProduct = async (req, res) => {
    try {
        const result = await db.query(
            `UPDATE Products SET status = 'banned' WHERE id = $1 RETURNING id`, [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        return res.status(200).json({ message: 'Product banned' });
    } catch (err) {
        console.error('banProduct error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const unbanProduct = async (req, res) => {
    try {
        const result = await db.query(
            `UPDATE Products SET status = 'active' WHERE id = $1 RETURNING id`, [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        return res.status(200).json({ message: 'Product unbanned' });
    } catch (err) {
        console.error('unbanProduct error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const assignCourier = async (req, res) => {
    const { order_id, courier_id } = req.body;
    try {
        await db.query(
            `INSERT INTO order_deliveries (order_id, courier_id, status)
             VALUES ($1, $2, 'assigned')
             ON CONFLICT (order_id) DO UPDATE SET courier_id = $2, status = 'assigned'`,
            [order_id, courier_id]
        );
        return res.status(200).json({ message: 'Courier assigned' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getUsers, getAllProducts, blockUser, unblockUser, changeUserRole, banProduct, unbanProduct, assignCourier };