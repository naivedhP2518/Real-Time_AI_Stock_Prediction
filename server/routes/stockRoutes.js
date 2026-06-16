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
const { 
  getStockPrediction,
  getAvailableModelsList,
  getModelsPerformanceMetrics,
  getSpecificModelPrediction,
  getEnsemblePredictionConsensus
} = require('../controllers/predictionController');
const { protect } = require('../middleware/authMiddleware');

// Secure stock routes (all endpoints protected by protect middleware)
router.use(protect);

router.get('/trending', getTrendingStocks);
router.get('/market-overview', getMarketOverview);
router.get('/search/:query', searchStocks);
router.get('/watchlist/details', getUserWatchlist);
router.post('/watchlist', addToWatchlist);
router.delete('/watchlist/:symbol', removeFromWatchlist);

// Multi-Model Forecasting Endpoints
router.get('/models', getAvailableModelsList);
router.get('/model-performance', getModelsPerformanceMetrics);
router.post('/predict/:model', getSpecificModelPrediction);
router.post('/ensemble-predict', getEnsemblePredictionConsensus);

// Legacy Prediction route
router.get('/predictions/:symbol', getStockPrediction);
router.get('/:symbol', getStock);

module.exports = router;
