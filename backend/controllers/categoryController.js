const db = require('../config/db');

const createCategory = async (req, res) => {
    const { category_name, parent_cat_id } = req.body;

    if (!category_name) {
        return res.status(400).json({ error: 'category_name is required' });
    }

    try {
        if (parent_cat_id) {
            const parent = await db.query(
                `SELECT id FROM Categories WHERE id = $1 AND status = 'active'`,
                [parent_cat_id]
            );
            if (parent.rows.length === 0) {
                return res.status(404).json({ error: 'Parent category not found or inactive' });
            }
        }

        const result = await db.query(
            `INSERT INTO Categories (category_name, parent_cat_id)
             VALUES ($1, $2) RETURNING *`,
            [category_name, parent_cat_id || null]
        );
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating category:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getCategories = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT c.id, c.category_name, c.status, c.created_at,
                    p.category_name AS parent_name
             FROM Categories c
             LEFT JOIN Categories p ON c.parent_cat_id = p.id
             WHERE c.status = 'active'
             ORDER BY c.category_name`
        );
        return res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { category_name, parent_cat_id, status } = req.body;

    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;

    if (category_name !== undefined) {
        updateFields.push(`category_name = $${paramIndex++}`);
        queryParams.push(category_name);
    }
    if (parent_cat_id !== undefined) {
        updateFields.push(`parent_cat_id = $${paramIndex++}`);
        queryParams.push(parent_cat_id);
    }
    if (status !== undefined) {
        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({ error: "status must be 'active' or 'inactive'" });
        }
        updateFields.push(`status = $${paramIndex++}`);
        queryParams.push(status);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No fields provided to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    queryParams.push(id);

    try {
        const result = await db.query(
            `UPDATE Categories SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            queryParams
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error updating category:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteCategory = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query(
            `UPDATE Categories
             SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 RETURNING id`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        return res.status(200).json({ message: 'Category deactivated successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { createCategory, getCategories, updateCategory, deleteCategory };