const axios = require('axios');
const Watchlist = require('../models/Watchlist');

// High fidelity Mock Stock Database for fallback and instant search
const MOCK_STOCKS = {
  AAPL: { symbol: 'AAPL', name: 'Apple Inc.', price: 189.84, open: 183.56, high: 191.20, low: 182.40, volume: 52400000, change: 6.28, changePercent: 3.42, volatility: 'Low', signal: 'BUY' },
  TSLA: { symbol: 'TSLA', name: 'Tesla, Inc.', price: 246.50, open: 232.80, high: 251.10, low: 230.50, volume: 88500000, change: 13.70, changePercent: 5.89, volatility: 'Very High', signal: 'STRONG BUY' },
  MSFT: { symbol: 'MSFT', name: 'Microsoft Corporation', price: 421.90, open: 424.00, high: 426.50, low: 419.20, volume: 22800000, change: -2.10, changePercent: -0.49, volatility: 'Low', signal: 'HOLD' },
  NVDA: { symbol: 'NVDA', name: 'Nvidia Corporation', price: 924.80, open: 910.30, high: 935.00, low: 905.20, volume: 41200000, change: 14.50, changePercent: 1.59, volatility: 'High', signal: 'STRONG BUY' },
  AMZN: { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: 178.15, open: 176.30, high: 180.50, low: 175.10, volume: 33400000, change: 1.85, changePercent: 1.05, volatility: 'Medium', signal: 'BUY' },
  COIN: { symbol: 'COIN', name: 'Coinbase Global, Inc.', price: 215.40, open: 228.20, high: 231.50, low: 210.60, volume: 14500000, change: -12.80, changePercent: -5.61, volatility: 'Extremely High', signal: 'SELL' },
  GOOGL: { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 173.50, open: 171.20, high: 175.40, low: 170.80, volume: 28900000, change: 2.30, changePercent: 1.34, volatility: 'Low', signal: 'BUY' },
  META: { symbol: 'META', name: 'Meta Platforms, Inc.', price: 475.20, open: 468.50, high: 479.80, low: 465.10, volume: 19800000, change: 6.70, changePercent: 1.43, volatility: 'Medium', signal: 'BUY' },
  NFLX: { symbol: 'NFLX', name: 'Netflix, Inc.', price: 610.50, open: 615.00, high: 618.30, low: 604.20, volume: 6400000, change: -4.50, changePercent: -0.73, volatility: 'Medium', signal: 'HOLD' }
};

// Mock Indices and Crypto
const MOCK_INDICES = [
  { name: 'S&P 500', symbol: 'SPX', price: 5321.41, change: 42.15, changePercent: 0.80 },
  { name: 'Nasdaq 100', symbol: 'NDX', price: 18652.20, change: 215.40, changePercent: 1.17 },
  { name: 'Dow Jones', symbol: 'DJI', price: 39872.99, change: -88.10, changePercent: -0.22 }
];

const MOCK_CRYPTOS = [
  { name: 'Bitcoin', symbol: 'BTC', price: 68420.50, change: 1240.20, changePercent: 1.85 },
  { name: 'Ethereum', symbol: 'ETH', price: 3820.15, change: -42.80, changePercent: -1.11 },
  { name: 'Solana', symbol: 'SOL', price: 178.45, change: 12.15, changePercent: 7.31 }
];

/**
 * Helper to fetch stock quotes from Finnhub if key is configured,
 * otherwise return dynamic simulated ticks.
 */
