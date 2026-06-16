import React, { useState, useEffect } from 'react';

const API_ENDPOINTS = [
  { method: 'GET', path: '/api/stocks/predictions/:symbol', desc: 'Get AI price prediction for a stock', tier: 'Free' },
  { method: 'POST', path: '/api/ensemble-predict', desc: 'Ensemble AI consensus forecast', tier: 'Pro' },
  { method: 'GET', path: '/api/model-performance', desc: 'AI model accuracy leaderboard', tier: 'Pro' },
  { method: 'GET', path: '/api/scanner/results', desc: 'Real-time market scanner results', tier: 'Pro' },
  { method: 'GET', path: '/api/stocks/quote/:symbol', desc: 'Live stock quote', tier: 'Free' },
  { method: 'GET', path: '/api/portfolio', desc: 'Portfolio analytics', tier: 'Enterprise' },
  { method: 'POST', path: '/api/paper-trading/buy', desc: 'Paper trading execution', tier: 'Pro' },
  { method: 'GET', path: '/api/news/:symbol', desc: 'News sentiment for stock', tier: 'Free' },
  { method: 'POST', path: '/api/ai-chat/query', desc: 'AI trading assistant query', tier: 'Enterprise' },
  { method: 'GET', path: '/api/alerts', desc: 'Smart price alerts', tier: 'Pro' },
];

const WEBHOOK_EVENTS = [
  { id: 'price_alert', name: 'Price Alert Triggered', desc: 'Fires when a price alert crosses target', tier: 'Pro' },
  { id: 'ai_signal', name: 'AI Signal Update', desc: 'Fires when AI model updates its prediction', tier: 'Pro' },
  { id: 'trade_executed', name: 'Trade Executed', desc: 'Fires on paper trading buy/sell execution', tier: 'Pro' },
  { id: 'pattern_detected', name: 'Pattern Detected', desc: 'Fires when AI detects a chart pattern', tier: 'Enterprise' },
  { id: 'portfolio_rebalance', name: 'Rebalance Suggested', desc: 'Fires when portfolio drift exceeds threshold', tier: 'Enterprise' },
];

const generateApiKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const prefix = 'qst_live_';
  let key = prefix;
  for (let i = 0; i < 32; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
  return key;
};

const TierBadge = ({ tier }) => {
  const colors = {
    Free: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
    Pro: 'bg-cyberBlue/10 text-cyberBlue border-cyberBlue/20',
    Enterprise: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };
  return (
    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${colors[tier]}`}>
      {tier}
    </span>
  );
};

const MethodBadge = ({ method }) => {
  const colors = {
    GET: 'bg-accentGreen/10 text-accentGreen border-accentGreen/20',
    POST: 'bg-cyberBlue/10 text-cyberBlue border-cyberBlue/20',
    PUT: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    DELETE: 'bg-accentRed/10 text-accentRed border-accentRed/20',
  };
  return (
    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase w-12 text-center ${colors[method] || ''}`}>
      {method}
    </span>
  );
};

