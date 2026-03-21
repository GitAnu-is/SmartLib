const asyncHandler = require('express-async-handler');
const Inquiry = require('../models/Inquiry');
const { logActivity } = require('../utils/activityLogger');

// @desc    Create an inquiry
// @route   POST /api/inquiries
// @access  Private
const createInquiry = asyncHandler(async (req, res) => {
  const subject = String(req.body?.subject || '').trim();
  const message = String(req.body?.message || '').trim();

  if (!subject) {
    res.status(400);
    throw new Error('Subject is required');
  }

  if (!message) {
    res.status(400);
    throw new Error('Message is required');
  }

  const inquiry = await Inquiry.create({
    user: req.user._id,
    subject,
    message,
    status: 'pending',
  });

  const populated = await Inquiry.findById(inquiry._id).populate(
    'user',
    'fullname email role'
  );

  res.status(201).json(populated);
});

// @desc    Get current user's inquiries
// @route   GET /api/inquiries/me
// @access  Private
const getMyInquiries = asyncHandler(async (req, res) => {
  const inquiries = await Inquiry.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('user', 'fullname email role');

  res.status(200).json(inquiries);
});

// @desc    Get all inquiries (admin)
// @route   GET /api/inquiries
// @access  Private/Admin
const getInquiries = asyncHandler(async (req, res) => {
  const inquiries = await Inquiry.find({})
    .sort({ createdAt: -1 })
    .populate('user', 'fullname email role');

  res.status(200).json(inquiries);
});

// @desc    Reply to an inquiry (admin)
// @route   PATCH /api/inquiries/:id/reply
// @access  Private/Admin
const replyToInquiry = asyncHandler(async (req, res) => {
  const response = String(req.body?.response || '').trim();
  if (!response) {
    res.status(400);
    throw new Error('Response is required');
  }

  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) {
    res.status(404);
    throw new Error('Inquiry not found');
  }

  inquiry.response = response;
  inquiry.status = 'answered';
  inquiry.respondedAt = new Date();
  await inquiry.save();

  await logActivity(req, {
    type: 'reply',
    action: `Replied to inquiry "${inquiry.subject}"`,
    meta: { inquiryId: inquiry._id, subject: inquiry.subject },
  });

  const populated = await Inquiry.findById(inquiry._id).populate(
    'user',
    'fullname email role'
  );

  res.status(200).json(populated);
});

module.exports = {
  createInquiry,
  getMyInquiries,
  getInquiries,
  replyToInquiry,
};
