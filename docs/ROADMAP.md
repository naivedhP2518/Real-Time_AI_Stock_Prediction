# 🔭 Future Roadmap

## Phase 1 — Production Deployment (Immediate)

- [ ] Deploy to **AWS EC2** or **DigitalOcean Droplet** using docker-compose
- [ ] Set up **Nginx reverse proxy** with SSL (Let's Encrypt / Certbot)
- [ ] Configure **MongoDB Atlas** for managed cloud database
- [ ] Set up **Uptime monitoring** (UptimeRobot free tier)
- [ ] Enable **GitHub branch protection** (require CI to pass before merge)

---

## Phase 2 — Advanced ML Features

### Crypto Prediction Module
```
ml-service/
  └── crypto/
      ├── crypto_model.py       # LSTM tuned for higher volatility
      ├── crypto_data.py        # CoinGecko / Binance API integration
      └── crypto_indicators.py  # Custom crypto indicators (VWAP, etc.)
```
- Supported: BTC, ETH, SOL, BNB, XRP
- Additional indicators: VWAP, OBV, Stochastic RSI

### Forex Prediction Module
- EUR/USD, GBP/USD, USD/JPY
- Economic calendar integration
- Correlation matrix analysis

### Ensemble Model Upgrade
```python
# Combine LSTM + Prophet + XGBoost
final_pred = (
    0.5 * lstm_pred +
    0.3 * prophet_pred +
    0.2 * xgb_pred
)
```

---

## Phase 3 — Auto-Trading Bot (Ethical / Paper Trading)

> ⚠️ **Paper trading only** — no real money involved

```
server/
  └── trading-bot/
      ├── TradingEngine.js      # Decision engine
      ├── RiskManager.js        # Stop-loss, position sizing
      ├── BrokerAdapter.js      # Alpaca Markets API (paper)
      └── BacktestRunner.js     # Historical strategy backtesting
```

**Strategy:** Signal from ML → Risk check → Paper execute → Log P&L

---

## Phase 4 — Kubernetes (K8s) Scaling

```yaml
# k8s/
#   ├── namespace.yaml
#   ├── deployments/
#   │   ├── server-deployment.yaml      (replicas: 3)
#   │   ├── ml-service-deployment.yaml  (replicas: 2, GPU node selector)
#   │   └── client-deployment.yaml      (replicas: 2)
#   ├── services/
#   ├── ingress/
#   │   └── nginx-ingress.yaml
#   └── hpa/
#       └── server-hpa.yaml             # Auto-scale on CPU/memory
```

**Tools:** Helm charts, Prometheus + Grafana monitoring, Horizontal Pod Autoscaler

---

## Phase 5 — Mobile App

### React Native (Expo)
```
mobile/
  ├── app/
  │   ├── (tabs)/
  │   │   ├── dashboard.tsx
  │   │   ├── predictions.tsx
  │   │   └── portfolio.tsx
  │   └── auth/
  ├── components/
  └── services/       # Reuse same API layer
```

**Features:**
- Push notifications for price alerts
- Biometric authentication (Face ID / Fingerprint)
- Widget support (iOS Today Widget)
- Offline portfolio view

---

## Phase 6 — Voice Assistant

```python
# Voice command examples:
# "Hey Stock, what's Apple's prediction?"
# "Buy 5 shares of Tesla"
# "Show my portfolio performance"

voice-assistant/
  ├── speech_to_text.py    # Whisper API
  ├── intent_parser.py     # NER + intent classification
  ├── action_executor.py   # Maps intents to API calls
  └── text_to_speech.py    # ElevenLabs / gTTS
```

---

## Phase 7 — Advanced Analytics

- **Options chain analysis** — put/call ratio, implied volatility
- **Earnings calendar** — pre/post earnings drift predictions
- **Insider trading tracker** — SEC Form 4 filings analysis
- **Macro indicators** — Fed rate decisions, CPI impact on stocks
- **Correlation heatmap** — cross-asset correlation matrix

---

## Phase 8 — Social Features

- **Stock discussion rooms** — real-time chat per ticker
- **Community predictions** — crowd wisdom aggregation
- **Paper trading leagues** — compete with other users
- **Shareable watchlists** — public portfolio cards

---

## Tech Debt & Improvements

| Item | Priority | Effort |
|------|----------|--------|
| Add TypeScript to backend | Medium | 2 days |
| Replace mock stock data with full Finnhub WebSocket | High | 1 day |
| Add model retraining scheduler (cron) | High | 1 day |
| GraphQL API layer | Low | 3 days |
| Server-Sent Events fallback for Socket.io | Medium | 1 day |
| Add Sentry error tracking | High | 2 hours |
| OpenTelemetry distributed tracing | Low | 2 days |
| Add 2FA (TOTP) authentication | Medium | 1 day |
