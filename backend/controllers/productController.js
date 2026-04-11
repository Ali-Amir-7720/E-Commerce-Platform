const db = require('../config/db');

const createProduct = async (req, res) => {
    const { category_id, product_name, description } = req.body;
    if (!category_id || !product_name)
        return res.status(400).json({ error: 'category_id and product_name are required' });
    try {
        const catCheck = await db.query(`SELECT id FROM Categories WHERE id = $1 AND status = 'active'`, [category_id]);
        if (catCheck.rows.length === 0) return res.status(404).json({ error: 'Category not found or inactive' });
        const result = await db.query(
            `INSERT INTO Products (category_id, product_name, description) VALUES ($1, $2, $3) RETURNING *`,
            [category_id, product_name, description || null]
        );
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating product:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getProducts = async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 100);
    const offset = (page - 1) * limit;
    try {
        const { rows } = await db.query(
            `SELECT p.id, p.product_name, p.description, p.status,
                    p.image_url, p.created_at, c.category_name,
                    COUNT(pv.id) AS variant_count
             FROM Products p
             JOIN Categories c ON p.category_id = c.id
             LEFT JOIN Product_variants pv ON pv.product_id = p.id
             WHERE p.status = 'active'
             GROUP BY p.id, c.category_name
             ORDER BY p.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        const countResult = await db.query(`SELECT COUNT(*) FROM Products WHERE status = 'active'`);
        const total = parseInt(countResult.rows[0].count);
        return res.status(200).json({
            data: rows,
            pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const productResult = await db.query(
            `SELECT p.id, p.product_name, p.description, p.status,
                    p.image_url, p.created_at, c.category_name
             FROM Products p
             JOIN Categories c ON p.category_id = c.id
             WHERE p.id = $1 AND p.status = 'active'`,
            [id]
        );
        if (productResult.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        const product = productResult.rows[0];
        const variantsResult = await db.query(
            `SELECT id, variant_name, sku, price, stock_quantity, created_at
             FROM Product_variants WHERE product_id = $1 ORDER BY price ASC`,
            [id]
        );
        product.variants = variantsResult.rows;
        return res.status(200).json(product);
    } catch (error) {
        console.error('Error fetching product by ID:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { category_id, product_name, description, status } = req.body;
    if (status !== undefined && !['active', 'inactive'].includes(status))
        return res.status(400).json({ error: "status must be 'active' or 'inactive'" });
    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;
    if (category_id !== undefined) { updateFields.push(`category_id = $${paramIndex++}`); queryParams.push(category_id); }
    if (product_name !== undefined) { updateFields.push(`product_name = $${paramIndex++}`); queryParams.push(product_name); }
    if (description !== undefined) { updateFields.push(`description = $${paramIndex++}`); queryParams.push(description); }
    if (status !== undefined) { updateFields.push(`status = $${paramIndex++}`); queryParams.push(status); }
    if (updateFields.length === 0) return res.status(400).json({ error: 'No fields provided to update' });
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    queryParams.push(id);
    try {
        const result = await db.query(
            `UPDATE Products SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`, queryParams
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error updating product:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            `UPDATE Products SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id`, [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        return res.status(200).json({ message: 'Product deactivated successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const createProductVariant = async (req, res) => {
    const { id: product_id } = req.params;
    const { variant_name, sku, price, stock_quantity } = req.body;
    if (price === undefined) return res.status(400).json({ error: 'price is required' });
    if (parseFloat(price) < 0) return res.status(400).json({ error: 'price must be non-negative' });
    try {
        const productCheck = await db.query(`SELECT id FROM Products WHERE id = $1 AND status = 'active'`, [product_id]);
        if (productCheck.rows.length === 0) return res.status(404).json({ error: 'Product not found or inactive' });
        const result = await db.query(
            `INSERT INTO Product_variants (product_id, variant_name, sku, price, stock_quantity)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [product_id, variant_name || null, sku || null, price, stock_quantity !== undefined ? stock_quantity : 0]
        );
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating product variant:', error);
        if (error.code === '23505') return res.status(409).json({ error: 'SKU already in use' });
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const updateProductVariant = async (req, res) => {
    const { id } = req.params;
    const { variant_name, sku, price, stock_quantity } = req.body;
    if (price !== undefined && parseFloat(price) < 0) return res.status(400).json({ error: 'price must be non-negative' });
    if (stock_quantity !== undefined && parseInt(stock_quantity) < 0) return res.status(400).json({ error: 'stock_quantity must be non-negative' });
    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;
    if (variant_name !== undefined) { updateFields.push(`variant_name = $${paramIndex++}`); queryParams.push(variant_name); }
    if (sku !== undefined) { updateFields.push(`sku = $${paramIndex++}`); queryParams.push(sku); }
    if (price !== undefined) { updateFields.push(`price = $${paramIndex++}`); queryParams.push(price); }
    if (stock_quantity !== undefined) { updateFields.push(`stock_quantity = $${paramIndex++}`); queryParams.push(stock_quantity); }
    if (updateFields.length === 0) return res.status(400).json({ error: 'No fields provided to update' });
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    queryParams.push(id);
    try {
        const result = await db.query(
            `UPDATE Product_variants SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`, queryParams
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Product variant not found' });
        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error updating product variant:', error);
        if (error.code === '23505') return res.status(409).json({ error: 'SKU already in use' });
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createProduct, getProducts, getProductById,
    updateProduct, deleteProduct,
    createProductVariant, updateProductVariant,
};