const mongoose = require('mongoose');

/**
 * Embedded sub-document that represents a single open position inside
 * the user's virtual portfolio.
 */
const positionSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    avgPrice: {
      type: Number,
      required: true,
      min: 0
    },
    currentPrice: {
      type: Number,
      default: 0
    },
    pnl: {
      type: Number,
      default: 0
    },
    pnlPercent: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

/**
 * PaperPortfolio — one document per user, tracks cash balance, open
 * positions, and auto-trade preferences.
 */
const paperPortfolioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    cash: {
      type: Number,
      default: 100000,   // Starting capital: $100,000
      min: 0
    },
    totalValue: {
      type: Number,
      default: 100000
    },
    positions: {
      type: [positionSchema],
      default: []
    },
    autoTradeEnabled: {
      type: Boolean,
      default: false
    },
    autoTradeSymbols: {
      type: [String],
      default: ['AAPL', 'TSLA', 'NVDA']
    }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
  }
);

module.exports = mongoose.model('PaperPortfolio', paperPortfolioSchema);
