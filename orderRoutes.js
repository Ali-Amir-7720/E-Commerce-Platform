const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize, ROLES } = require('../middleware/rbacMiddleware');

const router = express.Router();

router.use(authenticate);

router.post(
    '/',
    authorize(ROLES.CUSTOMER),
    orderController.createOrder
);

router.get(
    '/',
    authorize(ROLES.ADMIN, ROLES.CUSTOMER),
    orderController.getOrders
);

router.get(
    '/:id',
    authorize(ROLES.ADMIN, ROLES.CUSTOMER),
    orderController.getOrderById
);

module.exports = router;