const express = require('express');
const { getAddresses, createAddress, deleteAddress } = require('../controllers/addressController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', getAddresses);
router.post('/', createAddress);
router.delete('/:id', deleteAddress);

module.exports = router;