const express = require('express');
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize, ROLES } = require('../middleware/rbacMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get('/customer-orders', reportController.getCustomerOrdersReport);
router.get('/product-sales', reportController.getProductSalesReport);
router.get('/active-deliveries', reportController.getActiveDeliveriesReport);

module.exports = router;