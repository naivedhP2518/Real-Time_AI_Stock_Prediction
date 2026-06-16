const { getStockDetails } = require('./stockController');
const PaperTrade = require('../models/PaperTrade');
const PaperPortfolio = require('../models/PaperPortfolio');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Refresh all position prices + recompute totalValue for a portfolio doc.
 * Mutates and returns the same portfolio instance (not saved — caller saves).
 */
const refreshPortfolioValues = async (portfolio) => {
  let positionsValue = 0;

  const updatedPositions = await Promise.all(
    portfolio.positions.map(async (pos) => {
      const details = await getStockDetails(pos.symbol);
      const currentPrice = details.price;
      const positionValue = currentPrice * pos.quantity;
      const pnl = +((currentPrice - pos.avgPrice) * pos.quantity).toFixed(2);
      const pnlPercent = pos.avgPrice > 0
        ? +(((currentPrice - pos.avgPrice) / pos.avgPrice) * 100).toFixed(2)
        : 0;

      positionsValue += positionValue;

      return {
        symbol: pos.symbol,
        quantity: pos.quantity,
        avgPrice: pos.avgPrice,
        currentPrice,
        pnl,
        pnlPercent
      };
    })
  );

  portfolio.positions = updatedPositions;
  portfolio.totalValue = +(portfolio.cash + positionsValue).toFixed(2);

  return portfolio;
};

// ---------------------------------------------------------------------------
// Route Handlers
// ---------------------------------------------------------------------------

/**
 * @desc    Get (or create) the authenticated user's paper portfolio.
 *          Refreshes all position prices before returning.
 * @route   GET /api/paper-trading/portfolio
 * @access  Private
 */
const getPortfolio = async (req, res) => {
  try {
    let portfolio = await PaperPortfolio.findOne({ user: req.user._id });

    if (!portfolio) {
      portfolio = await PaperPortfolio.create({ user: req.user._id });
    }

    portfolio = await refreshPortfolioValues(portfolio);
    await portfolio.save();

    return res.json(portfolio);
  } catch (error) {
    console.error('getPortfolio error:', error.message);
    return res.status(500).json({ message: 'Failed to retrieve portfolio', error: error.message });
  }
};

/**
 * @desc    Execute a paper BUY order.
 * @route   POST /api/paper-trading/buy
 * @access  Private
 * @body    { symbol: String, quantity: Number }
 */
const executeBuy = async (req, res) => {
  try {
    const { symbol, quantity } = req.body;

    if (!symbol || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Valid symbol and quantity (min 1) are required' });
    }

    const sym = symbol.toUpperCase().trim();
    const qty = parseInt(quantity, 10);

    // Fetch live (or simulated) price
    const details = await getStockDetails(sym);
    const price = details.price;
    const cost = +(price * qty).toFixed(2);

    // Get or create portfolio
    let portfolio = await PaperPortfolio.findOne({ user: req.user._id });
    if (!portfolio) {
      portfolio = await PaperPortfolio.create({ user: req.user._id });
    }

    if (portfolio.cash < cost) {
      return res.status(400).json({
        message: `Insufficient cash. Required: $${cost.toFixed(2)}, Available: $${portfolio.cash.toFixed(2)}`
      });
    }

    // Deduct cash
    portfolio.cash = +(portfolio.cash - cost).toFixed(2);

    // Add or update position (weighted average price)
    const existingIndex = portfolio.positions.findIndex((p) => p.symbol === sym);
    if (existingIndex >= 0) {
      const existing = portfolio.positions[existingIndex];
      const totalShares = existing.quantity + qty;
      const newAvgPrice = +((existing.avgPrice * existing.quantity + price * qty) / totalShares).toFixed(4);
      portfolio.positions[existingIndex].quantity = totalShares;
      portfolio.positions[existingIndex].avgPrice = newAvgPrice;
      portfolio.positions[existingIndex].currentPrice = price;
    } else {
      portfolio.positions.push({
        symbol: sym,
        quantity: qty,
        avgPrice: price,
        currentPrice: price,
        pnl: 0,
        pnlPercent: 0
      });
    }

    // Create trade record
    await PaperTrade.create({
      user: req.user._id,
      symbol: sym,
      type: 'BUY',
      quantity: qty,
      price,
      status: 'OPEN'
    });

    // Refresh + save
    portfolio = await refreshPortfolioValues(portfolio);
    await portfolio.save();

    return res.status(201).json({
      message: `Bought ${qty} share(s) of ${sym} at $${price.toFixed(2)}`,
      portfolio
    });
  } catch (error) {
    console.error('executeBuy error:', error.message);
    return res.status(500).json({ message: 'Buy order failed', error: error.message });
  }
};

