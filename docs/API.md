# 📡 API Documentation

> Base URL: `http://localhost:5000/api`
> All protected routes require: `Authorization: Bearer <token>`

---

## Authentication

### POST `/auth/register`
Register a new user account.

**Body:**
```json
{ "name": "John Doe", "email": "john@example.com", "password": "secret123" }
```
**Response `201`:**
```json
{ "_id": "...", "name": "John Doe", "email": "john@example.com", "token": "jwt..." }
```
**Errors:** `400` — missing fields, duplicate email, short password

---

### POST `/auth/login`
Authenticate and receive JWT token.

**Body:**
```json
{ "email": "john@example.com", "password": "secret123" }
```
**Response `200`:**
```json
{ "_id": "...", "name": "John Doe", "email": "john@example.com", "token": "jwt..." }
```
**Errors:** `401` — invalid credentials

---

### GET `/auth/profile` 🔒
Get current user profile.

**Response `200`:**
```json
{ "_id": "...", "name": "John Doe", "email": "john@example.com", "createdAt": "..." }
```

---

## Stocks

### GET `/stocks` 🔒
Get all tracked stock quotes.

**Response `200`:**
```json
[
  { "symbol": "AAPL", "name": "Apple Inc.", "price": 182.52, "change": 1.23, "changePercent": 0.68, "volume": 54231000 }
]
```

---

### GET `/stocks/:symbol` 🔒
Get detailed quote for one symbol.

**Params:** `symbol` — e.g. `AAPL`, `TSLA`, `MSFT`

**Response `200`:**
```json
{
  "symbol": "AAPL",
  "price": 182.52,
  "open": 181.00,
  "high": 183.10,
  "low": 180.50,
  "volume": 54231000,
  "marketCap": 2850000000000,
  "pe": 28.4,
  "52wHigh": 198.23,
  "52wLow": 124.17
}
```

---

### GET `/stocks/search?q=apple` 🔒
Search stocks by name or symbol.

**Query:** `q` — search term

**Response `200`:**
```json
[{ "symbol": "AAPL", "name": "Apple Inc." }]
```

---

### POST `/stocks/watchlist` 🔒
Add symbol to user watchlist.

**Body:** `{ "symbol": "TSLA" }`

**Response `200`:** `{ "message": "Added to watchlist", "watchlist": [...] }`

---

### DELETE `/stocks/watchlist/:symbol` 🔒
Remove symbol from watchlist.

**Response `200`:** `{ "message": "Removed from watchlist" }`

---

## Portfolio

### GET `/portfolio` 🔒
Get portfolio summary with all holdings.

**Response `200`:**
```json
{
  "totalValue": 15420.50,
  "totalInvested": 13200.00,
  "totalPnL": 2220.50,
  "pnlPercent": 16.82,
  "holdings": [
    { "symbol": "AAPL", "quantity": 10, "avgPrice": 165.00, "currentPrice": 182.52, "pnl": 175.20 }
  ]
}
```

---

### POST `/portfolio/buy` 🔒
Execute a buy trade.

**Body:**
```json
{ "symbol": "AAPL", "quantity": 5, "price": 182.52 }
```
**Response `201`:** `{ "message": "Buy order executed", "holding": {...} }`

---

### POST `/portfolio/sell` 🔒
Execute a sell trade.

**Body:**
```json
{ "symbol": "AAPL", "quantity": 2, "price": 185.00 }
```
**Response `200`:** `{ "message": "Sell order executed", "profit": 4.96 }`

**Errors:** `400` — insufficient shares held

---

### GET `/portfolio/transactions` 🔒
Get full transaction history.

**Response `200`:**
```json
[
  { "type": "BUY", "symbol": "AAPL", "quantity": 5, "price": 182.52, "total": 912.60, "date": "..." }
]
```

---

## Alerts

### GET `/alerts` 🔒
Get all user price alerts.

### POST `/alerts` 🔒
Create a price alert.

**Body:**
```json
{ "symbol": "TSLA", "targetPrice": 200, "type": "ABOVE" }
```

### DELETE `/alerts/:id` 🔒
Delete an alert.

---

## News & Sentiment

### GET `/news/:symbol` 🔒
Get AI-analyzed news with sentiment scores.

**Response `200`:**
```json
{
  "symbol": "AAPL",
  "overallScore": 0.32,
  "overallSentiment": "BULLISH",
  "bullishRatio": 0.67,
  "bearishRatio": 0.17,
  "articles": [
    {
      "title": "Apple reports record Q4 earnings",
      "publisher": "Reuters",
      "sentiment": "BULLISH",
      "score": 0.72
    }
  ]
}
```

---

## Admin (Admin Only)

### GET `/admin/stats` 🔒👑
Platform-wide statistics.

### GET `/admin/users` 🔒👑
List all users.

### DELETE `/admin/users/:id` 🔒👑
Delete a user.

---

## ML Microservice (Port 5001)

### GET `/`
Health check — returns `{ "status": "online" }`

### POST `/predict`
Run LSTM prediction for a stock symbol.

**Body:** `{ "symbol": "AAPL" }`

**Response `200`:**
```json
{
  "symbol": "AAPL",
  "currentPrice": 182.52,
  "predictedPrice": 185.10,
  "changePercent": 1.41,
  "trend": "UP",
  "confidence": 87.4,
  "buySellSignal": "BUY",
  "risk": "MEDIUM",
  "indicators": { "rsi": 52.3, "sma": 178.4, "macd": 1.2 },
  "futurePrices": [{ "date": "2025-06-01", "price": 185.10, "upper": 187.33, "lower": 182.87 }],
  "historicalPrices": [...]
}
```

### POST `/train-model`
Start background model training.

**Body:** `{ "symbol": "TSLA", "epochs": 10, "batch_size": 32 }`

---

## WebSocket Events (Socket.io)

| Event | Direction | Payload |
|-------|-----------|---------|
| `stock-ticks` | Server → Client | Array of all stock quotes |
| `alert-triggered-{userId}` | Server → Client | Alert details when price crosses target |
| `subscribe-stock` | Client → Server | `{ symbol: "AAPL" }` |
| `unsubscribe-stock` | Client → Server | `{ symbol: "AAPL" }` |

---

## Error Responses

All errors follow this format:
```json
{ "status": "fail", "message": "Human-readable error description" }
```

| Code | Meaning |
|------|---------|
| `400` | Bad request / validation error |
| `401` | Unauthenticated |
| `403` | Forbidden (not admin) |
| `404` | Resource not found |
| `422` | Input validation failed |
| `429` | Rate limit exceeded |
| `500` | Internal server error |
