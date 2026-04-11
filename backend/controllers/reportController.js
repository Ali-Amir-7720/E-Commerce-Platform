const db = require('../config/db');

const getCustomerOrdersReport = async (_req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM Customer_Order_Summary');
        return res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching customer orders report:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getProductSalesReport = async (_req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM Product_Sales_Report ORDER BY total_revenue DESC');
        return res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching product sales report:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getActiveDeliveriesReport = async (_req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM Courier_Active_Deliveries');
        return res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching active deliveries report:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getCustomerOrdersReport,
    getProductSalesReport,
    getActiveDeliveriesReport,
};