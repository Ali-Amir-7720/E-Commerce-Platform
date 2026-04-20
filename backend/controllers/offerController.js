const db = require('../config/db');

const createOffer = async (req, res) => {
    const { coupon_code, discount_type, discount_value, start_date, end_date } = req.body;

    if (!coupon_code || !discount_type || discount_value === undefined || !start_date || !end_date) {
        return res.status(400).json({ error: 'coupon_code, discount_type, discount_value, start_date, and end_date are required' });
    }
    if (!['fixed', 'rate'].includes(discount_type)) {
        return res.status(400).json({ error: "discount_type must be 'fixed' or 'rate'" });
    }
    if (parseFloat(discount_value) <= 0) {
        return res.status(400).json({ error: 'discount_value must be greater than 0' });
    }
    if (discount_type === 'rate' && parseFloat(discount_value) > 100) {
        return res.status(400).json({ error: 'Rate discount cannot exceed 100%' });
    }
    if (new Date(start_date) > new Date(end_date)) {
        return res.status(400).json({ error: 'start_date must be before end_date' });
    }

    try {
        const result = await db.query(
            `INSERT INTO Offers (coupon_code, discount_type, discount_value, start_date, end_date)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [coupon_code.toUpperCase(), discount_type, discount_value, start_date, end_date]
        );
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating offer:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Coupon code already exists' });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getOffers = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT * FROM Offers
             WHERE status = 'active'
               AND start_date <= CURRENT_DATE
               AND end_date   >= CURRENT_DATE
             ORDER BY created_at DESC`
        );
        return res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching offers:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const validateCoupon = async (req, res) => {
    const { coupon_code } = req.body;
    const userId = req.user?.id; // assuming auth middleware

    if (!coupon_code) {
        return res.status(400).json({ error: 'coupon_code is required' });
    }

    try {
        // Step 1: Get coupon
        const { rows } = await db.query(
            `SELECT id, coupon_code, discount_type, discount_value
             FROM Offers
             WHERE coupon_code = $1
               AND status      = 'active'
               AND start_date <= CURRENT_DATE
               AND end_date   >= CURRENT_DATE`,
            [coupon_code.toUpperCase()]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Coupon is invalid or has expired' });
        }

        const offer = rows[0];

        // Step 2: Check if already used
        const usageCheck = await db.query(
            `SELECT 1 FROM CouponUsage
             WHERE user_id = $1 AND offer_id = $2`,
            [userId, offer.id]
        );

        if (usageCheck.rows.length > 0) {
            return res.status(400).json({ error: 'You have already used this coupon' });
        }

        return res.status(200).json({ valid: true, offer });

    } catch (error) {
        console.error('Error validating coupon:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
const deleteOffer = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query(
            `UPDATE Offers
             SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 RETURNING id`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        return res.status(200).json({ message: 'Offer deactivated successfully' });
    } catch (error) {
        console.error('Error deleting offer:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { createOffer, getOffers, validateCoupon, deleteOffer };