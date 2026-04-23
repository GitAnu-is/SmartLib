const asyncHandler = require('express-async-handler');

const Book = require('../models/Book');
const BorrowRequest = require('../models/BorrowRequest');
const Inquiry = require('../models/Inquiry');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = asyncHandler(async (req, res) => {
  const [totalBooks, activeBorrows, pendingRequests, openInquiries] =
    await Promise.all([
      Book.countDocuments({}),
      BorrowRequest.countDocuments({ status: 'approved' }),
      BorrowRequest.countDocuments({ status: 'pending' }),
      Inquiry.countDocuments({ status: 'pending' }),
    ]);

  // Overdue tracking isn't persisted yet in the data model
  const overdueBooks = 0;

  res.status(200).json({
    totalBooks,
    activeBorrows,
    pendingRequests,
    overdueBooks,
    openInquiries,
  });
});

module.exports = { getAdminStats };
