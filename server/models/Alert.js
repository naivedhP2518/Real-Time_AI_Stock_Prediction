const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
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
    targetPrice: {
      type: Number,
      required: true,
      min: [0.01, 'Target price must be greater than zero'],
    },
    type: {
      type: String,
      required: true,
      enum: ['ABOVE', 'BELOW'],
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Alert', alertSchema);
