const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const stockRoutes = require('./routes/stockRoutes');
const { MOCK_STOCKS, getStockDetails } = require('./controllers/stockController');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Configure Socket.io with CORS limits
const io = new Server(server, {
  cors: {
    origin: '*', // For demo development; can narrow down in production
    methods: ['GET', 'POST']
  }
});

// Enable CORS with support for frontend clients
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic request logger for backend audit
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.path}`);
  next();
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Stock Prediction Auth & Real-Time Socket API is fully active!' });
});

// Socket.io Real-Time Broadcast Loop
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// Broadcast stock price ticks every 3.5 seconds to connected socket clients
setInterval(async () => {
  try {
    const symbols = Object.keys(MOCK_STOCKS);
    const tickPromises = symbols.map(sym => getStockDetails(sym));
    const tickedDetails = await Promise.all(tickPromises);
    
    // Broadcast real-time stock quotes feed
    io.emit('stock-ticks', tickedDetails);
  } catch (error) {
    console.error('Socket Broadcast Tick Error:', error.message);
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

// Listen on HTTP server (which holds express app and socket.io)
server.listen(PORT, () => {
  console.log(`Server launched successfully in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
