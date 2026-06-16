/**
 * @file cache.js
 * @description Generic Express caching middleware using Redis.
 *              Gracefully degrades when Redis is unavailable.
 *              TTLs: stock quotes → 30s, news → 5min, predictions → 2min
 */

const { getCache, setCache } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Creates a cache middleware with specified TTL.
 * @param {number} ttlSeconds - Cache time-to-live in seconds
 * @param {Function} [keyFn] - Optional custom key builder (req) => string
 */
const cacheMiddleware = (ttlSeconds = 30, keyFn = null) => {
  return async (req, res, next) => {
    try {
      const cacheKey = keyFn
        ? keyFn(req)
        : `route:${req.method}:${req.originalUrl}`;

      // Try to serve from cache
      const cached = await getCache(cacheKey);
      if (cached) {
        logger.debug(`[Cache HIT] ${cacheKey}`);
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-TTL', ttlSeconds);
        return res.json(cached);
      }

      // Cache miss — intercept json() to store result
      logger.debug(`[Cache MISS] ${cacheKey}`);
      res.setHeader('X-Cache', 'MISS');

      const originalJson = res.json.bind(res);
      res.json = async (data) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          await setCache(cacheKey, data, ttlSeconds);
        }
        return originalJson(data);
      };

      next();
    } catch (err) {
      // Never let cache errors block the request
      logger.warn(`[Cache] Middleware error: ${err.message}`);
      next();
    }
  };
};

// ─── Pre-configured Cache Tiers ───────────────────────────────────────────────

/** 30 seconds — for real-time stock quotes */
const cacheStockQuote = cacheMiddleware(30, (req) => `stock:${req.params.symbol || req.query.symbol}`);

/** 5 minutes — for news feeds */
const cacheNews = cacheMiddleware(300, (req) => `news:${req.params.symbol || 'general'}`);

/** 2 minutes — for ML predictions */
const cachePrediction = cacheMiddleware(120, (req) => `pred:${req.body?.symbol || req.params.symbol}`);

/** 10 minutes — for admin stats */
const cacheAdminStats = cacheMiddleware(600, () => 'admin:stats');

module.exports = {
  cacheMiddleware,
  cacheStockQuote,
  cacheNews,
  cachePrediction,
  cacheAdminStats,
};
