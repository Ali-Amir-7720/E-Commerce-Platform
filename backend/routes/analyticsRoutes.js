const express = require('express');
const {
    getAdminAnalytics,
    getVendorAnalytics,
    getCustomerAnalytics,
    getCourierAnalytics,
} = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize, ROLES } = require('../middleware/rbacMiddleware');

const router = express.Router();

router.get('/admin', authenticate, authorize(ROLES.ADMIN), getAdminAnalytics);
router.get('/vendor', authenticate, authorize(ROLES.VENDOR), getVendorAnalytics);
router.get('/customer', authenticate, authorize(ROLES.CUSTOMER), getCustomerAnalytics);
router.get('/courier', authenticate, authorize(ROLES.COURIER), getCourierAnalytics);

module.exports = router;