const mongoose = require('mongoose');

/**
 * A single condition block inside a strategy.
 * Example: { indicator: 'RSI', operator: 'BELOW', value: 30, logic: 'AND' }
 */
const conditionSchema = new mongoose.Schema(
  {
    indicator: {
      type: String,
      required: true,
      trim: true
    },
    operator: {
      type: String,
      required: true,
      trim: true
    },
    value: {
      type: Number,
      required: true
    },
    logic: {
      type: String,
      enum: ['AND', 'OR'],
      default: 'AND'
    }
  },
  { _id: false }
);

/**
 * Strategy — stores the full definition of an algorithmic trading rule
 * set and its most recent backtest results.
 */
const strategySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Strategy name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  conditions: {
    type: [conditionSchema],
    default: []
  },
  isActive: {
    type: Boolean,
    default: false
  },
  /**
   * Populated by the backtest endpoint.
   * Shape: { win_rate, total_trades, return_pct, max_drawdown }
   */
  backtestResults: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Strategy', strategySchema);
