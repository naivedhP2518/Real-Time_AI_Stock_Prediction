const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const stockRoutes = require('./routes/stockRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const alertRoutes = require('./routes/alertRoutes');
const newsRoutes = require('./routes/newsRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Controllers & Models
const { MOCK_STOCKS, getStockDetails } = require('./controllers/stockController');
const Alert = require('./models/Alert');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Configure Socket.io with CORS limits
const io = new Server(server, {
  cors: {
    origin: '*', // For development; narrow down in production
    methods: ['GET', 'POST']
  }
});

// 1. Advanced Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Turn off for local development with charts/CDNs
}));

// 2. Global Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes window
  max: 200, // Limit each IP to 200 requests per window
  message: { message: 'Too many requests from this IP. Please try again after 10 minutes.' }
});
app.use('/api/', apiLimiter);

// Enable CORS with support for frontend clients
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logger for backend audit
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.path}`);
  next();
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/admin', adminRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Stock Platform Auth, Portfolio, News & Alerts APIs are active!' });
});

// Socket.io connection desk
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// Broadcast stock price ticks and verify Price Target alerts every 3.5 seconds
setInterval(async () => {
  try {
    const symbols = Object.keys(MOCK_STOCKS);
    const tickPromises = symbols.map(sym => getStockDetails(sym));
    const tickedDetails = await Promise.all(tickPromises);
    
    // Broadcast live stock quotes feed
    io.emit('stock-ticks', tickedDetails);
    
    // Asynchronous Event-Driven Alert triggers
    const activeAlerts = await Alert.find({ isActive: true });
    if (activeAlerts.length > 0) {
      for (const alert of activeAlerts) {
        const currentTick = tickedDetails.find(t => t.symbol === alert.symbol);
        if (!currentTick) continue;
        
        let isTriggered = false;
        if (alert.type === 'ABOVE' && currentTick.price >= alert.targetPrice) {
          isTriggered = true;
        } else if (alert.type === 'BELOW' && currentTick.price <= alert.targetPrice) {
          isTriggered = true;
        }
        
        if (isTriggered) {
          console.log(`[ALERT ACTIVE] Price trigger crossed for ${alert.symbol}: Target $${alert.targetPrice}, Current $${currentTick.price}`);
          
          // Emit direct targeted websocket payload
          io.emit(`alert-triggered-${alert.user}`, {
            _id: alert._id,
            symbol: alert.symbol,
            targetPrice: alert.targetPrice,
            currentPrice: currentTick.price,
            type: alert.type,
            message: `CRITICAL PRICE ALERT: ${alert.symbol} crossed ${alert.type.toLowerCase()} $${alert.targetPrice}! Current trading price is $${currentTick.price.toFixed(2)}.`
          });
          
          // Deactivate so it only alerts once
          alert.isActive = false;
          await alert.save();
        }
      }
    }
    
  } catch (error) {
    console.error('Socket Broadcast Tick and Alert Error:', error.message);
  }
}, 3500);

// 404 Route handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Global Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

// Listen on HTTP server
server.listen(PORT, () => {
  console.log(`Server launched successfully in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
