const express = require('express');

const {
  createInquiry,
  getMyInquiries,
  getInquiries,
  replyToInquiry,
} = require('../controllers/inquiryController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', protect, getMyInquiries);

router
  .route('/')
  .post(protect, createInquiry)
  .get(protect, authorize('admin'), getInquiries);

router.patch('/:id/reply', protect, authorize('admin'), replyToInquiry);

module.exports = router;
