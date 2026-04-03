const express = require('express');

const { optionalProtect } = require('../middleware/authMiddleware');
const {
  getAssistantHealth,
  getAssistantInsights,
  chatWithAssistant,
} = require('../controllers/assistantController');

const router = express.Router();

router.get('/health', getAssistantHealth);
router.get('/insights', optionalProtect, getAssistantInsights);
router.post('/chat', optionalProtect, chatWithAssistant);

module.exports = router;