/**
 * @desc    Execute a paper SELL order.
 * @route   POST /api/paper-trading/sell
 * @access  Private
 * @body    { symbol: String, quantity: Number }
 */
const executeSell = async (req, res) => {
  try {
    const { symbol, quantity } = req.body;

    if (!symbol || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Valid symbol and quantity (min 1) are required' });
    }

    const sym = symbol.toUpperCase().trim();
    const qty = parseInt(quantity, 10);

    let portfolio = await PaperPortfolio.findOne({ user: req.user._id });
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found. Make a buy first.' });
    }

    const positionIndex = portfolio.positions.findIndex((p) => p.symbol === sym);
    if (positionIndex < 0) {
      return res.status(400).json({ message: `No position found for ${sym}` });
    }

    const position = portfolio.positions[positionIndex];
    if (position.quantity < qty) {
      return res.status(400).json({
        message: `Insufficient shares. You hold ${position.quantity} share(s) of ${sym}`
      });
    }

    // Fetch current price for P&L calculation
    const details = await getStockDetails(sym);
    const currentPrice = details.price;

    const proceeds = +(currentPrice * qty).toFixed(2);
    const pnl = +((currentPrice - position.avgPrice) * qty).toFixed(2);

    // Add proceeds back to cash
    portfolio.cash = +(portfolio.cash + proceeds).toFixed(2);

    // Reduce or remove position
    if (position.quantity === qty) {
      portfolio.positions.splice(positionIndex, 1);
    } else {
      portfolio.positions[positionIndex].quantity -= qty;
      portfolio.positions[positionIndex].currentPrice = currentPrice;
    }

    // Create trade record (SELL / CLOSED)
    await PaperTrade.create({
      user: req.user._id,
      symbol: sym,
      type: 'SELL',
      quantity: qty,
      price: currentPrice,
      pnl,
      status: 'CLOSED',
      closedAt: new Date()
    });

    // Refresh + save
    portfolio = await refreshPortfolioValues(portfolio);
    await portfolio.save();

    return res.json({
      message: `Sold ${qty} share(s) of ${sym} at $${currentPrice.toFixed(2)} | P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
      pnl,
      portfolio
    });
  } catch (error) {
    console.error('executeSell error:', error.message);
    return res.status(500).json({ message: 'Sell order failed', error: error.message });
  }
};

/**
 * @desc    Get last 50 paper trade records for the authenticated user.
 * @route   GET /api/paper-trading/history
 * @access  Private
 */
const getTradeHistory = async (req, res) => {
  try {
    const trades = await PaperTrade.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({ trades, total: trades.length });
  } catch (error) {
    console.error('getTradeHistory error:', error.message);
    return res.status(500).json({ message: 'Failed to retrieve trade history', error: error.message });
  }
};

/**
 * @desc    Toggle auto-trade on/off and update watched symbols.
 * @route   POST /api/paper-trading/auto-trade/toggle
 * @access  Private
 * @body    { symbols?: String[] }
 */
const toggleAutoTrade = async (req, res) => {
  try {
    let portfolio = await PaperPortfolio.findOne({ user: req.user._id });
    if (!portfolio) {
      portfolio = await PaperPortfolio.create({ user: req.user._id });
    }

    // Toggle the flag
    portfolio.autoTradeEnabled = !portfolio.autoTradeEnabled;

    // Update symbols list if provided, otherwise keep defaults
    if (req.body.symbols && Array.isArray(req.body.symbols) && req.body.symbols.length > 0) {
      portfolio.autoTradeSymbols = req.body.symbols.map((s) => s.toUpperCase().trim());
    } else if (!portfolio.autoTradeSymbols || portfolio.autoTradeSymbols.length === 0) {
      portfolio.autoTradeSymbols = ['AAPL', 'TSLA', 'NVDA'];
    }

    await portfolio.save();

    return res.json({
      message: `Auto-trade ${portfolio.autoTradeEnabled ? 'enabled' : 'disabled'}`,
      autoTradeEnabled: portfolio.autoTradeEnabled,
      autoTradeSymbols: portfolio.autoTradeSymbols
    });
  } catch (error) {
    console.error('toggleAutoTrade error:', error.message);
    return res.status(500).json({ message: 'Failed to toggle auto-trade', error: error.message });
  }
};

// ---------------------------------------------------------------------------
// Exported helper — called by a scheduled job (e.g. cron / Socket.io tick)
// ---------------------------------------------------------------------------

/**
 * @desc  Scans every portfolio with autoTradeEnabled === true and fires
 *        virtual BUY/SELL orders based on the AI signal from getStockDetails.
 *        Not a route handler — intended to be called server-side on a schedule.
 */
const runAutoTrade = async () => {
  try {
    const activePortfolios = await PaperPortfolio.find({ autoTradeEnabled: true });

    if (!activePortfolios.length) {
      console.log('[AutoTrade] No active portfolios found.');
      return;
    }

    for (const portfolio of activePortfolios) {
      const symbols = portfolio.autoTradeSymbols.length
        ? portfolio.autoTradeSymbols
        : ['AAPL', 'TSLA', 'NVDA'];

      for (const sym of symbols) {
        try {
          const details = await getStockDetails(sym);
          const { signal, price } = details;

          // --- STRONG BUY logic ---
          if (signal === 'STRONG BUY' && portfolio.cash >= price * 5) {
            const qty = 5;
            const cost = +(price * qty).toFixed(2);
            portfolio.cash = +(portfolio.cash - cost).toFixed(2);

            const existingIdx = portfolio.positions.findIndex((p) => p.symbol === sym);
            if (existingIdx >= 0) {
              const existing = portfolio.positions[existingIdx];
              const totalShares = existing.quantity + qty;
              const newAvg = +((existing.avgPrice * existing.quantity + price * qty) / totalShares).toFixed(4);
              portfolio.positions[existingIdx].quantity = totalShares;
              portfolio.positions[existingIdx].avgPrice = newAvg;
              portfolio.positions[existingIdx].currentPrice = price;
            } else {
              portfolio.positions.push({
                symbol: sym,
                quantity: qty,
                avgPrice: price,
                currentPrice: price,
                pnl: 0,
                pnlPercent: 0
              });
            }

            await PaperTrade.create({
              user: portfolio.user,
              symbol: sym,
              type: 'BUY',
              quantity: qty,
              price,
              status: 'OPEN'
            });

            console.log(`[AutoTrade] BUY  5 x ${sym} @ $${price} | User: ${portfolio.user}`);
          }

          // --- STRONG SELL logic ---
          if (signal === 'STRONG SELL') {
            const posIdx = portfolio.positions.findIndex((p) => p.symbol === sym);
            if (posIdx >= 0 && portfolio.positions[posIdx].quantity > 0) {
              const position = portfolio.positions[posIdx];
              const sellQty = Math.min(5, position.quantity);
              const proceeds = +(price * sellQty).toFixed(2);
              const pnl = +((price - position.avgPrice) * sellQty).toFixed(2);

              portfolio.cash = +(portfolio.cash + proceeds).toFixed(2);

              if (position.quantity <= sellQty) {
                portfolio.positions.splice(posIdx, 1);
              } else {
                portfolio.positions[posIdx].quantity -= sellQty;
                portfolio.positions[posIdx].currentPrice = price;
              }

              await PaperTrade.create({
                user: portfolio.user,
                symbol: sym,
                type: 'SELL',
                quantity: sellQty,
                price,
                pnl,
                status: 'CLOSED',
                closedAt: new Date()
              });

              console.log(`[AutoTrade] SELL ${sellQty} x ${sym} @ $${price} | P&L: $${pnl} | User: ${portfolio.user}`);
            }
          }
        } catch (innerErr) {
          console.error(`[AutoTrade] Error processing ${sym} for user ${portfolio.user}:`, innerErr.message);
        }
      }

      // Persist portfolio changes after processing all symbols for this user
      try {
        await portfolio.save();
      } catch (saveErr) {
        console.error(`[AutoTrade] Failed to save portfolio for user ${portfolio.user}:`, saveErr.message);
      }
    }

    console.log(`[AutoTrade] Cycle complete. Processed ${activePortfolios.length} portfolio(s).`);
  } catch (error) {
    console.error('[AutoTrade] Fatal error during auto-trade cycle:', error.message);
  }
};

module.exports = {
  getPortfolio,
  executeBuy,
  executeSell,
  getTradeHistory,
  toggleAutoTrade,
  runAutoTrade
};
