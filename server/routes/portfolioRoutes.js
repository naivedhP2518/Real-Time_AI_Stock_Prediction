const express = require('express');
const router = express.Router();
const { 
  buyStock, 
  sellStock, 
  getPortfolio, 
  getTransactionHistory 
} = require('../controllers/portfolioController');
const { protect } = require('../middleware/authMiddleware');

// Secure all portfolio endpoints
router.use(protect);

router.get('/', getPortfolio);
router.post('/buy', buyStock);
router.post('/sell', sellStock);
router.get('/history', getTransactionHistory);

module.exports = router;
