/**
 * @file performanceMonitor.js
 * @description Request performance tracking middleware.
 *              Logs response times, flags slow requests (>500ms),
 *              and tracks endpoint-level metrics.
 */

const { performance } = require('perf_hooks');
const logger = require('../utils/logger');

// ─── In-memory metrics store ──────────────────────────────────────────────────
const metrics = {
  requests: 0,
  errors: 0,
  totalResponseTime: 0,
  slowRequests: 0,
  endpoints: {},
};

const SLOW_THRESHOLD_MS = 500;

// ─── Performance Middleware ───────────────────────────────────────────────────
const performanceMonitor = (req, res, next) => {
  const startTime = performance.now();
  metrics.requests++;

  // Intercept response finish to capture timing
  res.on('finish', () => {
    const duration = performance.now() - startTime;
    const durationMs = Math.round(duration);

    metrics.totalResponseTime += durationMs;

    if (res.statusCode >= 400) {
      metrics.errors++;
    }

    // Track per-endpoint stats
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    if (!metrics.endpoints[endpoint]) {
      metrics.endpoints[endpoint] = { count: 0, totalTime: 0, avgTime: 0, errors: 0 };
    }
    metrics.endpoints[endpoint].count++;
    metrics.endpoints[endpoint].totalTime += durationMs;
    metrics.endpoints[endpoint].avgTime = Math.round(
      metrics.endpoints[endpoint].totalTime / metrics.endpoints[endpoint].count
    );
    if (res.statusCode >= 400) {
      metrics.endpoints[endpoint].errors++;
    }

    // Flag and log slow requests
    if (durationMs > SLOW_THRESHOLD_MS) {
      metrics.slowRequests++;
      logger.warn(`[SLOW REQUEST] ${endpoint} took ${durationMs}ms`, {
        url: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        durationMs,
        userId: req.user?._id,
      });
    } else {
      logger.debug(`[PERF] ${req.method} ${req.originalUrl} → ${res.statusCode} (${durationMs}ms)`);
    }
  });

  next();
};

// ─── Metrics Summary Getter ───────────────────────────────────────────────────
const getMetrics = () => ({
  totalRequests: metrics.requests,
  totalErrors: metrics.errors,
  errorRate: metrics.requests > 0
    ? ((metrics.errors / metrics.requests) * 100).toFixed(2) + '%'
    : '0%',
  avgResponseTimeMs: metrics.requests > 0
    ? Math.round(metrics.totalResponseTime / metrics.requests)
    : 0,
  slowRequests: metrics.slowRequests,
  topEndpoints: Object.entries(metrics.endpoints)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {}),
});

// ─── Reset metrics (useful for testing) ──────────────────────────────────────
const resetMetrics = () => {
  metrics.requests = 0;
  metrics.errors = 0;
  metrics.totalResponseTime = 0;
  metrics.slowRequests = 0;
  metrics.endpoints = {};
};

module.exports = { performanceMonitor, getMetrics, resetMetrics };
