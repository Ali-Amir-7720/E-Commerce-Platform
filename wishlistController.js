const db = require('../config/db');

const getWishlist = async (req, res) => {
    const user_id = req.user.id;
    try {
        const { rows } = await db.query(
            `SELECT w.id, w.product_variant_id,
                    p.id           AS product_id,
                    p.product_name,
                    p.image_url,
                    pv.variant_name,
                    pv.price
             FROM Wishlist w
             JOIN Product_variants pv ON w.product_variant_id = pv.id
             JOIN Products p          ON pv.product_id = p.id
             WHERE w.user_id = $1
             ORDER BY w.created_at DESC`,
            [user_id]
        );
        return res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const addToWishlist = async (req, res) => {
    const { product_variant_id } = req.body;
    const user_id = req.user.id;
    if (!product_variant_id) return res.status(400).json({ error: 'product_variant_id is required' });
    try {
        const existing = await db.query(
            'SELECT id FROM Wishlist WHERE user_id = $1 AND product_variant_id = $2',
            [user_id, product_variant_id]
        );
        if (existing.rows.length > 0) return res.status(409).json({ error: 'Already in wishlist' });
        const result = await db.query(
            'INSERT INTO Wishlist (user_id, product_variant_id) VALUES ($1, $2) RETURNING *',
            [user_id, product_variant_id]
        );
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const removeFromWishlist = async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;
    try {
        const result = await db.query(
            'DELETE FROM Wishlist WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, user_id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Wishlist item not found' });
        return res.status(200).json({ message: 'Removed from wishlist' });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };