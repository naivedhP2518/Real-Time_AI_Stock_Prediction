import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [watchlistSymbols, setWatchlistSymbols] = useState([]);
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [tickerFlash, setTickerFlash] = useState({});
  const [chartType, setChartType] = useState('area'); // 'area' | 'line' | 'bar'
  const [zoomLevel, setZoomLevel] = useState(1); // Visual zoom factor for charts
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Initial Data Fetch (Trending + Watchlist Symbols)
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user watchlist first
        const watchlistRes = await API.get('/stocks/watchlist/details');
        setWatchlistSymbols(watchlistRes.data.symbols || []);

        // Fetch trending stock details
        const trendingRes = await API.get('/stocks/trending');
        const trendingList = trendingRes.data || [];

        // Combine watchlist stocks not in trending
        const wlDetails = watchlistRes.data.details || [];
        const combined = [...trendingList];
        
        wlDetails.forEach(wlStock => {
          if (!combined.some(s => s.symbol === wlStock.symbol)) {
            combined.push(wlStock);
          }
        });

        setStocks(combined);

        // Parse query params for focused stock
        const params = new URLSearchParams(location.search);
        const querySymbol = params.get('symbol');
        if (querySymbol) {
          const querySymUpper = querySymbol.toUpperCase();
          const matched = combined.find(s => s.symbol === querySymUpper);
          if (matched) {
            setSelectedStock(matched);
          } else {
            // Fetch quote for non-default query symbol
            try {
              const { data } = await API.get(`/stocks/${querySymUpper}`);
              setStocks(prev => [data, ...prev]);
              setSelectedStock(data);
            } catch (err) {
              console.warn('Could not find queried stock symbol:', querySymUpper);
              setSelectedStock(combined[0]);
            }
          }
        } else {
          setSelectedStock(combined[0]);
        }
      } catch (err) {
        console.error('Error initializing dashboard data:', err);
        setError('Failed to synchronize stock data. Retrying...');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [location.search]);

  // 2. Real-Time Socket.io Connection & Stream Listener
  useEffect(() => {
    // Establish connection to Socket.io backend
    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('Socket client successfully connected to server ticks');
    });

    socket.on('stock-ticks', (updatedTickedDetails) => {
      const updatedFlash = {};

      setStocks((prevStocks) => {
        return prevStocks.map((oldStock) => {
          const ticked = updatedTickedDetails.find((t) => t.symbol === oldStock.symbol);
          if (!ticked) return oldStock;

          // Track tick drift direction for visual flash effects
          const priceDiff = ticked.price - oldStock.price;
          if (priceDiff !== 0) {
            updatedFlash[oldStock.symbol] = priceDiff > 0 ? 'up' : 'down';
          }

          // Build rolling historical quote baseline dynamically (keep last 7 items)
          let newHistory = oldStock.history || [];
          if (newHistory.length === 0) {
            // Seed history if empty
            newHistory = [ticked.price - 4, ticked.price - 2, ticked.price + 1, ticked.price];
          } else {
            newHistory = [...newHistory.slice(1), ticked.price];
          }

          return {
            ...oldStock,
            ...ticked,
            history: newHistory
          };
        });
      });

      setTickerFlash(updatedFlash);

      // Clear the visual flash alerts after 800ms
      setTimeout(() => {
        setTickerFlash({});
      }, 800);
    });

    socket.on('disconnect', () => {
      console.log('Socket client disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // 3. Keep focused active stock details in sync with socket updates
  useEffect(() => {
    if (selectedStock) {
      const currentMatched = stocks.find((s) => s.symbol === selectedStock.symbol);
      if (currentMatched && JSON.stringify(currentMatched) !== JSON.stringify(selectedStock)) {
        setSelectedStock(currentMatched);
      }
    }
  }, [stocks, selectedStock]);

  // 4. Watchlist Toggle Handler (POST / DELETE to MongoDB)
  const handleWatchlistToggle = async (symbol, e) => {
    e.stopPropagation();
    const isPinned = watchlistSymbols.includes(symbol);
    try {
      if (isPinned) {
        // Remove from Watchlist
        const { data } = await API.delete(`/stocks/watchlist/${symbol}`);
        setWatchlistSymbols(data.symbols || []);
      } else {
        // Add to Watchlist
        const { data } = await API.post('/stocks/watchlist', { symbol });
        setWatchlistSymbols(data.symbols || []);
      }
    } catch (err) {
      console.error('Error toggling watchlist pinning:', err);
    }
  };

  const filteredStocks = watchlistOnly
    ? stocks.filter((s) => watchlistSymbols.includes(s.symbol))
    : stocks;

  if (loading && stocks.length === 0) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200/50 dark:bg-white/5 rounded w-1/4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-4">
            <div className="h-20 bg-slate-200/50 dark:bg-white/5 rounded-xl"></div>
            <div className="h-20 bg-slate-200/50 dark:bg-white/5 rounded-xl"></div>
            <div className="h-20 bg-slate-200/50 dark:bg-white/5 rounded-xl"></div>
          </div>
          <div className="lg:col-span-8 h-96 bg-slate-200/50 dark:bg-white/5 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // Pre-process recharts historical arrays
  const selectedHistory = selectedStock?.history || [100, 102, 98, 101, 105, 102, 100];
  const chartData = selectedHistory.map((val, idx) => ({
    time: `T-${selectedHistory.length - 1 - idx}`,
    price: val
  }));

  const chartColor = (selectedStock?.change || 0) >= 0 ? '#10B981' : '#EF4444';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
      
      {/* 1. Header Information Grid */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-5 border-b border-slate-200 dark:border-white/5 gap-4">
        <div>
          <span className="text-xs font-semibold text-cyberBlue uppercase tracking-wider">Trading Desk</span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">Real-Time Predictive Terminal</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Welcome, <span className="text-slate-800 dark:text-slate-200 font-semibold">{user?.name}</span>. Powered by synchronized Socket.io pricing feeds.
          </p>
        </div>

        {/* Global toggles and state indicators */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setWatchlistOnly(!watchlistOnly)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-300 cursor-pointer ${
              watchlistOnly
                ? "bg-cyberBlue/10 border-cyberBlue text-cyberBlue"
                : "bg-slate-200/50 dark:bg-white/5 border-slate-300/30 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {watchlistOnly ? "Showing Watchlist Only" : "Show Watchlist Only"}
          </button>
          
          <div className="flex items-center space-x-2 bg-slate-200/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/10 px-3 py-2 rounded-xl text-xs">
            <span className="w-2.5 h-2.5 bg-accentGreen rounded-full animate-ping"></span>
            <span className="text-slate-600 dark:text-slate-400 font-medium">Socket Live Ticks</span>
          </div>
        </div>
      </div>

      {/* Live Professional Trending Ticker Tape Marquee */}
      <div className="relative glass-panel rounded-2xl border border-slate-200 dark:border-white/5 py-4 px-4 mb-8 overflow-hidden flex items-center shadow-sm select-none">
        
        {/* Left static badge header with integrated gradient fade mask */}
        <div className="absolute left-0 top-0 bottom-0 pl-4 pr-16 bg-gradient-to-r from-slate-50 via-slate-50 to-transparent dark:from-[#0B0F19] dark:via-[#0B0F19] z-20 flex items-center transition-all duration-300 pointer-events-none">
          <div className="flex items-center space-x-2 shrink-0 border-r border-slate-200 dark:border-white/10 pr-4 mr-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            <span className="text-[10px] font-black tracking-wider uppercase text-slate-700 dark:text-slate-200 flex items-center gap-1 select-none">
              <svg className="w-3.5 h-3.5 text-orange-500 fill-orange-500 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.926-.214.378-.34.8-.45 1.258-.208.865-.507 1.747-.942 2.606C8.256 7.92 7.561 8.906 7 9.851V10a1 1 0 01-1 1h-1zM5 12a1 1 0 100 2h1a2 2 0 002-2V9.83a8.001 8.001 0 00-2.85 4.887l-.022.062a1 1 0 001.022 1.221h2a2 2 0 002-2v-1.13c.748.283 1.442.742 2.052 1.352a1 1 0 001.414-1.414c-.933-.933-2.15-1.585-3.466-1.85V9.45c1.464-.265 2.825-.972 3.93-2.077a1 1 0 00-1.414-1.414c-.752.752-1.68 1.245-2.686 1.444-.33-.678-.582-1.394-.74-2.13a16.037 16.037 0 00-.53-1.84c.162.298.34.583.535.855a1 1 0 101.664-1.11A18.067 18.067 0 0112 3v-.447z" clipRule="evenodd" />
              </svg>
              <span>TRENDING NOW</span>
            </span>
          </div>
        </div>

        {/* Dynamic Fading Mask (Right) */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-50 dark:from-[#0B0F19] to-transparent z-10 pointer-events-none" />

        {/* Marquee sliding track container */}
        <div className="w-full overflow-hidden flex items-center pl-36">
          <div className="animate-marquee flex items-center space-x-12">
            
            {/* Track 1 */}
            {stocks.map((stock, sIdx) => {
              const isUp = stock.change >= 0;
              const flash = tickerFlash[stock.symbol];
              const isSelected = selectedStock?.symbol === stock.symbol;

              let itemFlash = '';
              if (flash === 'up') itemFlash = 'text-accentGreen scale-105 font-black';
              else if (flash === 'down') itemFlash = 'text-accentRed scale-105 font-black';

              return (
                <div
                  key={`marq-1-${stock.symbol}-${sIdx}`}
                  onClick={() => setSelectedStock(stock)}
                  className={`flex items-center space-x-2.5 text-xs font-semibold cursor-pointer py-1 px-3 rounded-xl transition-all duration-300 border ${
                    isSelected 
                      ? 'bg-cyberBlue/15 text-cyberBlue border-cyberBlue/50 shadow-md shadow-cyberBlue/5'
                      : 'bg-slate-200/40 dark:bg-white/5 border-slate-300/30 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/10 shadow-sm'
                  } ${itemFlash}`}
                >
                  <span className="font-extrabold tracking-wide">{stock.symbol}</span>
                  <span className="font-mono font-bold">${stock.price.toFixed(2)}</span>
                  <span className={`flex items-center font-black text-[10px] ${isUp ? 'text-accentGreen animate-pulse' : 'text-accentRed animate-pulse'}`}>
                    {isUp ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(2)}%
                  </span>
                </div>
              );
            })}

            {/* Track 2: Duplicate for continuous slider wrapping */}
            {stocks.map((stock, sIdx) => {
              const isUp = stock.change >= 0;
              const flash = tickerFlash[stock.symbol];
              const isSelected = selectedStock?.symbol === stock.symbol;

              let itemFlash = '';
              if (flash === 'up') itemFlash = 'text-accentGreen scale-105 font-black';
              else if (flash === 'down') itemFlash = 'text-accentRed scale-105 font-black';

              return (
                <div
                  key={`marq-2-${stock.symbol}-${sIdx}`}
                  onClick={() => setSelectedStock(stock)}
                  className={`flex items-center space-x-2.5 text-xs font-semibold cursor-pointer py-1 px-3 rounded-xl transition-all duration-300 border ${
                    isSelected 
                      ? 'bg-cyberBlue/15 text-cyberBlue border-cyberBlue/50 shadow-md shadow-cyberBlue/5'
                      : 'bg-slate-200/40 dark:bg-white/5 border-slate-300/30 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/10 shadow-sm'
                  } ${itemFlash}`}
                >
                  <span className="font-extrabold tracking-wide">{stock.symbol}</span>
                  <span className="font-mono font-bold">${stock.price.toFixed(2)}</span>
                  <span className={`flex items-center font-black text-[10px] ${isUp ? 'text-accentGreen animate-pulse' : 'text-accentRed animate-pulse'}`}>
                    {isUp ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(2)}%
                  </span>
                </div>
              );
            })}

          </div>
        </div>

      </div>

      {error && (
        <div className="p-4 bg-accentRed/10 border border-accentRed/35 text-accentRed rounded-xl text-xs flex justify-between items-center mb-6">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-[10px] underline font-bold cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* 2. Main Desk Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Ticker Selector Scroll Pane */}
        <div className="lg:col-span-4 flex flex-col space-y-4 max-h-[82vh] overflow-y-auto pr-1.5">
          <h3 className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-1">
            {watchlistOnly ? "Pinned Securities" : "Supported Securities"}
          </h3>

          <AnimatePresence mode="popLayout">
            {filteredStocks.map((stock) => {
              const isUp = stock.change >= 0;
              const flash = tickerFlash[stock.symbol];
              const isSelected = selectedStock?.symbol === stock.symbol;

              let flashBorder = 'border-slate-200 dark:border-white/5';
              let flashBg = '';
              if (flash === 'up') {
                flashBorder = 'border-accentGreen/50';
                flashBg = 'bg-accentGreen/5';
              } else if (flash === 'down') {
                flashBorder = 'border-accentRed/50';
                flashBg = 'bg-accentRed/5';
              }

              return (
                <motion.div
                  layoutId={`card-${stock.symbol}`}
                  key={stock.symbol}
                  onClick={() => setSelectedStock(stock)}
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border neon-glow-card ${
                    isSelected
                      ? "bg-slate-200/70 dark:bg-[#1E2943]/60 border-cyberBlue/60 shadow-md shadow-cyberBlue/5"
                      : `glass-panel hover:bg-slate-100 dark:hover:bg-[#1E2943]/20 hover:border-slate-300 dark:hover:border-white/10`
                  } ${flashBorder} ${flashBg}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">{stock.symbol}</span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[120px] font-semibold">{stock.name}</span>
                      </div>
                      <div className="text-lg font-black text-slate-900 dark:text-white mt-2">
                        ${stock.price.toFixed(2)}
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      {/* Watchlist toggle star */}
                      <button
                        onClick={(e) => handleWatchlistToggle(stock.symbol, e)}
                        className="transition-colors p-0.5 focus:outline-none mb-1.5 text-slate-400 hover:text-yellow-400 cursor-pointer"
                        title={watchlistSymbols.includes(stock.symbol) ? "Remove from Watchlist" : "Add to Watchlist"}
                      >
                        {watchlistSymbols.includes(stock.symbol) ? (
                          <svg className="w-5 h-5 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-slate-400 hover:text-yellow-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.0" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        )}
                      </button>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isUp ? "bg-accentGreen/10 text-accentGreen" : "bg-accentRed/10 text-accentRed"
                      }`}>
                        {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredStocks.length === 0 && (
            <div className="glass-panel p-8 text-center rounded-xl text-slate-500 text-xs border border-slate-200 dark:border-white/5">
              No securities pinned. Choose or search securities to save references.
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive Charts & Core Details */}
        {selectedStock && (
          <div className="lg:col-span-8 space-y-6">
            
            {/* SEC 1: Focus Quote Header & Visual Chart */}
            <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-white/5 relative">
              
              {/* Core focus details */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                <div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{selectedStock.symbol}</span>
                    <span className="text-sm text-slate-500 font-semibold">{selectedStock.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      selectedStock.signal === 'STRONG BUY' || selectedStock.signal === 'BUY'
                        ? "bg-accentGreen/10 text-accentGreen"
                        : selectedStock.signal === 'HOLD'
                        ? "bg-yellow-400/10 text-yellow-500"
                        : "bg-accentRed/10 text-accentRed"
                    }`}>
                      {selectedStock.signal}
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2.5 mt-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">${selectedStock.price.toFixed(2)}</span>
                    <span className={`text-xs font-bold flex items-center ${
                      selectedStock.change >= 0 ? "text-accentGreen" : "text-accentRed"
                    }`}>
                      {selectedStock.change >= 0 ? '▲ +' : '▼ '}{selectedStock.change.toFixed(2)} ({selectedStock.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                {/* Specific details */}
                <div className="grid grid-cols-2 gap-4 text-[10px] bg-slate-200/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/5 p-4 rounded-xl shrink-0">
                  <div>
                    <p className="text-slate-500 font-bold uppercase">Open Price</p>
                    <p className="text-slate-800 dark:text-slate-300 font-extrabold mt-0.5">${selectedStock.open.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-bold uppercase">Volume</p>
                    <p className="text-slate-800 dark:text-slate-300 font-extrabold mt-0.5">{(selectedStock.volume / 1000000).toFixed(1)}M</p>
                  </div>
                </div>
              </div>

              {/* Chart Controls Area */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-slate-200/50 dark:border-white/5 pb-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setChartType('area')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      chartType === 'area'
                        ? 'bg-cyberBlue text-white shadow'
                        : 'bg-slate-200/50 dark:bg-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    Area
                  </button>
                  <button
                    onClick={() => setChartType('line')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      chartType === 'line'
                        ? 'bg-cyberBlue text-white shadow'
                        : 'bg-slate-200/50 dark:bg-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    Line
                  </button>
                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      chartType === 'bar'
                        ? 'bg-cyberBlue text-white shadow'
                        : 'bg-slate-200/50 dark:bg-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    Bar
                  </button>
                </div>

                <div className="flex items-center space-x-2.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Zoom</span>
                  <button
                    onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.5))}
                    className="p-1 rounded bg-slate-200/50 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-cyberBlue cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))}
                    className="p-1 rounded bg-slate-200/50 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-cyberBlue cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM4 10h12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Recharts Premium Graph Implementation */}
              <div className="w-full bg-slate-100 dark:bg-black/35 border border-slate-200 dark:border-white/5 rounded-xl p-4 h-64 transition-all overflow-hidden relative">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'area' ? (
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="primaryChartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={chartColor} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.07} />
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} />
                      <YAxis
                        domain={['auto', 'auto']}
                        tick={{ fontSize: 9, fill: '#64748b' }}
                        scale={zoomLevel > 1 ? "log" : "auto"}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(21, 29, 48, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '11px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={chartColor}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#primaryChartGradient)"
                      />
                    </AreaChart>
                  ) : chartType === 'line' ? (
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.07} />
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} />
                      <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(21, 29, 48, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '11px'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke={chartColor}
                        strokeWidth={3}
                        dot={{ r: 4, stroke: chartColor, strokeWidth: 1 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.07} />
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} />
                      <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(21, 29, 48, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '11px'
                        }}
                      />
                      <Bar dataKey="price" fill={chartColor} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Extra specifications under chart */}
              <div className="grid grid-cols-3 gap-4 mt-6 border-t border-slate-200/50 dark:border-white/5 pt-4 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">High Price</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">${selectedStock.high.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Low Price</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">${selectedStock.low.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Model Confidence</span>
                  <span className="text-sm font-extrabold text-cyberTeal mt-0.5">{selectedStock.confidence || 92.5}%</span>
                </div>
              </div>

            </div>

            {/* SEC 2: Predictive Engine Mockup Targets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="glass-panel rounded-xl p-5 border border-slate-200 dark:border-white/5">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center">
                  <svg className="w-4 h-4 text-yellow-400 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Forecast Ranges</span>
                </h4>
                <p className="text-[10px] text-slate-500 mt-1">Deep Learning target ranges for {selectedStock.symbol}.</p>

                <div className="space-y-3 mt-4">
                  <div className="flex justify-between items-center p-2.5 bg-slate-200/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/5 rounded-lg">
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">24-Hour Horizon</span>
                    <span className="text-xs font-bold text-cyberTeal">
                      ${(selectedStock.forecast24h || selectedStock.price * 1.025).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-slate-200/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/5 rounded-lg">
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">7-Day Horizon</span>
                    <span className="text-xs font-bold text-accentGreen">
                      ${(selectedStock.forecast7d || selectedStock.price * 1.06).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-xl p-5 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center">
                    <svg className="w-4 h-4 text-cyberBlue mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Security Verification Key</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">Bearer verification token registered in browser LocalStorage.</p>
                </div>

                <div className="mt-4 p-2.5 bg-slate-100 dark:bg-black/35 border border-slate-200 dark:border-white/5 rounded-lg">
                  <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                    <span>TOKEN SCHEMA</span>
                    <span className="text-cyberTeal font-bold">HMAC-SHA256</span>
                  </div>
                  <p className="text-[9px] font-mono text-slate-700 dark:text-slate-400 truncate max-w-[320px]">
                    Bearer {localStorage.getItem('token') || 'Token expired or missing'}
                  </p>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
