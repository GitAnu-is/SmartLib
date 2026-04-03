const asyncHandler = require('express-async-handler');
const WaitingList = require('../models/WaitingList');
const Book = require('../models/Book');

// @desc    Join waiting list for a book
// @route   POST /api/waiting-list
// @access  Private
const joinWaitingList = asyncHandler(async (req, res) => {
  const { bookId } = req.body;

  if (!bookId) {
    res.status(400);
    throw new Error('bookId is required');
  }

  const book = await Book.findById(bookId);
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  const existing = await WaitingList.findOne({
    user: req.user._id,
    book: bookId,
    status: 'active',
  });

  if (existing) {
    res.status(400);
    throw new Error('You are already in the waiting list for this book');
  }

  const entry = await WaitingList.create({
    user: req.user._id,
    book: bookId,
    status: 'active',
  });

  const populated = await WaitingList.findById(entry._id)
    .populate('book', 'title author category coverColor')
    .populate('user', 'fullname email role');

  res.status(201).json(populated);
});

// @desc    Get current user's waiting list
// @route   GET /api/waiting-list/me
// @access  Private
const getMyWaitingList = asyncHandler(async (req, res) => {
  const entries = await WaitingList.find({ user: req.user._id, status: 'active' })
    .sort({ createdAt: -1 })
    .populate('book', 'title author category coverColor')
    .populate('user', 'fullname email role');

  // compute position per book (count older active entries)
  const withPositions = await Promise.all(
    entries.map(async (e) => {
      const position =
        (await WaitingList.countDocuments({
          book: e.book?._id || e.book,
          status: 'active',
          createdAt: { $lt: e.createdAt },
        })) + 1;

      return { ...e.toObject(), position };
    })
  );

  res.status(200).json(withPositions);
});

// @desc    Leave waiting list
// @route   DELETE /api/waiting-list/:id
// @access  Private
const leaveWaitingList = asyncHandler(async (req, res) => {
  const entry = await WaitingList.findById(req.params.id);

  if (!entry) {
    res.status(404);
    throw new Error('Waiting list entry not found');
  }

  if (String(entry.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized');
  }

  if (entry.status !== 'active') {
    res.status(400);
    throw new Error('This waiting list entry is not active');
  }

  entry.status = 'left';
  entry.leftAt = new Date();
  await entry.save();

  res.status(200).json({ message: 'Left waiting list' });
});

module.exports = {
  joinWaitingList,
  getMyWaitingList,
  leaveWaitingList,
};
