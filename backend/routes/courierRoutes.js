const express = require('express');
const courierController = require('../controllers/courierController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize, ROLES } = require('../middleware/rbacMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.COURIER));

router.get('/orders', courierController.getAssignedOrders);
router.post('/orders/:id/accept', courierController.acceptOrder);

router.patch('/orders/:id/pick', courierController.pickOrder);

router.patch('/orders/:id/deliver', courierController.deliverOrder);

router.patch('/orders/:id/fail', courierController.failOrder);

module.exports = router;