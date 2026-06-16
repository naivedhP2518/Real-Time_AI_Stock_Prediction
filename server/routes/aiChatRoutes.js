const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { handleChatQuery } = require('../controllers/aiChatController');

router.post('/query', protect, handleChatQuery);

module.exports = router;
