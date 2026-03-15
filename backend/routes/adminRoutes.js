const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize, ROLES } = require('../middleware/rbacMiddleware');
const fraudController = require('../controllers/fraudController');
const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get('/users', adminController.getUsers);
router.patch('/users/:id/block', adminController.blockUser);
router.patch('/users/:id/unblock', adminController.unblockUser);
router.patch('/users/:id/role', adminController.changeUserRole);

router.patch('/products/:id/ban', adminController.banProduct);
router.patch('/products/:id/unban', adminController.unbanProduct);
router.get('/products', adminController.getAllProducts);
router.post('/assign-courier', adminController.assignCourier);
router.get('/fraud', fraudController.getFraudFlags);
router.patch('/fraud/ban/:userId', fraudController.banFraudUser);

module.exports = router;