const getStockDetails = async (symbol) => {
  const sym = symbol.toUpperCase();
  const apiKey = process.env.FINNHUB_API_KEY;
  const mockBase = MOCK_STOCKS[sym] || {
    symbol: sym,
    name: `${sym} Corporation`,
    price: 100.00,
    open: 98.00,
    high: 102.00,
    low: 97.50,
    volume: 5000000,
    change: 2.00,
    changePercent: 2.04,
    volatility: 'Medium',
    signal: 'HOLD'
  };

  // Add subtle dynamic price fluctuations
  const drift = (Math.random() - 0.48) * mockBase.price * (mockBase.volatility === 'Low' ? 0.002 : 0.008);
  mockBase.price = Math.max(1, +(mockBase.price + drift).toFixed(2));
  mockBase.change = +(mockBase.price - mockBase.open).toFixed(2);
  mockBase.changePercent = +((mockBase.change / mockBase.open) * 100).toFixed(2);
  mockBase.high = Math.max(mockBase.high, mockBase.price);
  mockBase.low = Math.min(mockBase.low, mockBase.price);

  if (apiKey) {
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${apiKey}`);
      const { c, o, h, l, v } = response.data;
      if (c && o) {
        return {
          symbol: sym,
          name: mockBase.name,
          price: c,
          open: o,
          high: h,
          low: l,
          volume: v || mockBase.volume,
          change: +(c - o).toFixed(2),
          changePercent: +(((c - o) / o) * 100).toFixed(2),
          volatility: mockBase.volatility,
          signal: mockBase.signal
        };
      }
    } catch (error) {
      console.warn(`Finnhub API limit or request error, falling back to simulated data.`, error.message);
    }
  }
  return mockBase;
};

/**
 * @desc    Get single stock details
 * @route   GET /api/stocks/:symbol
 * @access  Private
 */
const getStock = async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const data = await getStockDetails(symbol);
    return res.json(data);
  } catch (error) {
    console.error('Fetch Stock Error:', error.message);
    return res.status(500).json({ message: 'Error retrieving stock information' });
  }
};

/**
 * @desc    Get trending stocks list
 * @route   GET /api/stocks/trending
 * @access  Private
 */
const getTrendingStocks = async (req, res) => {
  try {
    const trendingSymbols = ['AAPL', 'TSLA', 'MSFT', 'NVDA', 'AMZN', 'COIN'];
    const stockPromises = trendingSymbols.map(sym => getStockDetails(sym));
    const trendingData = await Promise.all(stockPromises);
    return res.json(trendingData);
  } catch (error) {
    console.error('Fetch Trending Error:', error.message);
    return res.status(500).json({ message: 'Error retrieving trending stock listings' });
  }
};

/**
 * @desc    Get overall market indices, gainers/losers and crypto summaries
 * @route   GET /api/stocks/market-overview
 * @access  Private
 */
const getMarketOverview = async (req, res) => {
  try {
    const trendingList = await Promise.all(['AAPL', 'TSLA', 'MSFT', 'NVDA', 'AMZN', 'COIN', 'GOOGL', 'META', 'NFLX'].map(s => getStockDetails(s)));
    
    // Sort to determine Gainers vs Losers
    const sorted = [...trendingList].sort((a, b) => b.changePercent - a.changePercent);
    const topGainers = sorted.slice(0, 3);
    const topLosers = [...sorted].reverse().slice(0, 3);

    return res.json({
      indices: MOCK_INDICES.map(idx => {
        const drift = (Math.random() - 0.49) * 5;
        const newChange = +(idx.change + drift).toFixed(2);
        return {
          ...idx,
          change: newChange,
          changePercent: +((newChange / (idx.price - newChange)) * 100).toFixed(2),
          price: +(idx.price + drift).toFixed(2)
        };
      }),
      crypto: MOCK_CRYPTOS.map(c => {
        const drift = (Math.random() - 0.48) * c.price * 0.005;
        const newPrice = +(c.price + drift).toFixed(2);
        return {
          ...c,
          price: newPrice,
          change: +(c.change + drift).toFixed(2),
          changePercent: +(((c.change + drift) / (newPrice - (c.change + drift))) * 100).toFixed(2)
        };
      }),
      topGainers,
      topLosers,
      trending: trendingList.slice(0, 5)
    });
  } catch (error) {
    console.error('Market Overview Error:', error.message);
    return res.status(500).json({ message: 'Error fetching market overview data' });
  }
};

/**
 * @desc    Search stocks by symbol or query string
 * @route   GET /api/stocks/search/:query
 * @access  Private
 */
const searchStocks = async (req, res) => {
  try {
    const query = req.params.query.toUpperCase().trim();
    if (!query) {
      return res.json([]);
    }

    const matches = Object.values(MOCK_STOCKS).filter(
      stock => stock.symbol.includes(query) || stock.name.toUpperCase().includes(query)
    );

    return res.json(matches);
  } catch (error) {
    console.error('Search Stocks Error:', error.message);
    return res.status(500).json({ message: 'Error processing stock query search' });
  }
};

/**
 * @desc    Get user pinned watchlist securities details
 * @route   GET /api/stocks/watchlist/details
 * @access  Private
 */
const getUserWatchlist = async (req, res) => {
  try {
    let watchlist = await Watchlist.findOne({ user: req.user._id });
    if (!watchlist) {
      watchlist = await Watchlist.create({ user: req.user._id, symbols: ['AAPL', 'TSLA'] });
    }
    
    // Fetch details for all symbols
    const detailPromises = watchlist.symbols.map(sym => getStockDetails(sym));
    const listDetails = await Promise.all(detailPromises);

    return res.json({
      _id: watchlist._id,
      symbols: watchlist.symbols,
      details: listDetails
    });
  } catch (error) {
    console.error('Get Watchlist Error:', error.message);
    return res.status(500).json({ message: 'Error retrieving user watchlist' });
  }
};

/**
 * @desc    Add a security symbol to user watchlist
 * @route   POST /api/stocks/watchlist
 * @access  Private
 */
const addToWatchlist = async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) {
      return res.status(400).json({ message: 'Stock symbol is required' });
    }

    const sym = symbol.toUpperCase().trim();
    let watchlist = await Watchlist.findOne({ user: req.user._id });
    
    if (!watchlist) {
      watchlist = await Watchlist.create({ user: req.user._id, symbols: [sym] });
    } else {
      if (watchlist.symbols.includes(sym)) {
        return res.status(400).json({ message: 'Security already belongs to your watchlist' });
      }
      watchlist.symbols.push(sym);
      await watchlist.save();
    }

    const detailPromises = watchlist.symbols.map(s => getStockDetails(s));
    const listDetails = await Promise.all(detailPromises);

    return res.status(201).json({
      _id: watchlist._id,
      symbols: watchlist.symbols,
      details: listDetails
    });
  } catch (error) {
    console.error('Add Watchlist Error:', error.message);
    return res.status(500).json({ message: 'Error adding security to watchlist' });
  }
};

/**
 * @desc    Remove security symbol from user watchlist
 * @route   DELETE /api/stocks/watchlist/:symbol
 * @access  Private
 */
const removeFromWatchlist = async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase().trim();
    const watchlist = await Watchlist.findOne({ user: req.user._id });

    if (!watchlist || !watchlist.symbols.includes(symbol)) {
      return res.status(404).json({ message: 'Security was not found in your watchlist' });
    }

    watchlist.symbols = watchlist.symbols.filter(sym => sym !== symbol);
    await watchlist.save();

    const detailPromises = watchlist.symbols.map(s => getStockDetails(s));
    const listDetails = await Promise.all(detailPromises);

    return res.json({
      _id: watchlist._id,
      symbols: watchlist.symbols,
      details: listDetails
    });
  } catch (error) {
    console.error('Remove Watchlist Error:', error.message);
    return res.status(500).json({ message: 'Error removing security from watchlist' });
  }
};

module.exports = {
  getStock,
  getTrendingStocks,
  getMarketOverview,
  searchStocks,
  getUserWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  MOCK_STOCKS,
  getStockDetails
};
