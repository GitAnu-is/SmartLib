const Activity = require('../models/Activity');

async function logActivity(req, { type, action, meta = {} }) {
  try {
    const adminId = req?.user?._id;
    if (!adminId) return;

    await Activity.create({
      type,
      action,
      admin: adminId,
      meta,
    });
  } catch (e) {
    // Never block the main request if logging fails
  }
}

module.exports = { logActivity };
