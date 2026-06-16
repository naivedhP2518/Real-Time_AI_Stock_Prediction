import React, { useState, useEffect } from 'react';

const RLAgent = () => {
  const [isTraining, setIsTraining] = useState(false);
  const [episode, setEpisode] = useState(0);
  const [totalEpisodes] = useState(100);
  const [reward, setReward] = useState(0);
  const [totalReward, setTotalReward] = useState(0);
  const [agentState, setAgentState] = useState('idle'); // idle|training|trained
  const [trainingLog, setTrainingLog] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [policy, setPolicy] = useState({ buyThreshold: 0.65, sellThreshold: 0.45, holdBand: 0.1 });
  const [selectedAlgo, setSelectedAlgo] = useState('DQN');
  const [tradeHistory, setTradeHistory] = useState([]);
  const [metrics, setMetrics] = useState({
    totalReturn: 0, winRate: 0, sharpe: 0, maxDrawdown: 0, totalTrades: 0
  });

  const ALGORITHMS = [
    { id: 'DQN', name: 'Deep Q-Network', desc: 'Value-based RL using neural Q-function approximation', complexity: 'Medium' },
    { id: 'PPO', name: 'Proximal Policy Opt.', desc: 'Policy gradient with clipped surrogate objective', complexity: 'High' },
    { id: 'A3C', name: 'Async Advantage Actor-Critic', desc: 'Parallel training with actor-critic architecture', complexity: 'High' },
    { id: 'SAC', name: 'Soft Actor-Critic', desc: 'Maximum entropy RL for stable continuous control', complexity: 'Very High' },
  ];

  const ACTION_SPACE = [
    { action: 'BUY', desc: 'Purchase N shares at market price', color: 'text-accentGreen' },
    { action: 'SELL', desc: 'Sell N shares at market price', color: 'text-accentRed' },
    { action: 'HOLD', desc: 'Maintain current position', color: 'text-yellow-500' },
  ];

  const STATE_SPACE = [
    'RSI (14)', 'MACD Signal', 'SMA Cross', 'Volume Z-Score', 'Price Change %',
    'ATR Normalized', 'Bollinger %B', 'Portfolio P&L', 'Cash Ratio', 'Position Size'
  ];

  const startTraining = () => {
    setIsTraining(true);
    setAgentState('training');
    setTrainingLog([]);
    setPerformanceData([]);
    setEpisode(0);
    setTotalReward(0);
    setTradeHistory([]);

    let ep = 0;
    const perfData = [];
    const log = [];
    let cumReward = 0;

    const interval = setInterval(() => {
      ep++;
      const episodeReward = (Math.random() - 0.35) * 50 + ep * 0.3;
      cumReward += episodeReward;
      
      const winRate = 45 + Math.min(35, ep * 0.35);
      const ret = cumReward / 10;

      perfData.push({
        episode: ep,
        reward: +episodeReward.toFixed(2),
        cumReward: +cumReward.toFixed(2),
        winRate: +winRate.toFixed(1),
        epsilon: +(Math.max(0.05, 1.0 - ep * 0.01)).toFixed(3),
      });

      if (ep % 10 === 0) {
        const msgs = [
          `Episode ${ep}: Reward=${episodeReward.toFixed(2)}, Epsilon=${Math.max(0.05, 1.0 - ep * 0.01).toFixed(3)}`,
          `Updating Q-network weights via experience replay...`,
          `Batch sampled: 64 transitions | Loss: ${(Math.random() * 0.5).toFixed(4)}`,
          `Win rate improved to ${winRate.toFixed(1)}% | Avg return: ${ret.toFixed(2)}%`,
        ];
        log.push(...msgs.map(msg => ({ ep, msg, ts: new Date().toLocaleTimeString() })));
      }

      // Generate some trades
      if (ep % 5 === 0) {
        const symbols = ['AAPL', 'TSLA', 'NVDA', 'MSFT'];
        const sym = symbols[Math.floor(Math.random() * symbols.length)];
        const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
        const price = 150 + Math.random() * 200;
        const qty = Math.floor(5 + Math.random() * 20);
        const pnl = side === 'SELL' ? (Math.random() - 0.4) * price * qty * 0.05 : 0;
        setTradeHistory(prev => [{
          ep, sym, side, price: +price.toFixed(2), qty, pnl: +pnl.toFixed(2), ts: new Date().toLocaleTimeString()
        }, ...prev.slice(0, 49)]);
      }

      setEpisode(ep);
      setReward(+episodeReward.toFixed(2));
      setTotalReward(+cumReward.toFixed(2));
      setPerformanceData([...perfData]);
      setTrainingLog([...log].slice(-50));

      if (ep >= totalEpisodes) {
        clearInterval(interval);
        setIsTraining(false);
        setAgentState('trained');
        setMetrics({
          totalReturn: +(cumReward / 10).toFixed(2),
          winRate: +winRate.toFixed(1),
          sharpe: +(1.2 + Math.random() * 0.8).toFixed(2),
          maxDrawdown: +(8 + Math.random() * 12).toFixed(2),
          totalTrades: Math.floor(ep * 2.5),
        });
      }
    }, 80);
  };

  const resetAgent = () => {
    setAgentState('idle');
    setEpisode(0);
    setTotalReward(0);
    setTrainingLog([]);
    setPerformanceData([]);
    setTradeHistory([]);
    setMetrics({ totalReturn: 0, winRate: 0, sharpe: 0, maxDrawdown: 0, totalTrades: 0 });
  };

  const progress = (episode / totalEpisodes) * 100;

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 dark:border-white/5 pb-6 gap-4">
        <div>
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Reinforcement Learning</span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1">RL Trading Agent</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Self-learning AI that evolves trading strategies through reward-based optimization.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
            agentState === 'training' ? 'bg-cyberBlue/10 text-cyberBlue border border-cyberBlue/20' :
            agentState === 'trained' ? 'bg-accentGreen/10 text-accentGreen border border-accentGreen/20' :
            'bg-slate-200/50 dark:bg-white/5 text-slate-500 border border-slate-300 dark:border-white/10'
          }`}>
            <span className={`w-2 h-2 rounded-full ${agentState === 'training' ? 'bg-cyberBlue animate-pulse' : agentState === 'trained' ? 'bg-accentGreen' : 'bg-slate-400'}`} />
            {agentState === 'idle' ? 'IDLE' : agentState === 'training' ? 'TRAINING' : 'TRAINED'}
          </div>
          {agentState !== 'training' && (
            <button onClick={agentState === 'trained' ? resetAgent : startTraining} className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-800 text-white text-xs font-bold rounded-xl cursor-pointer hover:opacity-90 transition-opacity">
              {agentState === 'trained' ? 'Reset & Retrain' : '▶ Start Training'}
            </button>
          )}
          {agentState === 'training' && (
            <button onClick={() => { setIsTraining(false); setAgentState('idle'); }} className="px-5 py-2.5 bg-accentRed/10 text-accentRed border border-accentRed/20 text-xs font-bold rounded-xl cursor-pointer">
              ⏹ Stop
            </button>
          )}
        </div>
      </div>

      {/* Algorithm Selection */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Select RL Algorithm</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ALGORITHMS.map((algo) => (
            <button
              key={algo.id}
              onClick={() => !isTraining && setSelectedAlgo(algo.id)}
              disabled={isTraining}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                selectedAlgo === algo.id
                  ? 'bg-purple-500/10 border-purple-500/40 shadow-md shadow-purple-500/5'
                  : 'border-slate-200 dark:border-white/5 bg-slate-100/20 dark:bg-black/20 hover:border-slate-300 dark:hover:border-white/10'
              }`}
            >
              <div className="text-sm font-bold text-slate-900 dark:text-white">{algo.id}</div>
              <div className="text-[10px] font-semibold text-slate-500 mt-0.5">{algo.name}</div>
              <div className="text-[9px] text-slate-400 mt-2 leading-relaxed">{algo.desc}</div>
              <div className={`text-[9px] font-black mt-2 px-1.5 py-0.5 rounded w-fit ${
                algo.complexity === 'Very High' ? 'bg-purple-500/10 text-purple-400' :
                algo.complexity === 'High' ? 'bg-cyberBlue/10 text-cyberBlue' :
                'bg-accentGreen/10 text-accentGreen'
              }`}>
                {algo.complexity} Complexity
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Training Progress */}
      {agentState !== 'idle' && (
        <div className="glass-panel rounded-2xl p-6 border border-purple-500/20 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Training Progress — {selectedAlgo}</h3>
            <span className="text-xs font-mono text-purple-400">Episode {episode} / {totalEpisodes}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-white/5 h-3 rounded-full overflow-hidden mb-4">
            <div
              className="bg-gradient-to-r from-purple-500 to-cyberBlue h-full rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Current Reward', value: reward.toFixed(2), color: reward >= 0 ? 'text-accentGreen' : 'text-accentRed' },
              { label: 'Cumulative Reward', value: totalReward.toFixed(2), color: totalReward >= 0 ? 'text-accentGreen' : 'text-accentRed' },
              { label: 'Epsilon (Explore)', value: Math.max(0.05, 1.0 - episode * 0.01).toFixed(3), color: 'text-cyberTeal' },
              { label: 'Progress', value: `${progress.toFixed(1)}%`, color: 'text-purple-400' },
            ].map((m) => (
              <div key={m.label} className="bg-slate-100/50 dark:bg-black/20 rounded-xl p-3">
                <div className="text-[10px] text-slate-400">{m.label}</div>
                <div className={`text-xl font-black font-mono ${m.color}`}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trained Metrics */}
      {agentState === 'trained' && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in">
          {[
            { label: 'Total Return', value: `${metrics.totalReturn >= 0 ? '+' : ''}${metrics.totalReturn}%`, color: metrics.totalReturn >= 0 ? 'text-accentGreen' : 'text-accentRed' },
            { label: 'Win Rate', value: `${metrics.winRate}%`, color: 'text-cyberBlue' },
            { label: 'Sharpe Ratio', value: metrics.sharpe.toFixed(2), color: 'text-cyberTeal' },
            { label: 'Max Drawdown', value: `${metrics.maxDrawdown}%`, color: 'text-accentRed' },
            { label: 'Total Trades', value: metrics.totalTrades, color: 'text-purple-400' },
          ].map((m) => (
            <div key={m.label} className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-white/5 text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{m.label}</div>
              <div className={`text-2xl font-black font-mono mt-1 ${m.color}`}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Environment Config */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 space-y-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Environment Config</h3>

          <div>
            <div className="text-xs font-bold text-slate-500 mb-2">State Space (10 features)</div>
            <div className="space-y-1">
              {STATE_SPACE.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-purple-500/10 text-purple-400 rounded text-[9px] font-black flex items-center justify-center">{i+1}</span>
                  <span className="text-xs text-slate-600 dark:text-slate-300">{s}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-500 mb-2">Action Space (Discrete)</div>
            {ACTION_SPACE.map((a) => (
              <div key={a.action} className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-black w-12 ${a.color}`}>{a.action}</span>
                <span className="text-[10px] text-slate-400">{a.desc}</span>
              </div>
            ))}
          </div>

          <div>
            <div className="text-xs font-bold text-slate-500 mb-3">Reward Function Weights</div>
            <div className="space-y-2">
              {[
                { label: 'P&L Reward', value: 70 },
                { label: 'Risk Penalty', value: 20 },
                { label: 'Trade Frequency Penalty', value: 10 },
              ].map((r) => (
                <div key={r.label}>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-slate-400">{r.label}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{r.value}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-white/5 h-1.5 rounded-full">
                    <div className="bg-gradient-to-r from-purple-500 to-cyberBlue h-full rounded-full" style={{ width: `${r.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Training Log */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Training Console</h3>
          <div className="bg-black/40 rounded-xl p-3 h-80 overflow-y-auto font-mono text-[10px] space-y-0.5 border border-white/5">
            {trainingLog.length === 0 ? (
              <div className="text-slate-500 text-center pt-10">Waiting for training to start...</div>
            ) : (
              trainingLog.slice().reverse().map((entry, i) => (
                <div key={i} className="text-slate-300">
                  <span className="text-slate-600">[{entry.ts}] </span>
                  <span className={entry.msg.includes('Win rate') ? 'text-accentGreen' : entry.msg.includes('Loss') ? 'text-yellow-400' : 'text-slate-300'}>
                    {entry.msg}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Trade History */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Agent Trade History</h3>
          <div className="space-y-2 h-80 overflow-y-auto">
            {tradeHistory.length === 0 ? (
              <div className="text-slate-500 text-xs text-center pt-10">No trades yet. Start training to see agent decisions.</div>
            ) : (
              tradeHistory.map((t, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-100/50 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 text-xs">
                  <span className={`font-black px-2 py-0.5 rounded text-[9px] ${t.side === 'BUY' ? 'bg-accentGreen/10 text-accentGreen' : 'bg-accentRed/10 text-accentRed'}`}>{t.side}</span>
                  <span className="font-bold text-slate-900 dark:text-white w-12">{t.sym}</span>
                  <span className="text-slate-400">{t.qty}sh @ ${t.price}</span>
                  {t.pnl !== 0 && <span className={`ml-auto font-bold ${t.pnl >= 0 ? 'text-accentGreen' : 'text-accentRed'}`}>{t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}</span>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Info footer */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-white/5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0 text-purple-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Virtual Environment Only</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              The RL agent operates in a fully simulated environment using historical replay data. No real trades are executed. This is an educational and research tool demonstrating reinforcement learning concepts applied to algorithmic trading.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RLAgent;
