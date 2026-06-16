const mongoose = require('mongoose');

/**
 * PaperTrade — records each individual virtual buy/sell execution.
 * Linked to a User and carries enough info to reconstruct full P&L history.
 */
const paperTradeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['BUY', 'SELL'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1 share']
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Execution price cannot be negative']
  },
  totalValue: {
    type: Number
  },
  pnl: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['OPEN', 'CLOSED'],
    default: 'OPEN'
  },
  closedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Automatically compute totalValue before every save
paperTradeSchema.pre('save', function (next) {
  this.totalValue = +(this.price * this.quantity).toFixed(2);
  next();
});

// Compound index for fast per-user history queries
paperTradeSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('PaperTrade', paperTradeSchema);
