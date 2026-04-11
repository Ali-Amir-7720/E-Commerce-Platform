const express = require('express');
const { updateProductVariant } = require('../controllers/productController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/rbacMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles('Admin', 'Vendor'));

router.put('/:id', updateProductVariant);

module.exports = router;
