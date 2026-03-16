const express = require('express');
const v = require('../controllers/vendorController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize, ROLES } = require('../middleware/rbacMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.VENDOR));

router.get('/products', v.getVendorProducts);
router.post('/products', v.createVendorProduct);
router.put('/products/:id', v.updateVendorProduct);
router.delete('/products/:id', v.deleteVendorProduct);

router.get('/products/:id/variants', v.getVariants);
router.post('/products/:id/variants', v.addVariant);
router.put('/products/:id/variants/:vid', v.updateVariant);
router.delete('/products/:id/variants/:vid', v.deleteVariant);

module.exports = router;