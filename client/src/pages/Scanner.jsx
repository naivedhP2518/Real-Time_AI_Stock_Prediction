import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

// ─── Colour helpers ─────────────────────────────────────────────────────────
const signalMeta = {
  'STRONG BUY':  { bg: 'bg-emerald-900/80', text: 'text-emerald-300', border: 'border-emerald-700/50' },
  'BUY':         { bg: 'bg-accentGreen/20', text: 'text-accentGreen', border: 'border-accentGreen/40' },
  'HOLD':        { bg: 'bg-yellow-400/15',  text: 'text-yellow-400',  border: 'border-yellow-400/40' },
  'SELL':        { bg: 'bg-accentRed/20',   text: 'text-accentRed',   border: 'border-accentRed/40' },
  'STRONG SELL': { bg: 'bg-red-900/80',     text: 'text-red-300',     border: 'border-red-700/50' },
};

const rsiColor = (rsi) => {
  if (rsi < 30) return 'text-accentGreen font-bold';
  if (rsi > 70) return 'text-accentRed font-bold';
  return 'text-slate-400';
};

const pctColor = (v) => v >= 0 ? 'text-accentGreen' : 'text-accentRed';

// ─── Mock data generator ────────────────────────────────────────────────────
const FILTERS   = ['All', 'Bullish Breakout', 'Bearish Breakdown', 'Volume Spike', 'RSI Oversold', 'RSI Overbought', 'Strong AI Signal'];
const SECTORS   = ['All Sectors', 'Technology', 'Banking', 'Healthcare', 'Fintech', 'E-Commerce', 'Entertainment', 'Crypto', 'ETF'];
const PATTERNS  = ['Bull Flag', 'Bear Flag', 'Cup & Handle', 'Double Bottom', 'Double Top', 'Head & Shoulders', 'Ascending Triangle', 'Descending Triangle', 'Rising Wedge'];
const SIGNALS   = ['STRONG BUY', 'BUY', 'HOLD', 'SELL', 'STRONG SELL'];

const SEED_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.',           sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corp.',       sector: 'Technology' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.',          sector: 'Technology' },
  { symbol: 'GOOGL',name: 'Alphabet Inc.',         sector: 'Technology' },
  { symbol: 'META', name: 'Meta Platforms',        sector: 'Technology' },
  { symbol: 'JPM',  name: 'JPMorgan Chase',        sector: 'Banking' },
  { symbol: 'BAC',  name: 'Bank of America',       sector: 'Banking' },
  { symbol: 'GS',   name: 'Goldman Sachs',         sector: 'Banking' },
  { symbol: 'JNJ',  name: 'Johnson & Johnson',     sector: 'Healthcare' },
  { symbol: 'PFE',  name: 'Pfizer Inc.',           sector: 'Healthcare' },
  { symbol: 'MRNA', name: 'Moderna Inc.',          sector: 'Healthcare' },
  { symbol: 'SQ',   name: 'Block Inc.',            sector: 'Fintech' },
  { symbol: 'PYPL', name: 'PayPal Holdings',       sector: 'Fintech' },
  { symbol: 'HOOD', name: 'Robinhood Markets',     sector: 'Fintech' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.',       sector: 'E-Commerce' },
  { symbol: 'SHOP', name: 'Shopify Inc.',          sector: 'E-Commerce' },
  { symbol: 'NFLX', name: 'Netflix Inc.',          sector: 'Entertainment' },
  { symbol: 'DIS',  name: 'Walt Disney Co.',       sector: 'Entertainment' },
  { symbol: 'BTC',  name: 'Bitcoin',               sector: 'Crypto' },
  { symbol: 'ETH',  name: 'Ethereum',              sector: 'Crypto' },
  { symbol: 'SOL',  name: 'Solana',                sector: 'Crypto' },
  { symbol: 'SPY',  name: 'S&P 500 ETF',           sector: 'ETF' },
  { symbol: 'QQQ',  name: 'Nasdaq 100 ETF',        sector: 'ETF' },
  { symbol: 'TSLA', name: 'Tesla Inc.',            sector: 'Technology' },
  { symbol: 'AMD',  name: 'Advanced Micro Devices',sector: 'Technology' },
];

