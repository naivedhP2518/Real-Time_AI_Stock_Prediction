import React, { useState, useEffect, useCallback } from 'react';

// ─── Sector data ─────────────────────────────────────────────────────────────
const SECTOR_DATA = [
  { id: 'tech',        name: 'Technology',  stocks: ['AAPL','MSFT','NVDA','AMD','INTC','GOOGL','META'],   cap: 12.5 },
  { id: 'banking',     name: 'Banking',     stocks: ['JPM','BAC','GS','MS','C','WFC','V'],                cap: 6.8  },
  { id: 'healthcare',  name: 'Healthcare',  stocks: ['JNJ','PFE','MRNA','ABBV','UNH','CVS'],              cap: 5.2  },
  { id: 'energy',      name: 'Energy',      stocks: ['XOM','CVX','COP','SLB','BP','OXY'],                 cap: 4.1  },
  { id: 'fintech',     name: 'Fintech',     stocks: ['SQ','PYPL','HOOD','SOFI','COIN'],                   cap: 2.9  },
  { id: 'consumer',    name: 'Consumer',    stocks: ['WMT','TGT','COST','AMZN','HD'],                     cap: 4.6  },
  { id: 'auto',        name: 'Auto / EV',   stocks: ['TSLA','RIVN','NIO','F','GM'],                       cap: 3.2  },
  { id: 'crypto',      name: 'Crypto',      stocks: ['BTC','ETH','SOL','BNB','XRP'],                      cap: 2.4  },
];

const TIMEFRAME_RANGE = { '1D': 5, '1W': 15, '1M': 30 };

// ─── Colour helpers ────────────────────────────────────────────────────────
const perfColor = (pct) => {
  if (pct >=  3) return '#10B981';
  if (pct >=  1) return '#34D399';
  if (pct >=  0) return '#6EE7B7';
  if (pct >= -1) return '#FCA5A5';
  if (pct >= -3) return '#F87171';
  return '#EF4444';
};
const perfTextColor = (pct) => {
  if (pct >=  0) return 'text-emerald-300';
  return 'text-red-400';
};

const rand = (min, max, dp = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(dp));

const generateSectorPerf = (timeframe) => {
  const range = TIMEFRAME_RANGE[timeframe];
  return SECTOR_DATA.map(s => {
    const perf = rand(-range, range);
    const stocks = s.stocks.map(sym => ({
      symbol: sym,
      perf: rand(-range * 1.5, range * 1.5),
      price: rand(10, 800),
    }));
    const topMover = [...stocks].sort((a, b) => Math.abs(b.perf) - Math.abs(a.perf))[0];
    const avgRSI  = rand(30, 70, 1);
    return { ...s, perf, stocks, topMover, avgRSI };
  });
};

