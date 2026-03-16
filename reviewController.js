const db = require('../config/db');

const createReview = async (req, res) => {
    const { order_id, product_id, rating, comment, image_url } = req.body;
    const user_id = req.user.id;

    if (!rating || rating < 1 || rating > 5)
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    if (!order_id || !product_id)
        return res.status(400).json({ error: 'order_id and product_id are required' });

    try {
        const { rows: orderRows } = await db.query(
            `SELECT id FROM Orders WHERE id = $1 AND user_id = $2 AND status = 'delivered'`,
            [order_id, user_id]
        );
        if (orderRows.length === 0)
            return res.status(403).json({ error: 'Order not found or not yet delivered' });

        const { rows } = await db.query(
            `INSERT INTO reviews (user_id, product_id, order_id, rating, comment, image_url)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [user_id, product_id, order_id, rating, comment || null, image_url || null]
        );
        return res.status(201).json(rows[0]);
    } catch (err) {
        if (err.code === '23505')
            return res.status(409).json({ error: 'You have already reviewed this product for this order' });
        console.error('Error creating review:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getMyReviews = async (req, res) => {
    const user_id = req.user.id;
    try {
        const { rows } = await db.query(
            `SELECT id, order_id, product_id, rating FROM reviews WHERE user_id = $1`,
            [user_id]
        );
        return res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching my reviews:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getProductReviews = async (req, res) => {
    const { productId } = req.params;
    try {
        const { rows } = await db.query(
            `SELECT r.id, r.rating, r.comment, r.image_url, r.created_at,
                    u.full_name AS reviewer_name
             FROM reviews r
             JOIN Users u ON r.user_id = u.id
             WHERE r.product_id = $1
             ORDER BY r.created_at DESC`,
            [productId]
        );
        return res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching product reviews:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getAllReviews = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT r.id, r.rating, r.comment, r.image_url, r.created_at,
                    u.full_name AS reviewer_name, u.email AS reviewer_email,
                    p.product_name, o.order_number, r.order_id
             FROM reviews r
             JOIN Users u ON r.user_id = u.id
             JOIN Products p ON r.product_id = p.id
             JOIN Orders o ON r.order_id = o.id
             ORDER BY r.created_at DESC`
        );
        return res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching all reviews:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteReview = async (req, res) => {
    const { id } = req.params;
    try {
        const { rowCount } = await db.query(`DELETE FROM reviews WHERE id = $1`, [id]);
        if (rowCount === 0) return res.status(404).json({ error: 'Review not found' });
        return res.status(200).json({ message: 'Review deleted' });
    } catch (err) {
        console.error('Error deleting review:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { createReview, getMyReviews, getProductReviews, getAllReviews, deleteReview };