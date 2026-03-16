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


        const cartResult = await client.query(
            `SELECT id FROM Carts WHERE user_id = $1`,
            [userId]
        );
        if (cartResult.rows.length === 0) {
            throw httpError(400, 'Cart not found');
        }
        const cartId = cartResult.rows[0].id;
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
                    message: `Insufficient stock for '${item.variant_name || 'variant #' + item.product_variant_id}'`,
                    available: item.stock_quantity,
                    requested: item.quantity,
                });
            }
            const lineTotal = parseFloat(item.price) * item.quantity;
            totalAmount += lineTotal;
            orderItems.push({ ...item, lineTotal });
        }

        let discountAmount = 0;
        if (couponCode) {
            const offerResult = await client.query(
                `SELECT discount_type, discount_value
                 FROM Offers
                 WHERE coupon_code = $1
                   AND status      = 'active'
                   AND start_date <= CURRENT_DATE
                   AND end_date   >= CURRENT_DATE`,
                [couponCode.toUpperCase().trim()]
            );
            if (offerResult.rows.length === 0) {
                throw httpError(400, 'Coupon code is invalid or has expired');
            }

            const { discount_type, discount_value } = offerResult.rows[0];
            discountAmount = discount_type === 'fixed'
                ? parseFloat(discount_value)
                : (totalAmount * parseFloat(discount_value)) / 100;

            if (discountAmount > totalAmount) {
                discountAmount = totalAmount;
            }
        }

        const netAmount = totalAmount - discountAmount + shippingAmt;
        if (netAmount < 0) {
            throw httpError(400, 'Calculated net_amount is negative — check discount and shipping values');
        }
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const orderResult = await client.query(
            `INSERT INTO Orders
               (user_id, order_number, total_amount, discount_amount,
                shipping_amount, net_amount, payment_type)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [
                userId,
                orderNumber,
                totalAmount.toFixed(2),
                discountAmount.toFixed(2),
                shippingAmt.toFixed(2),
                netAmount.toFixed(2),
                paymentType,
            ]
        );
        const orderId = orderResult.rows[0].id;


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

        await client.query(
            `DELETE FROM Cart_items WHERE cart_id = $1`,
            [cartId]
        );

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
        console.log('[TRANSACTION ROLLBACK]', err.message);
        await client.query('ROLLBACK');

        if (err.message?.includes('Insufficient stock available')) {
            throw httpError(409, 'Insufficient stock — order rolled back');
        }
        throw err;
    } finally {
        client.release();
    }
};


const assignCourier = async (orderId, courierId) => {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        const orderResult = await client.query(
            `SELECT id, status FROM Orders WHERE id = $1 FOR UPDATE`,
            [orderId]
        );
        if (orderResult.rows.length === 0) {
            throw httpError(404, 'Order not found');
        }
        const orderStatus = orderResult.rows[0].status;
        if (orderStatus !== 'placed') {
            throw httpError(400,
                `Order is already in '${orderStatus}' status and cannot be assigned a courier`
            );
        }

        const existingDelivery = await client.query(
            `SELECT id FROM Order_deliveries WHERE order_id = $1`,
            [orderId]
        );
        if (existingDelivery.rows.length > 0) {
            throw httpError(409, 'A courier is already assigned to this order');
        }

        const courierResult = await client.query(
            `SELECT id, status FROM Couriers WHERE id = $1 FOR UPDATE`,
            [courierId]
        );
        if (courierResult.rows.length === 0) {
            throw httpError(404, 'Courier not found');
        }
        if (courierResult.rows[0].status !== 'available') {
            throw httpError(400,
                `Courier is '${courierResult.rows[0].status}' and cannot be assigned`
            );
        }

        const deliveryResult = await client.query(
            `INSERT INTO Order_deliveries (order_id, courier_id)
             VALUES ($1, $2)
             RETURNING id, order_id, courier_id, assigned_at`,
            [orderId, courierId]
        );
        const delivery = deliveryResult.rows[0];

        await client.query(
            `UPDATE Couriers
             SET status = 'busy', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [courierId]
        );

        await client.query(
            `UPDATE Orders
             SET status = 'processing', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [orderId]
        );

        await client.query('COMMIT');

        return {
            deliveryId: delivery.id,
            orderId: delivery.order_id,
            courierId: delivery.courier_id,
            assignedAt: delivery.assigned_at,
        };

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

module.exports = { placeOrder, assignCourier };