// ─── Fear & Greed Gauge ──────────────────────────────────────────────────────
const FearGreedGauge = ({ value }) => {
  const clamp = Math.max(0, Math.min(100, value));
  const angle = -90 + (clamp / 100) * 180;
  const label =
    clamp < 20 ? 'Extreme Fear' :
    clamp < 40 ? 'Fear' :
    clamp < 60 ? 'Neutral' :
    clamp < 80 ? 'Greed' : 'Extreme Greed';
  const color =
    clamp < 20 ? '#EF4444' :
    clamp < 40 ? '#F87171' :
    clamp < 60 ? '#94a3b8' :
    clamp < 80 ? '#34D399' : '#10B981';

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 70" className="w-36">
        {/* Track */}
        <path d="M10 65 A 50 50 0 0 1 110 65" fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
        {/* Zones */}
        <path d="M10 65 A 50 50 0 0 1 35 26" fill="none" stroke="#7f1d1d" strokeWidth="10" strokeLinecap="butt" />
        <path d="M35 26 A 50 50 0 0 1 60 15" fill="none" stroke="#991b1b" strokeWidth="10" strokeLinecap="butt" />
        <path d="M60 15 A 50 50 0 0 1 85 26" fill="none" stroke="#475569" strokeWidth="10" strokeLinecap="butt" />
        <path d="M85 26 A 50 50 0 0 1 100 45" fill="none" stroke="#065f46" strokeWidth="10" strokeLinecap="butt" />
        <path d="M100 45 A 50 50 0 0 1 110 65" fill="none" stroke="#047857" strokeWidth="10" strokeLinecap="butt" />
        {/* Needle */}
        <g transform={`translate(60,65) rotate(${angle})`}>
          <line x1="0" y1="0" x2="0" y2="-42" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="0" cy="0" r="4" fill={color} />
        </g>
        {/* Value */}
        <text x="60" y="62" textAnchor="middle" fontSize="12" fontWeight="900" fill={color}>{clamp}</text>
      </svg>
      <span className="text-xs font-bold mt-0.5" style={{ color }}>{label}</span>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const Heatmap = () => {
  const [sectors,        setSectors]        = useState([]);
  const [selectedSector, setSelectedSector] = useState(null);
  const [viewMode,       setViewMode]       = useState('sectors');
  const [hoverItem,      setHoverItem]      = useState(null);
  const [timeframe,      setTimeframe]      = useState('1D');
  const [fearGreed,      setFearGreed]      = useState(52);

  const regenerate = useCallback((tf) => {
    setSectors(generateSectorPerf(tf));
    setFearGreed(rand(15, 85, 0));
  }, []);

  useEffect(() => { regenerate(timeframe); }, [timeframe, regenerate]);

  // Advance / decline counts
  const allStocks = sectors.flatMap(s => s.stocks || []);
  const advancing = allStocks.filter(s => s.perf >= 0).length;
  const declining = allStocks.filter(s => s.perf < 0).length;
  const breadthPct = allStocks.length > 0 ? Math.round((advancing / allStocks.length) * 100) : 50;

  const sortedSectors = [...sectors].sort((a, b) => b.perf - a.perf);

  const handleSectorClick = (sector) => {
    setSelectedSector(sector);
    setViewMode('stocks');
  };

  // Tile size classes (by cap)
  const tileSize = (cap) => {
    if (cap >= 10) return 'min-h-[160px]';
    if (cap >= 5)  return 'min-h-[130px]';
    return 'min-h-[110px]';
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 animate-fade-in">
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyberTeal/15 border border-cyberTeal/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-cyberTeal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Sector Heatmap</h1>
              <p className="text-xs text-slate-500">Market-wide performance at a glance</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Timeframe */}
            <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5 gap-0.5">
              {['1D','1W','1M'].map(tf => (
                <button
                  key={tf}
                  onClick={() => { setTimeframe(tf); }}
                  className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    timeframe === tf
                      ? 'bg-cyberTeal text-[#0B0F19]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >{tf}</button>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5 gap-0.5">
              {['sectors','stocks'].map(v => (
                <button
                  key={v}
                  onClick={() => { if (v === 'sectors') { setViewMode('sectors'); setSelectedSector(null); } else if (selectedSector) setViewMode('stocks'); }}
                  className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer capitalize ${
                    viewMode === v
                      ? 'bg-cyberBlue text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >{v}</button>
              ))}
            </div>

            {/* Refresh */}
            <button
              onClick={() => regenerate(timeframe)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-cyberTeal/40 text-slate-300 hover:text-cyberTeal text-[10px] font-bold transition-all cursor-pointer"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* ── LEGEND ────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6 p-3 glass-panel rounded-xl border border-white/5">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider whitespace-nowrap">Performance</span>
          <div className="flex-1 h-3 rounded-full overflow-hidden" style={{
            background: 'linear-gradient(90deg, #EF4444 0%, #F87171 25%, #94a3b8 50%, #34D399 75%, #10B981 100%)'
          }} />
          <span className="text-[10px] font-bold text-red-400">-5%+</span>
          <span className="text-[10px] text-slate-500">◀──────────────▶</span>
          <span className="text-[10px] font-bold text-emerald-400">+5%+</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── MAIN HEATMAP ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-3">

            {viewMode === 'sectors' ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {sectors.map(sector => {
                    const bg = perfColor(sector.perf);
                    const isHovered = hoverItem?.id === sector.id;
                    return (
                      <div
                        key={sector.id}
                        onMouseEnter={() => setHoverItem(sector)}
                        onMouseLeave={() => setHoverItem(null)}
                        onClick={() => handleSectorClick(sector)}
                        className={`relative cursor-pointer rounded-2xl border transition-all duration-300 overflow-hidden select-none ${
                          tileSize(sector.cap)
                        } ${isHovered ? 'scale-[1.03] shadow-2xl z-10' : 'hover:scale-[1.01]'}`}
                        style={{
                          backgroundColor: `${bg}22`,
                          borderColor: `${bg}55`,
                          boxShadow: isHovered ? `0 0 30px ${bg}44` : 'none',
                        }}
                      >
                        {/* Background glow */}
                        <div className="absolute inset-0 rounded-2xl" style={{
                          background: `radial-gradient(circle at 50% 50%, ${bg}18 0%, transparent 70%)`
                        }} />

                        <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                          <div>
                            <p className="text-[10px] font-black text-white/70 uppercase tracking-wider">{sector.name}</p>
                            <p className={`text-2xl font-black mt-1 ${perfTextColor(sector.perf)}`} style={{ color: bg }}>
                              {sector.perf >= 0 ? '+' : ''}{sector.perf.toFixed(2)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-white/40">{sector.stocks.length} stocks</p>
                            <p className="text-[9px] text-white/50 font-mono truncate">
                              ↑ {sector.topMover?.symbol} {sector.topMover?.perf >= 0 ? '+' : ''}{sector.topMover?.perf.toFixed(1)}%
                            </p>
                          </div>
                        </div>

                        {/* Pulse animation based on magnitude */}
                        {Math.abs(sector.perf) > 2 && (
                          <div className="absolute inset-0 rounded-2xl animate-ping opacity-5" style={{ backgroundColor: bg }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Hover tooltip */}
                {hoverItem && (
                  <div className="mt-4 glass-panel rounded-xl border border-white/10 p-4 animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-black text-white">{hoverItem.name}</h3>
                      <span className="font-black text-lg" style={{ color: perfColor(hoverItem.perf) }}>
                        {hoverItem.perf >= 0 ? '+' : ''}{hoverItem.perf.toFixed(2)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-[10px]">
                      <div>
                        <p className="text-slate-500 font-bold uppercase">Avg RSI</p>
                        <p className="text-white font-black mt-0.5">{hoverItem.avgRSI}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-bold uppercase">Market Cap</p>
                        <p className="text-white font-black mt-0.5">${hoverItem.cap}T</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-bold uppercase">Leading Stock</p>
                        <p className="text-cyberTeal font-black mt-0.5">{hoverItem.topMover?.symbol}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {hoverItem.stocks.map(s => (
                        <span key={s} className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-slate-400 font-mono">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Stocks drill-down view */
              selectedSector ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      onClick={() => { setViewMode('sectors'); setSelectedSector(null); }}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-cyberTeal transition-colors cursor-pointer"
                    >
                      ← Back to Sectors
                    </button>
                    <span className="text-slate-600">/</span>
                    <span className="text-sm font-black text-white">{selectedSector.name}</span>
                    <span className="font-black text-sm" style={{ color: perfColor(selectedSector.perf) }}>
                      {selectedSector.perf >= 0 ? '+' : ''}{selectedSector.perf.toFixed(2)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {selectedSector.stocks.map(stock => {
                      const bg = perfColor(stock.perf);
                      return (
                        <div
                          key={stock.symbol}
                          className="rounded-xl border p-3 flex flex-col items-center cursor-pointer transition-all hover:scale-105 select-none"
                          style={{ backgroundColor: `${bg}18`, borderColor: `${bg}44` }}
                          onMouseEnter={() => setHoverItem(stock)}
                          onMouseLeave={() => setHoverItem(null)}
                        >
                          <span className="text-xs font-black text-white">{stock.symbol}</span>
                          <span className="text-[11px] font-bold mt-1" style={{ color: bg }}>
                            {stock.perf >= 0 ? '+' : ''}{stock.perf.toFixed(2)}%
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono mt-0.5">${stock.price.toFixed(0)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-500">
                  <p className="text-sm">Select a sector to drill down into individual stocks</p>
                </div>
              )
            )}
          </div>

          {/* ── SIDE PANEL ───────────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Market Breadth */}
            <div className="glass-panel rounded-xl border border-white/5 p-4">
              <h3 className="text-xs font-black text-white uppercase tracking-wider mb-3">Market Breadth</h3>
              <div className="flex items-center justify-between text-[10px] mb-1.5">
                <span className="text-accentGreen font-bold">▲ {advancing} Advancing</span>
                <span className="text-accentRed font-bold">{declining} Declining ▼</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 flex">
                <div className="h-full bg-accentGreen rounded-l-full transition-all" style={{ width: `${breadthPct}%` }} />
                <div className="h-full bg-accentRed rounded-r-full flex-1 transition-all" />
              </div>
              <p className="text-[9px] text-slate-500 mt-1 text-center">{breadthPct}% Advancing</p>
            </div>

            {/* Sector Rankings */}
            <div className="glass-panel rounded-xl border border-white/5 p-4">
              <h3 className="text-xs font-black text-white uppercase tracking-wider mb-3">Sector Rankings</h3>
              <div className="space-y-1.5">
                {sortedSectors.map((s, i) => (
                  <div
                    key={s.id}
                    onClick={() => handleSectorClick(s)}
                    className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group"
                  >
                    <span className="text-[9px] text-slate-600 font-mono w-4">{i + 1}</span>
                    <span className="text-[10px] text-slate-300 font-semibold flex-1 group-hover:text-white transition-colors">{s.name}</span>
                    <span className="text-[10px] font-black font-mono" style={{ color: perfColor(s.perf) }}>
                      {s.perf >= 0 ? '+' : ''}{s.perf.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fear & Greed */}
            <div className="glass-panel rounded-xl border border-white/5 p-4">
              <h3 className="text-xs font-black text-white uppercase tracking-wider mb-3">Fear & Greed Index</h3>
              <FearGreedGauge value={fearGreed} />
              <p className="text-[9px] text-slate-500 text-center mt-2">Based on volatility, momentum & volume</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Heatmap;
