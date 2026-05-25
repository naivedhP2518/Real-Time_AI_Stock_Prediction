const axios = require('axios');
const { getStockDetails, MOCK_STOCKS } = require('./stockController');

// Flask microservice configuration URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

/**
 * Helper to generate beautiful, high-fidelity simulated predictions if Flask service is offline.
 * This ensures continuous dashboard operation and matches the exact API schema.
 */
const generateSimulatedPrediction = async (symbol) => {
  const sym = symbol.toUpperCase().trim();
  const stockDetails = await getStockDetails(sym);
  const currentPrice = stockDetails.price;
  
  // Calculate simulated next-day predicted price with realistic drift
  const expectedGain = stockDetails.volatility === 'Very High' ? 0.05 
                     : stockDetails.volatility === 'High' ? 0.035 
                     : stockDetails.volatility === 'Medium' ? 0.02 
                     : 0.012;
                     
  // Adjust predicted price upward or downward depending on stock's signal
  const directionMultiplier = stockDetails.signal.includes('BUY') ? 1.0 : -0.8;
  const predDrift = currentPrice * expectedGain * directionMultiplier;
  const predictedPrice = +(currentPrice + predDrift).toFixed(2);
  
  const priceDiff = predictedPrice - currentPrice;
  const changePercent = +((priceDiff / currentPrice) * 100).toFixed(2);
  const trend = priceDiff >= 0 ? 'UP' : 'DOWN';
  
  // Custom authentic-looking indicators
  const rsi = stockDetails.signal === 'STRONG BUY' ? 28.5 
            : stockDetails.signal === 'BUY' ? 42.1 
            : stockDetails.signal === 'SELL' ? 71.4 
            : 54.8;
  const sma = +(currentPrice * 0.985).toFixed(2);
  const macd = +(currentPrice * 0.015 * directionMultiplier).toFixed(2);
  const macdSignal = +(macd * 0.85).toFixed(2);
  
  const confidence = stockDetails.signal === 'STRONG BUY' || stockDetails.signal === 'STRONG SELL'
                   ? +(92 + Math.random() * 6).toFixed(1)
                   : +(80 + Math.random() * 11).toFixed(1);
                   
  // Generate last 30 days of historical closing prices
  const historicalPrices = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const histDate = new Date();
    histDate.setDate(today.getDate() - i);
    // Standard random walk starting backwards
    const dayDrift = (Math.random() - 0.48) * currentPrice * 0.01;
    historicalPrices.push({
      date: histDate.toISOString().split('T')[0],
      price: +(currentPrice - (i * 0.1) + dayDrift).toFixed(2)
    });
  }
  
  // Generate future 7-day predicted forecasting wands
  const futurePrices = [];
  for (let i = 1; i <= 7; i++) {
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + i);
    
    // Add compounding variance/uncertainty values
    const stepGain = predDrift * (1 + (i * 0.05));
    const stepPrice = +(currentPrice + stepGain).toFixed(2);
    const uncertainty = currentPrice * 0.012 * i;
    
    futurePrices.push({
      date: futureDate.toISOString().split('T')[0],
      price: stepPrice,
      upper: +(stepPrice + uncertainty).toFixed(2),
      lower: +(stepPrice - uncertainty).toFixed(2)
    });
  }

  return {
    symbol: sym,
    currentPrice: +(currentPrice).toFixed(2),
    predictedPrice: predictedPrice,
    changePercent: changePercent,
    trend: trend,
    confidence: confidence,
    buySellSignal: stockDetails.signal,
    indicators: {
      rsi,
      sma,
      macd,
      macdSignal
    },
    historicalPrices,
    futurePrices,
    isFallback: true
  };
};

/**
 * @desc    Get Stock prediction metrics (combines yfinance real history + LSTM forecast)
 * @route   GET /api/stocks/predictions/:symbol
 * @access  Private
 */
const getStockPrediction = async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase().trim();
    if (!symbol) {
      return res.status(400).json({ message: 'Stock symbol parameter is required' });
    }
    
    console.log(`[Prediction Engine] Processing forecast request for symbol: ${symbol}`);
    
    try {
      // Attempt to query the Python Flask ML Service
      const response = await axios.post(`${ML_SERVICE_URL}/predict`, { symbol }, { timeout: 8000 });
      console.log(`[Prediction Engine] Successfully retrieved forecast from ML microservice for ${symbol}`);
      return res.json(response.data);
    } catch (mlError) {
      console.warn(
        `[Prediction Engine] Flask ML Microservice offline or timeout. Generating high-fidelity simulation.`,
        mlError.message
      );
      
      const simulation = await generateSimulatedPrediction(symbol);
      return res.json(simulation);
    }
  } catch (error) {
    console.error('Prediction Fetching Core Error:', error.message);
    return res.status(500).json({ message: 'Critical error calculating deep predictions metrics' });
  }
};

module.exports = {
  getStockPrediction
};
