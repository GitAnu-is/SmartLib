const express = require('express');

const {
  borrowReport,
  overdueReport,
  usageReport,
} = require('../controllers/reportController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/borrow', protect, authorize('admin'), borrowReport);
router.get('/overdue', protect, authorize('admin'), overdueReport);
router.get('/usage', protect, authorize('admin'), usageReport);

module.exports = router;
