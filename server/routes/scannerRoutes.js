const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getStockDetails, MOCK_STOCKS } = require('../controllers/stockController');

// ---------------------------------------------------------------------------
// Extended universe of symbols available for scanning
// ---------------------------------------------------------------------------
const SCANNER_UNIVERSE = [
  'AAPL', 'TSLA', 'NVDA', 'AMZN', 'MSFT', 'GOOGL', 'META', 'NFLX', 'AMD', 'INTC',
  'BABA', 'COIN', 'SQ', 'PYPL', 'SHOP', 'SNAP', 'UBER', 'LYFT', 'ABNB', 'DASH',
  'PLTR', 'RIVN', 'LCID', 'NIO', 'XPEV', 'SOFI', 'HOOD', 'CLOV', 'GME', 'AMC',
  'SPY', 'QQQ', 'ARKK', 'GLD', 'SLV', 'USO', 'TLT', 'HYG', 'VXX', 'UVXY',
  'JPM', 'BAC', 'GS', 'MS', 'C', 'WFC', 'V', 'MA', 'AXP', 'BRK',
  'JNJ', 'PFE', 'MRNA', 'BNTX', 'ABBV', 'UNH', 'CVS', 'WMT', 'TGT', 'COST'
];

/**
 * Sector map — used to enrich scanner results.
 * Falls back to 'Technology' for unknown symbols.
 */
const SECTOR_MAP = {
  AAPL: 'Technology', MSFT: 'Technology', NVDA: 'Technology', GOOGL: 'Technology',
  AMD: 'Technology', INTC: 'Semiconductors', INTC: 'Technology',
  META: 'Social Media', NFLX: 'Entertainment', SNAP: 'Social Media',
  TSLA: 'Automotive', RIVN: 'Automotive', LCID: 'Automotive', NIO: 'Automotive', XPEV: 'Automotive',
  AMZN: 'E-Commerce', SHOP: 'E-Commerce', UBER: 'Mobility', LYFT: 'Mobility',
  ABNB: 'Hospitality', DASH: 'Food Delivery',
  COIN: 'Crypto', HOOD: 'Fintech', SOFI: 'Fintech',
  SQ: 'Fintech', PYPL: 'Fintech',
  PLTR: 'Data Analytics', CLOV: 'Healthcare', BABA: 'E-Commerce',
  GME: 'Retail', AMC: 'Entertainment',
  SPY: 'ETF', QQQ: 'ETF', ARKK: 'ETF',
  GLD: 'Commodities', SLV: 'Commodities', USO: 'Commodities',
  TLT: 'Bonds', HYG: 'Bonds', VXX: 'Volatility', UVXY: 'Volatility',
  JPM: 'Banking', BAC: 'Banking', GS: 'Banking', MS: 'Banking',
  C: 'Banking', WFC: 'Banking', V: 'Fintech', MA: 'Fintech',
  AXP: 'Fintech', BRK: 'Conglomerate',
  JNJ: 'Healthcare', PFE: 'Pharma', MRNA: 'Biotech', BNTX: 'Biotech',
  ABBV: 'Pharma', UNH: 'Healthcare', CVS: 'Healthcare',
  WMT: 'Retail', TGT: 'Retail', COST: 'Retail'
};

const PATTERNS = ['Breakout', 'Pullback', 'Consolidation', 'Trending', 'Reversal'];

// ---------------------------------------------------------------------------
// GET /api/scanner/results
// ---------------------------------------------------------------------------

/**
 * @desc    Scan a universe of stocks and apply optional filters.
 * @route   GET /api/scanner/results
 * @access  Private
 * @query   filter      - bullish | bearish | volume_spike | oversold | overbought
 *          sector      - e.g. Technology, Banking, Biotech
 *          minVolume   - minimum volume threshold (number)
 *          maxRsi      - maximum RSI threshold (number)
 */
router.get('/results', protect, async (req, res) => {
  try {
    const { filter, sector, minVolume, maxRsi } = req.query;

    // Build the deduplicated scan list (MOCK_STOCKS first, then extras up to 30)
    const mockKeys = Object.keys(MOCK_STOCKS);
    const extras = [
      'AMD', 'INTC', 'COIN', 'SQ', 'PYPL', 'NFLX', 'META', 'GOOGL',
      'JPM', 'BAC', 'JNJ', 'PFE', 'MRNA', 'WMT', 'COST', 'GLD', 'SPY', 'QQQ'
    ];

    const symbolSet = new Set([...mockKeys, ...extras]);
    const symbols = Array.from(symbolSet).slice(0, 30);

    // Fetch details for all symbols concurrently
    const results = await Promise.all(
      symbols.map(async (sym) => {
        try {
          const details = await getStockDetails(sym);

          // Scanner-specific derived metrics
          const rsi = +(30 + Math.random() * 50).toFixed(1);
          const volume = Math.floor(1_000_000 + Math.random() * 50_000_000);
          const avgVolume = Math.floor(5_000_000 + Math.random() * 20_000_000);
          const volumeRatio = +(volume / avgVolume).toFixed(2);
          const pattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
          const aiConfidence = +(70 + Math.random() * 28).toFixed(1);

          return {
            symbol: sym,
            name: details.name || sym,
            price: details.price,
            change: details.change,
            changePercent: details.changePercent,
            signal: details.signal,
            rsi,
            volume,
            avgVolume,
            volumeRatio,
            pattern,
            sector: SECTOR_MAP[sym] || 'Technology',
            volatility: details.volatility,
            aiConfidence
          };
        } catch (innerErr) {
          console.warn(`[Scanner] Could not fetch data for ${sym}:`, innerErr.message);
          return null;
        }
      })
    );

    // Strip any nulls from failed fetches
    let filtered = results.filter(Boolean);

    // Apply filters
    if (filter === 'bullish') {
      filtered = filtered.filter((r) => r.signal.includes('BUY'));
    } else if (filter === 'bearish') {
      filtered = filtered.filter((r) => r.signal.includes('SELL'));
    } else if (filter === 'volume_spike') {
      filtered = filtered.filter((r) => r.volumeRatio > 1.5);
    } else if (filter === 'oversold') {
      filtered = filtered.filter((r) => r.rsi < 35);
    } else if (filter === 'overbought') {
      filtered = filtered.filter((r) => r.rsi > 70);
    }

    if (sector) {
      filtered = filtered.filter((r) => r.sector.toLowerCase() === sector.toLowerCase());
    }

    if (minVolume) {
      const min = parseInt(minVolume, 10);
      if (!isNaN(min)) filtered = filtered.filter((r) => r.volume >= min);
    }

    if (maxRsi) {
      const max = parseFloat(maxRsi);
      if (!isNaN(max)) filtered = filtered.filter((r) => r.rsi <= max);
    }

    // Sort by AI confidence descending for best results first
    filtered.sort((a, b) => b.aiConfidence - a.aiConfidence);

    return res.json({
      results: filtered,
      total: filtered.length,
      timestamp: new Date().toISOString(),
      filters: { filter: filter || null, sector: sector || null, minVolume: minVolume || null, maxRsi: maxRsi || null }
    });
  } catch (error) {
    console.error('[Scanner] Scan error:', error.message);
    return res.status(500).json({ message: 'Scanner error', error: error.message });
  }
});

module.exports = router;
