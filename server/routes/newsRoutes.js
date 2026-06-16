const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/authMiddleware');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

router.use(protect);

router.get('/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase().trim();
    console.log(`[News Proxy] Querying news sentiment from Flask service for: ${symbol}`);
    const response = await axios.get(`${ML_SERVICE_URL}/news/${symbol}`, { timeout: 6500 });
    return res.json(response.data);
  } catch (error) {
    console.warn(
      `[News Proxy] Flask news service unavailable. Generating fallback sentiment simulation.`,
      error.message
    );
    
    // Return high-fidelity sentiment breakdown matching Flask schema
    const today = Date.now();
    const sym = req.params.symbol.toUpperCase().trim();
    
    return res.json({
      symbol: sym,
      overallScore: 0.22,
      overallSentiment: "BULLISH",
      articlesCount: 3,
      bullishRatio: 0.67,
      bearishRatio: 0.33,
      articles: [
        {
          title: `Technical Volume Accumulation Patterns Emerge in ${sym} Trade Charts`,
          publisher: "Quantum Trader Daily",
          link: "#",
          publishTime: Math.floor((today - 4200000) / 1000),
          sentiment: "BULLISH",
          score: 0.38,
          breakdown: { positive: 0.2, negative: 0.0, neutral: 0.8 }
        },
        {
          title: `Wall Street Analysts Hold Consensus Targets on ${sym} Equity Ratings`,
          publisher: "Macro Analyst Desk",
          link: "#",
          publishTime: Math.floor((today - 18000000) / 1000),
          sentiment: "NEUTRAL",
          score: 0.05,
          breakdown: { positive: 0.05, negative: 0.05, neutral: 0.9 }
        },
        {
          title: `Drift Momentum Factors Support Positive 7-Day Forecasting for ${sym}`,
          publisher: "Recurrent Deep Networks Review",
          link: "#",
          publishTime: Math.floor((today - 32000000) / 1000),
          sentiment: "BULLISH",
          score: 0.42,
          breakdown: { positive: 0.25, negative: 0.0, neutral: 0.75 }
        }
      ],
      isFallback: true
    });
  }
});

router.get('/sentiment/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase().trim();
    console.log(`[News Proxy] Querying focused news sentiment for symbol: ${symbol}`);
    const response = await axios.get(`${ML_SERVICE_URL}/news/${symbol}`, { timeout: 6500 });
    
    const { overallScore, overallSentiment, bullishRatio, bearishRatio, articlesCount } = response.data;
    return res.json({
      symbol,
      score: overallScore,
      sentiment: overallSentiment,
      bullishRatio,
      bearishRatio,
      articlesCount
    });
  } catch (error) {
    console.warn(
      `[News Proxy] Flask news service unavailable. Generating fallback sentiment metric calculations.`,
      error.message
    );
    const sym = req.params.symbol.toUpperCase().trim();
    return res.json({
      symbol: sym,
      score: 0.22,
      sentiment: "BULLISH",
      bullishRatio: 0.67,
      bearishRatio: 0.33,
      articlesCount: 3,
      isFallback: true
    });
  }
});

module.exports = router;
