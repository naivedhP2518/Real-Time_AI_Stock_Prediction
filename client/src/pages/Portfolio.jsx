import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import API from '../services/api';

const COLORS = ['#3B82F6', '#10B981', '#06B6D4', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const Portfolio = () => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tradeSymbol, setTradeSymbol] = useState('');
  const [tradeShares, setTradeShares] = useState(1);
  const [tradeType, setTradeType] = useState('BUY'); // BUY or SELL
  const [tradePrice, setTradePrice] = useState(0.0);
  const [isTrading, setIsTrading] = useState(false);
  const [tradeMessage, setTradeMessage] = useState({ text: '', type: '' }); // success or error
  const [showTradePanel, setShowTradePanel] = useState(false);

  // Fetch full virtual portfolio data and past transaction histories
  const fetchPortfolioDetails = async () => {
    setIsLoading(true);
    try {
      const portRes = await API.get('/portfolio');
      setPortfolioData(portRes.data);
      
      const histRes = await API.get('/portfolio/history');
      setTransactions(histRes.data);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioDetails();
  }, []);

  // Set up details for custom trade drawer
  const handleOpenTrade = async (symbol, type = 'BUY', ownedShares = 0) => {
    setTradeSymbol(symbol);
    setTradeType(type);
    setTradeShares(type === 'SELL' ? ownedShares : 1);
    setTradeMessage({ text: '', type: '' });
    
    // Fetch live quote for symbol to pre-fill execution price
    try {
      const { data } = await API.get(`/stocks/${symbol}`);
      setTradePrice(data.price);
      setShowTradePanel(true);
    } catch (err) {
      console.error('Failed to get stock quote for trade:', err);
      setTradeMessage({ text: 'Unable to retrieve live stock quote. Try again.', type: 'error' });
    }
  };

  // Execute virtual buy/sell trade
  const handleExecuteTrade = async (e) => {
    e.preventDefault();
    setIsTrading(true);
    setTradeMessage({ text: '', type: '' });

    try {
      const endpoint = tradeType === 'BUY' ? '/portfolio/buy' : '/portfolio/sell';
      const payload = {
        symbol: tradeSymbol.toUpperCase().trim(),
        shares: parseFloat(tradeShares),
        price: parseFloat(tradePrice)
      };

      const { data } = await API.post(endpoint, payload);
      setTradeMessage({ text: data.message, type: 'success' });
      
      // Auto close panel after a brief pause and refresh values
      setTimeout(() => {
        setShowTradePanel(false);
        fetchPortfolioDetails();
      }, 1500);

    } catch (err) {
      console.error('Virtual transaction error:', err);
      const errText = err.response?.data?.message || 'Transaction failed. Please try again.';
      setTradeMessage({ text: errText, type: 'error' });
    } finally {
      setIsTrading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto transition-colors duration-300">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-white/5 pb-5 gap-4">
        <div>
          <span className="text-xs font-semibold text-cyberBlue dark:text-cyberTeal uppercase tracking-wider">Virtual Trading Terminal</span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">Virtual Portfolio</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Track allocations, execute instant virtual transactions, and evaluate unrealized profit margins.
          </p>
        </div>
        
        <button
          onClick={() => handleOpenTrade('', 'BUY')}
          className="px-5 py-2.5 bg-gradient-to-r from-cyberBlue to-cyberTeal text-white text-xs font-bold rounded-xl shadow-lg shadow-cyberBlue/15 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Quick Custom Trade
        </button>
      </div>

      {isLoading && !portfolioData ? (
        <div className="glass-panel rounded-2xl p-16 text-center space-y-4 border border-slate-200 dark:border-white/5">
          <div className="w-12 h-12 mx-auto border-4 border-slate-300 dark:border-white/10 border-t-cyberBlue rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Evaluating asset balances at live quotes...</p>
        </div>
      ) : portfolioData ? (
        <div className="space-y-8">

          {/* SEC 1: SUMMARY STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* NAV NAV Card */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden transition-all duration-300">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block mb-1">Total Net Asset Value (NAV)</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">${portfolioData.summary.netAssetValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-semibold mt-1">Starting Balance: $100,000.00</span>
            </div>

            {/* Buying Power */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden transition-all duration-300">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block mb-1">Virtual Buying Power</span>
              <span className="text-3xl font-black text-cyberTeal font-mono">${portfolioData.summary.buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-semibold mt-1">Idle Liquid Cash Assets</span>
            </div>

            {/* Assets Invested */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden transition-all duration-300">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block mb-1">Equities Assets Invested</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">${portfolioData.summary.holdingsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-semibold mt-1">Weighted Cost Basis: ${portfolioData.summary.totalInvested.toLocaleString()}</span>
            </div>

            {/* Total profit loss */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden transition-all duration-300">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block mb-1">Overall Net Returns</span>
              <span className={`text-3xl font-black font-mono block ${
                portfolioData.summary.overallProfitLoss >= 0 ? 'text-accentGreen' : 'text-accentRed'
              }`}>
                {portfolioData.summary.overallProfitLoss >= 0 ? '+' : ''}${portfolioData.summary.overallProfitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`text-[10px] font-bold mt-1 inline-block ${
                portfolioData.summary.overallProfitLoss >= 0 ? 'text-accentGreen' : 'text-accentRed'
              }`}>
                {portfolioData.summary.overallProfitLoss >= 0 ? '▲' : '▼'} {portfolioData.summary.overallProfitLossPercent.toFixed(2)}% Return
              </span>
            </div>

          </div>

          {/* SEC 2: HOLDINGS & ALLOCATION GRAPHS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Holdings Table Column */}
            <div className="lg:col-span-2 glass-panel rounded-2xl border border-slate-200 dark:border-white/5 shadow-md overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-slate-200/20 dark:bg-black/25">
                <h3 className="text-md font-extrabold text-slate-900 dark:text-white">Equities Asset Holdings</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Weighted average costs evaluated against active streaming market quotes.</p>
              </div>
              <div className="flex-grow overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 font-bold tracking-wider select-none">
                      <th className="p-4">Stock</th>
                      <th className="p-4 text-right">Shares</th>
                      <th className="p-4 text-right">Avg Cost</th>
                      <th className="p-4 text-right">Live Price</th>
                      <th className="p-4 text-right">Holdings Value</th>
                      <th className="p-4 text-right">Gains P/L</th>
                      <th className="p-4 text-center">Action Deck</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-white/5 font-medium text-slate-700 dark:text-slate-300">
                    {portfolioData.holdings.map((hold) => (
                      <tr key={hold.symbol} className="hover:bg-slate-100/30 dark:hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <span className="font-extrabold text-slate-900 dark:text-white text-sm tracking-wide block">{hold.symbol}</span>
                        </td>
                        <td className="p-4 text-right font-mono font-semibold">{hold.shares}</td>
                        <td className="p-4 text-right font-mono">${hold.averagePrice.toFixed(2)}</td>
                        <td className="p-4 text-right font-mono text-cyberBlue dark:text-cyberTeal font-bold">${hold.currentPrice.toFixed(2)}</td>
                        <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-white">${hold.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className={`p-4 text-right font-mono font-bold ${
                          hold.profitLoss >= 0 ? 'text-accentGreen' : 'text-accentRed'
                        }`}>
                          <span className="block">{hold.profitLoss >= 0 ? '+' : ''}${hold.profitLoss.toFixed(2)}</span>
                          <span className="text-[9px] block font-semibold">{hold.profitLoss >= 0 ? '▲' : '▼'} {hold.profitLossPercent.toFixed(1)}%</span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleOpenTrade(hold.symbol, 'BUY')}
                              className="px-2 py-1 rounded bg-accentGreen/10 hover:bg-accentGreen/20 text-accentGreen text-[9px] font-black tracking-wider uppercase transition-colors cursor-pointer"
                            >
                              Buy
                            </button>
                            <button
                              onClick={() => handleOpenTrade(hold.symbol, 'SELL', hold.shares)}
                              className="px-2 py-1 rounded bg-accentRed/10 hover:bg-accentRed/20 text-accentRed text-[9px] font-black tracking-wider uppercase transition-colors cursor-pointer"
                            >
                              Sell
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {portfolioData.holdings.length === 0 && (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-slate-500 dark:text-slate-400 font-bold">
                          No virtual equities holdings owned. Click "Quick Custom Trade" above to invest cash balance!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Asset Allocation Pie Column */}
            <div className="glass-panel rounded-2xl border border-slate-200 dark:border-white/5 shadow-md p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-md font-extrabold text-slate-900 dark:text-white">Net Asset Allocations</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Visual ratio breakdown of cash buying power vs active stock investments.</p>
              </div>

              <div className="h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={portfolioData.allocations}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {portfolioData.allocations.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(15, 23, 42, 0.95)', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#FFF',
                        fontSize: '10px'
                      }} 
                      formatter={(val) => `$${Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Visual central legend */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Holdings NAV</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">
                    ${(portfolioData.summary.netAssetValue / 1000).toFixed(1)}k
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-[9px] font-extrabold text-slate-500 mt-2">
                {portfolioData.allocations.map((alloc, idx) => (
                  <div key={alloc.name} className="flex justify-between items-center border-t border-slate-100 dark:border-white/5 pt-1.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      <span className="text-slate-700 dark:text-slate-300 tracking-wide">{alloc.name}</span>
                    </div>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{alloc.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* SEC 3: HISTORIC TRANSACTIONS LEDGER */}
          <div className="glass-panel rounded-2xl border border-slate-200 dark:border-white/5 shadow-md overflow-hidden flex flex-col max-h-[300px]">
            <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-slate-200/20 dark:bg-black/25">
              <h3 className="text-md font-extrabold text-slate-900 dark:text-white">Transaction Logs Ledger</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Historical record of all buy/sell transactions executed under this virtual desk.</p>
            </div>
            <div className="flex-grow overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 font-bold tracking-wider select-none">
                    <th className="p-4">Execution Date</th>
                    <th className="p-4">Security</th>
                    <th className="p-4 text-center">Type</th>
                    <th className="p-4 text-right">Shares Traded</th>
                    <th className="p-4 text-right">Execution Cost</th>
                    <th className="p-4 text-right">Total Principal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/30 dark:divide-white/5 font-medium text-slate-600 dark:text-slate-400 font-mono">
                  {transactions.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-100/20 dark:hover:bg-white/5 transition-colors">
                      <td className="p-4 text-slate-500 text-[10px]">{new Date(t.date).toLocaleString()}</td>
                      <td className="p-4 font-extrabold text-slate-800 dark:text-slate-200">{t.symbol}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider ${
                          t.type === 'BUY' ? 'bg-accentGreen/10 text-accentGreen' : 'bg-accentRed/10 text-accentRed'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold">{t.shares}</td>
                      <td className="p-4 text-right">${t.price.toFixed(2)}</td>
                      <td className="p-4 text-right font-bold text-slate-800 dark:text-slate-200">${t.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-500 dark:text-slate-400 font-bold font-sans">
                        No virtual transactions logged in the historical ledger.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : null}

      {/* DYNAMIC VIRTUAL TRADE DRAWER OVERLAY */}
      {showTradePanel && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl border border-slate-200 dark:border-white/10 p-6 max-w-sm w-full shadow-2xl relative">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Execute Virtual Transaction</h3>
            
            <form onSubmit={handleExecuteTrade} className="mt-4 space-y-4">
              
              {/* Symbol Ticker */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Stock Ticker Symbol</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AAPL"
                  value={tradeSymbol}
                  onChange={(e) => setTradeSymbol(e.target.value.toUpperCase())}
                  disabled={isTrading}
                  className="mt-1 w-full px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-black/35 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyberBlue focus:ring-1 focus:ring-cyberBlue font-bold text-sm tracking-widest font-mono"
                />
              </div>

              {/* BUY or SELL Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTradeType('BUY')}
                  disabled={isTrading}
                  className={`py-2 text-xs font-black rounded-xl tracking-wider cursor-pointer border transition-colors ${
                    tradeType === 'BUY'
                      ? 'bg-accentGreen text-white border-accentGreen shadow-md shadow-accentGreen/15'
                      : 'border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-black/25 text-slate-500'
                  }`}
                >
                  BUY LIMIT
                </button>
                <button
                  type="button"
                  onClick={() => setTradeType('SELL')}
                  disabled={isTrading}
                  className={`py-2 text-xs font-black rounded-xl tracking-wider cursor-pointer border transition-colors ${
                    tradeType === 'SELL'
                      ? 'bg-accentRed text-white border-accentRed shadow-md shadow-accentRed/15'
                      : 'border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-black/25 text-slate-500'
                  }`}
                >
                  SELL LIMIT
                </button>
              </div>

              {/* Shares and Price Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Shares Count</label>
                  <input
                    type="number"
                    required
                    min="0.001"
                    step="any"
                    value={tradeShares}
                    onChange={(e) => setTradeShares(e.target.value)}
                    disabled={isTrading}
                    className="mt-1 w-full px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-black/35 text-slate-800 dark:text-slate-100 font-mono font-bold focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Execution Price ($)</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={tradePrice}
                    onChange={(e) => setTradePrice(e.target.value)}
                    disabled={isTrading}
                    className="mt-1 w-full px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-black/35 text-slate-800 dark:text-slate-100 font-mono font-bold focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-3 bg-slate-100/50 dark:bg-black/45 border border-slate-200/50 dark:border-white/5 rounded-xl flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">Estimated Total:</span>
                <span className="font-black font-mono text-slate-900 dark:text-white">
                  ${(parseFloat(tradeShares || 0) * parseFloat(tradePrice || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Message Banner */}
              {tradeMessage.text && (
                <div className={`p-3 rounded-xl text-[10px] font-bold ${
                  tradeMessage.type === 'success'
                    ? 'bg-accentGreen/10 text-accentGreen border border-accentGreen/20'
                    : 'bg-accentRed/10 text-accentRed border border-accentRed/20'
                }`}>
                  {tradeMessage.text}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTradePanel(false)}
                  disabled={isTrading}
                  className="w-1/3 py-2.5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer select-none transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTrading}
                  className="w-2/3 py-2.5 bg-gradient-to-r from-cyberBlue to-cyberTeal text-white text-xs font-black rounded-xl cursor-pointer shadow-lg shadow-cyberBlue/15 hover:shadow-cyberBlue/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isTrading ? 'Processing Trade...' : 'Confirm Order'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Portfolio;
