const express = require('express');

const { getAdminStats } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', protect, authorize('admin'), getAdminStats);

module.exports = router;
