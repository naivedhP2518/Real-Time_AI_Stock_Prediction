const Portfolio = require('../models/Portfolio');
const Holding = require('../models/Holding');
const Transaction = require('../models/Transaction');
const { getStockDetails } = require('./stockController');

/**
 * Helper to ensure a user has an initialized virtual portfolio record.
 */
const getOrCreatePortfolio = async (userId) => {
  let portfolio = await Portfolio.findOne({ user: userId });
  if (!portfolio) {
    portfolio = await Portfolio.create({
      user: userId,
      balance: 100000.0, // Default $100,000 USD virtual buying power
      totalInvested: 0.0,
      totalProfitLoss: 0.0,
      profitLossPercent: 0.0,
    });
  }
  return portfolio;
};

/**
 * @desc    Buy virtual stock shares
 * @route   POST /api/portfolio/buy
 * @access  Private
 */
const buyStock = async (req, res) => {
  try {
    const { symbol, shares, price } = req.body;
    
    if (!symbol || !shares || !price) {
      return res.status(400).json({ message: 'Symbol, shares count, and price are required' });
    }
    
    const qty = parseFloat(shares);
    const buyPrice = parseFloat(price);
    
    if (qty <= 0 || buyPrice <= 0) {
      return res.status(400).json({ message: 'Shares and price must be greater than zero' });
    }
    
    const sym = symbol.toUpperCase().trim();
    const totalCost = qty * buyPrice;
    
    // 1. Get user portfolio
    const portfolio = await getOrCreatePortfolio(req.user._id);
    
    // Check buying power balance
    if (portfolio.balance < totalCost) {
      return res.status(400).json({ message: `Insufficient virtual balance. Required: $${totalCost.toFixed(2)}, Available: $${portfolio.balance.toFixed(2)}` });
    }
    
    // 2. Update holdings
    let holding = await Holding.findOne({ user: req.user._id, symbol: sym });
    
    if (holding) {
      const newShares = holding.shares + qty;
      const newTotalCost = holding.totalCost + totalCost;
      const newAveragePrice = +(newTotalCost / newShares).toFixed(4);
      
      holding.shares = newShares;
      holding.totalCost = +newTotalCost.toFixed(2);
      holding.averagePrice = newAveragePrice;
      await holding.save();
    } else {
      holding = await Holding.create({
        user: req.user._id,
        symbol: sym,
        shares: qty,
        averagePrice: buyPrice,
        totalCost: +totalCost.toFixed(2),
      });
    }
    
    // 3. Deduct buying power balance
    portfolio.balance = +(portfolio.balance - totalCost).toFixed(2);
    await portfolio.save();
    
    // 4. Log transaction
    const transaction = await Transaction.create({
      user: req.user._id,
      symbol: sym,
      type: 'BUY',
      shares: qty,
      price: buyPrice,
      totalAmount: +totalCost.toFixed(2),
    });
    
    console.log(`[Virtual Trading] User ${req.user.name} bought ${qty} shares of ${sym} for $${totalCost.toFixed(2)}`);
    
    return res.status(201).json({
      message: `Successfully purchased ${qty} shares of ${sym}`,
      portfolio,
      holding,
      transaction
    });
    
  } catch (error) {
    console.error('Buy Stock Core Error:', error.message);
    return res.status(500).json({ message: 'Error processing purchase transaction' });
  }
};

/**
 * @desc    Sell virtual stock shares
 * @route   POST /api/portfolio/sell
 * @access  Private
 */
const sellStock = async (req, res) => {
  try {
    const { symbol, shares, price } = req.body;
    
    if (!symbol || !shares || !price) {
      return res.status(400).json({ message: 'Symbol, shares count, and price are required' });
    }
    
    const qty = parseFloat(shares);
    const sellPrice = parseFloat(price);
    
    if (qty <= 0 || sellPrice <= 0) {
      return res.status(400).json({ message: 'Shares and price must be greater than zero' });
    }
    
    const sym = symbol.toUpperCase().trim();
    const totalAmount = qty * sellPrice;
    
    // 1. Check holding presence
    const holding = await Holding.findOne({ user: req.user._id, symbol: sym });
    if (!holding || holding.shares < qty) {
      return res.status(400).json({ message: `Insufficient shares owned. You own: ${holding ? holding.shares : 0} shares of ${sym}` });
    }
    
    // 2. Deduct from holdings or delete holding row if fully sold
    const remainingShares = holding.shares - qty;
    
    if (remainingShares === 0) {
      await Holding.deleteOne({ _id: holding._id });
    } else {
      holding.shares = remainingShares;
      // Proportional cost reduction
      holding.totalCost = +(remainingShares * holding.averagePrice).toFixed(2);
      await holding.save();
    }
    
    // 3. Credit portfolio buying power balance
    const portfolio = await getOrCreatePortfolio(req.user._id);
    portfolio.balance = +(portfolio.balance + totalAmount).toFixed(2);
    await portfolio.save();
    
    // 4. Log transaction
    const transaction = await Transaction.create({
      user: req.user._id,
      symbol: sym,
      type: 'SELL',
      shares: qty,
      price: sellPrice,
      totalAmount: +totalAmount.toFixed(2),
    });
    
    console.log(`[Virtual Trading] User ${req.user.name} sold ${qty} shares of ${sym} for $${totalAmount.toFixed(2)}`);
    
    return res.status(200).json({
      message: `Successfully sold ${qty} shares of ${sym}`,
      portfolio,
      holding: remainingShares === 0 ? null : holding,
      transaction
    });
    
  } catch (error) {
    console.error('Sell Stock Core Error:', error.message);
    return res.status(500).json({ message: 'Error processing sale transaction' });
  }
};

