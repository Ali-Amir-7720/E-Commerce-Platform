const express = require('express');
const { getProductMessages, getOrderMessages, getConversations } = require('../controllers/chatController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/conversations', getConversations);
router.get('/product/:productId', getProductMessages);
router.get('/order/:orderId', getOrderMessages);

module.exports = router;