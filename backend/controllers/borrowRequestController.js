const asyncHandler = require('express-async-handler');
const BorrowRequest = require('../models/BorrowRequest');
const Book = require('../models/Book');
const User = require('../models/User');
const { logActivity } = require('../utils/activityLogger');
const { sendMail } = require('../utils/mailer');

const BORROW_PERIOD_DAYS = 7;
const FINE_PER_DAY_LKR = 50;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function computeDueAt(borrowedAt) {
  const due = new Date(borrowedAt);
  due.setDate(due.getDate() + BORROW_PERIOD_DAYS);
  return due;
}

// @desc    Create a borrow request
// @route   POST /api/borrow-requests
// @access  Private
const createBorrowRequest = asyncHandler(async (req, res) => {
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

  const existingPending = await BorrowRequest.findOne({
    user: req.user._id,
    book: bookId,
    status: 'pending',
  });

  if (existingPending) {
    res.status(400);
    throw new Error('You already have a pending request for this book');
  }

  const request = await BorrowRequest.create({
    user: req.user._id,
    book: bookId,
    status: 'pending',
  });

  const populated = await BorrowRequest.findById(request._id)
    .populate('book', 'title author category coverColor rating')
    .populate('user', 'fullname email role');

  res.status(201).json(populated);
});

// @desc    Get current user's borrow requests
// @route   GET /api/borrow-requests/me
// @access  Private
const getMyBorrowRequests = asyncHandler(async (req, res) => {
  const requests = await BorrowRequest.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('book', 'title author category coverColor rating')
    .populate('user', 'fullname email role');

  res.status(200).json(requests);
});

// @desc    Get all borrow requests (admin)
// @route   GET /api/borrow-requests
// @access  Private/Admin
const getBorrowRequests = asyncHandler(async (req, res) => {
  const requests = await BorrowRequest.find({})
    .sort({ createdAt: -1 })
    .populate('book', 'title author category coverColor rating')
    .populate('user', 'fullname email role');

  res.status(200).json(requests);
});

// @desc    Approve a borrow request (admin)
// @route   PATCH /api/borrow-requests/:id/approve
// @access  Private/Admin
const approveBorrowRequest = asyncHandler(async (req, res) => {
  const request = await BorrowRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Borrow request not found');
  }

  if (request.status !== 'pending') {
    res.status(400);
    throw new Error('Only pending requests can be approved');
  }

  const book = await Book.findById(request.book);
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  if (typeof book.copies !== 'number' || book.copies <= 0) {
    res.status(400);
    throw new Error('No available copies for this book');
  }

  book.copies -= 1;
  book.status = book.copies === 0 ? 'borrowed' : 'available';
  await book.save();

  request.status = 'approved';

  // Set borrow lifecycle dates (do not overwrite if already set)
  const borrowedAt = request.borrowedAt || new Date();
  request.borrowedAt = borrowedAt;
  request.dueAt = request.dueAt || computeDueAt(borrowedAt);

  await request.save();

  await logActivity(req, {
    type: 'approve',
    action: `Approved borrow request for "${book.title}"`,
    meta: { requestId: request._id, bookId: book._id, title: book.title },
  });

  const populated = await BorrowRequest.findById(request._id)
    .populate('book', 'title author category coverColor')
    .populate('user', 'fullname email role');

  res.status(200).json(populated);
});

// @desc    Mark a borrow request as returned and compute fine
// @route   PATCH /api/borrow-requests/:id/return
// @access  Private/Admin
const returnBorrowRequest = asyncHandler(async (req, res) => {
  const request = await BorrowRequest.findById(req.params.id)
    .populate('book')
    .populate('user');

  if (!request) {
    res.status(404);
    throw new Error('Borrow request not found');
  }

  if (request.status !== 'approved') {
    res.status(400);
    throw new Error('Only approved borrow requests can be returned');
  }

  if (request.returnedAt) {
    res.status(400);
    throw new Error('This borrow request is already returned');
  }

  const returnedAt = new Date();
  const borrowedAt = request.borrowedAt || request.createdAt || returnedAt;
  const dueAt = request.dueAt || computeDueAt(borrowedAt);

  const msPerDay = 24 * 60 * 60 * 1000;
  const lateDays = Math.max(
    0,
    Math.floor((startOfDay(returnedAt) - startOfDay(dueAt)) / msPerDay)
  );
  const fineLkr = lateDays * FINE_PER_DAY_LKR;

  request.returnedAt = returnedAt;
  request.borrowedAt = borrowedAt;
  request.dueAt = dueAt;
  request.lateDays = lateDays;
  request.fineLkr = fineLkr;
  request.finePaid = false;
  request.finePaidAt = null;
  await request.save();

  // Update book inventory
  const book = request.book;
  if (book) {
    const currentCopies = typeof book.copies === 'number' ? book.copies : 0;
    const totalCopies = typeof book.totalCopies === 'number' ? book.totalCopies : currentCopies;

    book.copies = Math.min(totalCopies, currentCopies + 1);
    book.status = book.copies > 0 ? 'available' : 'borrowed';
    await book.save();
  }

  // Update member record if fine exists
  if (fineLkr > 0 && request.user?._id) {
    const user = await User.findById(request.user._id);
    if (user) {
      user.fineBalanceLkr = (Number(user.fineBalanceLkr) || 0) + fineLkr;
      user.totalFineLkr = (Number(user.totalFineLkr) || 0) + fineLkr;
      user.lateReturnCount = (Number(user.lateReturnCount) || 0) + 1;
      await user.save();
    }
  }

  await logActivity(req, {
    type: 'return',
    action: `Returned book "${request.book?.title || 'book'}"`,
    meta: { requestId: request._id, bookId: request.book?._id, fineLkr, lateDays },
  });

  const populated = await BorrowRequest.findById(request._id)
    .populate('book', 'title author category coverColor rating')
    .populate('user', 'fullname email role');

  res.status(200).json(populated);
});

