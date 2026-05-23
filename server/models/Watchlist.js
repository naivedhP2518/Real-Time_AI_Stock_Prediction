const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Each user gets a single watchlist
    },
    symbols: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Normalize symbols to uppercase before saving
watchlistSchema.pre('save', function (next) {
  if (this.symbols) {
    this.symbols = this.symbols.map((sym) => sym.toUpperCase());
  }
  next();
});

const Watchlist = mongoose.model('Watchlist', watchlistSchema);

module.exports = Watchlist;