const rand = (min, max, dp = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(dp));

const generateMockResults = () =>
  SEED_STOCKS.map((s, i) => {
    const price    = rand(10, 800);
    const change   = rand(-8, 8);
    const rsi      = rand(20, 80, 1);
    const volume   = rand(0.5, 50, 1);
    const volRatio = rand(0.3, 4.5, 2);
    const conf     = rand(55, 98, 1);
    const signal   = SIGNALS[Math.floor(Math.random() * SIGNALS.length)];
    const pattern  = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
    return { ...s, price, change, rsi, volume, volRatio, conf, signal, pattern, rank: i + 1 };
  });

// ─── Sub-components ─────────────────────────────────────────────────────────
const SignalBadge = ({ signal }) => {
  const m = signalMeta[signal] || signalMeta['HOLD'];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black border ${m.bg} ${m.text} ${m.border} whitespace-nowrap`}>
      {signal}
    </span>
  );
};

const MiniBar = ({ ratio }) => {
  const pct  = Math.min(100, (ratio / 5) * 100);
  const color = ratio >= 2 ? '#10B981' : ratio >= 1 ? '#06B6D4' : '#64748b';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-14 h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] font-mono text-slate-400">{ratio.toFixed(2)}x</span>
    </div>
  );
};

const ConfBar = ({ value }) => (
  <div className="flex items-center gap-1.5">
    <div className="w-14 h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
      <div
        className="h-full rounded-full animate-confidence"
        style={{ width: `${value}%`, background: `linear-gradient(90deg, #06B6D4, #10B981)` }}
      />
    </div>
    <span className="text-[10px] font-mono text-cyberTeal">{value.toFixed(0)}%</span>
  </div>
);

const SortIcon = ({ col, sortBy, sortDir }) => {
  if (sortBy !== col) return <span className="text-slate-600 ml-0.5">⇅</span>;
  return <span className="text-cyberTeal ml-0.5">{sortDir === 'asc' ? '▲' : '▼'}</span>;
};

// ─── Main Component ──────────────────────────────────────────────────────────
const Scanner = () => {
  const navigate = useNavigate();

  const [results,       setResults]       = useState([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [filter,        setFilter]        = useState('All');
  const [selectedSector,setSelectedSector]= useState('All Sectors');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [sortBy,        setSortBy]        = useState('rank');
  const [sortDir,       setSortDir]       = useState('asc');
  const [autoRefresh,   setAutoRefresh]   = useState(true);
  const [countdown,     setCountdown]     = useState(15);
  const [lastUpdated,   setLastUpdated]   = useState(new Date());
  const [watchlist,     setWatchlist]     = useState([]);

  const timerRef    = useRef(null);
  const countRef    = useRef(null);

  // ── Fetch / simulate ──────────────────────────────────────────────────────
  const fetchResults = useCallback(async () => {
    setIsLoading(true);
    try {
      // Real API call (will fall back to mock if server isn't responding)
      const params = new URLSearchParams();
      if (filter !== 'All')          params.set('filter', filter);
      if (selectedSector !== 'All Sectors') params.set('sector', selectedSector);
      const res = await API.get(`/api/scanner/results?${params.toString()}`);
      setResults(res.data || generateMockResults());
    } catch {
      // Fallback mock data
      setResults(generateMockResults());
    } finally {
      setIsLoading(false);
      setLastUpdated(new Date());
      setCountdown(15);
    }
  }, [filter, selectedSector]);

  // Initial load
  useEffect(() => { fetchResults(); }, [fetchResults]);

  // Auto-refresh countdown
  useEffect(() => {
    if (countRef.current) clearInterval(countRef.current);
    if (autoRefresh) {
      countRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { fetchResults(); return 15; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countRef.current);
  }, [autoRefresh, fetchResults]);

  // ── Sorting ───────────────────────────────────────────────────────────────
  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const displayed = [...results]
    .filter(r => {
      if (selectedSector !== 'All Sectors' && r.sector !== selectedSector) return false;
      if (filter === 'Bullish Breakout'  && !['STRONG BUY','BUY'].includes(r.signal))   return false;
      if (filter === 'Bearish Breakdown' && !['STRONG SELL','SELL'].includes(r.signal)) return false;
      if (filter === 'Volume Spike'      && r.volRatio < 2)   return false;
      if (filter === 'RSI Oversold'      && r.rsi >= 30)      return false;
      if (filter === 'RSI Overbought'    && r.rsi <= 70)      return false;
      if (filter === 'Strong AI Signal'  && r.conf < 80)      return false;
      if (searchQuery && !r.symbol.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let av = a[sortBy], bv = b[sortBy];
      if (typeof av === 'string') av = av.toLowerCase(), bv = bv.toLowerCase();
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

  const bullish  = results.filter(r => ['STRONG BUY','BUY'].includes(r.signal)).length;
  const bearish  = results.filter(r => ['STRONG SELL','SELL'].includes(r.signal)).length;
  const highVol  = results.filter(r => r.volRatio >= 2).length;

  const TH = ({ col, label, className = '' }) => (
    <th
      onClick={() => handleSort(col)}
      className={`px-3 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400 cursor-pointer hover:text-cyberTeal transition-colors select-none whitespace-nowrap ${className}`}
    >
      {label}<SortIcon col={col} sortBy={sortBy} sortDir={sortDir} />
    </th>
  );

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 animate-fade-in">

      {/* ── TOP HEADER ─────────────────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-4 border-b border-white/5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyberBlue/15 border border-cyberBlue/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-cyberBlue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">AI Market Scanner</h1>
              <p className="text-xs text-slate-500 font-medium">Real-time pattern & signal detection across all markets</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accentGreen/10 border border-accentGreen/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accentGreen opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accentGreen" />
              </span>
              <span className="text-[10px] font-black text-accentGreen uppercase tracking-wider">Live Scanning</span>
            </div>

            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(v => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                autoRefresh
                  ? 'bg-cyberBlue/15 border-cyberBlue/40 text-cyberBlue'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
              }`}
            >
              <svg className={`w-3 h-3 ${autoRefresh ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {autoRefresh ? `Auto ${countdown}s` : 'Auto-refresh Off'}
            </button>

            {/* Manual refresh */}
            <button
              onClick={fetchResults}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-cyberBlue/40 text-slate-300 hover:text-cyberBlue text-[10px] font-bold transition-all cursor-pointer"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>

            {/* Last updated */}
            <span className="text-[10px] text-slate-500 font-mono">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 relative max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search symbol…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-cyberBlue/50 text-xs text-slate-200 placeholder-slate-600 focus:outline-none font-mono transition-colors"
          />
        </div>
      </div>

      {/* ── FILTER BAR ─────────────────────────────────────────────────────── */}
      <div className="px-6 py-3 border-b border-white/5 flex flex-wrap items-center gap-3">
        {/* Signal pills */}
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                filter === f
                  ? 'bg-cyberBlue text-white border-cyberBlue shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-white/10 hidden sm:block" />

        {/* Sector dropdown */}
        <select
          value={selectedSector}
          onChange={e => setSelectedSector(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-300 focus:outline-none focus:border-cyberBlue/50 cursor-pointer"
        >
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Sort display */}
        <span className="text-[10px] text-slate-600 font-mono ml-auto">
          Sorted by <span className="text-cyberTeal font-bold">{sortBy}</span> {sortDir === 'asc' ? '▲' : '▼'}
        </span>
      </div>

      {/* ── SCANNER TABLE ──────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-xs font-mono">
          <thead className="sticky top-0 z-10 bg-[#0d1220] border-b border-white/8">
            <tr>
              <TH col="rank"    label="#"       className="w-8" />
              <TH col="symbol"  label="Symbol" />
              <TH col="sector"  label="Sector" />
              <TH col="price"   label="Price" />
              <TH col="change"  label="Chg%" />
              <TH col="rsi"     label="RSI" />
              <TH col="volume"  label="Volume" />
              <TH col="volRatio"label="Vol Ratio" />
              <TH col="signal"  label="Signal" />
              <TH col="pattern" label="Pattern" />
              <TH col="conf"    label="AI Conf%" />
              <th className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 12 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 12 }).map((_, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-3 rounded skeleton-shimmer" style={{ width: `${40 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              : displayed.map((row, i) => (
                  <tr
                    key={row.symbol}
                    className={`border-b border-white/5 transition-colors cursor-default ${
                      i % 2 === 0 ? 'bg-white/[0.01]' : 'bg-transparent'
                    } hover:bg-cyberBlue/5`}
                  >
                    <td className="px-3 py-2.5 text-slate-600 text-[10px]">{i + 1}</td>

                    {/* Symbol */}
                    <td className="px-3 py-2.5">
                      <div className="font-black text-white text-xs tracking-wide">{row.symbol}</div>
                      <div className="text-[9px] text-slate-500 truncate max-w-[90px]">{row.name}</div>
                    </td>

                    {/* Sector */}
                    <td className="px-3 py-2.5">
                      <span className="text-[10px] text-slate-400 font-medium">{row.sector}</span>
                    </td>

                    {/* Price */}
                    <td className="px-3 py-2.5 text-white font-bold">${row.price.toFixed(2)}</td>

                    {/* Change% */}
                    <td className={`px-3 py-2.5 font-bold ${pctColor(row.change)}`}>
                      {row.change >= 0 ? '+' : ''}{row.change.toFixed(2)}%
                    </td>

                    {/* RSI */}
                    <td className={`px-3 py-2.5 ${rsiColor(row.rsi)}`}>{row.rsi.toFixed(1)}</td>

                    {/* Volume */}
                    <td className="px-3 py-2.5 text-slate-300">{row.volume.toFixed(1)}M</td>

                    {/* Vol Ratio */}
                    <td className="px-3 py-2.5">
                      <MiniBar ratio={row.volRatio} />
                    </td>

                    {/* Signal */}
                    <td className="px-3 py-2.5">
                      <SignalBadge signal={row.signal} />
                    </td>

                    {/* Pattern */}
                    <td className="px-3 py-2.5">
                      <span className="inline-block px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-slate-400 whitespace-nowrap">
                        {row.pattern}
                      </span>
                    </td>

                    {/* AI Conf */}
                    <td className="px-3 py-2.5">
                      <ConfBar value={row.conf} />
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => navigate(`/chart/${row.symbol}`)}
                          className="px-2.5 py-1 rounded-lg bg-cyberBlue/15 border border-cyberBlue/30 text-cyberBlue text-[10px] font-bold hover:bg-cyberBlue/25 transition-all cursor-pointer whitespace-nowrap"
                        >
                          View Chart
                        </button>
                        <button
                          onClick={() => setWatchlist(w => w.includes(row.symbol) ? w.filter(s => s !== row.symbol) : [...w, row.symbol])}
                          className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                            watchlist.includes(row.symbol)
                              ? 'bg-yellow-400/15 border-yellow-400/40 text-yellow-400'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                          }`}
                        >
                          {watchlist.includes(row.symbol) ? '★ Watching' : '☆ Watch'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>

        {!isLoading && displayed.length === 0 && (
          <div className="py-20 text-center text-slate-500 text-sm">
            No results match the current filters.
          </div>
        )}
      </div>

      {/* ── BOTTOM STATS ───────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Stocks Scanned', value: results.length,   color: 'text-cyberBlue' },
          { label: 'Bullish Signals', value: bullish,          color: 'text-accentGreen' },
          { label: 'Bearish Signals', value: bearish,          color: 'text-accentRed' },
          { label: 'High Vol Alerts', value: highVol,          color: 'text-yellow-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-panel rounded-xl p-4 border border-white/5 text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Scanner;
