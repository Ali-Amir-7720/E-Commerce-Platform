const db = require('../config/db');

const addToCart = async (req, res) => {
    const { product_variant_id, quantity } = req.body;
    const user_id = req.user.id;
    if (!product_variant_id) return res.status(400).json({ error: 'product_variant_id is required' });
    const qty = parseInt(quantity) || 1;
    if (qty < 1) return res.status(400).json({ error: 'Quantity must be at least 1' });
    try {
        const cartResult = await db.query(
            `INSERT INTO Carts (user_id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id`, [user_id]
        );
        let cart_id;
        if (cartResult.rows.length > 0) {
            cart_id = cartResult.rows[0].id;
        } else {
            const existing = await db.query('SELECT id FROM Carts WHERE user_id = $1', [user_id]);
            cart_id = existing.rows[0].id;
        }
        const variantResult = await db.query('SELECT stock_quantity FROM Product_variants WHERE id = $1', [product_variant_id]);
        if (variantResult.rows.length === 0) return res.status(404).json({ error: 'Product variant not found' });
        const stock = variantResult.rows[0].stock_quantity;
        const existingItem = await db.query(
            `SELECT id, quantity FROM Cart_items WHERE cart_id = $1 AND product_variant_id = $2`,
            [cart_id, product_variant_id]
        );
        const alreadyInCart = existingItem.rows.length > 0 ? existingItem.rows[0].quantity : 0;
        const totalRequested = alreadyInCart + qty;
        if (totalRequested > stock) return res.status(400).json({ error: `Not enough stock. Available: ${stock}` });
        let result;
        if (existingItem.rows.length > 0) {
            result = await db.query(
                `UPDATE Cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
                [totalRequested, existingItem.rows[0].id]
            );
        } else {
            result = await db.query(
                `INSERT INTO Cart_items (cart_id, product_variant_id, quantity) VALUES ($1, $2, $3) RETURNING *`,
                [cart_id, product_variant_id, qty]
            );
        }
        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding to cart:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getCart = async (req, res) => {
    const user_id = req.user.id;
    try {
        const cartResult = await db.query('SELECT id FROM Carts WHERE user_id = $1', [user_id]);
        if (cartResult.rows.length === 0) return res.status(200).json({ items: [], total: 0 });
        const cart_id = cartResult.rows[0].id;
        const { rows } = await db.query(
            `SELECT ci.id              AS cart_item_id,
                    ci.quantity,
                    pv.id              AS product_variant_id,
                    pv.variant_name,
                    pv.price,
                    pv.stock_quantity,
                    p.product_name,
                    p.image_url,
                    (ci.quantity * pv.price) AS line_total
             FROM Cart_items ci
             JOIN Product_variants pv ON ci.product_variant_id = pv.id
             JOIN Products p          ON pv.product_id = p.id
             WHERE ci.cart_id = $1`,
            [cart_id]
        );
        const total = rows.reduce((sum, r) => sum + parseFloat(r.line_total), 0);
        return res.status(200).json({ items: rows, total: total.toFixed(2) });
    } catch (error) {
        console.error('Error fetching cart:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const removeCartItem = async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;
    try {
        const cartResult = await db.query('SELECT id FROM Carts WHERE user_id = $1', [user_id]);
        if (cartResult.rows.length === 0) return res.status(404).json({ error: 'Cart not found' });
        const cart_id = cartResult.rows[0].id;
        const result = await db.query(
            `DELETE FROM Cart_items WHERE id = $1 AND cart_id = $2 RETURNING id`, [id, cart_id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Cart item not found' });
        return res.status(200).json({ message: 'Item removed from cart' });
    } catch (error) {
        console.error('Error removing cart item:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const updateCartItem = async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    const user_id = req.user.id;
    const qty = parseInt(quantity);
    if (!qty || qty < 1) return res.status(400).json({ error: 'Quantity must be at least 1' });
    try {
        const cartResult = await db.query('SELECT id FROM Carts WHERE user_id = $1', [user_id]);
        if (cartResult.rows.length === 0) return res.status(404).json({ error: 'Cart not found' });
        const cart_id = cartResult.rows[0].id;
        const stockResult = await db.query(
            `SELECT pv.stock_quantity FROM Cart_items ci
             JOIN Product_variants pv ON ci.product_variant_id = pv.id
             WHERE ci.id = $1 AND ci.cart_id = $2`, [id, cart_id]
        );
        if (stockResult.rows.length === 0) return res.status(404).json({ error: 'Cart item not found' });
        if (qty > stockResult.rows[0].stock_quantity)
            return res.status(400).json({ error: `Only ${stockResult.rows[0].stock_quantity} in stock` });
        const result = await db.query(
            `UPDATE Cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND cart_id = $3 RETURNING *`,
            [qty, id, cart_id]
        );
        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error updating cart item:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { addToCart, getCart, removeCartItem, updateCartItem };