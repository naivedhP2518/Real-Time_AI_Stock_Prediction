import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';

// ─── Constants ───────────────────────────────────────────────────────────────
const SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'AMZN', 'MSFT'];

const ORDER_TYPES = ['BLOCK', 'SWEEP', 'DARK_POOL'];
const SIDES = ['BUY', 'SELL'];

const BASE_PRICES = { AAPL: 189.45, TSLA: 248.90, NVDA: 875.20, AMZN: 182.70, MSFT: 415.30 };

// ─── Generators ──────────────────────────────────────────────────────────────
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const fmt = (n, dec = 2) => n.toFixed(dec);
const fmtMoney = (n) => n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${(n / 1e3).toFixed(0)}K`;

const generateBidAsk = (basePrice) => {
  const levels = [];
  for (let i = -10; i <= 10; i++) {
    if (i === 0) continue;
    const price = +(basePrice + i * 0.05).toFixed(2);
    const bidSize = i < 0 ? randInt(100, 8000) : 0;
    const askSize = i > 0 ? randInt(100, 8000) : 0;
    const imbalance = bidSize > 0 ? 1 : askSize > 0 ? -1 : 0;
    levels.push({ price, bidSize, askSize, imbalance });
  }
  return levels.sort((a, b) => b.price - a.price);
};

const generateVolumeProfile = (basePrice) => {
  const levels = [];
  for (let i = -12; i <= 12; i++) {
    const price = +(basePrice + i * 0.10).toFixed(2);
    const volume = randInt(500, 20000);
    const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
    levels.push({ price, volume, side, isHighVolume: volume > 15000 });
  }
  return levels;
};

const generateLargeOrder = (symbol, basePrice) => {
  const side = SIDES[Math.floor(Math.random() * 2)];
  const type = ORDER_TYPES[Math.floor(Math.random() * ORDER_TYPES.length)];
  const size = randInt(1000, 250000);
  const price = +(basePrice + rand(-2, 2)).toFixed(2);
  const value = size * price;
  const now = new Date();
  return {
    id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    time: now.toLocaleTimeString('en-US', { hour12: false }),
    symbol,
    side,
    size,
    price,
    value,
    type,
    isNew: true,
  };
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

const TypeBadge = ({ type }) => {
  const colors = { BLOCK: 'bg-violet-500/20 text-violet-400 border-violet-500/30', SWEEP: 'bg-amber-500/20 text-amber-400 border-amber-500/30', DARK_POOL: 'bg-slate-600/40 text-slate-300 border-slate-500/30' };
  return <span className={`text-[8px] font-black font-mono px-1.5 py-0.5 rounded border ${colors[type] || ''}`}>{type.replace('_', ' ')}</span>;
};

const SideBadge = ({ side }) => (
  <span className={`text-[9px] font-black font-mono px-2 py-0.5 rounded border ${side === 'BUY' ? 'bg-accentGreen/15 text-accentGreen border-accentGreen/30' : 'bg-accentRed/15 text-accentRed border-accentRed/30'}`}>
    {side}
  </span>
);

const MetricBox = ({ label, value, sub, color = 'text-white' }) => (
  <div className="bg-black/30 rounded-xl border border-white/5 px-4 py-3 min-w-[110px]">
    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono mb-1">{label}</p>
    <p className={`text-lg font-black font-mono ${color}`}>{value}</p>
    {sub && <p className="text-[10px] text-slate-500 font-mono">{sub}</p>}
  </div>
);

const TooltipStyle = {
  background: 'rgba(8,11,20,0.95)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  fontSize: '11px',
  color: '#F8FAFC',
  padding: '10px 14px',
};

// ─── Main Component ───────────────────────────────────────────────────────────
const OrderFlow = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [bidAskData, setBidAskData] = useState([]);
  const [largeOrders, setLargeOrders] = useState([]);
  const [volumeProfile, setVolumeProfile] = useState([]);
  const [netFlow, setNetFlow] = useState(0);
  const [delta, setDelta] = useState(0);
  const [cvd, setCvd] = useState(0);
  const feedRef = useRef(null);
  const intervalRef = useRef(null);

  const basePrice = BASE_PRICES[symbol] || 200;

  // ─── Init ─────────────────────────────────────────────────────────────────
  const initData = useCallback(() => {
    setBidAskData(generateBidAsk(basePrice));
    setVolumeProfile(generateVolumeProfile(basePrice));
    // Seed 10 initial orders
    const initial = Array.from({ length: 10 }, () => ({ ...generateLargeOrder(symbol, basePrice), isNew: false }));
    setLargeOrders(initial.reverse());
    const nf = rand(-2e6, 2e6);
    setNetFlow(nf);
    setDelta(rand(-5e5, 5e5));
    setCvd(nf * 1.3);
  }, [symbol, basePrice]);

  useEffect(() => { initData(); }, [initData]);

  // ─── Live tick simulation ─────────────────────────────────────────────────
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      // Update bid/ask
      setBidAskData(prev => prev.map(row => ({
        ...row,
        bidSize: row.bidSize > 0 ? Math.max(0, row.bidSize + randInt(-500, 500)) : 0,
        askSize: row.askSize > 0 ? Math.max(0, row.askSize + randInt(-500, 500)) : 0,
      })));

      // Add new large order
      const newOrder = generateLargeOrder(symbol, basePrice);
      setLargeOrders(prev => [newOrder, ...prev.slice(0, 49)]);

      // Update flow metrics
      const delta = rand(-3e5, 3e5);
      setNetFlow(prev => prev + delta);
      setDelta(delta);
      setCvd(prev => prev + delta * 0.6);

      // Scroll feed
      if (feedRef.current) feedRef.current.scrollTop = 0;
    }, 2000);
    return () => clearInterval(intervalRef.current);
  }, [symbol, basePrice]);

  // ─── Derived metrics ───────────────────────────────────────────────────────
  const totalBidLiq = bidAskData.reduce((s, r) => s + r.bidSize, 0);
  const totalAskLiq = bidAskData.reduce((s, r) => s + r.askSize, 0);
  const spreadPct = ((0.05 / basePrice) * 100).toFixed(3);
  const liquidityScore = Math.min(100, Math.round(((totalBidLiq + totalAskLiq) / 200000) * 100));
  const maxBid = Math.max(...bidAskData.map(r => r.bidSize), 1);
  const maxAsk = Math.max(...bidAskData.map(r => r.askSize), 1);

  // ─── Volume delta chart ────────────────────────────────────────────────────
  const volumeDeltaData = volumeProfile.slice(0, 16).map(d => ({
    price: d.price,
    delta: d.side === 'BUY' ? d.volume : -d.volume,
  }));

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full text-slate-100 animate-fade-in">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accentGreen opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accentGreen" />
            </span>
            <span className="text-[10px] font-black text-accentGreen uppercase tracking-widest font-mono">Live Order Flow</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Institutional Order Flow</h2>
          <p className="text-xs text-slate-400">Real-time block, sweep, and dark pool transaction monitoring • Auto-refreshes every 2s</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Symbol selector */}
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="bg-black/40 border border-white/10 text-white rounded-xl px-4 py-2 text-sm font-black font-mono focus:outline-none focus:border-cyberBlue/60 cursor-pointer"
          >
            {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Summary metrics */}
          <MetricBox
            label="Net Flow"
            value={fmtMoney(Math.abs(netFlow))}
            sub={netFlow >= 0 ? '▲ BUYING' : '▼ SELLING'}
            color={netFlow >= 0 ? 'text-accentGreen' : 'text-accentRed'}
          />
          <MetricBox
            label="Delta"
            value={fmtMoney(Math.abs(delta))}
            sub={delta >= 0 ? '+ Bullish' : '- Bearish'}
            color={delta >= 0 ? 'text-cyberTeal' : 'text-amber-400'}
          />
          <MetricBox label="CVD" value={fmtMoney(Math.abs(cvd))} color="text-violet-400" />
        </div>
      </div>

      {/* ── MAIN 3-COLUMN LAYOUT ────────────────────────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '280px 1fr 320px' }}>

        {/* ── LEFT: Bid/Ask Ladder ────────────────────────────────────────── */}
        <div className="glass-panel neon-glow-card rounded-2xl border border-white/5 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-white/5 bg-black/20">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-mono">Bid/Ask Ladder</h3>
            <p className="text-[9px] text-slate-500 font-mono mt-0.5">20 price levels • {symbol} @ ${fmt(basePrice)}</p>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-3 px-3 py-1.5 border-b border-white/5 bg-black/10">
            <span className="text-[9px] font-black text-accentGreen uppercase font-mono text-right">Bid</span>
            <span className="text-[9px] font-black text-slate-400 uppercase font-mono text-center">Price</span>
            <span className="text-[9px] font-black text-accentRed uppercase font-mono text-left pl-2">Ask</span>
          </div>

          <div className="overflow-y-auto flex-1 max-h-[480px]">
            {bidAskData.map((row, i) => {
              const isCenter = Math.abs(row.price - basePrice) < 0.08;
              const bidW = row.bidSize > 0 ? Math.round((row.bidSize / maxBid) * 100) : 0;
              const askW = row.askSize > 0 ? Math.round((row.askSize / maxAsk) * 100) : 0;
              return (
                <div
                  key={i}
                  className={`relative grid grid-cols-3 px-3 py-1 border-b border-white/[0.03] ${isCenter ? 'bg-cyberBlue/10 border-cyberBlue/20' : 'hover:bg-white/[0.02]'}`}
                >
                  {/* Bid bar */}
                  {bidW > 0 && <div className="absolute left-0 top-0 h-full bg-accentGreen/10" style={{ width: `${bidW * 0.33}%` }} />}
                  {/* Ask bar */}
                  {askW > 0 && <div className="absolute right-0 top-0 h-full bg-accentRed/10" style={{ width: `${askW * 0.33}%` }} />}

                  <span className="text-[11px] font-mono font-bold text-accentGreen text-right z-10 relative">
                    {row.bidSize > 0 ? row.bidSize.toLocaleString() : '—'}
                  </span>
                  <span className={`text-[11px] font-mono font-black text-center z-10 relative ${isCenter ? 'text-cyberBlue' : 'text-slate-200'}`}>
                    {fmt(row.price)}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-accentRed pl-2 z-10 relative">
                    {row.askSize > 0 ? row.askSize.toLocaleString() : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CENTER: Volume Delta ────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="glass-panel neon-glow-card rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 bg-black/20">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-mono">Volume Delta by Price</h3>
            </div>
            <div className="p-4 bg-[#080b14]">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={volumeDeltaData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <YAxis dataKey="price" type="category" tick={{ fontSize: 9, fill: '#94a3b8', fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={52} />
                  <Tooltip
                    contentStyle={TooltipStyle}
                    formatter={(v) => [`${Math.abs(v).toLocaleString()} shares`, v >= 0 ? 'Net Buy' : 'Net Sell']}
                  />
                  <ReferenceLine x={0} stroke="rgba(255,255,255,0.1)" />
                  <Bar dataKey="delta" maxBarSize={14} radius={[0, 3, 3, 0]}>
                    {volumeDeltaData.map((d, i) => (
                      <Cell key={i} fill={d.delta >= 0 ? '#10B981' : '#EF4444'} opacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cumulative Delta + Imbalance */}
          <div className="glass-panel rounded-2xl border border-white/5 p-4 space-y-3">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-mono">Imbalance Heatmap</h3>
            <div className="grid grid-cols-10 gap-0.5">
              {volumeProfile.slice(0, 20).map((d, i) => {
                const ratio = d.side === 'BUY' ? d.volume / 20000 : -(d.volume / 20000);
                const intensity = Math.abs(ratio);
                const green = d.side === 'BUY';
                return (
                  <div
                    key={i}
                    title={`$${d.price} — ${d.volume.toLocaleString()} ${d.side}`}
                    className="h-8 rounded-sm cursor-pointer transition-all hover:opacity-100"
                    style={{
                      background: green
                        ? `rgba(16,185,129,${0.15 + intensity * 0.7})`
                        : `rgba(239,68,68,${0.15 + intensity * 0.7})`,
                      opacity: 0.8,
                    }}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-500">
              <span>← Strong Selling</span>
              <span>Strong Buying →</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Large Order Feed ─────────────────────────────────────── */}
        <div className="glass-panel neon-glow-card rounded-2xl border border-white/5 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-white/5 bg-black/20 flex items-center justify-between">
            <div>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-mono">Large Order Feed</h3>
              <p className="text-[9px] text-slate-500 font-mono">Block · Sweep · Dark Pool detection</p>
            </div>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accentGreen animate-pulse" />
              <span className="text-[9px] font-black text-accentGreen font-mono">LIVE</span>
            </span>
          </div>

          <div ref={feedRef} className="overflow-y-auto flex-1 max-h-[520px] divide-y divide-white/[0.04]">
            {largeOrders.map((order, i) => (
              <div
                key={order.id}
                className={`p-3 transition-all duration-500 ${i === 0 ? 'animate-fade-in bg-white/[0.03]' : 'hover:bg-white/[0.02]'}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <SideBadge side={order.side} />
                    <TypeBadge type={order.type} />
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">{order.time}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-black font-mono text-white">{order.symbol}</span>
                  <span className="text-[10px] font-mono text-slate-400">{order.size.toLocaleString()} @ ${fmt(order.price)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-sm font-black font-mono ${order.side === 'BUY' ? 'text-accentGreen' : 'text-accentRed'}`}>
                    {fmtMoney(order.value)}
                  </span>
                  {order.value >= 1e6 && (
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
                      ⚡ SIGNIFICANT
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM: Market Depth + Metrics ───────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Market Depth */}
        <div className="col-span-2 glass-panel neon-glow-card rounded-2xl border border-white/5 p-5 space-y-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-mono">Market Depth Visualization</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-accentGreen w-16 text-right">{(totalBidLiq / 1000).toFixed(0)}K</span>
              <div className="flex-1 flex rounded-full overflow-hidden h-5">
                <div className="bg-accentGreen/70 rounded-l-full transition-all duration-500" style={{ width: `${(totalBidLiq / (totalBidLiq + totalAskLiq)) * 100}%` }} />
                <div className="bg-accentRed/70 rounded-r-full flex-1 transition-all duration-500" />
              </div>
              <span className="text-[10px] font-mono text-accentRed w-16">{(totalAskLiq / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-500 px-20">
              <span>Total Bid Liquidity</span>
              <span>Total Ask Liquidity</span>
            </div>
          </div>

          {/* Support / Resistance */}
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase font-mono tracking-widest mb-2">High Volume Price Levels (Support/Resistance)</p>
            <div className="flex gap-2 flex-wrap">
              {volumeProfile.filter(d => d.isHighVolume).slice(0, 5).map((d, i) => (
                <div key={i} className={`px-3 py-1.5 rounded-lg border text-[10px] font-black font-mono ${d.side === 'BUY' ? 'bg-accentGreen/10 border-accentGreen/30 text-accentGreen' : 'bg-accentRed/10 border-accentRed/30 text-accentRed'}`}>
                  ${fmt(d.price)} <span className="opacity-60">({d.side === 'BUY' ? 'Support' : 'Resistance'})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Microstructure Metrics */}
        <div className="glass-panel neon-glow-card rounded-2xl border border-white/5 p-5 space-y-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-mono">Microstructure</h3>
          <div className="space-y-3">
            {[
              { label: 'Bid-Ask Spread', value: `$0.05 (${spreadPct}%)`, color: 'text-cyberTeal' },
              { label: 'Bid Depth', value: `${(totalBidLiq / 1000).toFixed(0)}K shares`, color: 'text-accentGreen' },
              { label: 'Ask Depth', value: `${(totalAskLiq / 1000).toFixed(0)}K shares`, color: 'text-accentRed' },
              { label: 'Liquidity Score', value: `${liquidityScore}/100`, color: liquidityScore > 60 ? 'text-accentGreen' : 'text-amber-400' },
              { label: 'Orders Detected', value: largeOrders.length, color: 'text-violet-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-white/[0.05]">
                <span className="text-[10px] text-slate-400 font-mono">{label}</span>
                <span className={`text-xs font-black font-mono ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFlow;
