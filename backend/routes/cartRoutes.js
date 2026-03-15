const express = require('express');
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize, ROLES } = require('../middleware/rbacMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.CUSTOMER));

router.post('/', cartController.addToCart);
router.get('/', cartController.getCart);
router.delete('/item/:id', cartController.removeCartItem);

router.patch('/items/:id', authenticate, authorize(ROLES.CUSTOMER), cartController.updateCartItem);

module.exports = router;