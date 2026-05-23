import React, { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import API from '../services/api';

const Watchlist = () => {
  const [watchlistData, setWatchlistData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newSymbol, setNewSymbol] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await API.get('/stocks/watchlist/details');
      setWatchlistData(data);
    } catch (err) {
      console.error('Error fetching watchlist:', err);
      setError('Unable to synchronize watchlist details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleAddSymbol = async (e) => {
    e.preventDefault();
    if (!newSymbol.trim()) return;
    setActionLoading(true);
    setError(null);
    try {
      const sym = newSymbol.trim().toUpperCase();
      const { data } = await API.post('/stocks/watchlist', { symbol: sym });
      setWatchlistData(data);
      setNewSymbol('');
    } catch (err) {
      console.error('Error adding to watchlist:', err);
      setError(err.response?.data?.message || 'Failed to pin security. Verify symbol exists.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveSymbol = async (symbol, e) => {
    e.stopPropagation();
    setActionLoading(true);
    setError(null);
    try {
      const { data } = await API.delete(`/stocks/watchlist/${symbol}`);
      setWatchlistData(data);
    } catch (err) {
      console.error('Error removing from watchlist:', err);
      setError('Failed to unpin security.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !watchlistData) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200/50 dark:bg-white/5 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-44 bg-slate-200/50 dark:bg-white/5 rounded-2xl"></div>
          <div className="h-44 bg-slate-200/50 dark:bg-white/5 rounded-2xl"></div>
          <div className="h-44 bg-slate-200/50 dark:bg-white/5 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto transition-colors duration-300">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 dark:border-white/5 pb-5 gap-4">
        <div>
          <span className="text-xs font-semibold text-cyberBlue uppercase tracking-wider">Saved Securities</span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">My Watchlist</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Track and pin your favorite stock tickers with real-time analytics.</p>
        </div>

        {/* Add Security Form */}
        <form onSubmit={handleAddSymbol} className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Add ticker (e.g. MSFT)..."
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            disabled={actionLoading}
            className="px-4 py-2 text-xs rounded-xl bg-slate-200/50 dark:bg-black/35 border border-slate-300/30 dark:border-white/10 focus:outline-none focus:border-cyberBlue text-slate-900 dark:text-slate-100 disabled:opacity-50 uppercase placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={actionLoading}
            className="px-4 py-2 bg-gradient-to-r from-cyberBlue to-cyberTeal hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            {actionLoading ? 'Saving...' : 'Pin Ticker'}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-accentRed/10 border border-accentRed/35 text-accentRed rounded-xl text-xs flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-[10px] underline font-bold cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Grid of Tickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {watchlistData?.details.map((stock) => {
          const isUp = stock.change >= 0;
          const chartData = (stock.history || [100, 100, 100, 100, 100, 100, 100]).map((price, index) => ({
            index,
            price
          }));

          return (
            <div
              key={stock.symbol}
              className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-white/5 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-cyberBlue/20 flex flex-col justify-between h-48"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-black text-slate-900 dark:text-white tracking-wide">{stock.symbol}</span>
                      <span className="text-[10px] text-slate-500 truncate max-w-[120px] font-semibold">{stock.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        stock.signal === 'STRONG BUY' || stock.signal === 'BUY'
                          ? "bg-accentGreen/10 text-accentGreen"
                          : stock.signal === 'HOLD'
                          ? "bg-yellow-400/10 text-yellow-500"
                          : "bg-accentRed/10 text-accentRed"
                      }`}>
                        {stock.signal}
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold uppercase">{stock.volatility} Vol</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleRemoveSymbol(stock.symbol, e)}
                    disabled={actionLoading}
                    className="p-1 rounded-lg bg-slate-200/50 dark:bg-white/5 text-yellow-400 hover:text-slate-400 dark:hover:text-slate-500 transition-colors cursor-pointer"
                    title="Remove from watchlist"
                  >
                    <svg className="w-5 h-5 fill-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-baseline space-x-2 mt-3.5">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">${stock.price.toFixed(2)}</span>
                  <span className={`text-xs font-bold ${isUp ? 'text-accentGreen' : 'text-accentRed'}`}>
                    {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Sparkline Graph Area */}
              <div className="w-full h-12 -mx-5 -mb-5 relative mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`gradient-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isUp ? "#10B981" : "#EF4444"} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={isUp ? "#10B981" : "#EF4444"} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <YAxis domain={['auto', 'auto']} hide={true} />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={isUp ? "#10B981" : "#EF4444"}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill={`url(#gradient-${stock.symbol})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

            </div>
          );
        })}

        {watchlistData?.symbols.length === 0 && (
          <div className="col-span-full glass-panel py-16 px-8 text-center rounded-2xl border border-slate-200 dark:border-white/5">
            <svg className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <h4 className="text-md font-bold text-slate-800 dark:text-slate-200">Your Watchlist is Empty</h4>
            <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">Use the input panel above or search securities to save items for instant monitoring.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Watchlist;
