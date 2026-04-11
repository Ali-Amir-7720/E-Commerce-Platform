const db = require('../config/db');

const getVendorProducts = async (req, res) => {
    const vendorId = req.user.id;
    try {
        const { rows } = await db.query(
            `SELECT p.id, p.product_name, p.description, p.status, p.created_at,
                    p.image_url,
                    c.category_name, c.id AS category_id,
                    COUNT(pv.id)::int AS variant_count
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN product_variants pv ON pv.product_id = p.id
             WHERE p.vendor_id = $1
             GROUP BY p.id, c.category_name, c.id
             ORDER BY p.created_at DESC`,
            [vendorId]
        );
        return res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching vendor products:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const createVendorProduct = async (req, res) => {
    const vendorId = req.user.id;
    const { product_name, category_id, description, status = 'active', image_url } = req.body;
    if (!product_name || !category_id)
        return res.status(400).json({ error: 'product_name and category_id are required' });
    try {
        const { rows } = await db.query(
            `INSERT INTO products (product_name, category_id, description, status, vendor_id, image_url)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, product_name, description, status, image_url`,
            [product_name, category_id, description || null, status, vendorId, image_url || null]
        );
        return res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error creating product:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const updateVendorProduct = async (req, res) => {
    const vendorId = req.user.id;
    const { id } = req.params;
    const { product_name, category_id, description, status, image_url } = req.body;
    try {
        const { rows: own } = await db.query(
            `SELECT id FROM products WHERE id = $1 AND vendor_id = $2`, [id, vendorId]
        );
        if (own.length === 0) return res.status(403).json({ error: 'You do not own this product' });

        const { rows } = await db.query(
            `UPDATE products
             SET product_name = COALESCE($1, product_name),
                 category_id  = COALESCE($2, category_id),
                 description  = COALESCE($3, description),
                 status       = COALESCE($4, status),
                 image_url    = $5,
                 updated_at   = NOW()
             WHERE id = $6
             RETURNING id, product_name, description, status, image_url`,
            [product_name, category_id, description, status, image_url || null, id]
        );
        return res.status(200).json(rows[0]);
    } catch (err) {
        console.error('Error updating product:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteVendorProduct = async (req, res) => {
    const vendorId = req.user.id;
    const { id } = req.params;
    try {
        const check = await db.query('SELECT id FROM products WHERE id = $1 AND vendor_id = $2', [id, vendorId]);
        if (check.rows.length === 0) return res.status(404).json({ error: 'Product not found or not yours.' });
        await db.query('DELETE FROM product_variants WHERE product_id = $1', [id]);
        await db.query('DELETE FROM products WHERE id = $1', [id]);
        return res.status(200).json({ message: 'Product deleted.' });
    } catch (err) {
        console.error('Error deleting product:', err);
        return res.status(500).json({ error: 'Failed to delete product.' });
    }
};

const getVariants = async (req, res) => {
    const vendorId = req.user.id;
    const { id } = req.params;
    try {
        const { rows: own } = await db.query(`SELECT id FROM products WHERE id = $1 AND vendor_id = $2`, [id, vendorId]);
        if (own.length === 0) return res.status(403).json({ error: 'Not your product' });
        const { rows } = await db.query(
            `SELECT id, variant_name, sku, price, stock_quantity FROM product_variants WHERE product_id = $1 ORDER BY id`, [id]
        );
        return res.status(200).json(rows);
    } catch (err) { return res.status(500).json({ error: 'Internal server error' }); }
};
const addVariant = async (req, res) => {
    const vendorId = req.user.id;
    const { id } = req.params;
    const { variant_name, sku, price, stock_quantity } = req.body;
    if (!price) return res.status(400).json({ error: 'price is required' });
    try {
        const { rows: own } = await db.query(`SELECT id FROM products WHERE id = $1 AND vendor_id = $2`, [id, vendorId]);
        if (own.length === 0) return res.status(403).json({ error: 'Not your product' });
        const { rows } = await db.query(
            `INSERT INTO product_variants (product_id, variant_name, sku, price, stock_quantity)
             VALUES ($1, $2, $3, $4, $5) RETURNING id, variant_name, sku, price, stock_quantity`,
            [id, variant_name || null, sku || null, price, stock_quantity || 0]
        );
        return res.status(201).json(rows[0]);
    } catch (err) { return res.status(500).json({ error: 'Internal server error' }); }
};
const updateVariant = async (req, res) => {
    const vendorId = req.user.id;
    const { id, vid } = req.params;
    const { variant_name, sku, price, stock_quantity } = req.body;
    try {
        const { rows: own } = await db.query(`SELECT id FROM products WHERE id = $1 AND vendor_id = $2`, [id, vendorId]);
        if (own.length === 0) return res.status(403).json({ error: 'Not your product' });
        const { rows } = await db.query(
            `UPDATE product_variants
             SET variant_name=$1, sku=$2, price=COALESCE($3,price), stock_quantity=COALESCE($4,stock_quantity), updated_at=NOW()
             WHERE id=$5 AND product_id=$6 RETURNING id, variant_name, sku, price, stock_quantity`,
            [variant_name, sku, price, stock_quantity, vid, id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Variant not found' });
        return res.status(200).json(rows[0]);
    } catch (err) { return res.status(500).json({ error: 'Internal server error' }); }
};
const deleteVariant = async (req, res) => {
    const vendorId = req.user.id;
    const { id, vid } = req.params;
    try {
        const { rows: own } = await db.query(`SELECT id FROM products WHERE id = $1 AND vendor_id = $2`, [id, vendorId]);
        if (own.length === 0) return res.status(403).json({ error: 'Not your product' });
        const { rowCount } = await db.query(`DELETE FROM product_variants WHERE id = $1 AND product_id = $2`, [vid, id]);
        if (rowCount === 0) return res.status(404).json({ error: 'Variant not found' });
        return res.status(200).json({ message: 'Variant deleted' });
    } catch (err) { return res.status(500).json({ error: 'Internal server error' }); }
};

module.exports = {
    getVendorProducts, createVendorProduct, updateVendorProduct, deleteVendorProduct,
    getVariants, addVariant, updateVariant, deleteVariant
};