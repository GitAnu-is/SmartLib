const express = require('express');

const { getActivities } = require('../controllers/activityController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, authorize('admin'), getActivities);

module.exports = router;
