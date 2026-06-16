const { getStockDetails, MOCK_STOCKS } = require('./stockController');

// ---------------------------------------------------------------------------
// Intent Detection Helpers
// ---------------------------------------------------------------------------

/**
 * Scan a message string for known ticker symbols (2-5 uppercase letters).
 * Prioritises symbols that are actually present in MOCK_STOCKS.
 */
const extractSymbols = (message) => {
  const knownKeys = Object.keys(MOCK_STOCKS);
  const found = [];

  // First pass: look for exact known tickers mentioned in uppercase
  for (const sym of knownKeys) {
    // Match whole-word occurrences (word boundaries)
    const regex = new RegExp(`\\b${sym}\\b`, 'i');
    if (regex.test(message)) {
      found.push(sym);
    }
  }

  // Second pass: generic 2-5 uppercase letter tokens not yet captured
  const tokens = message.match(/\b[A-Z]{2,5}\b/g) || [];
  for (const token of tokens) {
    if (!found.includes(token)) {
      found.push(token);
    }
  }

  return found;
};

/**
 * Map a signal string to a human-readable sentiment label.
 */
const signalLabel = (signal) => {
  const map = {
    'STRONG BUY': '🟢 Strong Buy',
    'BUY': '🟩 Buy',
    'HOLD': '🟡 Hold',
    'SELL': '🟥 Sell',
    'STRONG SELL': '🔴 Strong Sell'
  };
  return map[signal] || signal;
};

/**
 * Derive a synthetic RSI value from stock metrics for narrative purposes.
 * (Not a real technical indicator — used for AI assistant flavour text.)
 */
const syntheticRsi = (changePercent, volatility) => {
  let base = 50;
  base += changePercent * 3;
  if (volatility === 'Very High' || volatility === 'Extremely High') base += 5;
  if (volatility === 'Low') base -= 3;
  return Math.min(100, Math.max(0, +base.toFixed(1)));
};

// ---------------------------------------------------------------------------
// Response generators per intent
// ---------------------------------------------------------------------------

const generateExplainResponse = async (symbols, originalMessage) => {
  const sym = symbols[0] || 'AAPL';
  const d = await getStockDetails(sym);
  const rsi = syntheticRsi(d.changePercent, d.volatility);
  const trend = d.changePercent >= 0 ? 'bullish' : 'bearish';
  const absTrend = Math.abs(d.changePercent);

  const response =
    `**Why is ${sym} ${trend}?**\n\n` +
    `${sym} (${d.name || sym}) is currently trading at **$${d.price.toFixed(2)}**, ` +
    `${d.changePercent >= 0 ? 'up' : 'down'} **${absTrend.toFixed(2)}%** in today's session.\n\n` +
    `**Key Factors:**\n` +
    `• **AI Signal:** ${signalLabel(d.signal)} — our model has high conviction in this direction.\n` +
    `• **Synthetic RSI:** ${rsi} — ${rsi > 70 ? 'overbought territory, momentum may cool' : rsi < 30 ? 'oversold territory, potential bounce ahead' : 'neutral zone, trend continuation likely'}.\n` +
    `• **Volatility Profile:** ${d.volatility} — expect ${d.volatility === 'Low' ? 'smoother price action' : 'larger intra-day swings'}.\n` +
    `• **Intraday Range:** $${d.low?.toFixed(2) || 'N/A'} – $${d.high?.toFixed(2) || 'N/A'}.\n\n` +
    `**AI Analysis:** ` +
    (d.signal.includes('BUY')
      ? `Buying pressure is elevated. Momentum indicators align with the upward trend. Institutional accumulation signals are positive. The risk/reward ratio favours longs at current levels.`
      : d.signal.includes('SELL')
        ? `Distribution patterns are visible on the tape. Selling pressure outweighs demand at current price levels. The AI recommends caution and suggests scaling out of positions.`
        : `Mixed signals are present. The stock is in a consolidation phase. Wait for a cleaner breakout or breakdown before committing new capital.`);

  return { response, symbol: sym, relatedStocks: symbols.slice(1, 4) };
};

