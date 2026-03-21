const express = require('express');

const {
  getReservationsAdmin,
  getMyReservations,
  createReservation,
  cancelReservation,
} = require('../controllers/reservationController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, authorize('admin'), getReservationsAdmin);
router.get('/my', protect, getMyReservations);
router.post('/', protect, createReservation);
router.put('/:id/cancel', protect, cancelReservation);

module.exports = router;