const APIAccess = () => {
  const [activeTab, setActiveTab] = useState('keys');
  const [apiKeys, setApiKeys] = useState([
    { id: 1, name: 'Production Key', key: generateApiKey(), created: '2025-05-01', lastUsed: '2m ago', requests: 4821, tier: 'Pro', isVisible: false },
    { id: 2, name: 'Development Key', key: generateApiKey(), created: '2025-05-15', lastUsed: '1d ago', requests: 128, tier: 'Free', isVisible: false },
  ]);
  const [webhooks, setWebhooks] = useState([
    { id: 1, url: 'https://your-app.com/webhook', events: ['price_alert', 'ai_signal'], isActive: true, deliveries: 234 },
  ]);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const createApiKey = () => {
    if (!newKeyName.trim()) return;
    const newKey = {
      id: Date.now(),
      name: newKeyName,
      key: generateApiKey(),
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      requests: 0,
      tier: 'Free',
      isVisible: true,
    };
    setApiKeys(prev => [...prev, newKey]);
    setNewKeyName('');
    setIsCreatingKey(false);
  };

  const deleteKey = (id) => setApiKeys(prev => prev.filter(k => k.id !== id));
  const toggleKeyVisibility = (id) => setApiKeys(prev => prev.map(k => k.id === id ? { ...k, isVisible: !k.isVisible } : k));

  const addWebhook = () => {
    if (!webhookUrl.trim() || selectedEvents.length === 0) return;
    setWebhooks(prev => [...prev, { id: Date.now(), url: webhookUrl, events: selectedEvents, isActive: true, deliveries: 0 }]);
    setWebhookUrl('');
    setSelectedEvents([]);
  };

  const TABS = [
    { id: 'keys', label: 'API Keys', icon: '🔑' },
    { id: 'webhooks', label: 'Webhooks', icon: '🔗' },
    { id: 'docs', label: 'API Docs', icon: '📚' },
    { id: 'usage', label: 'Usage Analytics', icon: '📊' },
  ];

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 dark:border-white/5 pb-6 gap-4">
        <div>
          <span className="text-xs font-bold text-cyberBlue dark:text-cyberTeal uppercase tracking-wider">Developer Platform</span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1">API & Webhook Access</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Integrate QuantumStocks AI predictions and market data into your applications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 glass-panel rounded-xl border border-accentGreen/20 text-xs font-bold text-accentGreen flex items-center gap-2">
            <span className="w-2 h-2 bg-accentGreen rounded-full animate-pulse" />
            API Status: Operational
          </div>
          <div className="px-4 py-2 glass-panel rounded-xl border border-slate-200 dark:border-white/5 text-xs font-bold text-slate-600 dark:text-slate-400">
            v2.1.0
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total API Calls', value: '4,949', sub: 'this month', icon: '⚡' },
          { label: 'Active Keys', value: apiKeys.length.toString(), sub: `${apiKeys.filter(k => k.tier === 'Pro').length} Pro keys`, icon: '🔑' },
          { label: 'Webhooks', value: webhooks.length.toString(), sub: `${webhooks.filter(w => w.isActive).length} active`, icon: '🔗' },
          { label: 'Success Rate', value: '99.8%', sub: 'last 30 days', icon: '✅' },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-white/5">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{stat.value}</div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{stat.label}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="flex bg-slate-100 dark:bg-black/35 p-1 rounded-2xl border border-slate-200 dark:border-white/5 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-white dark:bg-white/10 text-cyberBlue dark:text-cyberTeal shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* API Keys Tab */}
      {activeTab === 'keys' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your API Keys</h3>
            <button
              onClick={() => setIsCreatingKey(true)}
              className="px-4 py-2 bg-gradient-to-r from-cyberBlue to-cyberTeal text-white text-xs font-bold rounded-xl cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Generate New Key
            </button>
          </div>

          {isCreatingKey && (
            <div className="glass-panel rounded-2xl p-6 border border-cyberBlue/20 animate-scale-up">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Create New API Key</h4>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Key name (e.g. My App Production)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/35 text-slate-900 dark:text-white focus:outline-none focus:border-cyberBlue"
                />
                <button onClick={createApiKey} className="px-5 py-2.5 bg-cyberBlue text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-cyberBlue/80">
                  Create
                </button>
                <button onClick={() => setIsCreatingKey(false)} className="px-5 py-2.5 border border-slate-200 dark:border-white/10 text-xs font-bold rounded-xl cursor-pointer text-slate-600 dark:text-slate-400">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{apiKey.name}</span>
                      <TierBadge tier={apiKey.tier} />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Created {apiKey.created} · Last used {apiKey.lastUsed} · {apiKey.requests.toLocaleString()} requests</div>
                  </div>
                  <button onClick={() => deleteKey(apiKey.id)} className="text-slate-400 hover:text-accentRed transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-black/25 rounded-xl font-mono text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5 overflow-hidden">
                    {apiKey.isVisible ? apiKey.key : apiKey.key.substring(0, 12) + '••••••••••••••••••••••••'}
                  </div>
                  <button onClick={() => toggleKeyVisibility(apiKey.id)} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={apiKey.isVisible ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                    </svg>
                  </button>
                  <button onClick={() => copyToClipboard(apiKey.key, apiKey.id)} className={`px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all ${copiedKey === apiKey.id ? 'bg-accentGreen/10 text-accentGreen border border-accentGreen/20' : 'bg-slate-200/50 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-cyberBlue/10 hover:text-cyberBlue'}`}>
                    {copiedKey === apiKey.id ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Webhook Subscriptions</h3>

          {/* Add webhook form */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Add Webhook Endpoint</h4>
            <div className="space-y-4">
              <input
                type="url"
                placeholder="https://your-app.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/35 text-slate-900 dark:text-white focus:outline-none focus:border-cyberBlue"
              />
              <div>
                <div className="text-xs font-bold text-slate-500 mb-3">Select Events to Subscribe:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {WEBHOOK_EVENTS.map((evt) => (
                    <label key={evt.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/5 cursor-pointer hover:border-cyberBlue/30 transition-all">
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(evt.id)}
                        onChange={(e) => setSelectedEvents(prev => e.target.checked ? [...prev, evt.id] : prev.filter(x => x !== evt.id))}
                        className="mt-0.5 cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{evt.name}</div>
                        <div className="text-[10px] text-slate-400">{evt.desc}</div>
                        <TierBadge tier={evt.tier} />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={addWebhook} className="px-6 py-2.5 bg-gradient-to-r from-cyberBlue to-cyberTeal text-white text-xs font-bold rounded-xl cursor-pointer hover:opacity-90 transition-opacity">
                Subscribe to Webhook
              </button>
            </div>
          </div>

          {/* Existing webhooks */}
          {webhooks.map((wh) => (
            <div key={wh.id} className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${wh.isActive ? 'bg-accentGreen animate-pulse' : 'bg-slate-400'}`} />
                  <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{wh.url}</span>
                </div>
                <span className="text-xs text-slate-400">{wh.deliveries} deliveries</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {wh.events.map((ev) => (
                  <span key={ev} className="px-2 py-1 bg-cyberBlue/10 text-cyberBlue border border-cyberBlue/20 rounded-lg text-[10px] font-bold">
                    {ev.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* API Docs Tab */}
      {activeTab === 'docs' && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">API Reference</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              All endpoints require an <span className="text-cyberTeal font-mono">Authorization: Bearer YOUR_API_KEY</span> header.
              Base URL: <span className="text-cyberTeal font-mono">https://api.quantumstocks.ai</span>
            </p>

            <div className="space-y-3">
              {API_ENDPOINTS.map((ep, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-all">
                  <MethodBadge method={ep.method} />
                  <code className="text-xs font-mono text-cyberTeal flex-1">{ep.path}</code>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex-1">{ep.desc}</span>
                  <TierBadge tier={ep.tier} />
                </div>
              ))}
            </div>
          </div>

          {/* Code Sample */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Quick Start Example</h4>
            <pre className="text-xs font-mono text-cyberTeal bg-black/30 p-4 rounded-xl overflow-x-auto border border-white/5">
{`// Get AI prediction for AAPL
const response = await fetch(
  'https://api.quantumstocks.ai/api/stocks/predictions/AAPL?model=ensemble',
  {
    headers: {
      'Authorization': 'Bearer qst_live_YOUR_API_KEY',
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
console.log(data.predictedPrice);  // 187.45
console.log(data.buySellSignal);   // "STRONG BUY"
console.log(data.confidence);      // 92.3`}
            </pre>
          </div>
        </div>
      )}

      {/* Usage Analytics Tab */}
      {activeTab === 'usage' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">API Calls by Endpoint</h4>
            <div className="space-y-3">
              {[
                { path: '/predictions/:symbol', calls: 2341, pct: 47 },
                { path: '/ensemble-predict', calls: 1122, pct: 22 },
                { path: '/scanner/results', calls: 893, pct: 18 },
                { path: '/stocks/quote', calls: 450, pct: 9 },
                { path: '/ai-chat/query', calls: 143, pct: 3 },
              ].map((ep) => (
                <div key={ep.path}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-mono text-cyberTeal">{ep.path}</span>
                    <span className="text-slate-400 font-bold">{ep.calls.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-white/5 h-1.5 rounded-full">
                    <div className="bg-gradient-to-r from-cyberBlue to-cyberTeal h-full rounded-full transition-all" style={{ width: `${ep.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Rate Limit Status</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">Monthly Quota</span>
                  <span className="font-bold text-slate-900 dark:text-white">4,949 / 10,000</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/5 h-3 rounded-full">
                  <div className="bg-gradient-to-r from-cyberBlue to-cyberTeal h-full rounded-full" style={{ width: '49%' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Requests Today', value: '342' },
                  { label: 'Avg Latency', value: '124ms' },
                  { label: 'Error Rate', value: '0.2%' },
                  { label: 'Quota Reset', value: 'June 30' },
                ].map((m) => (
                  <div key={m.label} className="bg-slate-100/50 dark:bg-black/20 rounded-xl p-3">
                    <div className="text-xs text-slate-400">{m.label}</div>
                    <div className="text-lg font-black font-mono text-slate-900 dark:text-white">{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default APIAccess;
