const db = require('../config/db');

const getAddresses = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT id, full_address, state, city, zip_code, created_at
             FROM Shipping_addresses
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [req.user.id]
        );
        return res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching addresses:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const createAddress = async (req, res) => {
    const { full_address, state, city, zip_code } = req.body;

    if (!full_address || !state || !city || !zip_code) {
        return res.status(400).json({ error: 'full_address, state, city, and zip_code are required' });
    }

    try {
        const { rows } = await db.query(
            `INSERT INTO Shipping_addresses (user_id, full_address, state, city, zip_code)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, full_address, state, city, zip_code`,
            [req.user.id, full_address, state, city, zip_code]
        );
        return res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error creating address:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const { rowCount } = await db.query(
            `DELETE FROM Shipping_addresses WHERE id = $1 AND user_id = $2`,
            [req.params.id, req.user.id]
        );
        if (rowCount === 0) return res.status(404).json({ error: 'Address not found' });
        return res.status(200).json({ message: 'Address deleted' });
    } catch (err) {
        console.error('Error deleting address:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getAddresses, createAddress, deleteAddress };