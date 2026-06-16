# 🚀 Real-Time AI Stock Prediction Platform

<div align="center">

![Platform Banner](https://img.shields.io/badge/QUANTUMSTOCKS-AI%20Stock%20Platform-blue?style=for-the-badge&logo=chart-line)
![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)
![TensorFlow](https://img.shields.io/badge/TensorFlow-LSTM-FF6F00?style=flat-square&logo=tensorflow)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=flat-square&logo=mongodb)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)
![License](https://img.shields.io/badge/License-ISC-green?style=flat-square)

**A full-stack, production-grade financial intelligence platform powered by LSTM deep learning, real-time WebSockets, and a React AI dashboard.**

[🌐 Live Demo](#) · [📖 API Docs](./docs/API.md) · [🏗️ Architecture](./docs/ARCHITECTURE.md) · [🚀 Setup Guide](./docs/SETUP.md)

</div>

---

## 📸 Screenshots

> Dashboard · Predictions · Portfolio · Analytics

| Dashboard | AI Predictions |
|-----------|---------------|
| Live stock tickers + portfolio summary | LSTM 7-day forecast + buy/sell signals |

| Portfolio | Analytics |
|-----------|-----------|
| Holdings, P&L, trade history | Technical indicators + sentiment |

---

## ✨ Feature Highlights

| Category | Features |
|----------|----------|
| 🔐 **Auth** | JWT, bcrypt, rate limiting, protected routes |
| 📈 **Real-Time** | Socket.io live tickers (3.5s refresh), price alerts |
| 🤖 **AI/ML** | LSTM neural network, 7-day forecast, confidence scoring |
| 📊 **Dashboard** | Interactive Recharts, candlestick, volume bars |
| 💼 **Portfolio** | Buy/sell engine, P&L tracking, transaction history |
| 📰 **Sentiment** | NLP news analysis, bullish/bearish conviction scores |
| 🔔 **Alerts** | Price target notifications via WebSocket |
| 👁️ **Watchlist** | Personalized stock tracking |
| 🛡️ **Admin** | User management, platform metrics |
| 🏗️ **DevOps** | Docker, CI/CD GitHub Actions, Redis caching |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (React + Vite)                │
│         Port 5173 │ Tailwind v4 │ Framer Motion         │
└────────────────────────┬────────────────────────────────┘
                         │ REST + WebSocket
┌────────────────────────▼────────────────────────────────┐
│              NODE.JS / EXPRESS BACKEND                  │
│    Port 5000 │ Socket.io │ JWT Auth │ Redis Cache        │
│    Routes: auth · stocks · portfolio · alerts · news    │
└──────────┬────────────────────────────┬─────────────────┘
           │ Mongoose                   │ HTTP Proxy
           ▼                            ▼
     ┌─────────┐                 ┌─────────────────┐
     │ MongoDB │                 │  PYTHON ML API  │
     │  7.0    │                 │  Flask + LSTM   │
     └─────────┘                 │  Port 5001      │
                                 └─────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Tech | Version | Purpose |
|------|---------|---------|
| React | 19 | UI framework |
| Vite | 8 | Build tool |
| Tailwind CSS | 4 | Styling |
| Framer Motion | 12 | Animations |
| Recharts | 3 | Charts |
| Socket.io Client | 4 | Real-time |
| React Router | 7 | Routing |
| Axios | 1 | HTTP client |

### Backend
| Tech | Version | Purpose |
|------|---------|---------|
| Node.js | 20 | Runtime |
| Express | 4 | Web framework |
| MongoDB | 7 | Database |
| Mongoose | 8 | ODM |
| Socket.io | 4 | WebSockets |
| JWT | 9 | Authentication |
| Helmet | 8 | Security headers |
| Winston | 3 | Logging |
| Redis/ioredis | 5 | Caching |

### ML Service
| Tech | Version | Purpose |
|------|---------|---------|
| Python | 3.11 | Runtime |
| Flask | 3 | Web framework |
| TensorFlow | 2 | LSTM model |
| scikit-learn | 1 | Preprocessing |
| yfinance | 0.2 | Stock data |
| pandas/numpy | latest | Data processing |

---

## 🚀 Quick Start

### Option A — Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/yourusername/stock-prediction-platform.git
cd stock-prediction-platform

# Copy environment file
cp server/.env.example server/.env
# Edit server/.env with your API keys

# Start all services
docker compose up --build

# App running at:
# Frontend  → http://localhost:80
# Backend   → http://localhost:5000
# ML API    → http://localhost:5001
```

### Option B — Manual Development

```bash
# 1. Backend
cd server
npm install
cp .env.example .env   # fill in values
npm run dev            # → http://localhost:5000

# 2. ML Service (separate terminal)
cd ml-service
pip install -r requirements.txt
py app.py              # → http://localhost:5001

# 3. Frontend (separate terminal)
cd client
npm install
npm run dev            # → http://localhost:5173
```

> **Requires**: Node.js 20+, Python 3.11+, MongoDB 7.0 running locally

---

## 📁 Project Structure

```
stock-prediction-platform/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── components/        # Shared components
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── LoadingSkeleton.jsx   ← NEW
│   │   │   └── ErrorBoundary.jsx     ← NEW
│   │   ├── pages/             # Route pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Predictions.jsx
│   │   │   ├── Portfolio.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── Markets.jsx
│   │   │   ├── Watchlist.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Admin.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Signup.jsx
│   │   ├── context/           # Auth + Theme context
│   │   └── services/          # API service layer
│   ├── Dockerfile             ← NEW
│   └── nginx.conf             ← NEW
│
├── server/                    # Node.js backend
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── redis.js           ← NEW
│   ├── controllers/           # Business logic
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── validators.js      ← NEW
│   │   ├── cache.js           ← NEW
│   │   ├── performanceMonitor.js ← NEW
│   │   └── errorHandler.js   ← NEW
│   ├── models/                # Mongoose schemas
│   ├── routes/                # Express routes
│   ├── tests/                 ← NEW
│   │   ├── auth.test.js
│   │   ├── stock.test.js
│   │   └── portfolio.test.js
│   ├── utils/
│   │   ├── generateToken.js
│   │   └── logger.js          ← NEW
│   ├── logs/                  # Runtime logs (gitignored)
│   ├── server.js
│   ├── Dockerfile             ← NEW
│   └── .env.example           ← NEW
│
├── ml-service/                # Python Flask ML
│   ├── models/                # LSTM architecture
│   ├── utils/                 # Data processing
│   ├── trained_models/        # Saved models
│   ├── app.py                 # Flask app
│   ├── train.py               # Training script
│   ├── test_predict.py        ← UPDATED
│   └── Dockerfile             ← NEW
│
├── cypress/                   ← NEW
│   └── e2e/
│       ├── auth.cy.js
│       └── dashboard.cy.js
│
├── .github/workflows/         ← NEW
│   ├── ci.yml
│   └── deploy.yml
│
├── docs/                      ← NEW
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── SETUP.md
│   ├── DEPLOYMENT.md
│   ├── PORTFOLIO.md
│   ├── RESUME_BULLETS.md
│   └── ROADMAP.md
│
├── docker-compose.yml         ← NEW
├── cypress.config.js          ← NEW
└── README.md                  ← THIS FILE
```

---

## 🔒 Security Features

- ✅ JWT authentication with expiry
- ✅ bcrypt password hashing (salt rounds: 10)
- ✅ Helmet.js security headers (HSTS, XSS, CSP)
- ✅ API rate limiting (200 req/10min general, 10/15min auth)
- ✅ Input sanitization via express-validator
- ✅ CORS restricted to whitelisted origins
- ✅ Non-root Docker containers
- ✅ Environment variable protection
- ✅ No sensitive data in responses (passwords stripped)

---

## 🧪 Testing

```bash
# Backend unit + integration tests
cd server
npm test

# Backend with coverage report
npm run test:coverage

# ML service tests
cd ml-service
pytest test_predict.py -v

# E2E tests (Cypress) — requires app running
npx cypress run
npx cypress open   # interactive mode
```

---

## 📊 Performance

| Metric | Target | Implementation |
|--------|--------|----------------|
| API Response | < 200ms | Redis caching (30s TTL for quotes) |
| ML Prediction | < 5s | On-demand training, model caching |
| Socket latency | < 100ms | Direct WebSocket emission |
| DB queries | Optimized | Compound indexes on hot paths |
| Frontend bundle | < 500KB | Vite code splitting |

---

## 🌐 Environment Variables

See [`server/.env.example`](./server/.env.example) for the complete list.

**Required:**
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — Minimum 32-character random string
- `FINNHUB_API_KEY` — From [finnhub.io](https://finnhub.io)

**Optional (graceful degradation):**
- `REDIS_HOST` / `REDIS_PORT` — Caching (app works without Redis)

---

## 📜 License

ISC © 2025 — Built as an advanced MERN + AI full-stack  project.

---

<div align="center">
  Built with ❤️ using React · Node.js · Python · TensorFlow · MongoDB · Socket.io
</div>
