const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 100000.0, // Default virtual balance of $100,000
    },
    totalInvested: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalProfitLoss: {
      type: Number,
      required: true,
      default: 0.0,
    },
    profitLossPercent: {
      type: Number,
      required: true,
      default: 0.0,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Portfolio', portfolioSchema);
