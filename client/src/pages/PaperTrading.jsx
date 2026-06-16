import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import API from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'AMZN', 'MSFT', 'GOOGL', 'META', 'AMD'];

const generatePortfolioHistory = (startValue = 100000) => {
  const data = [];
  let value = startValue;
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const change = (Math.random() - 0.46) * 1200;
    value = Math.max(85000, value + change);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: +value.toFixed(2),
    });
  }
  return data;
};

const fmtCurrency = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

const fmtDate = (iso) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// ─── Loading skeleton ─────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => (
  <div className={`skeleton-shimmer rounded-lg ${className}`} />
);

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, positive, loading }) => (
  <div className="glass-panel neon-glow-card rounded-2xl p-5 border border-white/5 flex flex-col gap-1 animate-fade-in">
    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
    {loading ? (
      <Skeleton className="h-7 w-32 mt-1" />
    ) : (
      <span className="text-2xl font-black text-white">{value}</span>
    )}
    {sub !== undefined && !loading && (
      <span className={`text-xs font-semibold flex items-center gap-1 ${positive ? 'text-accentGreen' : 'text-accentRed'}`}>
        {positive ? '▲' : '▼'} {sub}
      </span>
    )}
  </div>
);

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-darkCard border border-white/10 rounded-xl px-3 py-2 text-xs text-white shadow-xl">
      <p className="font-bold text-cyberTeal">{payload[0]?.payload?.date}</p>
      <p className="text-slate-300 mt-0.5">{fmtCurrency(payload[0]?.value)}</p>
    </div>
  );
};

// ─── Badge ────────────────────────────────────────────────────────────────────
const Badge = ({ type }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider ${
    type === 'BUY' ? 'bg-accentGreen/15 text-accentGreen' : 'bg-accentRed/15 text-accentRed'
  }`}>
    {type}
  </span>
);

// ─── Tab button ───────────────────────────────────────────────────────────────
const TabBtn = ({ label, active, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
      active
        ? 'bg-cyberBlue/15 text-cyberBlue border border-cyberBlue/30'
        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
    }`}
  >
    <span>{icon}</span>
    <span>{label}</span>
  </button>
);

