const express = require('express');

const {
  joinWaitingList,
  getMyWaitingList,
  leaveWaitingList,
} = require('../controllers/waitingListController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', protect, getMyWaitingList);
router.post('/', protect, joinWaitingList);
router.delete('/:id', protect, leaveWaitingList);

module.exports = router;
