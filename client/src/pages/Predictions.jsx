import React, { useState, useEffect } from 'react';

const MOCK_PREDICTIVE_MODELS = [
  {
    symbol: 'NVDA',
    name: 'Nvidia Corporation',
    model: 'Temporal Fusion Transformer (TFT)',
    confidence: 96.8,
    signal: 'STRONG BUY',
    currentPrice: 924.80,
    forecast24h: 948.50,
    forecast7d: 985.00,
    expectedGain: '+6.5%',
    risk: 'High'
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    model: 'LSTM Recurrent Network v4.2',
    confidence: 91.2,
    signal: 'BUY',
    currentPrice: 189.84,
    forecast24h: 194.20,
    forecast7d: 201.50,
    expectedGain: '+6.1%',
    risk: 'Low'
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    model: 'Deep Q-Learning RL Agent',
    confidence: 88.5,
    signal: 'STRONG BUY',
    currentPrice: 246.50,
    forecast24h: 260.10,
    forecast7d: 284.40,
    expectedGain: '+15.3%',
    risk: 'Very High'
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    model: 'Ensemble GBDT Regressor',
    confidence: 93.4,
    signal: 'HOLD',
    currentPrice: 421.90,
    forecast24h: 422.00,
    forecast7d: 435.60,
    expectedGain: '+3.2%',
    risk: 'Low'
  }
];

const Predictions = () => {
  const [isScanning, setIsScanning] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsScanning(false);
            clearInterval(interval);
            return 100;
          }
          return prev + 8;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isScanning]);

  const handleRestartScan = () => {
    setProgress(0);
    setIsScanning(true);
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto transition-colors duration-300">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-white/5 pb-5 gap-4">
        <div>
          <span className="text-xs font-semibold text-cyberBlue uppercase tracking-wider">Predictive Deep Learning Modules</span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">AI Signals & Forecasts</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">High-confidence model targets computed across active temporal horizons.</p>
        </div>

        <button
          onClick={handleRestartScan}
          disabled={isScanning}
          className="px-4 py-2 bg-gradient-to-r from-cyberBlue to-cyberTeal disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <svg className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
          {isScanning ? 'Computing...' : 'Recalculate Signals'}
        </button>
      </div>

      {/* SEC 1: Scanning Overlay Status */}
      {isScanning ? (
        <div className="glass-panel rounded-2xl p-8 border border-cyberBlue/20 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-cyberBlue/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-cyberBlue animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Analyzing Market Tick Sequences...</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">Feeding real-time price updates into Temporal Fusion Transformers and recurrent LSTM nodes to generate forecast distributions.</p>
          <div className="w-full max-w-md mx-auto bg-slate-200 dark:bg-white/5 h-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-cyberBlue to-cyberTeal h-full transition-all duration-100" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="text-[10px] font-mono text-slate-400">{progress}% Connected</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {MOCK_PREDICTIVE_MODELS.map((model) => (
            <div
              key={model.symbol}
              className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 hover:border-cyberBlue/20 hover:shadow-xl relative overflow-hidden transition-all duration-300"
            >
              {/* Background accent glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyberBlue/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-wide">{model.symbol}</span>
                    <span className="text-xs text-slate-500 font-semibold">{model.name}</span>
                  </div>
                  <p className="text-[10px] font-semibold font-mono text-cyberTeal mt-1.5">{model.model}</p>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  model.signal === 'STRONG BUY' || model.signal === 'BUY'
                    ? "bg-accentGreen/10 text-accentGreen"
                    : "bg-yellow-400/10 text-yellow-500"
                }`}>
                  {model.signal}
                </span>
              </div>

              {/* Grid values */}
              <div className="grid grid-cols-3 gap-4 mt-6 text-xs">
                <div className="p-3 bg-slate-100/50 dark:bg-black/35 border border-slate-200/50 dark:border-white/5 rounded-xl text-center">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-1">Current Base</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">${model.currentPrice.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-slate-100/50 dark:bg-black/35 border border-slate-200/50 dark:border-white/5 rounded-xl text-center">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-1">24H Target</span>
                  <span className="text-sm font-extrabold text-cyberBlue">${model.forecast24h.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-slate-100/50 dark:bg-black/35 border border-slate-200/50 dark:border-white/5 rounded-xl text-center">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-1">7D Target</span>
                  <span className="text-sm font-extrabold text-accentGreen">${model.forecast7d.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mt-6 text-[10px] border-t border-slate-200/50 dark:border-white/5 pt-4">
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-cyberTeal rounded-full animate-pulse"></span>
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">Confidence Score: <span className="text-slate-800 dark:text-slate-200 font-bold">{model.confidence}%</span></span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">Risk:</span>
                  <span className={`font-bold uppercase ${model.risk === 'Low' ? 'text-accentGreen' : model.risk === 'High' ? 'text-orange-500' : 'text-accentRed'}`}>{model.risk}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Predictions;
