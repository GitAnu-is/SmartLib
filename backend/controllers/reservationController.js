const asyncHandler = require('express-async-handler');
const Reservation = require('../models/Reservation');

function normalizeString(value) {
  return String(value || '').trim();
}

// @desc    Get all reservations (admin)
// @route   GET /api/reservations
// @access  Private/Admin
const getReservationsAdmin = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit || '200', 10), 1), 500);

  const reservations = await Reservation.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'fullname email role');

  res.status(200).json(reservations);
});

// @desc    Get my reservations
// @route   GET /api/reservations/my
// @access  Private
const getMyReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(reservations);
});

// @desc    Create reservation
// @route   POST /api/reservations
// @access  Private
const createReservation = asyncHandler(async (req, res) => {
  const spaceName = normalizeString(req.body.spaceName);
  const date = normalizeString(req.body.date);
  const time = normalizeString(req.body.time);
  const spaceId = req.body.spaceId || undefined;

  if (!spaceName) {
    res.status(400);
    throw new Error('Space name is required');
  }
  if (!date) {
    res.status(400);
    throw new Error('Date is required');
  }
  if (!time) {
    res.status(400);
    throw new Error('Time is required');
  }

  const created = await Reservation.create({
    user: req.user._id,
    spaceId,
    spaceName,
    date,
    time,
    status: 'Upcoming',
  });

  res.status(201).json(created);
});

// @desc    Cancel reservation (owner or admin)
// @route   PUT /api/reservations/:id/cancel
// @access  Private
const cancelReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) {
    res.status(404);
    throw new Error('Reservation not found');
  }

  const isOwner = String(reservation.user) === String(req.user._id);
  const isAdmin = req.user && req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to cancel this reservation');
  }

  if (reservation.status === 'Cancelled' || reservation.status === 'Completed') {
    res.status(400);
    throw new Error('Reservation cannot be cancelled');
  }

  reservation.status = 'Cancelled';
  const saved = await reservation.save();
  res.status(200).json(saved);
});

module.exports = {
  getReservationsAdmin,
  getMyReservations,
  createReservation,
  cancelReservation,
};
