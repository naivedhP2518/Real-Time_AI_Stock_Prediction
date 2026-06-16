# 🚀 Setup & Development Guide

## Prerequisites

| Tool | Min Version | Install |
|------|------------|---------|
| Node.js | 20.x | [nodejs.org](https://nodejs.org) |
| npm | 10.x | Included with Node.js |
| Python | 3.11+ | [python.org](https://python.org) |
| MongoDB | 7.0 | [mongodb.com](https://www.mongodb.com/try/download/community) |
| Git | 2.x | [git-scm.com](https://git-scm.com) |
| Docker (optional) | 24+ | [docker.com](https://docker.com) |

---

## 1. Clone the Repository

```bash
git clone https://github.com/yourusername/stock-prediction-platform.git
cd stock-prediction-platform
```

---

## 2. Environment Setup

```bash
# Copy example env file
cp server/.env.example server/.env
```

Edit `server/.env` with your values:
```env
MONGO_URI=mongodb://localhost:27017/stock-prediction
JWT_SECRET=your_minimum_32_character_secret_here
FINNHUB_API_KEY=your_finnhub_api_key   # Get free at finnhub.io
```

**Get Finnhub API Key (Free):**
1. Go to [finnhub.io](https://finnhub.io)
2. Create free account
3. Copy your API key from the dashboard

---

## 3. MongoDB Setup

### Option A — MongoDB Community (Local)
```bash
# Windows (with Chocolatey)
choco install mongodb

# Start MongoDB service
net start MongoDB

# Verify connection
mongosh mongodb://localhost:27017
```

### Option B — MongoDB Atlas (Cloud, Free Tier)
1. Create account at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free M0 cluster
3. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/stock-prediction`
4. Set in `.env` as `MONGO_URI`

---

## 4. Backend Server

```bash
cd server
npm install
npm run dev
```

**Expected output:**
```
[nodemon] starting `node server.js`
🚀 Server launched in development mode on port 5000
[MongoDB] Connection established successfully.
```

**Verify:** `http://localhost:5000` → should return `{ "status": "online" }`

---

## 5. ML Service

```bash
cd ml-service

# Windows
py -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start service
py app.py       # Windows
python app.py   # Mac/Linux
```

**Expected output:**
```
Starting QUANTUMSTOCKS ML Microservice listening on port 5001...
```

**Verify:** `http://localhost:5001` → `{ "status": "online" }`

> **Note:** First prediction for any stock will trigger on-the-fly training (takes 30-60s).
> You can pre-train: `POST http://localhost:5001/train-model` with `{ "symbol": "AAPL" }`

---

## 6. React Frontend

```bash
cd client
npm install
npm run dev
```

**Expected output:**
```
VITE v8.x.x  ready in 537 ms
➜  Local:   http://localhost:5173/
```

**Open:** `http://localhost:5173` → You should see the login page.

---

## 7. Create Your First Account

1. Go to `http://localhost:5173/signup`
2. Register with name, email, password
3. You'll be redirected to the dashboard automatically
4. The first stock prediction will train the LSTM model on-the-fly

---

## 8. Running Tests

```bash
# Backend tests
cd server
npm test                  # Run all tests
npm run test:coverage     # With coverage report

# ML Service tests
cd ml-service
pytest test_predict.py -v

# E2E tests (requires all 3 services running)
npx cypress open          # Interactive mode
npx cypress run           # Headless CI mode
```

---

## 9. Useful Commands

```bash
# Reset database (development)
mongosh mongodb://localhost:27017 --eval "use stock-prediction; db.dropDatabase()"

# Check server logs
cat server/logs/combined.log
cat server/logs/error.log

# Check active ML models
curl http://localhost:5001/model-status

# Train a specific stock model
curl -X POST http://localhost:5001/train-model \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL", "epochs": 10}'

# Performance metrics
curl http://localhost:5000/api/metrics
```

---

## 10. Common Issues

### MongoDB Connection Refused
```bash
# Check if MongoDB is running
net start MongoDB         # Windows
brew services start mongodb-community  # Mac
sudo systemctl start mongod            # Linux
```

### Python `py` Not Found (Windows)
```bash
# Use Python Launcher
py --version
# Or install Python from python.org (check "Add to PATH")
```

### Port Already in Use
```bash
# Find and kill process on port (Windows PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process

# Mac/Linux
lsof -ti:5000 | xargs kill
```

### TensorFlow Not Installing
```bash
# Use CPU-only version (no GPU required)
pip install tensorflow-cpu
```

### Finnhub Rate Limit
The app includes mock stock data as fallback. If you hit API limits, mock prices are used automatically — the app keeps working.
