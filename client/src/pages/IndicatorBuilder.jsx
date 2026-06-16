import React, { useState, useMemo, useCallback } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// ─── Color System for Component Types ──────────────────────────────────────
const COMPONENT_COLORS = {
  momentum:   { bg: 'bg-violet-500/15', border: 'border-violet-500/50', text: 'text-violet-400', pill: '#8B5CF6' },
  trend:      { bg: 'bg-cyberBlue/15',  border: 'border-cyberBlue/50',  text: 'text-cyberBlue',  pill: '#3B82F6' },
  volatility: { bg: 'bg-amber-500/15',  border: 'border-amber-500/50',  text: 'text-amber-400',  pill: '#F59E0B' },
  volume:     { bg: 'bg-cyberTeal/15',  border: 'border-cyberTeal/50',  text: 'text-cyberTeal',  pill: '#06B6D4' },
  operator:   { bg: 'bg-slate-700/40',  border: 'border-slate-500/40',  text: 'text-slate-300',  pill: '#64748B' },
  number:     { bg: 'bg-accentGreen/15',border: 'border-accentGreen/50',text: 'text-accentGreen',pill: '#10B981' },
};

// ─── Available Base Components ──────────────────────────────────────────────
const BASE_COMPONENTS = [
  { id: 'RSI',          label: 'RSI',          display: (p) => `RSI(${p})`,           category: 'momentum',   hasPeriod: true,  defaultPeriod: 14,  description: 'Relative Strength Index — momentum oscillator (0-100)' },
  { id: 'EMA',          label: 'EMA',          display: (p) => `EMA(${p})`,           category: 'trend',      hasPeriod: true,  defaultPeriod: 20,  description: 'Exponential Moving Average — weighted trend follower' },
  { id: 'SMA',          label: 'SMA',          display: (p) => `SMA(${p})`,           category: 'trend',      hasPeriod: true,  defaultPeriod: 20,  description: 'Simple Moving Average — equal-weight trend line' },
  { id: 'MACD',         label: 'MACD',         display: () => `MACD(12,26,9)`,        category: 'momentum',   hasPeriod: false, description: 'MACD line — trend/momentum crossover signal' },
  { id: 'VOLUME',       label: 'VOLUME',       display: () => `VOLUME`,               category: 'volume',     hasPeriod: false, description: 'Raw trading volume for the period' },
  { id: 'BBANDS_UPPER', label: 'BB Upper',     display: () => `BBANDS_UPPER`,         category: 'volatility', hasPeriod: false, description: 'Bollinger Band upper bound (2σ above SMA)' },
  { id: 'BBANDS_LOWER', label: 'BB Lower',     display: () => `BBANDS_LOWER`,         category: 'volatility', hasPeriod: false, description: 'Bollinger Band lower bound (2σ below SMA)' },
  { id: 'ATR',          label: 'ATR',          display: (p) => `ATR(${p})`,           category: 'volatility', hasPeriod: true,  defaultPeriod: 14,  description: 'Average True Range — measures market volatility' },
  { id: 'VWAP',         label: 'VWAP',         display: () => `VWAP`,                 category: 'volume',     hasPeriod: false, description: 'Volume-Weighted Average Price — institutional benchmark' },
];

const OPERATORS = ['+', '-', '*', '/', '>', '<', '(', ')'];

