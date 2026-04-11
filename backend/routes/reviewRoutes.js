const express = require('express');
const { createReview, getMyReviews, getProductReviews, getAllReviews, deleteReview } = require('../controllers/reviewController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize, ROLES } = require('../middleware/rbacMiddleware');

const router = express.Router();

router.get('/product/:productId', getProductReviews);

router.get('/my', authenticate, authorize(ROLES.CUSTOMER), getMyReviews);

router.post('/', authenticate, authorize(ROLES.CUSTOMER), createReview);

router.get('/', authenticate, authorize(ROLES.ADMIN), getAllReviews);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), deleteReview);

module.exports = router;