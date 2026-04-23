const express = require('express');

const {
  createBorrowRequest,
  getMyBorrowRequests,
  getBorrowRequests,
  approveBorrowRequest,
  rejectBorrowRequest,
  returnBorrowRequest,
  sendOverdueReminder,
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
<<<<<<< HEAD
router.patch('/:id/return', protect, returnBorrowRequest);
=======
router.patch('/:id/return', protect, authorize('admin'), returnBorrowRequest);
>>>>>>> c74094ce282018c28485d65b40a1d1fc8dd85ed6
router.post('/:id/remind', protect, authorize('admin'), sendOverdueReminder);

router.delete('/:id', protect, cancelBorrowRequest);

module.exports = router;