// ─── Toggle Switch ────────────────────────────────────────────────────────────
const Toggle = ({ enabled, onToggle, label }) => (
  <button
    onClick={onToggle}
    className="flex items-center gap-3 cursor-pointer group"
    aria-label={label}
  >
    <div className={`relative w-12 h-6 rounded-full transition-all duration-300 ${enabled ? 'bg-accentGreen' : 'bg-slate-600'}`}>
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${enabled ? 'left-7' : 'left-1'}`} />
    </div>
    <span className={`text-sm font-semibold ${enabled ? 'text-accentGreen' : 'text-slate-400'}`}>{label}</span>
  </button>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const PaperTrading = () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [portfolio, setPortfolio] = useState({
    cash: 100000,
    totalValue: 100000,
    positions: [],
    autoTradeEnabled: false,
  });
  const [trades, setTrades] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [livePrices, setLivePrices] = useState({});
  const [portfolioHistory] = useState(generatePortfolioHistory);
  const [loading, setLoading] = useState(true);
  const [histLoading, setHistLoading] = useState(false);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [autoSymbols, setAutoSymbols] = useState(['AAPL', 'TSLA', 'NVDA']);
  const [maxPositionSize, setMaxPositionSize] = useState(5000);
  const [maxDailyTrades, setMaxDailyTrades] = useState(10);
  const [aiLog, setAiLog] = useState([
    { id: 1, time: new Date().toISOString(), msg: 'AI Engine initialised. Monitoring market conditions...', type: 'info' },
    { id: 2, time: new Date(Date.now() - 60000).toISOString(), msg: 'RSI signal detected for NVDA — momentum building above 60', type: 'signal' },
    { id: 3, time: new Date(Date.now() - 120000).toISOString(), msg: 'TSLA Volume Spike detected: 2.1x average — watching for breakout', type: 'alert' },
  ]);

  const socketRef = useRef(null);

  // ── Fetch portfolio on mount ───────────────────────────────────────────────
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        const { data } = await API.get('/paper-trading/portfolio');
        setPortfolio(data);
      } catch (e) {
        // Fallback: use default portfolio state
        console.warn('Paper trading portfolio fetch failed, using defaults:', e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, []);

  // ── Fetch trade history when tab activated ─────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'history') return;
    const fetchHistory = async () => {
      try {
        setHistLoading(true);
        const { data } = await API.get('/paper-trading/history');
        setTrades(data || []);
      } catch (e) {
        console.warn('History fetch failed:', e.message);
      } finally {
        setHistLoading(false);
      }
    };
    fetchHistory();
  }, [activeTab]);

  // ── Socket.io for live prices ──────────────────────────────────────────────
  useEffect(() => {
    const socket = io('http://localhost:5000');
    socketRef.current = socket;

    socket.on('stock-ticks', (ticks) => {
      const priceMap = {};
      ticks.forEach((t) => { priceMap[t.symbol] = t.price; });

      // Update live prices
      setLivePrices((prev) => ({ ...prev, ...priceMap }));

      // Update position market values
      setPortfolio((prev) => {
        const updatedPositions = prev.positions.map((pos) => {
          const currentPrice = priceMap[pos.symbol] ?? pos.currentPrice;
          const value = currentPrice * pos.shares;
          const pnl = value - pos.avgPrice * pos.shares;
          const pnlPct = ((currentPrice - pos.avgPrice) / pos.avgPrice) * 100;
          return { ...pos, currentPrice, value, pnl, pnlPct };
        });
        const posValue = updatedPositions.reduce((s, p) => s + p.value, 0);
        return { ...prev, positions: updatedPositions, totalValue: prev.cash + posValue };
      });
    });

    return () => { socket.disconnect(); };
  }, []);

  // ── Dismiss toast ──────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Buy ────────────────────────────────────────────────────────────────────
  const handleBuy = async () => {
    if (quantity < 1) return;
    try {
      setTradeLoading(true);
      const { data } = await API.post('/paper-trading/buy', { symbol: selectedSymbol, quantity: Number(quantity) });
      setPortfolio(data.portfolio || data);
      showToast(`✅ Bought ${quantity} × ${selectedSymbol}`);
      if (data.trade) setTrades((prev) => [data.trade, ...prev]);
    } catch (e) {
      // Simulate locally if API not ready
      const price = livePrices[selectedSymbol] || 150;
      const cost = price * Number(quantity);
      setPortfolio((prev) => {
        const newCash = prev.cash - cost;
        if (newCash < 0) { showToast('❌ Insufficient funds', 'error'); return prev; }
        const existing = prev.positions.find((p) => p.symbol === selectedSymbol);
        let newPositions;
        if (existing) {
          newPositions = prev.positions.map((p) =>
            p.symbol === selectedSymbol
              ? { ...p, shares: p.shares + Number(quantity), avgPrice: (p.avgPrice * p.shares + cost) / (p.shares + Number(quantity)), currentPrice: price, value: (p.shares + Number(quantity)) * price }
              : p
          );
        } else {
          newPositions = [...prev.positions, { symbol: selectedSymbol, shares: Number(quantity), avgPrice: price, currentPrice: price, value: cost, pnl: 0, pnlPct: 0 }];
        }
        const posValue = newPositions.reduce((s, p) => s + p.value, 0);
        return { ...prev, cash: newCash, positions: newPositions, totalValue: newCash + posValue };
      });
      const trade = { id: Date.now(), date: new Date().toISOString(), symbol: selectedSymbol, type: 'BUY', qty: Number(quantity), price, total: cost, pnl: 0 };
      setTrades((prev) => [trade, ...prev]);
      showToast(`✅ Bought ${quantity} × ${selectedSymbol}`);
    } finally {
      setTradeLoading(false);
    }
  };

  // ── Sell ───────────────────────────────────────────────────────────────────
  const handleSell = async () => {
    if (quantity < 1) return;
    try {
      setTradeLoading(true);
      const { data } = await API.post('/paper-trading/sell', { symbol: selectedSymbol, quantity: Number(quantity) });
      setPortfolio(data.portfolio || data);
      showToast(`🔴 Sold ${quantity} × ${selectedSymbol}`);
      if (data.trade) setTrades((prev) => [data.trade, ...prev]);
    } catch (e) {
      const price = livePrices[selectedSymbol] || 150;
      const proceeds = price * Number(quantity);
      setPortfolio((prev) => {
        const existing = prev.positions.find((p) => p.symbol === selectedSymbol);
        if (!existing || existing.shares < Number(quantity)) {
          showToast('❌ Not enough shares', 'error');
          return prev;
        }
        let newPositions;
        if (existing.shares === Number(quantity)) {
          newPositions = prev.positions.filter((p) => p.symbol !== selectedSymbol);
        } else {
          newPositions = prev.positions.map((p) =>
            p.symbol === selectedSymbol
              ? { ...p, shares: p.shares - Number(quantity), value: (p.shares - Number(quantity)) * price }
              : p
          );
        }
        const newCash = prev.cash + proceeds;
        const posValue = newPositions.reduce((s, p) => s + p.value, 0);
        return { ...prev, cash: newCash, positions: newPositions, totalValue: newCash + posValue };
      });
      const trade = { id: Date.now(), date: new Date().toISOString(), symbol: selectedSymbol, type: 'SELL', qty: Number(quantity), price, total: proceeds, pnl: (price - 140) * Number(quantity) };
      setTrades((prev) => [trade, ...prev]);
      showToast(`🔴 Sold ${quantity} × ${selectedSymbol}`);
    } finally {
      setTradeLoading(false);
    }
  };

  // ── Close position ─────────────────────────────────────────────────────────
  const handleClosePosition = async (symbol, shares) => {
    const price = livePrices[symbol] || 150;
    const proceeds = price * shares;
    setPortfolio((prev) => {
      const existing = prev.positions.find((p) => p.symbol === symbol);
      if (!existing) return prev;
      const newPositions = prev.positions.filter((p) => p.symbol !== symbol);
      const newCash = prev.cash + proceeds;
      const posValue = newPositions.reduce((s, p) => s + p.value, 0);
      return { ...prev, cash: newCash, positions: newPositions, totalValue: newCash + posValue };
    });
    const pnl = (price - (portfolio.positions.find((p) => p.symbol === symbol)?.avgPrice || price)) * shares;
    const trade = { id: Date.now(), date: new Date().toISOString(), symbol, type: 'SELL', qty: shares, price, total: proceeds, pnl };
    setTrades((prev) => [trade, ...prev]);
    showToast(`🔴 Closed ${symbol} position`);
  };

  // ── Auto-trade toggle ──────────────────────────────────────────────────────
  const handleAutoTradeToggle = async () => {
    try {
      await API.post('/paper-trading/auto-trade/toggle');
    } catch (e) {
      // Fallback: toggle locally
    }
    setPortfolio((prev) => ({ ...prev, autoTradeEnabled: !prev.autoTradeEnabled }));
    const newEnabled = !portfolio.autoTradeEnabled;
    setAiLog((prev) => [{
      id: Date.now(),
      time: new Date().toISOString(),
      msg: newEnabled ? '🟢 AI Auto-Trade ACTIVATED — scanning for signals...' : '⏸ AI Auto-Trade PAUSED by user.',
      type: newEnabled ? 'signal' : 'info',
    }, ...prev]);
    showToast(newEnabled ? '🤖 AI Auto-Trade Enabled' : '⏸ AI Auto-Trade Paused');
  };

  // ── Computed values ────────────────────────────────────────────────────────
  const totalPnL = portfolio.positions.reduce((s, p) => s + (p.pnl || 0), 0);
  const openPositions = portfolio.positions.length;
  const livePrice = livePrices[selectedSymbol];
  const lastHistValue = portfolioHistory[portfolioHistory.length - 1]?.value;
  const firstHistValue = portfolioHistory[0]?.value;
  const histChange = lastHistValue - firstHistValue;
  const histChangePct = ((histChange / firstHistValue) * 100).toFixed(2);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-darkBg text-white px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 animate-toast-in px-4 py-3 rounded-xl border text-sm font-semibold shadow-xl ${
          toast.type === 'error' ? 'bg-accentRed/10 border-accentRed/40 text-accentRed' : 'bg-accentGreen/10 border-accentGreen/40 text-accentGreen'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-cyberBlue/20 border border-cyberBlue/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-cyberBlue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-cyberBlue">Paper Trading Simulator</span>
        </div>
        <h1 className="text-3xl font-black text-white">Virtual Trading Terminal</h1>
        <p className="text-slate-400 text-sm mt-1">Practice trading with $100,000 virtual capital. AI-powered signals included.</p>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        <StatCard
          label="Total Portfolio Value"
          value={loading ? '' : fmtCurrency(portfolio.totalValue)}
          sub={`${histChangePct}% (30d)`}
          positive={histChange >= 0}
          loading={loading}
        />
        <StatCard
          label="Available Cash"
          value={loading ? '' : fmtCurrency(portfolio.cash)}
          loading={loading}
        />
        <div className="glass-panel neon-glow-card rounded-2xl p-5 border border-white/5 flex flex-col gap-1 animate-fade-in">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total P&amp;L</span>
          {loading ? <Skeleton className="h-7 w-32 mt-1" /> : (
            <span className={`text-2xl font-black ${totalPnL >= 0 ? 'text-accentGreen' : 'text-accentRed'}`}>
              {totalPnL >= 0 ? '+' : ''}{fmtCurrency(totalPnL)}
            </span>
          )}
          {!loading && (
            <span className={`text-xs font-semibold flex items-center gap-1 ${totalPnL >= 0 ? 'text-accentGreen' : 'text-accentRed'}`}>
              {totalPnL >= 0 ? '▲ Profit' : '▼ Loss'}
            </span>
          )}
        </div>
        <div className="glass-panel neon-glow-card rounded-2xl p-5 border border-white/5 flex flex-col gap-1 animate-fade-in">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Open Positions</span>
          {loading ? <Skeleton className="h-7 w-16 mt-1" /> : (
            <span className="text-2xl font-black text-white">{openPositions}</span>
          )}
          {!loading && (
            <span className="text-xs font-semibold text-slate-500">
              {openPositions === 0 ? 'No open positions' : `Across ${openPositions} securities`}
            </span>
          )}
        </div>
      </div>

      {/* ── Tab Bar ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6 p-1 glass-panel rounded-2xl border border-white/5 w-fit">
        <TabBtn label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon="📊" />
        <TabBtn label="Positions" active={activeTab === 'positions'} onClick={() => setActiveTab('positions')} icon="📋" />
        <TabBtn label="Trade History" active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon="🕐" />
        <TabBtn label="AI Auto-Trade" active={activeTab === 'autotrade'} onClick={() => setActiveTab('autotrade')} icon="🤖" />
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* OVERVIEW TAB */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">
          {/* Portfolio Chart */}
          <div className="xl:col-span-2 glass-panel rounded-2xl border border-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Portfolio Performance</h3>
                <p className="text-xs text-slate-400 mt-0.5">30-day equity curve</p>
              </div>
              <div className={`text-xs font-bold px-3 py-1.5 rounded-lg ${histChange >= 0 ? 'bg-accentGreen/15 text-accentGreen' : 'bg-accentRed/15 text-accentRed'}`}>
                {histChange >= 0 ? '+' : ''}{histChangePct}%
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={portfolioHistory} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} interval={4} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2.5} fill="url(#portGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Trade Form */}
          <div className="glass-panel rounded-2xl border border-white/5 p-6 flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accentGreen animate-ping" />
              <h3 className="text-sm font-bold text-white">Quick Trade</h3>
            </div>

            {/* Symbol Selector */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Symbol</label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-cyberBlue/50 cursor-pointer"
              >
                {SYMBOLS.map((s) => <option key={s} value={s} className="bg-darkCard">{s}</option>)}
              </select>
            </div>

            {/* Live Price */}
            <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/5">
              <span className="text-xs text-slate-400 font-semibold">Live Price</span>
              <span className="text-lg font-black text-cyberTeal">
                {livePrice ? `$${livePrice.toFixed(2)}` : <span className="text-slate-500 text-sm">Connecting...</span>}
              </span>
            </div>

            {/* Quantity */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Quantity (Shares)</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-cyberBlue/50"
              />
              {livePrice && (
                <p className="text-[10px] text-slate-500 mt-1.5">
                  Estimated cost: <span className="text-slate-300 font-bold">{fmtCurrency(livePrice * quantity)}</span>
                </p>
              )}
            </div>

            {/* Buy / Sell Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-auto">
              <button
                onClick={handleBuy}
                disabled={tradeLoading}
                className="bg-accentGreen hover:bg-accentGreen/80 disabled:opacity-50 text-darkBg font-bold py-3 rounded-xl text-sm transition-all active:scale-95 btn-press cursor-pointer"
              >
                {tradeLoading ? '...' : '▲ Buy'}
              </button>
              <button
                onClick={handleSell}
                disabled={tradeLoading}
                className="bg-accentRed hover:bg-accentRed/80 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-95 btn-press cursor-pointer"
              >
                {tradeLoading ? '...' : '▼ Sell'}
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="xl:col-span-3 glass-panel rounded-2xl border border-white/5 p-6">
            <h3 className="text-sm font-bold text-white mb-4">Recent Activity</h3>
            {trades.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                <div className="text-4xl mb-3">📭</div>
                <p>No recent trades. Start trading to see activity here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {trades.slice(0, 5).map((t, i) => (
                  <div key={t.id || i} className="flex items-center justify-between p-3 bg-white/3 border border-white/5 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge type={t.type} />
                      <span className="font-bold text-sm text-white">{t.symbol}</span>
                      <span className="text-xs text-slate-400">{t.qty} shares @ ${(t.price || 0).toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-white">{fmtCurrency(t.total)}</div>
                      <div className="text-xs text-slate-500">{t.date ? fmtDate(t.date) : 'Just now'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* POSITIONS TAB */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'positions' && (
        <div className="glass-panel rounded-2xl border border-white/5 p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-white">Open Positions</h3>
            <span className="text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg">{openPositions} positions</span>
          </div>

          {portfolio.positions.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <div className="text-5xl mb-4">📂</div>
              <p className="text-sm font-semibold">No open positions</p>
              <p className="text-xs mt-1">Execute trades in the Overview tab to build your portfolio.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-white/5">
                    <th className="pb-3 pr-4">Symbol</th>
                    <th className="pb-3 pr-4">Shares</th>
                    <th className="pb-3 pr-4">Avg Price</th>
                    <th className="pb-3 pr-4">Current</th>
                    <th className="pb-3 pr-4">Value</th>
                    <th className="pb-3 pr-4">P&amp;L</th>
                    <th className="pb-3 pr-4">P&amp;L%</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {portfolio.positions.map((pos) => {
                    const isProfit = (pos.pnl || 0) >= 0;
                    return (
                      <tr
                        key={pos.symbol}
                        className={`transition-colors hover:bg-white/3 ${isProfit ? 'bg-accentGreen/3' : 'bg-accentRed/3'}`}
                      >
                        <td className="py-3.5 pr-4">
                          <span className="font-bold text-white">{pos.symbol}</span>
                        </td>
                        <td className="py-3.5 pr-4 text-slate-300 font-mono">{pos.shares}</td>
                        <td className="py-3.5 pr-4 text-slate-300 font-mono">${(pos.avgPrice || 0).toFixed(2)}</td>
                        <td className="py-3.5 pr-4 font-mono font-bold text-white">
                          ${(pos.currentPrice || livePrices[pos.symbol] || pos.avgPrice || 0).toFixed(2)}
                        </td>
                        <td className="py-3.5 pr-4 font-mono text-white">{fmtCurrency(pos.value || 0)}</td>
                        <td className={`py-3.5 pr-4 font-bold font-mono ${isProfit ? 'text-accentGreen' : 'text-accentRed'}`}>
                          {isProfit ? '+' : ''}{fmtCurrency(pos.pnl || 0)}
                        </td>
                        <td className={`py-3.5 pr-4 font-bold text-xs ${isProfit ? 'text-accentGreen' : 'text-accentRed'}`}>
                          {isProfit ? '▲' : '▼'} {Math.abs(pos.pnlPct || 0).toFixed(2)}%
                        </td>
                        <td className="py-3.5">
                          <button
                            onClick={() => handleClosePosition(pos.symbol, pos.shares)}
                            className="px-3 py-1.5 text-[10px] font-bold bg-accentRed/15 text-accentRed hover:bg-accentRed/25 rounded-lg transition-colors cursor-pointer"
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* HISTORY TAB */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="glass-panel rounded-2xl border border-white/5 p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-white">Trade History</h3>
            <span className="text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg">{trades.length} trades</span>
          </div>

          {histLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : trades.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <div className="text-5xl mb-4">📜</div>
              <p className="text-sm font-semibold">No trade history yet</p>
              <p className="text-xs mt-1">Your executed trades will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-white/5">
                    <th className="pb-3 pr-4">Date / Time</th>
                    <th className="pb-3 pr-4">Symbol</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3 pr-4">Qty</th>
                    <th className="pb-3 pr-4">Price</th>
                    <th className="pb-3 pr-4">Total</th>
                    <th className="pb-3">P&amp;L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {trades.map((t, i) => {
                    const pnlPos = (t.pnl || 0) >= 0;
                    return (
                      <tr key={t.id || i} className="hover:bg-white/3 transition-colors">
                        <td className="py-3 pr-4 text-xs text-slate-400">{t.date ? fmtDate(t.date) : '—'}</td>
                        <td className="py-3 pr-4 font-bold text-white">{t.symbol}</td>
                        <td className="py-3 pr-4"><Badge type={t.type} /></td>
                        <td className="py-3 pr-4 font-mono text-slate-300">{t.qty}</td>
                        <td className="py-3 pr-4 font-mono text-slate-300">${(t.price || 0).toFixed(2)}</td>
                        <td className="py-3 pr-4 font-mono font-bold text-white">{fmtCurrency(t.total || 0)}</td>
                        <td className={`py-3 font-bold font-mono text-xs ${pnlPos ? 'text-accentGreen' : 'text-accentRed'}`}>
                          {t.type === 'BUY' ? '—' : `${pnlPos ? '+' : ''}${fmtCurrency(t.pnl || 0)}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* AI AUTO-TRADE TAB */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'autotrade' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-5">
            {/* Toggle + Status */}
            <div className="glass-panel rounded-2xl border border-white/5 p-6">
              <h3 className="text-sm font-bold text-white mb-4">AI Engine Control</h3>
              <Toggle
                enabled={portfolio.autoTradeEnabled}
                onToggle={handleAutoTradeToggle}
                label={portfolio.autoTradeEnabled ? 'Enabled' : 'Disabled'}
              />
              <div className={`mt-4 flex items-center gap-2.5 px-4 py-3 rounded-xl border ${
                portfolio.autoTradeEnabled
                  ? 'bg-accentGreen/10 border-accentGreen/30'
                  : 'bg-slate-800 border-white/5'
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${portfolio.autoTradeEnabled ? 'bg-accentGreen animate-ping' : 'bg-slate-500'}`} />
                <span className={`text-xs font-bold ${portfolio.autoTradeEnabled ? 'text-accentGreen' : 'text-slate-400'}`}>
                  {portfolio.autoTradeEnabled ? 'ACTIVE — AI is trading' : 'PAUSED'}
                </span>
              </div>
            </div>

            {/* Symbol selection */}
            <div className="glass-panel rounded-2xl border border-white/5 p-6">
              <h3 className="text-sm font-bold text-white mb-4">Target Symbols</h3>
              <div className="space-y-2.5">
                {SYMBOLS.map((sym) => (
                  <label key={sym} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={autoSymbols.includes(sym)}
                      onChange={(e) => {
                        if (e.target.checked) setAutoSymbols((prev) => [...prev, sym]);
                        else setAutoSymbols((prev) => prev.filter((s) => s !== sym));
                      }}
                      className="w-4 h-4 rounded accent-cyberBlue cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">{sym}</span>
                    {livePrices[sym] && (
                      <span className="ml-auto text-xs font-mono text-cyberTeal">${livePrices[sym].toFixed(2)}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Risk Settings */}
            <div className="glass-panel rounded-2xl border border-white/5 p-6">
              <h3 className="text-sm font-bold text-white mb-4">Risk Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
                    Max Position Size
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={500}
                      max={25000}
                      step={500}
                      value={maxPositionSize}
                      onChange={(e) => setMaxPositionSize(Number(e.target.value))}
                      className="flex-1 accent-cyberBlue cursor-pointer"
                    />
                    <span className="text-xs font-bold text-cyberTeal w-16 text-right">{fmtCurrency(maxPositionSize)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
                    Max Daily Trades
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={1}
                      max={50}
                      step={1}
                      value={maxDailyTrades}
                      onChange={(e) => setMaxDailyTrades(Number(e.target.value))}
                      className="flex-1 accent-cyberBlue cursor-pointer"
                    />
                    <span className="text-xs font-bold text-cyberTeal w-8 text-right">{maxDailyTrades}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Activity Log */}
          <div className="lg:col-span-2 glass-panel rounded-2xl border border-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">AI Decision Log</h3>
              <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg ${
                portfolio.autoTradeEnabled ? 'bg-accentGreen/10 text-accentGreen' : 'bg-slate-800 text-slate-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${portfolio.autoTradeEnabled ? 'bg-accentGreen animate-ping' : 'bg-slate-500'}`} />
                {portfolio.autoTradeEnabled ? 'LIVE' : 'PAUSED'}
              </div>
            </div>
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {aiLog.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex gap-3 p-3 rounded-xl border text-xs transition-all ${
                    entry.type === 'signal'
                      ? 'bg-cyberBlue/8 border-cyberBlue/20 text-cyberBlue'
                      : entry.type === 'alert'
                      ? 'bg-yellow-500/8 border-yellow-500/20 text-yellow-400'
                      : entry.type === 'trade'
                      ? 'bg-accentGreen/8 border-accentGreen/20 text-accentGreen'
                      : 'bg-white/3 border-white/5 text-slate-400'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {entry.type === 'signal' ? '📡' : entry.type === 'alert' ? '⚠️' : entry.type === 'trade' ? '✅' : 'ℹ️'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold leading-relaxed">{entry.msg}</p>
                    <p className="text-slate-500 mt-1">{fmtDate(entry.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaperTrading;
