/**
 * @file logger.js
 * @description Centralized Winston logging system with daily file rotation.
 *              Provides structured logging for all environments.
 *              Levels: error > warn > info > http > debug
 */

const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ─── Custom Format ────────────────────────────────────────────────────────────
const customFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

const consoleFormat = format.combine(
  format.colorize({ all: true }),
  format.timestamp({ format: 'HH:mm:ss' }),
  format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `[${timestamp}] ${level}: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    if (stack) log += `\n${stack}`;
    return log;
  })
);

// ─── Logger Instance ──────────────────────────────────────────────────────────
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: customFormat,
  defaultMeta: { service: 'stock-platform-api' },
  transports: [
    // Combined log (all levels)
    new transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    }),
    // Error-only log
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    }),
    // HTTP access log
    new transports.File({
      filename: path.join(logsDir, 'http.log'),
      level: 'http',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3,
    }),
  ],
});

// ─── Console Output (non-production) ─────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({ format: consoleFormat }));
}

// ─── Morgan Stream Integration ────────────────────────────────────────────────
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

module.exports = logger;
