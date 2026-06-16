# 🏗️ System Architecture

## Overview

The platform is a **microservices-inspired** full-stack application with three independently deployable services communicating via HTTP and WebSocket.

---

## High-Level Architecture

```
╔══════════════════════════════════════════════════════════════════╗
║                         USER BROWSER                            ║
║                     http://localhost:5173                        ║
╚════════════════════════════╤═════════════════════════════════════╝
                             │  HTTP/REST + WebSocket (Socket.io)
╔════════════════════════════▼═════════════════════════════════════╗
║                   REACT FRONTEND (Vite)                          ║
║  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   ║
║  │Dashboard │ │Portfolio │ │Predicts  │ │  Analytics/Admin │   ║
║  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   ║
║  ┌─────────────────────────────────────────────────────────┐    ║
║  │  AuthContext · ThemeContext · Axios Interceptor         │    ║
║  └─────────────────────────────────────────────────────────┘    ║
╚════════════════════════════╤═════════════════════════════════════╝
                             │
         ┌───────────────────┴────────────────────┐
         │ REST API                               │ Socket.io
╔════════▼═══════════╗               ╔════════════▼═══════════════╗
║   NODE.JS EXPRESS  ║               ║   SOCKET.IO SERVER         ║
║   Port :5000       ║               ║   (same process)           ║
║                    ║               ║                            ║
║  /api/auth         ║               ║  Broadcasts:               ║
║  /api/stocks       ║               ║  • stock-ticks (3.5s)      ║
║  /api/portfolio    ║               ║  • alert-triggered-{uid}   ║
║  /api/alerts       ║               ║                            ║
║  /api/news         ║               ╚════════════════════════════╝
║  /api/admin        ║
╚════════╤═══════════╝
         │                      │ HTTP
    ┌────▼─────┐         ┌──────▼────────────────────┐
    │ MongoDB  │         │  PYTHON ML SERVICE         │
    │  :27017  │         │  Flask + Gunicorn :5001    │
    │          │         │                            │
    │  Users   │         │  /predict     (LSTM)       │
    │  Portfolio│        │  /train-model (async)      │
    │  Holdings │        │  /news/:symbol (NLP)       │
    │  Alerts  │         │  /model-status             │
    │  Watchlist│        └────────────────────────────┘
    └────┬─────┘
         │
    ┌────▼─────┐
    │  REDIS   │
    │  :6379   │
    │ (cache)  │
    └──────────┘
```

---

## Data Flow — Stock Prediction

```
User clicks "Predict AAPL"
        │
        ▼
React → POST /api/predict (Express)
        │
        ▼
Express → POST /predict (Flask ML)
        │
        ├── fetch_stock_history("AAPL", period="3m") [yfinance]
        ├── calculate_technical_indicators(df)
        │      └─ SMA20, RSI14, MACD, EMA12/26, Bollinger Bands
        ├── prepare_latest_sequence(60 days)
        ├── model.predict(sequence) [LSTM inference]
        ├── inverse_transform(scaled_pred) [MinMaxScaler]
        ├── decision_fusion_algorithm(price_drift, rsi, macd)
        │      └─ score → BUY/SELL/HOLD + confidence
        └── recursive 7-day forecast
        │
        ▼
Flask → JSON response (Express → React)
        │
        ▼
React renders: PriceChart + SignalBadge + ForecastTable
```

---

## Data Flow — Real-Time Ticks

```
Every 3.5 seconds:
        │
        ▼
Server setInterval → getStockDetails(all_symbols) [Finnhub API + Mock]
        │
        ├── io.emit('stock-ticks', tickedDetails)   [broadcast to all]
        │
        └── check Alert.find({ isActive: true })
               └── if price crosses threshold:
                     io.emit('alert-triggered-{userId}', alertData)
                     alert.isActive = false; alert.save()
```

---

## Database Schema

```
Users ──────────────────────────────────────────────────────
  _id, name, email, password (bcrypt), isAdmin, timestamps

Portfolios ─────────────────────────────────────────────────
  _id, user (ref: User), cash, totalInvested, timestamps

Holdings ────────────────────────────────────────────────────
  _id, user (ref: User), symbol, quantity, avgPrice, timestamps

Transactions ────────────────────────────────────────────────
  _id, user (ref: User), type (BUY/SELL), symbol,
  quantity, price, total, timestamps

Alerts ──────────────────────────────────────────────────────
  _id, user (ref: User), symbol, targetPrice,
  type (ABOVE/BELOW), isActive, timestamps

Watchlist ───────────────────────────────────────────────────
  _id, user (ref: User, unique), symbols [String],  timestamps
```

---

## Security Architecture

```
Request → Helmet (headers) → CORS check → Rate Limiter
       → express-validator (sanitize) → JWT verify → Controller
       → MongoDB (indexed queries) → Response
```

**Rate Limiter Tiers:**
- General API: 200 req / 10 min per IP
- Auth endpoints: 10 req / 15 min per IP (brute-force protection)

---

## Caching Strategy

| Data | TTL | Cache Key Pattern |
|------|-----|------------------|
| Stock quotes | 30s | `stock:{symbol}` |
| News feed | 5m | `news:{symbol}` |
| ML predictions | 2m | `pred:{symbol}` |
| Admin stats | 10m | `admin:stats` |

Redis gracefully degrades — if unavailable, all requests hit MongoDB/APIs directly.

---

## ML Model Architecture

```
LSTM Input: (batch=32, timesteps=60, features=8)
  Features: [close, open, high, low, volume, sma_20, rsi, macd]

┌─────────────────────────────────┐
│  LSTM Layer 1: 50 units         │
│  return_sequences=True          │
│  dropout=0.2                    │
├─────────────────────────────────┤
│  LSTM Layer 2: 50 units         │
│  dropout=0.2                    │
├─────────────────────────────────┤
│  Dense: 25 units                │
├─────────────────────────────────┤
│  Dense Output: 1 (price)        │
└─────────────────────────────────┘

Optimizer: Adam | Loss: MSE
Scaler: MinMaxScaler (feature-wise)
Training: yfinance historical data (2yr default)
```

---

## Docker Network

```
stock_net (bridge: 172.20.0.0/24)
  │
  ├── mongo      (mongo:7.0)
  ├── redis      (redis:7.2-alpine)
  ├── server     (node:20-alpine, non-root)
  ├── ml-service (python:3.11-slim, non-root)
  └── client     (nginx:1.25-alpine)

Volumes:
  mongo_data   → /data/db
  redis_data   → /data
  ml_models    → /app/trained_models
  server_logs  → /app/logs
```
