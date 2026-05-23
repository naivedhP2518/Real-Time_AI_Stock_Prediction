const express = require('express');
const router = express.Router();
const {
  getStock,
  getTrendingStocks,
  getMarketOverview,
  searchStocks,
  getUserWatchlist,
  addToWatchlist,
  removeFromWatchlist
} = require('../controllers/stockController');
const { protect } = require('../middleware/authMiddleware');

// Secure stock routes (all endpoints protected by protect middleware)
router.use(protect);

router.get('/trending', getTrendingStocks);
router.get('/market-overview', getMarketOverview);
router.get('/search/:query', searchStocks);
router.get('/watchlist/details', getUserWatchlist);
router.post('/watchlist', addToWatchlist);
router.delete('/watchlist/:symbol', removeFromWatchlist);
router.get('/:symbol', getStock);

module.exports = router;
