const express = require('express');
const wishlistController = require('../controllers/wishlistController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize, ROLES } = require('../middleware/rbacMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.CUSTOMER));

router.post('/', wishlistController.addToWishlist);

router.get('/', wishlistController.getWishlist);
router.delete('/:id', wishlistController.removeFromWishlist);

module.exports = router;