/**
 * @desc    Get user portfolio balance, detailed holdings valued at live prices, and allocations
 * @route   GET /api/portfolio
 * @access  Private
 */
const getPortfolio = async (req, res) => {
  try {
    const portfolio = await getOrCreatePortfolio(req.user._id);
    const holdings = await Holding.find({ user: req.user._id });
    
    let totalHoldingsValue = 0.0;
    let totalInvested = 0.0;
    
    const enrichedHoldings = [];
    
    // Evaluate each holding at its live stock price
    for (const h of holdings) {
      const liveDetails = await getStockDetails(h.symbol);
      const livePrice = liveDetails.price;
      const currentVal = +(h.shares * livePrice).toFixed(2);
      const profitLoss = +(currentVal - h.totalCost).toFixed(2);
      const profitLossPercent = h.totalCost > 0 ? +((profitLoss / h.totalCost) * 100).toFixed(2) : 0.0;
      
      totalHoldingsValue += currentVal;
      totalInvested += h.totalCost;
      
      enrichedHoldings.push({
        _id: h._id,
        symbol: h.symbol,
        shares: h.shares,
        averagePrice: h.averagePrice,
        totalCost: h.totalCost,
        currentPrice: livePrice,
        currentValue: currentVal,
        profitLoss,
        profitLossPercent
      });
    }
    
    const netAssetValue = +(portfolio.balance + totalHoldingsValue).toFixed(2);
    
    // Standard returns comparing NAV against the initial starting seed capital of $100,000
    const overallProfitLoss = +(netAssetValue - 100000.0).toFixed(2);
    const overallProfitLossPercent = +((overallProfitLoss / 100000.0) * 100).toFixed(2);
    
    // Update portfolio in background
    portfolio.totalInvested = +totalInvested.toFixed(2);
    portfolio.totalProfitLoss = overallProfitLoss;
    portfolio.profitLossPercent = overallProfitLossPercent;
    await portfolio.save();
    
    // Calculate allocations ratio for Recharts charts
    const holdingsAllocations = enrichedHoldings.map(h => ({
      name: h.symbol,
      value: h.currentValue,
      percentage: netAssetValue > 0 ? +((h.currentValue / netAssetValue) * 100).toFixed(2) : 0.0
    }));
    
    // Append Cash allocation to complete pie allocations
    const cashAllocation = {
      name: 'Cash (Buying Power)',
      value: portfolio.balance,
      percentage: netAssetValue > 0 ? +((portfolio.balance / netAssetValue) * 100).toFixed(2) : 100.0
    };
    
    const allocations = [cashAllocation, ...holdingsAllocations];
    
    return res.json({
      summary: {
        buyingPower: portfolio.balance,
        totalInvested: +totalInvested.toFixed(2),
        holdingsValue: +totalHoldingsValue.toFixed(2),
        netAssetValue,
        overallProfitLoss,
        overallProfitLossPercent
      },
      holdings: enrichedHoldings,
      allocations
    });
    
  } catch (error) {
    console.error('Get Portfolio Core Error:', error.message);
    return res.status(500).json({ message: 'Error fetching portfolio details' });
  }
};

/**
 * @desc    Get user past virtual transactions history
 * @route   GET /api/portfolio/history
 * @access  Private
 */
const getTransactionHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort({ date: -1 });
    return res.json(transactions);
  } catch (error) {
    console.error('Get Transaction History Core Error:', error.message);
    return res.status(500).json({ message: 'Error fetching transaction history' });
  }
};

module.exports = {
  buyStock,
  sellStock,
  getPortfolio,
  getTransactionHistory
};