const generateCompareResponse = async (symbols) => {
  const syms = symbols.slice(0, 2);
  if (syms.length < 2) syms.push('AAPL');
  const [d1, d2] = await Promise.all(syms.map((s) => getStockDetails(s)));

  const winner = d1.changePercent > d2.changePercent ? syms[0] : syms[1];
  const rsi1 = syntheticRsi(d1.changePercent, d1.volatility);
  const rsi2 = syntheticRsi(d2.changePercent, d2.volatility);

  const response =
    `**${syms[0]} vs ${syms[1]} — Head to Head Comparison**\n\n` +
    `| Metric         | ${syms[0]}           | ${syms[1]}           |\n` +
    `|----------------|----------------------|----------------------|\n` +
    `| Price          | $${d1.price.toFixed(2)}          | $${d2.price.toFixed(2)}          |\n` +
    `| Change %       | ${d1.changePercent >= 0 ? '+' : ''}${d1.changePercent.toFixed(2)}%       | ${d2.changePercent >= 0 ? '+' : ''}${d2.changePercent.toFixed(2)}%       |\n` +
    `| AI Signal      | ${d1.signal}         | ${d2.signal}         |\n` +
    `| Volatility     | ${d1.volatility}     | ${d2.volatility}     |\n` +
    `| Synthetic RSI  | ${rsi1}              | ${rsi2}              |\n\n` +
    `**Verdict:** Based on AI signal strength and momentum, **${winner}** has the edge today. ` +
    `${winner === syms[0]
      ? `${syms[0]}'s signal (${d1.signal}) outperforms ${syms[1]}'s signal (${d2.signal}).`
      : `${syms[1]}'s signal (${d2.signal}) outperforms ${syms[0]}'s signal (${d1.signal}).`}`;

  return { response, symbol: syms[0], relatedStocks: [syms[1]] };
};

const generateRecommendResponse = async () => {
  const allSymbols = Object.keys(MOCK_STOCKS);
  const topFive = allSymbols.slice(0, 5);
  const details = await Promise.all(topFive.map((s) => getStockDetails(s)));

  // Sort: STRONG BUY first, then BUY, then others
  const order = { 'STRONG BUY': 0, 'BUY': 1, 'HOLD': 2, 'SELL': 3, 'STRONG SELL': 4 };
  const sorted = details.sort((a, b) => (order[a.signal] ?? 5) - (order[b.signal] ?? 5));
  const top3 = sorted.slice(0, 3);

  const response =
    `**Top Stock Recommendations — AI Powered**\n\n` +
    top3.map((d, i) =>
      `**${i + 1}. ${d.symbol}** — ${d.name || d.symbol}\n` +
      `   • Price: $${d.price.toFixed(2)} (${d.changePercent >= 0 ? '+' : ''}${d.changePercent.toFixed(2)}%)\n` +
      `   • Signal: ${signalLabel(d.signal)}\n` +
      `   • Volatility: ${d.volatility}\n` +
      `   • AI Take: ${d.signal === 'STRONG BUY' ? 'Highest conviction buy. Strong institutional demand detected.' : d.signal === 'BUY' ? 'Positive momentum. Suitable for swing entry.' : 'Neutral — monitor for a cleaner setup.'}`
    ).join('\n\n') +
    `\n\n> *Recommendations are AI-generated signals, not financial advice. Always do your own research.*`;

  return { response, symbol: top3[0]?.symbol || 'AAPL', relatedStocks: top3.slice(1).map((d) => d.symbol) };
};

const generateMomentumResponse = async () => {
  const allSymbols = Object.keys(MOCK_STOCKS);
  const details = await Promise.all(allSymbols.map((s) => getStockDetails(s)));
  const sorted = [...details].sort((a, b) => b.changePercent - a.changePercent);
  const top5 = sorted.slice(0, 5);

  const response =
    `**Top 5 Momentum Stocks Right Now 🚀**\n\n` +
    top5.map((d, i) =>
      `**${i + 1}. ${d.symbol}** — ${d.changePercent >= 0 ? '+' : ''}${d.changePercent.toFixed(2)}%\n` +
      `   Price: $${d.price.toFixed(2)} | Signal: ${signalLabel(d.signal)} | Volatility: ${d.volatility}`
    ).join('\n\n') +
    `\n\nThese stocks are showing the strongest relative price performance in the current session. ` +
    `High momentum often precedes continuation — but watch for volume confirmation before entering.`;

  return { response, symbol: top5[0]?.symbol || 'TSLA', relatedStocks: top5.slice(1).map((d) => d.symbol) };
};

const generatePortfolioAdviceResponse = () => {
  const response =
    `**AI Portfolio Management Tips 📊**\n\n` +
    `Here are some general guidelines for managing your paper portfolio effectively:\n\n` +
    `• **Diversification:** Spread capital across different sectors (tech, finance, healthcare) to reduce concentration risk.\n` +
    `• **Position Sizing:** Never allocate more than 10–15% of your portfolio to a single position.\n` +
    `• **Stop Losses:** Consider closing a position if it drops 8–10% from your entry price.\n` +
    `• **Auto-Trade:** Enable the AI auto-trade feature to let the model execute STRONG BUY/SELL signals automatically.\n` +
    `• **Review Regularly:** Check your open positions daily and close underperformers before they drag down overall returns.\n\n` +
    `Use the **Paper Portfolio** page to view your current positions, P&L, and trade history.`;

  return { response, symbol: null, relatedStocks: [] };
};

