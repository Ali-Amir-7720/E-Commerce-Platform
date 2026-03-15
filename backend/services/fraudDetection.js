
const ORDER_FLOOD_LIMIT = 3;
const ORDER_FLOOD_WINDOW = '10 minutes';
const HIGH_VALUE_THRESHOLD = 5000;
const DAILY_SPEND_LIMIT = 10000;
const FAILED_DELIVERY_LIMIT = 2;

const checkFraud = async (client, userId, orderId, netAmount) => {
    const flags = [];

    const { rows: recentOrders } = await client.query(
        `SELECT COUNT(*) AS cnt
         FROM Orders
         WHERE user_id = $1
           AND id != $2
           AND created_at > NOW() - INTERVAL '${ORDER_FLOOD_WINDOW}'`,
        [userId, orderId]
    );
    const recentCount = parseInt(recentOrders[0].cnt);
    if (recentCount >= ORDER_FLOOD_LIMIT) {
        flags.push({
            rule: 'ORDER_FLOOD',
            detail: `${recentCount} orders placed in the last ${ORDER_FLOOD_WINDOW} (limit: ${ORDER_FLOOD_LIMIT})`
        });
    }

    if (parseFloat(netAmount) > HIGH_VALUE_THRESHOLD) {
        flags.push({
            rule: 'HIGH_VALUE_ORDER',
            detail: `Order value $${parseFloat(netAmount).toFixed(2)} exceeds threshold of $${HIGH_VALUE_THRESHOLD}`
        });
    }

    const { rows: dailySpend } = await client.query(
        `SELECT COALESCE(SUM(net_amount), 0) AS total
         FROM Orders
         WHERE user_id = $1
           AND id != $2
           AND created_at >= CURRENT_DATE
           AND status NOT IN ('cancelled', 'failed')`,
        [userId, orderId]
    );
    const todayTotal = parseFloat(dailySpend[0].total) + parseFloat(netAmount);
    if (todayTotal > DAILY_SPEND_LIMIT) {
        flags.push({
            rule: 'DAILY_SPEND_LIMIT',
            detail: `Total spend today $${todayTotal.toFixed(2)} exceeds daily limit of $${DAILY_SPEND_LIMIT}`
        });
    }
    const { rows: failedOrders } = await client.query(
        `SELECT COUNT(*) AS cnt
         FROM Orders o
         WHERE o.user_id = $1
           AND o.id != $2
           AND o.status = 'failed'`,
        [userId, orderId]
    );
    const failedCount = parseInt(failedOrders[0].cnt);
    if (failedCount >= FAILED_DELIVERY_LIMIT) {
        flags.push({
            rule: 'HIGH_FAILURE_HISTORY',
            detail: `User has ${failedCount} previously failed order${failedCount !== 1 ? 's' : ''} on record (limit: ${FAILED_DELIVERY_LIMIT})`
        });
    }

    if (flags.length > 0) {

        await client.query(
            `UPDATE Orders SET status = 'flagged', updated_at = NOW() WHERE id = $1`,
            [orderId]
        );
        for (const flag of flags) {
            await client.query(
                `INSERT INTO fraud_flags (order_id, user_id, rule_triggered, detail)
                 VALUES ($1, $2, $3, $4)`,
                [orderId, userId, flag.rule, flag.detail]
            );
        }

        console.log(`[FRAUD] Order ${orderId} flagged — rules: ${flags.map(f => f.rule).join(', ')}`);
        return true;
    }

    return false;
};

module.exports = { checkFraud };