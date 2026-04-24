const express = require('express');
const router = express.Router();
const {
  submitContactMessage,
  getContactMessages,
  getContactMessage,
  replyToContactMessage,
  deleteContactMessage,
} = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route
router.post('/', submitContactMessage);

// Admin routes
router.get('/', protect, authorize('admin'), getContactMessages);
router.get('/:id', protect, authorize('admin'), getContactMessage);
router.patch('/:id/reply', protect, authorize('admin'), replyToContactMessage);
router.delete('/:id', protect, authorize('admin'), deleteContactMessage);

module.exports = router;
