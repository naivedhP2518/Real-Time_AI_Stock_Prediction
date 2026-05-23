import React, { useState, useEffect } from 'react';
import API from '../services/api';

const Markets = () => {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await API.get('/stocks/market-overview');
      setMarketData(data);
    } catch (err) {
      console.error('Fetch Market Error:', err);
      setError('Unable to synchronize market indices. Please verify connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 6000); // Polling index shifts
    return () => clearInterval(interval);
  }, []);

  if (loading && !marketData) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200/50 dark:bg-white/5 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-28 bg-slate-200/50 dark:bg-white/5 rounded-xl"></div>
          <div className="h-28 bg-slate-200/50 dark:bg-white/5 rounded-xl"></div>
          <div className="h-28 bg-slate-200/50 dark:bg-white/5 rounded-xl"></div>
        </div>
        <div className="h-4 bg-slate-200/50 dark:bg-white/5 rounded w-1/3 mt-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-64 bg-slate-200/50 dark:bg-white/5 rounded-2xl"></div>
          <div className="h-64 bg-slate-200/50 dark:bg-white/5 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto transition-colors duration-300">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-white/5 pb-5 gap-4">
        <div>
          <span className="text-xs font-semibold text-cyberTeal uppercase tracking-wider">Securities Indices Feed</span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">Global Stock Markets</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Real-time composite indexes, cryptocurrencies, and top movers.</p>
        </div>
        <button
          onClick={fetchMarketData}
          className="px-4 py-2 bg-slate-200/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-300/30 dark:border-white/10 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.228 10H18.228" />
          </svg>
          Sync Feed
        </button>
      </div>

      {error && (
        <div className="p-4 bg-accentRed/10 border border-accentRed/35 text-accentRed rounded-xl text-xs flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {/* SEC 1: Index Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {marketData?.indices.map((idx) => {
          const isUp = idx.changePercent >= 0;
          return (
            <div key={idx.symbol} className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 hover:border-cyberBlue/20 shadow-md relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{idx.name}</span>
                  <p className="text-sm font-semibold text-slate-400 mt-0.5">{idx.symbol}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isUp ? 'bg-accentGreen/10 text-accentGreen' : 'bg-accentRed/10 text-accentRed'}`}>
                  {isUp ? '▲ +' : '▼ '}{idx.changePercent}%
                </span>
              </div>
              <div className="flex justify-between items-baseline mt-4">
                <span className="text-2xl font-black text-slate-900 dark:text-white">${idx.price.toLocaleString()}</span>
                <span className={`text-xs font-semibold ${isUp ? 'text-accentGreen' : 'text-accentRed'}`}>
                  {isUp ? '+' : ''}{idx.change.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* SEC 2: Top Gainers and Losers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gainers */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-accentGreen/10 border border-accentGreen/20 rounded-lg text-accentGreen">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Top Gainers</h3>
          </div>
          <div className="space-y-4">
            {marketData?.topGainers.map((stock) => (
              <div key={stock.symbol} className="flex justify-between items-center p-3 bg-slate-100/50 dark:bg-black/35 border border-slate-200/50 dark:border-white/5 rounded-xl hover:border-accentGreen/20 transition-all duration-300">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{stock.symbol}</span>
                  <span className="text-xs text-slate-500 block">{stock.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">${stock.price.toFixed(2)}</span>
                  <span className="text-xs font-bold text-accentGreen block">+{stock.changePercent.toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Losers */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-accentRed/10 border border-accentRed/20 rounded-lg text-accentRed">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Top Losers</h3>
          </div>
          <div className="space-y-4">
            {marketData?.topLosers.map((stock) => (
              <div key={stock.symbol} className="flex justify-between items-center p-3 bg-slate-100/50 dark:bg-black/35 border border-slate-200/50 dark:border-white/5 rounded-xl hover:border-accentRed/20 transition-all duration-300">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{stock.symbol}</span>
                  <span className="text-xs text-slate-500 block">{stock.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">${stock.price.toFixed(2)}</span>
                  <span className="text-xs font-bold text-accentRed block">{stock.changePercent.toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SEC 3: Crypto Feeds */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-1.5 bg-cyberTeal/10 border border-cyberTeal/20 rounded-lg text-cyberTeal">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Cryptocurrency Index</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {marketData?.crypto.map((coin) => {
            const isUp = coin.changePercent >= 0;
            return (
              <div key={coin.symbol} className="p-4 bg-slate-100/50 dark:bg-black/35 border border-slate-200/50 dark:border-white/5 rounded-2xl transition-all duration-300">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{coin.name}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{coin.symbol}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isUp ? 'bg-accentGreen/10 text-accentGreen' : 'bg-accentRed/10 text-accentRed'}`}>
                    {isUp ? '▲ +' : '▼ '}{coin.changePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-4">
                  ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Markets;