// ─── Saved Indicators Library ───────────────────────────────────────────────
const DEFAULT_SAVED_INDICATORS = [
  {
    id: 'ind1',
    name: 'RSI Momentum',
    formula: 'RSI(14) + EMA(20) / 2',
    components: [
      { key: 'RSI', display: 'RSI(14)', category: 'momentum' },
      { key: 'op+', display: '+', category: 'operator' },
      { key: 'EMA', display: 'EMA(20)', category: 'trend' },
      { key: 'op/', display: '/', category: 'operator' },
      { key: 'num2', display: '2', category: 'number' },
    ],
    color: '#8B5CF6',
    description: 'Combines RSI momentum with EMA trend filter',
  },
  {
    id: 'ind2',
    name: 'Volume RSI',
    formula: '(VOLUME * RSI(14)) / 1000000',
    components: [
      { key: 'op(', display: '(', category: 'operator' },
      { key: 'VOLUME', display: 'VOLUME', category: 'volume' },
      { key: 'op*', display: '*', category: 'operator' },
      { key: 'RSI', display: 'RSI(14)', category: 'momentum' },
      { key: 'op)', display: ')', category: 'operator' },
      { key: 'op/', display: '/', category: 'operator' },
      { key: 'num1M', display: '1000000', category: 'number' },
    ],
    color: '#06B6D4',
    description: 'Volume-adjusted RSI for institutional confirmation',
  },
  {
    id: 'ind3',
    name: 'Trend Strength',
    formula: 'MACD(12,26,9) * RSI(14) / 100',
    components: [
      { key: 'MACD', display: 'MACD(12,26,9)', category: 'momentum' },
      { key: 'op*', display: '*', category: 'operator' },
      { key: 'RSI', display: 'RSI(14)', category: 'momentum' },
      { key: 'op/', display: '/', category: 'operator' },
      { key: 'num100', display: '100', category: 'number' },
    ],
    color: '#3B82F6',
    description: 'MACD amplified by RSI strength normalised to 100',
  },
  {
    id: 'ind4',
    name: 'Volatility Score',
    formula: 'ATR(14) / EMA(50) * 100',
    components: [
      { key: 'ATR', display: 'ATR(14)', category: 'volatility' },
      { key: 'op/', display: '/', category: 'operator' },
      { key: 'EMA', display: 'EMA(50)', category: 'trend' },
      { key: 'op*', display: '*', category: 'operator' },
      { key: 'num100', display: '100', category: 'number' },
    ],
    color: '#F59E0B',
    description: 'ATR relative to EMA — normalised volatility percentage',
  },
];

