const express = require('express');

const { protect } = require('../middleware/authMiddleware');
const {
  getAssistantInsights,
  chatWithAssistant,
} = require('../controllers/assistantController');

const router = express.Router();

router.get('/insights', protect, getAssistantInsights);
router.post('/chat', protect, chatWithAssistant);

module.exports = router;
