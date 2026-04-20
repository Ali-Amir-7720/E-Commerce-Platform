const db = require('../config/db');
const { checkFraud } = require('./fraudDetection');

const httpError = (statusCode, message) => {
    const err = new Error(message);
    err.statusCode = statusCode;
    return err;
};

const placeOrder = async ({ userId, paymentType, shippingAmount = 0, couponCode }) => {
    const shippingAmt = parseFloat(shippingAmount) || 0;

    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        // 1. Get cart
        const cartResult = await client.query(
            `SELECT id FROM Carts WHERE user_id = $1`,
            [userId]
        );

        if (cartResult.rows.length === 0) {
            throw httpError(400, 'Cart not found');
        }

        const cartId = cartResult.rows[0].id;

        // 2. Get cart items
        const cartItemsResult = await client.query(
            `SELECT ci.product_variant_id,
                    ci.quantity,
                    pv.price,
                    pv.variant_name,
                    pv.stock_quantity
             FROM Cart_items ci
             JOIN Product_variants pv ON ci.product_variant_id = pv.id
             WHERE ci.cart_id = $1`,
            [cartId]
        );

        if (cartItemsResult.rows.length === 0) {
            throw httpError(400, 'Cart is empty');
        }

        let totalAmount = 0;
        const orderItems = [];

        for (const item of cartItemsResult.rows) {
            if (item.stock_quantity < item.quantity) {
                throw httpError(409, {
                    message: `Insufficient stock for '${item.variant_name}'`,
                    available: item.stock_quantity,
                    requested: item.quantity,
                });
            }

            const lineTotal = Number(item.price) * item.quantity;
            totalAmount += lineTotal;

            orderItems.push({ ...item, lineTotal });
        }

        // 3. Coupon logic (UPDATED WITH USAGE CHECK)
        let discountAmount = 0;
        let offerId = null;

        const code = couponCode?.trim();

        if (code) {
            const offerResult = await client.query(
                `SELECT id, discount_type, discount_value
                 FROM Offers
                 WHERE LOWER(coupon_code) = LOWER($1)
                   AND status = 'active'
                   AND CURRENT_TIMESTAMP BETWEEN start_date AND end_date`,
                [code]
            );

            if (offerResult.rows.length === 0) {
                throw httpError(400, 'Coupon code is invalid or expired');
            }

            const offer = offerResult.rows[0];
            offerId = offer.id;

            // CHECK IF ALREADY USED
            const usageCheck = await client.query(
                `SELECT 1 FROM CouponUsage
                 WHERE user_id = $1 AND offer_id = $2`,
                [userId, offerId]
            );

            if (usageCheck.rows.length > 0) {
                throw httpError(400, 'You have already used this coupon');
            }

            const discountValue = Number(offer.discount_value);

            if (offer.discount_type === 'fixed') {
                discountAmount = discountValue;
            } else if (offer.discount_type === 'rate') {
                discountAmount = (totalAmount * discountValue) / 100;
            }

            if (discountAmount > totalAmount) {
                discountAmount = totalAmount;
            }
        }

        // 4. Final calculation
        const netAmount = totalAmount - discountAmount + shippingAmt;

        if (netAmount < 0) {
            throw httpError(400, 'Invalid net amount calculation');
        }

        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // 5. Insert order
        const orderResult = await client.query(
            `INSERT INTO Orders
               (user_id, order_number, total_amount, discount_amount,
                shipping_amount, net_amount, payment_type, offer_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [
                userId,
                orderNumber,
                totalAmount.toFixed(2),
                discountAmount.toFixed(2),
                shippingAmt.toFixed(2),
                netAmount.toFixed(2),
                paymentType,
                offerId
            ]
        );

        const orderId = orderResult.rows[0].id;

        // 6. Insert order items
        for (const item of orderItems) {
            await client.query(
                `INSERT INTO Order_items
                   (order_id, product_variant_id, variant_name, price, quantity, total_amount)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    orderId,
                    item.product_variant_id,
                    item.variant_name,
                    item.price,
                    item.quantity,
                    item.lineTotal.toFixed(2),
                ]
            );
        }

        // 7. Record coupon usage (NEW)
        if (offerId) {
            await client.query(
                `INSERT INTO CouponUsage (user_id, offer_id, order_id)
                 VALUES ($1, $2, $3)`,
                [userId, offerId, orderId]
            );
        }

        // 8. Clear cart
        await client.query(
            `DELETE FROM Cart_items WHERE cart_id = $1`,
            [cartId]
        );

        // 9. Fraud check
        const wasFlagged = await checkFraud(client, userId, orderId, netAmount);

        await client.query('COMMIT');

        return {
            orderId,
            orderNumber,
            totalAmount: totalAmount.toFixed(2),
            discountAmount: discountAmount.toFixed(2),
            shippingAmount: shippingAmt.toFixed(2),
            netAmount: netAmount.toFixed(2),
            flagged: wasFlagged,
        };

    } catch (err) {
        await client.query('ROLLBACK');
        console.log('[ORDER ERROR]', err.message);
        throw err;
    } finally {
        client.release();
    }
};

module.exports = { placeOrder };