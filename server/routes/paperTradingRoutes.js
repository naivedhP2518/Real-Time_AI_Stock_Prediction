const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getPortfolio,
  executeBuy,
  executeSell,
  getTradeHistory,
  toggleAutoTrade
} = require('../controllers/paperTradingController');

// All routes require a valid JWT
router.use(protect);

router.get('/portfolio', getPortfolio);
router.post('/buy', executeBuy);
router.post('/sell', executeSell);
router.get('/history', getTradeHistory);
router.post('/auto-trade/toggle', toggleAutoTrade);

module.exports = router;
