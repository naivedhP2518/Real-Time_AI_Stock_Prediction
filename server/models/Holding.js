const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    symbol: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    shares: {
      type: Number,
      required: true,
      min: [0, 'Shares count cannot be negative'],
      default: 0,
    },
    averagePrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalCost: {
      type: Number,
      required: true,
      default: 0.0,
    }
  },
  {
    timestamps: true,
  }
);

// Create compound index so user cannot have duplicate rows for the same symbol
holdingSchema.index({ user: 1, symbol: 1 }, { unique: true });

module.exports = mongoose.model('Holding', holdingSchema);
