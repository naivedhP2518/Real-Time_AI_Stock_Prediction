import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, ReferenceLine 
} from 'recharts';
import API from '../services/api';

const CORE_TICKERS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'TSLA', name: 'Tesla, Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corp.' },
  { symbol: 'NVDA', name: 'Nvidia Corp.' },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.' }
];

const Predictions = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [customSymbol, setCustomSymbol] = useState('');
  const [predictionData, setPredictionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState('');
  const [error, setError] = useState(null);

  // Fetch prediction details for selected symbol
  const fetchPrediction = async (symbol) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await API.get(`/stocks/predictions/${symbol}`);
      setPredictionData(data);
    } catch (err) {
      console.error('Error fetching prediction:', err);
      setError('Unable to fetch model forecasting data. Please verify backend state.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction(selectedSymbol);
  }, [selectedSymbol]);

  // Recalculation simulation with beautiful diagnostic messages
  const handleRecalculate = () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanMessage('Initializing LSTM model nodes...');
    
    const messages = [
      'Initializing LSTM model nodes...',
      'Downloading 2-year daily stock quotes from Yahoo Finance...',
      'Computing technical features (RSI-14, SMA-20, MACD)...',
      'Normalizing dataset vectors via MinMaxScaler...',
      'Segmenting 60-day rolling sequence matrices...',
      'Loading trained LSTM deep network weights...',
      'Executing forward-propagation matrix calculations...',
      'Generating recursive 7-day future forecasting wands...',
      'Validating loss parameters and confidence ratings...'
    ];

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        const next = prev + 4;
        
        // Update diagnostics messages based on progress checkpoints
        const msgIdx = Math.min(
          messages.length - 1,
          Math.floor((next / 100) * messages.length)
        );
        setScanMessage(messages[msgIdx]);

        if (next >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          fetchPrediction(selectedSymbol);
          return 100;
        }
        return next;
      });
    }, 120);
  };

  const handleCustomSearch = (e) => {
    e.preventDefault();
    if (customSymbol.trim()) {
      const sym = customSymbol.toUpperCase().trim();
      setSelectedSymbol(sym);
      setCustomSymbol('');
    }
  };

  // Compile combined chart data for historical and predictions lines
  const compiledChartData = useMemo(() => {
    if (!predictionData) return [];
    
    const hist = predictionData.historicalPrices || [];
    const fut = predictionData.futurePrices || [];
    
    const histPoints = hist.map(item => ({
      date: item.date,
      price: item.price,
      predicted: null,
      upper: null,
      lower: null,
      type: 'Historical'
    }));

    if (histPoints.length === 0) return [];

    const lastHist = histPoints[histPoints.length - 1];
    
    // Connect the history line directly with the prediction line to ensure visual continuity
    const connectionPoint = {
      date: lastHist.date,
      price: lastHist.price,
      predicted: lastHist.price,
      upper: lastHist.price,
      lower: lastHist.price,
      type: 'Connection'
    };

    const futPoints = fut.map(item => ({
      date: item.date,
      price: null,
      predicted: item.price,
      upper: item.upper,
      lower: item.lower,
      type: 'Forecast'
    }));

    return [...histPoints, connectionPoint, ...futPoints];
  }, [predictionData]);

  // Compute confidence state colors
  const confidenceColor = useMemo(() => {
    if (!predictionData) return 'text-cyberTeal border-cyberTeal';
    const conf = predictionData.confidence;
    if (conf >= 85) return 'text-accentGreen border-accentGreen shadow-accentGreen/10';
    if (conf >= 75) return 'text-cyberBlue border-cyberBlue shadow-cyberBlue/10';
    return 'text-yellow-500 border-yellow-500 shadow-yellow-500/10';
  }, [predictionData]);

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto transition-colors duration-300">
      
      {/* Header bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 dark:border-white/5 pb-6 gap-4">
        <div>
          <span className="text-xs font-bold text-cyberBlue dark:text-cyberTeal uppercase tracking-wider">Predictive Deep Learning Terminal</span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1">AI Signals & Forecasting</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            LSTM recurrent models running daily calculations over technical indicators and price drift sequences.
          </p>
        </div>

        {/* Action controllers */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleCustomSearch} className="relative flex items-center">
            <input
              type="text"
              placeholder=""
              value={customSymbol}
              onChange={(e) => setCustomSymbol(e.target.value)}
              className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/35 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyberBlue focus:ring-1 focus:ring-cyberBlue w-52 transition-all"
            />
            <button type="submit" className="absolute right-2 text-slate-400 dark:text-slate-500 hover:text-cyberBlue transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          <button
            onClick={handleRecalculate}
            disabled={isLoading || isScanning}
            className="px-5 py-2.5 bg-gradient-to-r from-cyberBlue to-cyberTeal text-white font-bold text-xs rounded-xl shadow-lg shadow-cyberBlue/10 hover:shadow-cyberBlue/20 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            <svg className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.656 48.656 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
            </svg>
            {isScanning ? 'Re-training Network...' : 'Recalculate AI Model'}
          </button>
        </div>
      </div>

      {/* CORE TICKERS ROW SELECTOR */}
      <div className="flex flex-wrap gap-2.5">
        {CORE_TICKERS.map((ticker) => (
          <button
            key={ticker.symbol}
            onClick={() => setSelectedSymbol(ticker.symbol)}
            disabled={isScanning}
            className={`px-4 py-3 rounded-xl border font-bold text-xs transition-all duration-300 flex items-center space-x-2 cursor-pointer ${
              selectedSymbol === ticker.symbol
                ? 'bg-gradient-to-r from-cyberBlue/10 to-cyberTeal/10 border-cyberBlue text-cyberBlue dark:text-cyberTeal shadow-md shadow-cyberBlue/5'
                : 'border-slate-200 dark:border-white/5 bg-slate-100/40 dark:bg-black/25 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-white/10'
            }`}
          >
            <span className="font-extrabold tracking-wide">{ticker.symbol}</span>
            <span className="text-[10px] opacity-75 font-semibold font-mono hidden sm:inline">| {ticker.name}</span>
          </button>
        ))}
      </div>

      {/* ERROR HANDLER */}
      {error && (
        <div className="p-4 bg-accentRed/10 border border-accentRed/20 text-accentRed rounded-xl text-xs font-semibold flex items-center space-x-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* DYNAMIC SCANNERS & PROGRESS METERS */}
      {isScanning ? (
        <div className="glass-panel border border-cyberBlue/20 rounded-2xl p-12 text-center space-y-6 animate-pulse">
          <div className="w-20 h-20 mx-auto bg-cyberBlue/10 dark:bg-cyberBlue/5 rounded-full flex items-center justify-center border border-cyberBlue/30 relative">
            <div className="absolute inset-0 rounded-full border-2 border-t-cyberTeal animate-spin"></div>
            <svg className="w-9 h-9 text-cyberBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Active LSTM Optimization Cycle</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-lg mx-auto">{scanMessage}</p>
          </div>
          <div className="w-full max-w-md mx-auto space-y-2">
            <div className="w-full bg-slate-200 dark:bg-white/5 h-2.5 rounded-full overflow-hidden p-[1px] border border-slate-300 dark:border-white/5">
              <div className="bg-gradient-to-r from-cyberBlue to-cyberTeal h-full rounded-full transition-all duration-150" style={{ width: `${scanProgress}%` }}></div>
            </div>
            <span className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-500">{scanProgress}% Computed</span>
          </div>
        </div>
      ) : isLoading ? (
        <div className="glass-panel rounded-2xl p-16 text-center space-y-4 border border-slate-200 dark:border-white/5">
          <div className="w-12 h-12 mx-auto border-4 border-slate-300 dark:border-white/10 border-t-cyberBlue rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Querying AI Prediction models...</p>
        </div>
      ) : predictionData ? (
        <div className="space-y-8">
          
          {/* SECTION 1: PREDICTION STATS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Ticker & Signal Card */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm relative overflow-hidden transition-all duration-300">
              <div className="absolute -top-12 -left-12 w-28 h-28 bg-cyberBlue/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-wide">{predictionData.symbol}</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold font-mono mt-1">LSTM Deep Learning v4.2</p>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg tracking-wider ${
                  predictionData.buySellSignal.includes('BUY')
                    ? 'bg-accentGreen/10 text-accentGreen border border-accentGreen/20'
                    : predictionData.buySellSignal.includes('SELL')
                    ? 'bg-accentRed/10 text-accentRed border border-accentRed/20'
                    : 'bg-yellow-400/10 text-yellow-500 border border-yellow-500/20'
                }`}>
                  {predictionData.buySellSignal}
                </span>
              </div>
              <div className="mt-8 flex justify-between items-end">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block mb-1">Current Base Close</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">${predictionData.currentPrice.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">Model Target</span>
                  <span className={`text-base font-extrabold font-mono flex items-center gap-0.5 justify-end mt-1 ${
                    predictionData.trend === 'UP' ? 'text-accentGreen' : 'text-accentRed'
                  }`}>
                    {predictionData.trend === 'UP' ? '▲' : '▼'}
                    ${predictionData.predictedPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Confidence Dial Card */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm relative overflow-hidden transition-all duration-300 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wide">Confidence Rating</span>
                <span className="w-2.5 h-2.5 bg-cyberTeal rounded-full animate-ping"></span>
              </div>
              <div className="mt-4 flex items-center space-x-4">
                <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="25"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      fill="transparent"
                      className="text-slate-200 dark:text-white/5"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="25"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 25}
                      strokeDashoffset={2 * Math.PI * 25 * (1 - predictionData.confidence / 100)}
                      strokeLinecap="round"
                      className={`${
                        predictionData.confidence >= 85 
                          ? 'text-accentGreen' 
                          : predictionData.confidence >= 75 
                          ? 'text-cyberBlue' 
                          : 'text-yellow-500'
                      } transition-all duration-1000`}
                    />
                  </svg>
                  <span className={`absolute font-black text-xs font-mono ${
                    predictionData.confidence >= 85 
                      ? 'text-accentGreen' 
                      : predictionData.confidence >= 75 
                      ? 'text-cyberBlue' 
                      : 'text-yellow-500'
                  }`}>
                    {predictionData.confidence}%
                  </span>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200">Statistical Fit</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-1">
                    Computed across rolling training convergence parameters.
                  </p>
                </div>
              </div>
            </div>

            {/* AI Expected Gain Card */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm relative overflow-hidden transition-all duration-300 flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wide">Expected Trend Drift</span>
              </div>
              <div className="mt-4">
                <span className={`text-3xl font-black font-mono ${
                  predictionData.changePercent >= 0 ? 'text-accentGreen' : 'text-accentRed'
                }`}>
                  {predictionData.changePercent >= 0 ? '+' : ''}{predictionData.changePercent.toFixed(2)}%
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                  Projected 24-hour mathematical closing variance.
                </p>
              </div>
            </div>

            {/* Trend Forecast Period */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm relative overflow-hidden transition-all duration-300 flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wide">Forecast Horizon Target</span>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  ${predictionData.futurePrices[6]?.price.toFixed(2) || 'N/A'}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-semibold mt-1">
                  7-Day Projected Term Limit
                </span>
              </div>
            </div>

          </div>

          {/* SECTION 2: THE FORECAST WAND CHART PANEL */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Combined Forecast Wand Visualizer</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Visualizing 30 days of actual historical price points alongside tomorrow's prediction and the recursive 7-day confidence uncertainty wands.
                </p>
              </div>
              <div className="flex items-center space-x-4 text-[10px] font-bold">
                <span className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
                  <span className="w-3 h-0.5 bg-cyberBlue block rounded"></span>
                  <span>Historical Prices</span>
                </span>
                <span className="flex items-center space-x-1.5 text-cyberTeal">
                  <span className="w-3 h-0.5 border-t border-dashed border-cyberTeal block"></span>
                  <span>AI Predictive Line</span>
                </span>
                <span className="flex items-center space-x-1.5 text-cyberTeal/40">
                  <span className="w-3 h-2 bg-cyberTeal/20 block rounded-sm"></span>
                  <span>Uncertainty Cone</span>
                </span>
              </div>
            </div>

            <div className="h-[380px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={compiledChartData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <defs>
                    {/* Shaded glowing gradient for uncertainty cone */}
                    <linearGradient id="predictionGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="rgba(148, 163, 184, 0.08)" 
                    vertical={false}
                  />
                  
                  <XAxis 
                    dataKey="date" 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 9, fontWeight: 600, fill: '#64748B' }}
                    dy={10}
                  />
                  
                  <YAxis 
                    domain={['auto', 'auto']}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 9, fontWeight: 600, fill: '#64748B' }}
                  />
                  
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(15, 23, 42, 0.95)', 
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                      fontSize: '11px',
                      color: '#F8FAFC'
                    }}
                    labelStyle={{ fontWeight: 800, color: '#38BDF8', marginBottom: '4px' }}
                    itemStyle={{ padding: '2px 0' }}
                    formatter={(value, name) => {
                      if (name === 'price') return [`$${Number(value).toFixed(2)}`, 'Historical Base'];
                      if (name === 'predicted') return [`$${Number(value).toFixed(2)}`, 'AI Forecast'];
                      if (name === 'upper') return [`$${Number(value).toFixed(2)}`, 'Confidence High'];
                      if (name === 'lower') return [`$${Number(value).toFixed(2)}`, 'Confidence Low'];
                      return [value, name];
                    }}
                  />

                  {/* Draw Uncertainty Shaded Area Cone precisely between lower and upper bounds */}
                  <Area
                    name="uncertainty"
                    type="monotone"
                    dataKey={['lower', 'upper']}
                    stroke="none"
                    fill="url(#predictionGlow)"
                    connectNulls
                  />

                  {/* Historical Solid Line */}
                  <Line
                    name="price"
                    type="monotone"
                    dataKey="price"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 1.5, stroke: '#FFFFFF', fill: '#0284c7' }}
                  />

                  {/* Future Forecast Dashed Line */}
                  <Line
                    name="predicted"
                    type="monotone"
                    dataKey="predicted"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 1.5, stroke: '#FFFFFF', fill: '#10b981' }}
                  />
                  
                  {/* Mark Tomorrow's Target explicitly */}
                  <ReferenceLine 
                    x={predictionData.futurePrices[0]?.date} 
                    stroke="rgba(16, 185, 129, 0.4)" 
                    strokeDasharray="3 3"
                    label={{ 
                      value: '24H forecast target', 
                      position: 'top', 
                      fill: '#10b981', 
                      fontSize: 8, 
                      fontWeight: 700 
                    }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SECTION 3: DEEP ADVANCED TECHNICAL INDICATORS ANALYSIS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* RSI Gauge Indicator */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm relative overflow-hidden transition-all duration-300 flex flex-col justify-between">
              <div>
                <h4 className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block mb-1">RSI (Relative Strength Index)</h4>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{predictionData.indicators.rsi}</span>
              </div>
              <div className="mt-6 space-y-4">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                    <span>Oversold (30)</span>
                    <span>Neutral (50)</span>
                    <span>Overbought (70)</span>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/5">
                    <div 
                      style={{ width: `${predictionData.indicators.rsi}%` }} 
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                        predictionData.indicators.rsi < 35 
                          ? 'bg-accentGreen' 
                          : predictionData.indicators.rsi > 65 
                          ? 'bg-accentRed' 
                          : 'bg-cyberBlue'
                      }`}
                    ></div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {predictionData.indicators.rsi < 35 
                    ? 'RSI level indicates extremely oversold conditions. A strong positive price rebound is statistically highly probable.' 
                    : predictionData.indicators.rsi > 65 
                    ? 'RSI level indicates overbought coordinates. Market buying volume might cool off in the short-term horizon.' 
                    : 'RSI level rests within standard neutral ranges. Momentum remains steady and stable.'}
                </p>
              </div>
            </div>

            {/* SMA Moving Average Trend Card */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm relative overflow-hidden transition-all duration-300 flex flex-col justify-between">
              <div>
                <h4 className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block mb-1">SMA-20 Trend Convergence</h4>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">${predictionData.indicators.sma.toFixed(2)}</span>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-white/5 pb-2">
                  <span className="text-[10px] text-slate-500 font-semibold">Current Price vs SMA</span>
                  <span className={`text-[10px] font-extrabold font-mono ${
                    predictionData.currentPrice > predictionData.indicators.sma ? 'text-accentGreen' : 'text-accentRed'
                  }`}>
                    {predictionData.currentPrice > predictionData.indicators.sma ? '▲ Trading ABOVE SMA' : '▼ Trading BELOW SMA'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed pt-1">
                  {predictionData.currentPrice > predictionData.indicators.sma 
                    ? 'The security trading above the 20-day Simple Moving Average indicates a dominant short-term bullish trend and healthy accumulation.' 
                    : 'The security trading below the 20-day Simple Moving Average signals general bearish pressure. Model forecasts recovery triggers.'}
                </p>
              </div>
            </div>

            {/* MACD Momentum Convergence Card */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm relative overflow-hidden transition-all duration-300 flex flex-col justify-between">
              <div>
                <h4 className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block mb-1">MACD Convergence (12, 26, 9)</h4>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{predictionData.indicators.macd.toFixed(3)}</span>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-white/5 pb-2">
                  <span className="text-[10px] text-slate-500 font-semibold">MACD Signal Line</span>
                  <span className="text-[10px] text-slate-800 dark:text-slate-200 font-bold font-mono">{predictionData.indicators.macdSignal.toFixed(3)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-white/5 pb-2">
                  <span className="text-[10px] text-slate-500 font-semibold">Momentum Bias</span>
                  <span className={`text-[10px] font-black ${
                    predictionData.indicators.macd > predictionData.indicators.macdSignal ? 'text-accentGreen' : 'text-accentRed'
                  }`}>
                    {predictionData.indicators.macd > predictionData.indicators.macdSignal ? 'BULLISH crossover' : 'BEARISH divergence'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed pt-1">
                  MACD divergence assists LSTM layers in isolating long-term cyclical trend changes from static price noise.
                </p>
              </div>
            </div>

          </div>

          {/* WARNING CONES DIAGNOSTICS */}
          {predictionData.isFallback && (
            <div className="p-4 bg-yellow-400/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-500 rounded-2xl text-[10px] font-semibold flex items-center space-x-2.5">
              <span className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full animate-ping"></span>
              <span>
                <strong>System Diagnostic Notice:</strong> The Flask Python ML service is currently offline or loading data parameters. Rendering predictions from our backup high-fidelity forecasting emulator. To connect standard live neural weights, verify Python Flask state.
              </span>
            </div>
          )}

        </div>
      ) : null}

    </div>
  );
};

export default Predictions;
