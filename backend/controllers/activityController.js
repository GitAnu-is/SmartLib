const asyncHandler = require('express-async-handler');
const Activity = require('../models/Activity');

// @desc    Get activity log (admin)
// @route   GET /api/activities
// @access  Private/Admin
const getActivities = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 200);

  const activities = await Activity.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('admin', 'fullname email role');

  res.status(200).json(activities);
});

module.exports = { getActivities };
