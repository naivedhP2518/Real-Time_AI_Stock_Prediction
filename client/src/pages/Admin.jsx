import React, { useState, useEffect } from 'react';
import API from '../services/api';
import axios from 'axios';

const Admin = () => {
  const [systemStats, setSystemStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Model training form state
  const [trainSymbol, setTrainSymbol] = useState('AAPL');
  const [trainEpochs, setTrainEpochs] = useState('10');
  const [trainBatch, setTrainBatch] = useState('32');
  const [trainStatus, setTrainStatus] = useState({ type: '', message: '' });
  const [isTraining, setIsTraining] = useState(false);

  const fetchSystemStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await API.get('/admin/system-stats');
      setSystemStats(data);
    } catch (err) {
      console.error('Error fetching admin statistics:', err);
      setError('Forbidden - Administrative credentials or MERN connection active.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const handleTrainModel = async (e) => {
    e.preventDefault();
    setTrainStatus({ type: '', message: '' });
    setIsTraining(true);

    const symbol = trainSymbol.toUpperCase().trim();
    if (!symbol) {
      setTrainStatus({ type: 'error', message: 'Ticker symbol is required.' });
      setIsTraining(false);
      return;
    }

    try {
      // Connect directly to CORS-enabled Flask server or backend
      const response = await axios.post('http://localhost:5001/train-model', {
        symbol: symbol,
        epochs: parseInt(trainEpochs),
        batch_size: parseInt(trainBatch)
      });

      setTrainStatus({
        type: 'success',
        message: response.data.message || `Training initiated successfully for ${symbol}!`
      });
      
      // Refresh stats after a brief moment to show active jobs
      setTimeout(fetchSystemStats, 2000);
      
      // Reset status after a delay
      setTimeout(() => {
        setTrainStatus({ type: '', message: '' });
      }, 8000);
    } catch (err) {
      console.error('Error training model:', err);
      setTrainStatus({
        type: 'error',
        message: err.response?.data?.error || 'Failed to communicate with Flask ML Training microservice.'
      });
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto transition-colors duration-300">
      
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 dark:border-white/5 pb-6 gap-4">
        <div>
          <span className="text-xs font-bold text-accentRed uppercase tracking-wider">System Administration Mainframe</span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1">Console Dashboard</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Audit registered user databases, review active training networks, and monitor microservice latencies.
          </p>
        </div>
        
        <button
          onClick={fetchSystemStats}
          disabled={isLoading}
          className="px-4 py-2 bg-slate-200/60 dark:bg-white/5 hover:bg-slate-350 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 border border-slate-300/30 dark:border-white/10 font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
        >
          <svg className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
          </svg>
          Refresh Core System
        </button>
      </div>

      {error ? (
        <div className="glass-panel border-l-4 border-l-accentRed rounded-2xl p-8 border border-slate-200 dark:border-white/5 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 bg-accentRed/10 rounded-full flex items-center justify-center border border-accentRed/20 text-accentRed mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m0-8v6m0 5h.01M4.938 19h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Administrative Credentials Error</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              This terminal workspace requires full Administrator permissions (`user.isAdmin === true`). 
              Please verify your login account state or request server permissions.
            </p>
          </div>
        </div>
      ) : isLoading && !systemStats ? (
        <div className="glass-panel rounded-2xl p-24 border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-slate-300 dark:border-white/10 border-t-accentRed rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Querying administrative system diagnostics...</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* SECTION 1: GLOBAL METRICS COUNTERS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Total Users */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm relative overflow-hidden transition-all duration-300">
              <div className="absolute -top-12 -left-12 w-28 h-28 bg-cyberBlue/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block">Registered Users</span>
                <span className="p-1.5 rounded-lg bg-cyberBlue/10 text-cyberBlue border border-cyberBlue/20">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </span>
              </div>
              <div className="mt-6">
                <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{systemStats?.metrics?.users}</span>
                <span className="text-[10px] text-slate-400 block font-semibold mt-1">Verified Mongo Profiles</span>
              </div>
            </div>

            {/* Portfolios Active */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm relative overflow-hidden transition-all duration-300">
              <div className="absolute -top-12 -left-12 w-28 h-28 bg-cyberTeal/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block">Virtual Portfolios</span>
                <span className="p-1.5 rounded-lg bg-cyberTeal/10 text-cyberTeal border border-cyberTeal/20">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </span>
              </div>
              <div className="mt-6">
                <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{systemStats?.metrics?.portfolios}</span>
                <span className="text-[10px] text-slate-400 block font-semibold mt-1">Active Accounts Initialized</span>
              </div>
            </div>

            {/* Total Transactions Ledger */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm relative overflow-hidden transition-all duration-300">
              <div className="absolute -top-12 -left-12 w-28 h-28 bg-accentGreen/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block">Transactions Logged</span>
                <span className="p-1.5 rounded-lg bg-accentGreen/10 text-accentGreen border border-accentGreen/20">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </span>
              </div>
              <div className="mt-6">
                <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{systemStats?.metrics?.transactions}</span>
                <span className="text-[10px] text-slate-400 block font-semibold mt-1">Virtual Trades Executed</span>
              </div>
            </div>

            {/* Target Price Alerts */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm relative overflow-hidden transition-all duration-300">
              <div className="absolute -top-12 -left-12 w-28 h-28 bg-accentRed/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block">Price Triggers Active</span>
                <span className="p-1.5 rounded-lg bg-accentRed/10 text-accentRed border border-accentRed/20">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </span>
              </div>
              <div className="mt-6">
                <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{systemStats?.metrics?.alerts}</span>
                <span className="text-[10px] text-slate-400 block font-semibold mt-1">Socket Watcher Loops</span>
              </div>
            </div>

          </div>

          {/* SECTION 2: CONNECTIVITY STATUS GAUGES & MODEL TRAINING */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* System Status Gages */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-md space-y-6">
              <div>
                <span className="text-xs font-bold text-cyberBlue dark:text-cyberTeal uppercase tracking-wider">Server Diagnostics</span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Connectivity Health</h3>
              </div>

              <div className="space-y-4">
                {/* Database Connectivity */}
                <div className="flex justify-between items-center p-3.5 rounded-xl border bg-slate-100/40 dark:bg-black/15 border-slate-200 dark:border-white/5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">MongoDB Database</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1.5 ${
                    systemStats?.gauges?.databaseStatus === 'CONNECTED'
                      ? 'bg-accentGreen/10 border-accentGreen/25 text-accentGreen'
                      : 'bg-accentRed/10 border-accentRed/25 text-accentRed'
                  }`}>
                    <span className="w-1.5 h-1.5 bg-accentGreen rounded-full animate-ping inline-block" />
                    {systemStats?.gauges?.databaseStatus}
                  </span>
                </div>

                {/* Flask ML Service Status */}
                <div className="flex justify-between items-center p-3.5 rounded-xl border bg-slate-100/40 dark:bg-black/15 border-slate-200 dark:border-white/5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Flask ML Microservice</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1.5 ${
                    systemStats?.mlStatus?.online
                      ? 'bg-accentGreen/10 border-accentGreen/25 text-accentGreen'
                      : 'bg-accentRed/10 border-accentRed/25 text-accentRed'
                  }`}>
                    {systemStats?.mlStatus?.online && <span className="w-1.5 h-1.5 bg-accentGreen rounded-full animate-ping inline-block" />}
                    {systemStats?.mlStatus?.online ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>

                {/* Latency & Resource consumption stats */}
                <div className="grid grid-cols-3 gap-2.5 pt-2">
                  <div className="p-3 rounded-xl border text-center bg-slate-100/40 dark:bg-black/15 border-slate-200 dark:border-white/5">
                    <span className="text-[9px] text-slate-450 dark:text-slate-500 font-extrabold uppercase block mb-1">API Latency</span>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-slate-200 font-mono">{systemStats?.gauges?.apiLatency}</span>
                  </div>
                  <div className="p-3 rounded-xl border text-center bg-slate-100/40 dark:bg-black/15 border-slate-200 dark:border-white/5">
                    <span className="text-[9px] text-slate-450 dark:text-slate-500 font-extrabold uppercase block mb-1">CPU Load</span>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-slate-200 font-mono">{systemStats?.gauges?.cpuLoad}</span>
                  </div>
                  <div className="p-3 rounded-xl border text-center bg-slate-100/40 dark:bg-black/15 border-slate-200 dark:border-white/5">
                    <span className="text-[9px] text-slate-450 dark:text-slate-500 font-extrabold uppercase block mb-1">RAM Usage</span>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-slate-200 font-mono">{systemStats?.gauges?.memoryUsage}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Neural Network Training Control Deck */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-md space-y-5 lg:col-span-2">
              <div>
                <span className="text-xs font-bold text-cyberBlue dark:text-cyberTeal uppercase tracking-wider">LSTM Neural Network Controller</span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Train forecasting model</h3>
              </div>

              {trainStatus.message && (
                <div className={`p-3 rounded-xl text-[10px] font-bold border transition-all ${
                  trainStatus.type === 'success' 
                    ? 'bg-accentGreen/10 border-accentGreen/20 text-accentGreen' 
                    : 'bg-accentRed/10 border-accentRed/20 text-accentRed'
                }`}>
                  {trainStatus.message}
                </div>
              )}

              <form onSubmit={handleTrainModel} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Ticker selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-450 dark:text-slate-500 font-extrabold uppercase tracking-wide block">
                      Target Ticker symbol
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MSFT"
                      value={trainSymbol}
                      onChange={(e) => setTrainSymbol(e.target.value)}
                      className="w-full px-4 py-2 text-xs rounded-xl bg-slate-100/60 dark:bg-black/35 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyberBlue focus:ring-1 focus:ring-cyberBlue transition-all"
                    />
                  </div>

                  {/* Epochs */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-450 dark:text-slate-500 font-extrabold uppercase tracking-wide block">
                      Epoch limit (Epochs)
                    </label>
                    <select
                      value={trainEpochs}
                      onChange={(e) => setTrainEpochs(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100/60 dark:bg-black/35 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyberBlue focus:ring-1 focus:ring-cyberBlue transition-all cursor-pointer"
                    >
                      <option value="5">5 Epochs (Fast Run)</option>
                      <option value="10">10 Epochs (Recommended)</option>
                      <option value="20">20 Epochs (Standard Fit)</option>
                      <option value="50">50 Epochs (Deep Optimization)</option>
                    </select>
                  </div>

                  {/* Batch Size */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-450 dark:text-slate-500 font-extrabold uppercase tracking-wide block">
                      Matrix segment (Batch Size)
                    </label>
                    <select
                      value={trainBatch}
                      onChange={(e) => setTrainBatch(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100/60 dark:bg-black/35 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyberBlue focus:ring-1 focus:ring-cyberBlue transition-all cursor-pointer"
                    >
                      <option value="16">16 (Higher Granularity)</option>
                      <option value="32">32 (Default Batch)</option>
                      <option value="64">64 (Faster Inference)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isTraining || !systemStats?.mlStatus?.online}
                  className="w-full py-2.5 bg-gradient-to-r from-accentRed to-orange-500 text-white font-extrabold text-xs rounded-xl tracking-wider hover:shadow-lg hover:shadow-accentRed/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <svg className={`w-4 h-4 ${isTraining ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.656 48.656 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
                  </svg>
                  {isTraining ? 'Training Matrix Running...' : 'INITIATE TENSOR MATRIX OPTIMIZATION'}
                </button>
              </form>
            </div>

          </div>

          {/* SECTION 3: RECENT REGISTRATIONS & TRAINED SYMBOLS LIST */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Recent Registrations Table */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-md lg:col-span-2 space-y-4">
              <div>
                <span className="text-xs font-bold text-cyberBlue dark:text-cyberTeal uppercase tracking-wider">Account Audit Logs</span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Recent user registries</h3>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/5 text-slate-400 font-extrabold uppercase">
                      <th className="pb-3 pr-4">User Details</th>
                      <th className="pb-3 pr-4">Email Coordinates</th>
                      <th className="pb-3 pr-4">Authority Privileges</th>
                      <th className="pb-3">Registration Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/40 dark:divide-white/5">
                    {systemStats?.recentUsers?.map((user) => (
                      <tr key={user._id} className="text-slate-800 dark:text-slate-200 hover:bg-slate-200/20 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3.5 pr-4 flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyberBlue to-cyberTeal text-white font-extrabold text-[10px] flex items-center justify-center">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                          <span className="font-bold text-slate-950 dark:text-white">{user.name}</span>
                        </td>
                        <td className="py-3.5 pr-4 font-semibold font-mono text-slate-500 dark:text-slate-400">{user.email}</td>
                        <td className="py-3.5 pr-4">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                            user.isAdmin 
                              ? 'bg-accentRed/10 border-accentRed/20 text-accentRed' 
                              : 'bg-cyberBlue/10 border-cyberBlue/20 text-cyberBlue'
                          }`}>
                            {user.isAdmin ? 'SYSTEM ADMIN' : 'VIRTUAL TRADER'}
                          </span>
                        </td>
                        <td className="py-3.5 font-bold text-slate-500 dark:text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                    {(!systemStats?.recentUsers || systemStats.recentUsers.length === 0) && (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-slate-500 font-bold">No active users logged.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Trained Symbols List Panel */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-md space-y-4">
              <div>
                <span className="text-xs font-bold text-cyberBlue dark:text-cyberTeal uppercase tracking-wider">Inference Nodes</span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Trained stock weight clusters</h3>
              </div>

              <div className="space-y-3.5">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wide block">
                  Optimized symbols ({systemStats?.mlStatus?.trainedSymbols?.length || 0})
                </span>

                <div className="flex flex-wrap gap-2 max-h-[180px] overflow-y-auto pr-1">
                  {systemStats?.mlStatus?.trainedSymbols?.map((symbol) => (
                    <span
                      key={symbol}
                      className="px-3 py-1.5 bg-slate-200/50 dark:bg-black/25 text-slate-800 dark:text-slate-200 border border-slate-350 dark:border-white/5 font-extrabold text-xs rounded-xl tracking-wider font-mono hover:border-cyberBlue/40 cursor-pointer transition-colors block"
                    >
                      {symbol}
                    </span>
                  ))}
                  {(!systemStats?.mlStatus?.trainedSymbols || systemStats.mlStatus.trainedSymbols.length === 0) && (
                    <span className="text-[10px] text-slate-500 font-semibold block text-center py-4 w-full">
                      No neural weights saved. Initiate training above.
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200/50 dark:border-white/5 text-[9px] text-slate-500 leading-normal font-semibold">
                  Trained weights are serialized as scale dictionaries (`_scaler.pkl`) and deep model layers (`_model/` or `.npz`) under the `ml-service/trained_models/` directory, saving processing limits on active runs.
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default Admin;
