const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createStrategy,
  getStrategies,
  updateStrategy,
  deleteStrategy,
  backtestStrategy
} = require('../controllers/strategyController');

// All strategy routes require authentication
router.use(protect);

router.post('/', createStrategy);
router.get('/', getStrategies);
router.put('/:id', updateStrategy);
router.delete('/:id', deleteStrategy);
router.post('/:id/backtest', backtestStrategy);

module.exports = router;
