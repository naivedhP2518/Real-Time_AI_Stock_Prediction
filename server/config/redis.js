/**
 * @file redis.js
 * @description Redis client configuration using ioredis.
 *              Includes graceful degradation — if Redis is unavailable,
 *              the app continues to work without caching.
 */

const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;
let isConnected = false;

// ─── Redis Connection ─────────────────────────────────────────────────────────
const connectRedis = () => {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB) || 0,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn('[Redis] Max retries reached. Running without cache.');
          return null; // Stop retrying
        }
        return Math.min(times * 200, 1000); // Exponential backoff
      },
      enableOfflineQueue: false,
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      isConnected = true;
      logger.info('[Redis] Connected successfully.');
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      logger.warn(`[Redis] Connection error: ${err.message}. Cache disabled.`);
    });

    redisClient.on('close', () => {
      isConnected = false;
      logger.warn('[Redis] Connection closed.');
    });

    redisClient.connect().catch((err) => {
      logger.warn(`[Redis] Failed to connect: ${err.message}. Running without cache.`);
    });

  } catch (err) {
    logger.warn(`[Redis] Initialization failed: ${err.message}. Running without cache.`);
  }
};

// ─── Safe Getters / Setters ───────────────────────────────────────────────────
const getCache = async (key) => {
  if (!isConnected || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const setCache = async (key, value, ttlSeconds = 30) => {
  if (!isConnected || !redisClient) return;
  try {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Silently fail — cache is optional
  }
};

const deleteCache = async (key) => {
  if (!isConnected || !redisClient) return;
  try {
    await redisClient.del(key);
  } catch {
    // Silently fail
  }
};

const deleteCachePattern = async (pattern) => {
  if (!isConnected || !redisClient) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) await redisClient.del(...keys);
  } catch {
    // Silently fail
  }
};

const isCacheConnected = () => isConnected;

module.exports = {
  connectRedis,
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  isCacheConnected,
};
