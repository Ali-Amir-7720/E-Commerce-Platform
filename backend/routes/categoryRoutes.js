const express = require('express');
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize, ROLES } = require('../middleware/rbacMiddleware');

const router = express.Router();

router.get('/', categoryController.getCategories);
router.post(
    '/',
    authenticate,
    authorize(ROLES.ADMIN),
    categoryController.createCategory
);

router.patch(
    '/:id',
    authenticate,
    authorize(ROLES.ADMIN),
    categoryController.updateCategory
);

router.delete(
    '/:id',
    authenticate,
    authorize(ROLES.ADMIN),
    categoryController.deleteCategory
);

module.exports = router;