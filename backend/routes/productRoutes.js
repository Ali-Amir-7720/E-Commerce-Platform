const express = require('express');
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize, ROLES } = require('../middleware/rbacMiddleware');

const router = express.Router();

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

router.post(
    '/',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.VENDOR),
    productController.createProduct
);

router.patch(
    '/:id',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.VENDOR),
    productController.updateProduct
);

router.delete(
    '/:id',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.VENDOR),
    productController.deleteProduct
);

router.post(
    '/:id/variants',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.VENDOR),
    productController.createProductVariant
);

router.patch(
    '/:id/variants/:variantId',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.VENDOR),
    (req, res, next) => {
        req.params.id = req.params.variantId;
        next();
    },
    productController.updateProductVariant
);

module.exports = router;