// ─── Generate Synthetic Preview Data ───────────────────────────────────────
const generatePreviewData = (color = '#06B6D4') => {
  const days = 30;
  const data = [];
  let price = 180 + Math.random() * 20;
  let indicator = 50 + Math.random() * 20;
  for (let i = 0; i < days; i++) {
    price += (Math.random() - 0.48) * 4;
    indicator += (Math.random() - 0.48) * 8;
    indicator = Math.max(10, Math.min(90, indicator));
    data.push({
      day: `D${i + 1}`,
      price: +price.toFixed(2),
      indicator: +indicator.toFixed(2),
    });
  }
  return data;
};

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0B0F19]/95 border border-white/10 rounded-xl p-3 text-xs font-mono shadow-2xl">
      <p className="text-cyberTeal font-bold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </p>
      ))}
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────
const IndicatorBuilder = () => {
  const [formulaComponents, setFormulaComponents] = useState([]);
  const [indicatorName, setIndicatorName] = useState('');
  const [savedIndicators, setSavedIndicators] = useState(DEFAULT_SAVED_INDICATORS);
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [selectedPeriods, setSelectedPeriods] = useState({});
  const [previewMode, setPreviewMode] = useState('overlay'); // 'price' | 'indicator' | 'overlay'
  const [indicatorColor, setIndicatorColor] = useState('#06B6D4');
  const [validationMsg, setValidationMsg] = useState(null); // { type: 'ok'|'error', msg }
  const [previewData] = useState(() => generatePreviewData());

  // ─── Period for a given component ───────────────────────────────────────
  const getPeriod = (compId) => selectedPeriods[compId] ?? (BASE_COMPONENTS.find(c => c.id === compId)?.defaultPeriod || 14);

  // ─── Add component to formula ────────────────────────────────────────────
  const addComponent = useCallback((comp) => {
    const uid = `${comp.id}_${Date.now()}`;
    const period = getPeriod(comp.id);
    setFormulaComponents(prev => [...prev, {
      uid,
      key: comp.id,
      display: comp.hasPeriod ? comp.display(period) : comp.display(),
      category: comp.category,
    }]);
    setValidationMsg(null);
  }, [selectedPeriods]);

  const addOperator = useCallback((op) => {
    const uid = `op_${op}_${Date.now()}`;
    setFormulaComponents(prev => [...prev, { uid, key: `op${op}`, display: op, category: 'operator' }]);
    setValidationMsg(null);
  }, []);

  const removeLastComponent = () => setFormulaComponents(prev => prev.slice(0, -1));
  const clearFormula = () => { setFormulaComponents([]); setValidationMsg(null); };

  // ─── Formula string ──────────────────────────────────────────────────────
  const formulaString = useMemo(() => formulaComponents.map(c => c.display).join(' '), [formulaComponents]);

  // ─── Validate formula ─────────────────────────────────────────────────────
  const validateFormula = () => {
    if (formulaComponents.length === 0) {
      setValidationMsg({ type: 'error', msg: 'Formula is empty. Add components to build.' });
      return;
    }
    const lastComp = formulaComponents[formulaComponents.length - 1];
    if (lastComp.category === 'operator' && ![')', '>','<'].includes(lastComp.display)) {
      setValidationMsg({ type: 'error', msg: 'Formula cannot end with an arithmetic operator.' });
      return;
    }
    const opens = formulaComponents.filter(c => c.display === '(').length;
    const closes = formulaComponents.filter(c => c.display === ')').length;
    if (opens !== closes) {
      setValidationMsg({ type: 'error', msg: `Mismatched parentheses: ${opens} open, ${closes} close.` });
      return;
    }
    setValidationMsg({ type: 'ok', msg: '✓ Formula syntax is valid.' });
  };

  // ─── Save indicator ───────────────────────────────────────────────────────
  const saveIndicator = () => {
    if (!indicatorName.trim()) { setValidationMsg({ type: 'error', msg: 'Enter an indicator name before saving.' }); return; }
    if (formulaComponents.length === 0) { setValidationMsg({ type: 'error', msg: 'Formula is empty.' }); return; }
    const newInd = {
      id: `ind_${Date.now()}`,
      name: indicatorName.trim(),
      formula: formulaString,
      components: formulaComponents,
      color: indicatorColor,
      description: `Custom: ${formulaString.substring(0, 50)}`,
    };
    setSavedIndicators(prev => [newInd, ...prev]);
    setIndicatorName('');
    setFormulaComponents([]);
    setValidationMsg({ type: 'ok', msg: `"${newInd.name}" saved to library.` });
  };

  // ─── Load saved indicator into builder ────────────────────────────────────
  const loadIndicator = (ind) => {
    setSelectedIndicator(ind.id);
    setFormulaComponents(ind.components.map((c, i) => ({ ...c, uid: `${c.key}_loaded_${i}` })));
    setIndicatorName(ind.name);
    setIndicatorColor(ind.color);
    setValidationMsg(null);
  };

  // ─── Chart data per preview mode ─────────────────────────────────────────
  const chartDataForMode = useMemo(() => {
    if (previewMode === 'price') return previewData.map(d => ({ ...d, indicator: undefined }));
    if (previewMode === 'indicator') return previewData.map(d => ({ ...d, price: undefined }));
    return previewData;
  }, [previewMode, previewData]);

  // ─── Category badge ───────────────────────────────────────────────────────
  const getCategoryLabel = (cat) => ({ momentum: 'MOMEN', trend: 'TREND', volatility: 'VOLAT', volume: 'VOL', operator: 'OP', number: 'NUM' }[cat] || cat.toUpperCase());

  return (
    <div className="p-4 sm:p-8 space-y-8 w-full text-slate-800 dark:text-slate-100 transition-colors duration-300 animate-fade-in">

      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 dark:border-white/5 pb-6 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500" />
            </span>
            <span className="text-[11px] font-black text-violet-400 uppercase tracking-widest font-mono">Formula Studio</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Indicator Builder</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Compose custom technical indicators using base oscillators, trend lines, and volume signals.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/5 px-3 py-1.5 rounded-lg">
            {formulaComponents.length} components
          </span>
          <span className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${validationMsg?.type === 'ok' ? 'text-accentGreen border-accentGreen/30 bg-accentGreen/10' : validationMsg?.type === 'error' ? 'text-accentRed border-accentRed/30 bg-accentRed/10' : 'text-slate-400 border-white/5 bg-black/20'}`}>
            {validationMsg ? validationMsg.msg : 'No validation run yet'}
          </span>
        </div>
      </div>

      {/* ── MAIN 3-COLUMN BUILDER LAYOUT ────────────────────────────────── */}
      <div className="grid gap-6" style={{ gridTemplateColumns: '260px 1fr 320px' }}>

        {/* ── LEFT: Component Library ──────────────────────────────────── */}
        <div className="space-y-4">
          <div className="glass-panel neon-glow-card rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
              <h3 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Component Library</h3>
            </div>
            <div className="p-3 space-y-2 max-h-[420px] overflow-y-auto">
              {BASE_COMPONENTS.map((comp) => {
                const colors = COMPONENT_COLORS[comp.category];
                const period = getPeriod(comp.id);
                return (
                  <div key={comp.id} className={`rounded-xl border p-2.5 ${colors.bg} ${colors.border} group`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-xs font-black font-mono ${colors.text}`}>{comp.label}</span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}>
                            {getCategoryLabel(comp.category)}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">{comp.description}</p>
                      </div>
                    </div>
                    {comp.hasPeriod && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[9px] text-slate-400 font-mono">Period:</span>
                        <input
                          type="number"
                          min="2" max="200"
                          value={period}
                          onChange={(e) => setSelectedPeriods(prev => ({ ...prev, [comp.id]: parseInt(e.target.value) || comp.defaultPeriod }))}
                          className="w-14 text-[10px] font-mono font-bold bg-black/30 border border-white/10 rounded-lg px-2 py-0.5 text-white focus:outline-none focus:border-cyberBlue/60"
                        />
                      </div>
                    )}
                    <button
                      onClick={() => addComponent(comp)}
                      className={`mt-2 w-full text-[10px] font-black py-1.5 rounded-lg border ${colors.border} ${colors.text} ${colors.bg} hover:brightness-125 transition-all cursor-pointer`}
                    >
                      + Add to Formula
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operators Panel */}
          <div className="glass-panel neon-glow-card rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
              <h3 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Operators</h3>
            </div>
            <div className="p-3 grid grid-cols-4 gap-2">
              {OPERATORS.map((op) => (
                <button
                  key={op}
                  onClick={() => addOperator(op)}
                  className="h-10 rounded-xl border border-slate-600/40 bg-slate-700/30 text-slate-200 font-black text-base font-mono hover:bg-slate-600/40 hover:border-slate-500/60 hover:text-white transition-all cursor-pointer"
                >
                  {op}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── CENTER: Formula Canvas ───────────────────────────────────── */}
        <div className="space-y-4">
          <div className="glass-panel neon-glow-card rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 flex items-center justify-between">
              <h3 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Formula Canvas</h3>
              <div className="flex gap-2">
                <button onClick={removeLastComponent} className="text-[10px] font-black px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer">⌫ Undo</button>
                <button onClick={clearFormula} className="text-[10px] font-black px-3 py-1 rounded-lg bg-accentRed/10 border border-accentRed/30 text-accentRed hover:bg-accentRed/20 transition-all cursor-pointer">✕ Clear</button>
              </div>
            </div>

            {/* Formula pill display */}
            <div className="p-4 min-h-[120px] bg-[#0a0d17] rounded-none">
              <div className="flex flex-wrap gap-2 min-h-[64px] p-3 rounded-xl border border-dashed border-white/10 bg-black/20">
                {formulaComponents.length === 0 ? (
                  <span className="text-slate-600 text-xs font-mono self-center">
                    {'// Click components to build your formula...'}
                  </span>
                ) : (
                  formulaComponents.map((comp) => {
                    const colors = COMPONENT_COLORS[comp.category] || COMPONENT_COLORS.operator;
                    return (
                      <span
                        key={comp.uid}
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black font-mono border ${colors.bg} ${colors.border} ${colors.text} animate-scale-up`}
                      >
                        {comp.display}
                      </span>
                    );
                  })
                )}
              </div>
            </div>

            {/* Formula string preview */}
            <div className="px-4 py-3 bg-[#080b14] border-t border-white/5">
              <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest mb-1">Formula String</p>
              <code className="text-xs text-cyberTeal font-mono break-all">
                {formulaString || '// empty formula'}
              </code>
            </div>

            {/* Name + Save */}
            <div className="p-4 border-t border-slate-200 dark:border-white/5 space-y-3">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Indicator name..."
                  value={indicatorName}
                  onChange={(e) => setIndicatorName(e.target.value)}
                  className="flex-1 text-xs font-mono bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyberBlue/60 transition-all"
                />
                <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-3">
                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">Line Color</span>
                  <input
                    type="color"
                    value={indicatorColor}
                    onChange={(e) => setIndicatorColor(e.target.value)}
                    className="w-8 h-6 cursor-pointer bg-transparent border-0 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={validateFormula}
                  className="flex-1 py-2.5 text-xs font-black rounded-xl border border-cyberBlue/40 bg-cyberBlue/10 text-cyberBlue hover:bg-cyberBlue/20 transition-all cursor-pointer"
                >
                  ✓ Validate Syntax
                </button>
                <button
                  onClick={saveIndicator}
                  className="flex-1 py-2.5 text-xs font-black rounded-xl bg-gradient-to-r from-violet-500 to-cyberBlue text-white hover:from-violet-600 hover:to-blue-600 transition-all cursor-pointer shadow-lg"
                >
                  💾 Save to Library
                </button>
              </div>
            </div>
          </div>

          {/* Syntax Legend */}
          <div className="glass-panel rounded-2xl border border-slate-200 dark:border-white/5 p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-3">Syntax Color Legend</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(COMPONENT_COLORS).map(([cat, colors]) => (
                <span key={cat} className={`text-[9px] font-black px-2.5 py-1 rounded-lg border uppercase font-mono ${colors.bg} ${colors.border} ${colors.text}`}>
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Preview Chart ─────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="glass-panel neon-glow-card rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
              <h3 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono mb-2">Preview Chart</h3>
              <div className="flex gap-1 bg-black/30 rounded-lg p-1">
                {[['price', 'Price'], ['indicator', 'Indicator'], ['overlay', 'Overlay']].map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => setPreviewMode(mode)}
                    className={`flex-1 text-[9px] font-black py-1.5 rounded-md transition-all cursor-pointer ${previewMode === mode ? 'bg-cyberBlue text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-[#080b14]">
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={chartDataForMode} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGradIB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 8, fill: '#475569' }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis yAxisId="price" tick={{ fontSize: 8, fill: '#475569' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  {(previewMode === 'overlay' || previewMode === 'indicator') && (
                    <YAxis yAxisId="ind" orientation="right" tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  )}
                  <Tooltip content={<ChartTooltip />} />
                  {(previewMode === 'price' || previewMode === 'overlay') && (
                    <>
                      <Area yAxisId="price" type="monotone" dataKey="price" stroke="#10B981" strokeWidth={2} fill="url(#priceGradIB)" dot={false} name="Price" />
                      <Line yAxisId="price" type="monotone" dataKey="price" stroke="#10B981" strokeWidth={2} dot={false} name="Price" />
                    </>
                  )}
                  {(previewMode === 'indicator' || previewMode === 'overlay') && (
                    <Line yAxisId={previewMode === 'overlay' ? 'ind' : 'price'} type="monotone" dataKey="indicator" stroke={indicatorColor} strokeWidth={2} dot={false} name="Indicator" strokeDasharray={previewMode === 'overlay' ? '4 2' : undefined} />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="p-3 border-t border-white/5 space-y-1.5 bg-black/20">
              <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Chart Legend</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-accentGreen" /><span className="text-[10px] font-mono text-slate-400">Price</span></div>
                <div className="flex items-center gap-1.5"><div className="w-4 h-0.5" style={{ background: indicatorColor }} /><span className="text-[10px] font-mono text-slate-400">Indicator</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SAVED INDICATORS LIBRARY ─────────────────────────────────────── */}
      <div className="glass-panel neon-glow-card rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 flex items-center justify-between">
          <div>
            <h3 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Saved Indicators Library</h3>
            <p className="text-xs text-slate-500 mt-0.5">{savedIndicators.length} indicators saved</p>
          </div>
        </div>
        <div className="p-6 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {savedIndicators.map((ind) => (
            <div
              key={ind.id}
              className={`rounded-2xl border p-4 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${selectedIndicator === ind.id ? 'border-cyberBlue/50 bg-cyberBlue/5' : 'border-slate-200 dark:border-white/5 bg-slate-50/30 dark:bg-black/20'}`}
              onClick={() => loadIndicator(ind)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: ind.color }} />
                  <span className="text-sm font-black text-slate-800 dark:text-white">{ind.name}</span>
                </div>
                {selectedIndicator === ind.id && <span className="text-[9px] font-black text-cyberBlue bg-cyberBlue/10 border border-cyberBlue/30 px-2 py-0.5 rounded-full uppercase">Active</span>}
              </div>
              <code className="text-[10px] font-mono text-cyberTeal block mb-2 leading-relaxed">{ind.formula}</code>
              <p className="text-[10px] text-slate-400 mb-3">{ind.description}</p>
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); loadIndicator(ind); }}
                  className="flex-1 text-[10px] font-black py-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-all cursor-pointer"
                >
                  ✏️ Edit
                </button>
                <a
                  href="/chart/AAPL"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 text-[10px] font-black py-1.5 rounded-lg border border-accentGreen/30 bg-accentGreen/10 text-accentGreen hover:bg-accentGreen/20 transition-all text-center"
                >
                  📈 Apply
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IndicatorBuilder;