const generateAnalyzeResponse = async (symbols, originalMessage) => {
  const sym = symbols[0] || 'AAPL';
  const d = await getStockDetails(sym);
  const rsi = syntheticRsi(d.changePercent, d.volatility);

  const response =
    `**Full AI Analysis — ${sym}**\n\n` +
    `**${d.name || sym}** is currently priced at **$${d.price.toFixed(2)}** ` +
    `(${d.changePercent >= 0 ? '+' : ''}${d.changePercent.toFixed(2)}% today).\n\n` +
    `**Technical Overview:**\n` +
    `• **AI Signal:** ${signalLabel(d.signal)}\n` +
    `• **Synthetic RSI:** ${rsi} — ${rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral'}\n` +
    `• **Volatility:** ${d.volatility}\n` +
    `• **Today's Range:** $${d.low?.toFixed(2) || 'N/A'} – $${d.high?.toFixed(2) || 'N/A'}\n` +
    `• **Volume:** ${d.volume ? d.volume.toLocaleString() : 'N/A'} shares\n\n` +
    `**AI Commentary:**\n` +
    (d.signal === 'STRONG BUY'
      ? `${sym} is showing exceptional strength. Volume is confirming the breakout and the AI model has detected strong accumulation by institutional players. This is a high-conviction long setup.`
      : d.signal === 'BUY'
        ? `${sym} presents a favourable risk/reward opportunity. The trend is intact and momentum indicators support continued upside. A measured long position is warranted.`
        : d.signal === 'HOLD'
          ? `${sym} is in a neutral phase. No clear directional catalyst exists right now. The AI recommends monitoring but waiting for a higher-conviction setup before adding exposure.`
          : d.signal === 'SELL'
            ? `${sym} is showing weakness. Distribution is occurring and the bearish momentum could persist. Reduce or avoid long exposure until the trend stabilises.`
            : `${sym} is exhibiting strong bearish signals. The AI model flags elevated downside risk. Consider short-selling (in a live account) or avoid entirely.`);

  return { response, symbol: sym, relatedStocks: symbols.slice(1, 4) };
};

// ---------------------------------------------------------------------------
// Main Handler
// ---------------------------------------------------------------------------

/**
 * @desc    Process a conversational AI trading query.
 * @route   POST /api/ai-chat/query
 * @access  Private
 * @body    { message: String, symbol?: String }
 */
const handleChatQuery = async (req, res) => {
  try {
    const { message, symbol } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ message: 'A non-empty message is required.' });
    }

    const lower = message.toLowerCase();

    // --- Intent Detection ---
    let intent;
    if ((lower.includes('why')) && (lower.includes('bullish') || lower.includes('bearish') || lower.includes(' up') || lower.includes(' down'))) {
      intent = 'explain';
    } else if (lower.includes('compare')) {
      intent = 'compare';
    } else if (lower.includes('best') || lower.includes('top') || lower.includes('recommend')) {
      intent = 'recommend';
    } else if (lower.includes('momentum')) {
      intent = 'momentum';
    } else if (lower.includes('portfolio')) {
      intent = 'portfolio';
    } else {
      intent = 'analyze';
    }

    // Extract symbols from the message; fall back to req.body.symbol or 'AAPL'
    const detectedSymbols = extractSymbols(message);
    if (symbol && !detectedSymbols.includes(symbol.toUpperCase())) {
      detectedSymbols.unshift(symbol.toUpperCase());
    }
    if (detectedSymbols.length === 0) {
      detectedSymbols.push('AAPL');
    }

    // --- Dispatch to intent handler ---
    let result;
    switch (intent) {
      case 'explain':
        result = await generateExplainResponse(detectedSymbols, message);
        break;
      case 'compare':
        result = await generateCompareResponse(detectedSymbols);
        break;
      case 'recommend':
        result = await generateRecommendResponse();
        break;
      case 'momentum':
        result = await generateMomentumResponse();
        break;
      case 'portfolio':
        result = generatePortfolioAdviceResponse();
        break;
      case 'analyze':
      default:
        result = await generateAnalyzeResponse(detectedSymbols, message);
        break;
    }

    return res.json({
      response: result.response,
      intent,
      symbol: result.symbol,
      timestamp: new Date().toISOString(),
      relatedStocks: result.relatedStocks || []
    });
  } catch (error) {
    console.error('handleChatQuery error:', error.message);
    return res.status(500).json({ message: 'AI chat query failed', error: error.message });
  }
};

module.exports = { handleChatQuery };
