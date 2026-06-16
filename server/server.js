/**
 * @file server.js
 * @description Production-hardened Express + Socket.io server.
 *              Features: Winston logging, Morgan HTTP logs, performance monitoring,
 *              enhanced security headers, Redis caching, graceful shutdown.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const http = require('http');
const morgan = require('morgan');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');
const { performanceMonitor, getMetrics } = require('./middleware/performanceMonitor');
const { notFound, globalErrorHandler } = require('./middleware/errorHandler');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const stockRoutes = require('./routes/stockRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const alertRoutes = require('./routes/alertRoutes');
const newsRoutes = require('./routes/newsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const predictionRoutes = require('./routes/predictionRoutes');

// Controllers & Models
const { MOCK_STOCKS, getStockDetails } = require('./controllers/stockController');
const Alert = require('./models/Alert');

// Load environment variables
dotenv.config();

// ─── DB Connections ───────────────────────────────────────────────────────────
connectDB();
connectRedis(); // Gracefully degrades if Redis is unavailable

// ─── App & HTTP Server ────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? ALLOWED_ORIGINS : '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ─── Security Middleware ──────────────────────────────────────────────────────

// Helmet — comprehensive HTTP security headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", ...ALLOWED_ORIGINS],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ALLOWED_ORIGINS : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many requests from this IP. Please try again in 10 minutes.' },
  handler: (req, res, next, options) => {
    logger.warn(`[Rate Limit] IP ${req.ip} exceeded API rate limit`);
    res.status(options.statusCode).json(options.message);
  },
});

// Stricter auth rate limiter (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Only 10 auth attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many login attempts. Please try again in 15 minutes.' },
  handler: (req, res, next, options) => {
    logger.warn(`[Auth Rate Limit] IP ${req.ip} exceeded auth rate limit on ${req.path}`);
    res.status(options.statusCode).json(options.message);
  },
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── HTTP Logging (Morgan → Winston) ─────────────────────────────────────────
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, { stream: logger.stream }));

// ─── Performance Monitoring ───────────────────────────────────────────────────
app.use(performanceMonitor);

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Limit payload size
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', predictionRoutes);

// ─── Health & Metrics Endpoints ───────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Real-Time AI Stock Prediction Platform API',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

app.get('/api/metrics', (req, res) => {
  // In production, secure this with admin middleware
  res.json(getMetrics());
});

// ─── Socket.io Events ─────────────────────────────────────────────────────────
let connectedClients = 0;

io.on('connection', (socket) => {
  connectedClients++;
  logger.info(`[Socket] Client connected: ${socket.id} | Total: ${connectedClients}`);

  socket.on('disconnect', (reason) => {
    connectedClients--;
    logger.debug(`[Socket] Client disconnected: ${socket.id} | Reason: ${reason} | Total: ${connectedClients}`);
  });

  socket.on('error', (err) => {
    logger.error(`[Socket] Error on ${socket.id}: ${err.message}`);
  });

  // Subscribe to specific stock rooms
  socket.on('subscribe-stock', (symbol) => {
    socket.join(`stock:${symbol}`);
    logger.debug(`[Socket] ${socket.id} subscribed to stock:${symbol}`);
  });

  socket.on('unsubscribe-stock', (symbol) => {
    socket.leave(`stock:${symbol}`);
  });
});

// ─── Live Stock Tick Broadcaster ─────────────────────────────────────────────
let tickInterval;

const startTickBroadcast = () => {
  tickInterval = setInterval(async () => {
    try {
      const symbols = Object.keys(MOCK_STOCKS);
      const tickedDetails = await Promise.all(symbols.map(sym => getStockDetails(sym)));

      // Broadcast live stock feed
      io.emit('stock-ticks', tickedDetails);

      // Check and fire price alerts
      const activeAlerts = await Alert.find({ isActive: true });
      for (const alert of activeAlerts) {
        const currentTick = tickedDetails.find(t => t.symbol === alert.symbol);
        if (!currentTick) continue;

        const isTriggered =
          (alert.type === 'ABOVE' && currentTick.price >= alert.targetPrice) ||
          (alert.type === 'BELOW' && currentTick.price <= alert.targetPrice);

        if (isTriggered) {
          logger.info(`[Alert] Triggered: ${alert.symbol} crossed ${alert.type} $${alert.targetPrice}`, {
            userId: alert.user,
            currentPrice: currentTick.price,
          });

          io.emit(`alert-triggered-${alert.user}`, {
            _id: alert._id,
            symbol: alert.symbol,
            targetPrice: alert.targetPrice,
            currentPrice: currentTick.price,
            type: alert.type,
            message: `PRICE ALERT: ${alert.symbol} crossed ${alert.type.toLowerCase()} $${alert.targetPrice}! Current: $${currentTick.price.toFixed(2)}`,
          });

          alert.isActive = false;
          await alert.save();
        }
      }
    } catch (error) {
      logger.error(`[Socket Tick] Broadcast error: ${error.message}`, { stack: error.stack });
    }
  }, 3500);
};

startTickBroadcast();

// ─── Error Handlers ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(globalErrorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`🚀 Server launched in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const gracefulShutdown = async (signal) => {
  logger.info(`[Shutdown] Received ${signal}. Shutting down gracefully...`);

  clearInterval(tickInterval);

  server.close(async () => {
    logger.info('[Shutdown] HTTP server closed.');
    try {
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      logger.info('[Shutdown] MongoDB connection closed.');
    } catch (err) {
      logger.error('[Shutdown] Error closing MongoDB:', err);
    }
    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    logger.error('[Shutdown] Forced exit after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error(`[Uncaught Exception] ${err.message}`, { stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`[Unhandled Rejection] at: ${promise}`, { reason });
  process.exit(1);
});

module.exports = { app, server };
