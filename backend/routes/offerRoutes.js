const express = require('express');
const offerController = require('../controllers/offerController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize, ROLES } = require('../middleware/rbacMiddleware');

const router = express.Router();

router.get('/', offerController.getOffers);
router.post('/validate', authenticate, offerController.validateCoupon);
router.post(
    '/',
    authenticate,
    authorize(ROLES.ADMIN),
    offerController.createOffer
);

router.delete(
    '/:id',
    authenticate,
    authorize(ROLES.ADMIN),
    offerController.deleteOffer
);

module.exports = router;