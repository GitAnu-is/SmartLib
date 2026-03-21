const express = require('express');

const {
  createBorrowRequest,
  getMyBorrowRequests,
  getBorrowRequests,
  approveBorrowRequest,
  rejectBorrowRequest,
  returnBorrowRequest,
  cancelBorrowRequest,
} = require('../controllers/borrowRequestController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', protect, getMyBorrowRequests);

router
  .route('/')
  .post(protect, createBorrowRequest)
  .get(protect, authorize('admin'), getBorrowRequests);

router.patch('/:id/approve', protect, authorize('admin'), approveBorrowRequest);
router.patch('/:id/reject', protect, authorize('admin'), rejectBorrowRequest);
router.patch('/:id/return', protect, authorize('admin'), returnBorrowRequest);

router.delete('/:id', protect, cancelBorrowRequest);

module.exports = router;