// @desc    Reject a borrow request (admin)
// @route   PATCH /api/borrow-requests/:id/reject
// @access  Private/Admin
const rejectBorrowRequest = asyncHandler(async (req, res) => {
  const request = await BorrowRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Borrow request not found');
  }

  if (request.status !== 'pending') {
    res.status(400);
    throw new Error('Only pending requests can be rejected');
  }

  request.status = 'rejected';
  await request.save();

  await logActivity(req, {
    type: 'reject',
    action: 'Rejected borrow request',
    meta: { requestId: request._id },
  });

  const populated = await BorrowRequest.findById(request._id)
    .populate('book', 'title author category coverColor')
    .populate('user', 'fullname email role');

  res.status(200).json(populated);
});

// @desc    Cancel (delete) a pending borrow request (user)
// @route   DELETE /api/borrow-requests/:id
// @access  Private
const cancelBorrowRequest = asyncHandler(async (req, res) => {
  const request = await BorrowRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Borrow request not found');
  }

  if (String(request.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to cancel this request');
  }

  if (request.status !== 'pending') {
    res.status(400);
    throw new Error('Only pending requests can be cancelled');
  }

  await request.deleteOne();

  res.status(200).json({ message: 'Borrow request cancelled' });
});

// @desc    Send overdue reminder email to a user (admin)
// @route   POST /api/borrow-requests/:id/remind
// @access  Private/Admin
const sendOverdueReminder = asyncHandler(async (req, res) => {
  const request = await BorrowRequest.findById(req.params.id)
    .populate('book', 'title author category')
    .populate('user', 'fullname email');

  if (!request) {
    res.status(404);
    throw new Error('Borrow request not found');
  }

  if (request.status !== 'approved' || request.returnedAt) {
    res.status(400);
    throw new Error('This borrow request is not an active approved borrow');
  }

  const userEmail = request.user?.email;
  if (!userEmail) {
    res.status(400);
    throw new Error('Borrower email is missing');
  }

  const now = new Date();
  const borrowedAt = request.borrowedAt || request.createdAt || now;
  const dueAt = request.dueAt || computeDueAt(borrowedAt);

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysLate = Math.max(
    0,
    Math.floor((startOfDay(now) - startOfDay(dueAt)) / msPerDay)
  );

  if (daysLate <= 0) {
    res.status(400);
    throw new Error('This item is not overdue');
  }

  const fineLkr = daysLate * FINE_PER_DAY_LKR;
  const userName = request.user?.fullname || 'Student';
  const bookTitle = request.book?.title || 'your borrowed book';
  const dueDateStr = new Date(dueAt).toLocaleDateString('en-CA');

  const subject = `SmartLib Reminder: Overdue book return (${bookTitle})`;
  const text =
    `Hello ${userName},\n\n` +
    `This is a reminder that the book "${bookTitle}" is overdue.\n` +
    `Due date: ${dueDateStr}\n` +
    `Days late: ${daysLate}\n` +
    `Current fine: Rs ${Number(fineLkr).toFixed(2)}\n\n` +
    `Please return the book as soon as possible and settle the fine.\n\n` +
    `Thank you,\nSmartLib Admin`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5">
      <p>Hello ${String(userName).replace(/</g, '&lt;').replace(/>/g, '&gt;')},</p>
      <p>This is a reminder that the book <strong>${String(bookTitle)
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')}</strong> is overdue.</p>
      <ul>
        <li><strong>Due date:</strong> ${dueDateStr}</li>
        <li><strong>Days late:</strong> ${daysLate}</li>
        <li><strong>Current fine:</strong> Rs ${Number(fineLkr).toFixed(2)}</li>
      </ul>
      <p>Please return the book as soon as possible and settle the fine.</p>
      <p>Thank you,<br/>SmartLib Admin</p>
    </div>
  `;

  try {
    await sendMail({
      to: userEmail,
      subject,
      text,
      html,
    });
  } catch (e) {
    res.status(500);
    throw new Error(e?.message || 'Failed to send reminder email');
  }

  await logActivity(req, {
    type: 'reminder',
    action: `Sent overdue reminder to ${userName} for "${bookTitle}"`,
    meta: { requestId: request._id, userEmail, daysLate, fineLkr },
  });

  res.status(200).json({
    message: 'Reminder email sent',
    requestId: request._id,
    to: userEmail,
    daysLate,
    fineLkr,
  });
});

module.exports = {
  createBorrowRequest,
  getMyBorrowRequests,
  getBorrowRequests,
  approveBorrowRequest,
  rejectBorrowRequest,
  returnBorrowRequest,
  sendOverdueReminder,
  cancelBorrowRequest,
};
