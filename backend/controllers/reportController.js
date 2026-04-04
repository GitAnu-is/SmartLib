const asyncHandler = require('express-async-handler');

const BorrowRequest = require('../models/BorrowRequest');
const Activity = require('../models/Activity');

const BORROW_PERIOD_DAYS = 7;
const FINE_PER_DAY_LKR = 50;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDayRange(dateStr) {
  if (!dateStr) return null;
  const start = new Date(dateStr);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function escapeCsv(value) {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(headers, rows) {
  const headerLine = headers.map(escapeCsv).join(',');
  const body = rows
    .map((row) => headers.map((h) => escapeCsv(row[h])).join(','))
    .join('\n');
  return body ? `${headerLine}\n${body}\n` : `${headerLine}\n`;
}

// @desc    Borrow report (admin) for a selected date
// @route   GET /api/reports/borrow?date=YYYY-MM-DD
// @access  Private/Admin
const borrowReport = asyncHandler(async (req, res) => {
  const range = getDayRange(req.query.date);
  if (!range) {
    res.status(400);
    throw new Error('Valid date (YYYY-MM-DD) is required');
  }

  const requests = await BorrowRequest.find({
    createdAt: { $gte: range.start, $lt: range.end },
  })
    .sort({ createdAt: -1 })
    .populate('book', 'title author category')
    .populate('user', 'fullname email');

  const headers = [
    'requestId',
    'date',
    'status',
    'userName',
    'userEmail',
    'bookTitle',
    'bookAuthor',
    'bookCategory',
  ];

  const rows = requests.map((r) => ({
    requestId: r._id,
    date: r.createdAt ? new Date(r.createdAt).toISOString() : '',
    status: r.status || '',
    userName: r.user?.fullname || '',
    userEmail: r.user?.email || '',
    bookTitle: r.book?.title || '',
    bookAuthor: r.book?.author || '',
    bookCategory: r.book?.category || '',
  }));

  const csv = toCsv(headers, rows);
  const filename = `borrow-report-${req.query.date}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csv);
});

// @desc    Overdue report (admin) for a selected date
// @route   GET /api/reports/overdue?date=YYYY-MM-DD
// @access  Private/Admin
const overdueReport = asyncHandler(async (req, res) => {
  const range = getDayRange(req.query.date);
  if (!range) {
    res.status(400);
    throw new Error('Valid date (YYYY-MM-DD) is required');
  }

  // Overdue tracking isn't persisted; compute it as-of the selected date.
  // Policy: first 7 days are free; after that Rs 50/day for each extra day.
  const asOf = startOfDay(range.start);
  const msPerDay = 24 * 60 * 60 * 1000;

  const requests = await BorrowRequest.find({
    status: 'approved',
    createdAt: { $lt: asOf },
    returnedAt: null,
  })
    .sort({ createdAt: -1 })
    .populate('book', 'title author category')
    .populate('user', 'fullname email');

  const headers = [
    'requestId',
    'borrowedAt',
    'dueDate',
    'daysLate',
    'fineLkr',
    'userName',
    'userEmail',
    'bookTitle',
    'bookAuthor',
    'bookCategory',
  ];

  const rows = requests
    .map((r) => {
      const borrowedAt = r.borrowedAt
        ? new Date(r.borrowedAt)
        : r.createdAt
          ? new Date(r.createdAt)
          : null;
      if (!borrowedAt || Number.isNaN(borrowedAt.getTime())) return null;

      const dueDate = r.dueAt ? new Date(r.dueAt) : (() => {
        const d = new Date(borrowedAt);
        d.setDate(d.getDate() + BORROW_PERIOD_DAYS);
        return d;
      })();

      const daysLate = Math.max(
        0,
        Math.floor((startOfDay(asOf) - startOfDay(dueDate)) / msPerDay)
      );

      if (daysLate <= 0) return null;

      const fineLkr = daysLate * FINE_PER_DAY_LKR;

      return {
        requestId: r._id,
        borrowedAt: borrowedAt.toISOString(),
        dueDate: dueDate.toISOString(),
        daysLate,
        fineLkr,
        userName: r.user?.fullname || '',
        userEmail: r.user?.email || '',
        bookTitle: r.book?.title || '',
        bookAuthor: r.book?.author || '',
        bookCategory: r.book?.category || '',
      };
    })
    .filter(Boolean);

  const csv = toCsv(headers, rows);
  const filename = `overdue-report-${req.query.date}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csv);
});

// @desc    Usage report (admin) for a selected date
// @route   GET /api/reports/usage?date=YYYY-MM-DD
// @access  Private/Admin
const usageReport = asyncHandler(async (req, res) => {
  const range = getDayRange(req.query.date);
  if (!range) {
    res.status(400);
    throw new Error('Valid date (YYYY-MM-DD) is required');
  }

  const activities = await Activity.find({
    createdAt: { $gte: range.start, $lt: range.end },
  })
    .sort({ createdAt: -1 })
    .populate('admin', 'fullname email');

  const headers = ['date', 'type', 'action', 'adminName', 'adminEmail'];
  const rows = activities.map((a) => ({
    date: a.createdAt ? new Date(a.createdAt).toISOString() : '',
    type: a.type || '',
    action: a.action || '',
    adminName: a.admin?.fullname || '',
    adminEmail: a.admin?.email || '',
  }));

  const csv = toCsv(headers, rows);
  const filename = `usage-report-${req.query.date}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csv);
});

module.exports = { borrowReport, overdueReport, usageReport };
