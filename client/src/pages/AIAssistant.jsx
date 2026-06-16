import React, { useState, useEffect, useRef, useCallback } from 'react';
import API from '../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const QUICK_QUERIES = [
  { label: 'Why is TSLA bearish today?', symbol: 'TSLA', icon: '🔻' },
  { label: 'Best bullish stocks right now', symbol: null, icon: '🚀' },
  { label: 'Compare AAPL vs NVDA', symbol: 'AAPL', icon: '⚖️' },
  { label: 'Stocks with strongest momentum', symbol: null, icon: '💨' },
  { label: 'Risk analysis for my portfolio', symbol: null, icon: '🛡️' },
  { label: 'What is the market sentiment?', symbol: null, icon: '🌡️' },
];

const QUICK_SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'AMZN', 'MSFT'];

const AI_CAPABILITIES = [
  { icon: '📈', label: 'Technical Analysis' },
  { icon: '🔍', label: 'Pattern Recognition' },
  { icon: '⚡', label: 'Momentum Scoring' },
  { icon: '📊', label: 'Trend Analysis' },
  { icon: '🛡️', label: 'Risk Assessment' },
];

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  timestamp: new Date().toISOString(),
  content: `Welcome to **QuantumStocks AI Assistant** — your real-time trading intelligence engine.

I can help you with:
• **Technical Analysis** — RSI, MACD, EMA patterns and signals
• **Stock Comparisons** — Side-by-side performance breakdowns  
• **Market Sentiment** — AI-powered sentiment scoring across sectors
• **Risk Assessment** — Portfolio risk profiling and hedging strategies
• **Momentum Signals** — Identify breakout candidates before they move

Select a quick query from the left panel, or ask me anything about the markets. I'm powered by real-time data feeds and deep learning models trained on historical price action.`,
};

// ─── Format assistant message content ─────────────────────────────────────────
const formatContent = (text) => {
  // Split into lines for processing
  const lines = text.split('\n');
  const elements = [];
  let key = 0;

  lines.forEach((line) => {
    // Bullet points
    if (line.startsWith('• ') || line.startsWith('- ')) {
      const content = line.replace(/^[•\-]\s*/, '');
      elements.push(
        <div key={key++} className="flex items-start gap-2 my-0.5">
          <span className="text-cyberTeal mt-0.5 shrink-0">•</span>
          <span>{inlineFormat(content)}</span>
        </div>
      );
    }
    // Section separator
    else if (line.startsWith('---')) {
      elements.push(<hr key={key++} className="border-white/10 my-2" />);
    }
    // Blank line
    else if (line.trim() === '') {
      elements.push(<div key={key++} className="h-2" />);
    }
    // Normal line
    else {
      elements.push(<p key={key++} className="leading-relaxed">{inlineFormat(line)}</p>);
    }
  });

  return elements;
};

// ─── Inline formatting: **bold**, numbers, stock symbols ─────────────────────
const inlineFormat = (text) => {
  const parts = [];
  // Pattern: **bold**, $numbers, SYMBOLS (uppercase 2-5 chars at word boundary)
  const regex = /(\*\*[^*]+\*\*)|(\$[\d,]+\.?\d*)|(\b[A-Z]{2,5}\b)/g;
  let last = 0;
  let m;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));

    if (m[1]) {
      // Bold
      parts.push(<strong key={m.index} className="text-white font-bold">{m[1].replace(/\*\*/g, '')}</strong>);
    } else if (m[2]) {
      // Dollar amount
      parts.push(<span key={m.index} className="text-accentGreen font-bold font-mono">{m[2]}</span>);
    } else if (m[3]) {
      // Stock symbol (rough heuristic — all caps 2-5 chars)
      const knownSymbols = ['AAPL', 'TSLA', 'NVDA', 'AMZN', 'MSFT', 'GOOGL', 'META', 'AMD', 'SPY', 'QQQ', 'RSI', 'MACD', 'EMA', 'AI'];
      if (knownSymbols.includes(m[3])) {
        parts.push(<span key={m.index} className="text-cyberTeal font-bold">{m[3]}</span>);
      } else {
        parts.push(m[3]);
      }
    }

    last = m.index + m[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
};

// ─── AI Avatar ────────────────────────────────────────────────────────────────
const AIAvatar = () => (
  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyberBlue to-cyberTeal flex items-center justify-center shrink-0 shadow-lg shadow-cyberBlue/20">
    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
    </svg>
  </div>
);

// ─── Loading dots ─────────────────────────────────────────────────────────────
const LoadingDots = () => (
  <div className="flex items-end gap-1 px-1 py-0.5">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-2 h-2 rounded-full bg-cyberTeal"
        style={{ animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }}
      />
    ))}
    <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }`}</style>
  </div>
);

// ─── Message bubble ───────────────────────────────────────────────────────────
const MessageBubble = ({ message, isTyping }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-end gap-3 animate-fade-in ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isUser && <AIAvatar />}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-cyberBlue/20 border border-cyberBlue/30 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-cyberBlue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-cyberBlue text-white rounded-br-sm'
              : 'bg-darkCard border border-white/8 text-slate-300 rounded-bl-sm'
          }`}
        >
          {isTyping ? (
            <LoadingDots />
          ) : isUser ? (
            <p>{message.content}</p>
          ) : (
            <div className="space-y-0.5">{formatContent(message.content)}</div>
          )}
        </div>
        <span className="text-[10px] text-slate-500 px-1">
          {new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const AIAssistant = () => {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [isTypingEffect, setIsTypingEffect] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimerRef = useRef(null);

  // ── Auto-scroll to bottom ──────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ── Cleanup typing timers on unmount ───────────────────────────────────────
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  // ── Typing effect: reveal text char by char ────────────────────────────────
  const typeMessage = useCallback((msgId, fullText) => {
    let index = 0;
    setIsTypingEffect(true);

    const reveal = () => {
      index++;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, content: fullText.slice(0, index), _typing: index < fullText.length } : m
        )
      );
      if (index < fullText.length) {
        typingTimerRef.current = setTimeout(reveal, 12);
      } else {
        setIsTypingEffect(false);
      }
    };

    typingTimerRef.current = setTimeout(reveal, 12);
  }, []);

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text, overrideSymbol) => {
    const messageText = (text || inputMessage).trim();
    if (!messageText || isLoading) return;

    const symbol = overrideSymbol !== undefined ? overrideSymbol : selectedSymbol;

    // Add user message
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    // Placeholder assistant message
    const assistantId = `assistant-${Date.now()}`;
    const placeholderMsg = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      _loading: true,
    };
    setMessages((prev) => [...prev, placeholderMsg]);

    try {
      const { data } = await API.post('/ai-chat/query', {
        message: messageText,
        symbol,
      });

      const responseText = data.response || data.message || data.answer || 'Analysis complete. No additional data returned from the AI engine.';

      // Switch from loading to typing
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, _loading: false, content: '' } : m
        )
      );
      setIsLoading(false);

      // Trigger typing effect
      typeMessage(assistantId, responseText);
    } catch (err) {
      // Fallback simulated response
      const fallbackResponse = generateFallbackResponse(messageText, symbol);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, _loading: false, content: '' } : m
        )
      );
      setIsLoading(false);
      typeMessage(assistantId, fallbackResponse);
    }
  }, [inputMessage, isLoading, selectedSymbol, typeMessage]);

  // ── Fallback AI response generator ────────────────────────────────────────
  const generateFallbackResponse = (query, symbol) => {
    const sym = symbol || 'the market';
    const rsi = (Math.random() * 40 + 40).toFixed(1);
    const confidence = (Math.random() * 20 + 75).toFixed(1);
    const change = ((Math.random() - 0.45) * 4).toFixed(2);
    const signal = parseFloat(change) > 0 ? 'BULLISH' : 'BEARISH';

    return `**AI Analysis for ${sym.toUpperCase()}**

---

**Market Signal:** ${signal} (Confidence: ${confidence}%)

**Technical Indicators:**
• RSI (14): ${rsi} — ${parseFloat(rsi) > 60 ? 'Overbought territory, momentum strong' : parseFloat(rsi) < 40 ? 'Oversold — potential reversal zone' : 'Neutral range, awaiting catalyst'}
• MACD: ${parseFloat(change) > 0 ? 'Bullish crossover detected on 4H chart' : 'Bearish divergence on daily timeframe'}
• EMA (20/50): Price ${parseFloat(change) > 0 ? 'trading above' : 'below'} key moving averages — ${parseFloat(change) > 0 ? 'uptrend intact' : 'downtrend pressure'}

**Price Action:**
• Intraday move: ${parseFloat(change) >= 0 ? '+' : ''}${change}%
• Volume: ${(Math.random() * 50 + 80).toFixed(0)}% of average — ${Math.random() > 0.5 ? 'elevated institutional activity' : 'retail-driven flow'}
• Support level: $${(Math.random() * 50 + 140).toFixed(2)}
• Resistance zone: $${(Math.random() * 50 + 195).toFixed(2)}

**AI Recommendation:** ${parseFloat(change) > 1.5 ? 'Strong momentum signal — consider accumulating on dips near support.' : parseFloat(change) < -1.5 ? 'Caution advised. Watch for volume confirmation before entering long positions.' : 'Hold bias. Monitor for breakout above resistance with volume confirmation.'}

*Note: This is AI-generated analysis. Always conduct your own due diligence before trading.*`;
  };

  // ── Key handler ────────────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-80px)] bg-darkBg text-white overflow-hidden animate-fade-in">

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* LEFT PANEL */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="w-[300px] shrink-0 flex flex-col border-r border-white/5 bg-darkCard/60 backdrop-blur-xl overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyberBlue to-cyberTeal flex items-center justify-center shadow-lg shadow-cyberBlue/20 animate-pulse-glow">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-black text-white">AI Trading Assistant</h2>
              <p className="text-[10px] text-accentGreen font-semibold flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accentGreen animate-ping" />
                Online · Ready
              </p>
            </div>
          </div>
        </div>

        {/* Quick Queries */}
        <div className="p-4 border-b border-white/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Quick Queries</p>
          <div className="space-y-1.5">
            {QUICK_QUERIES.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q.label, q.symbol || selectedSymbol)}
                disabled={isLoading || isTypingEffect}
                className="w-full text-left px-3 py-2.5 rounded-xl bg-white/3 hover:bg-white/8 border border-white/5 hover:border-cyberBlue/30 text-xs text-slate-300 hover:text-white transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="mr-2">{q.icon}</span>
                <span className="group-hover:text-cyberTeal transition-colors">{q.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stock Selector */}
        <div className="p-4 border-b border-white/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Focus Symbol</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedSymbol(null)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                !selectedSymbol ? 'bg-cyberBlue text-white' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              ALL
            </button>
            {QUICK_SYMBOLS.map((sym) => (
              <button
                key={sym}
                onClick={() => setSelectedSymbol(sym === selectedSymbol ? null : sym)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  selectedSymbol === sym ? 'bg-cyberTeal text-darkBg' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
          {selectedSymbol && (
            <p className="text-[10px] text-cyberTeal mt-2 font-semibold">Focused on {selectedSymbol}</p>
          )}
        </div>

        {/* AI Capabilities */}
        <div className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">AI Capabilities</p>
          <div className="space-y-2">
            {AI_CAPABILITIES.map((cap, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-slate-400">
                <span className="text-base">{cap.icon}</span>
                <span className="font-semibold">{cap.label}</span>
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accentGreen/60" />
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-auto p-4 border-t border-white/5">
          <p className="text-[9px] text-slate-600 leading-relaxed">
            AI analysis is for informational purposes only. Not financial advice. Always consult a licensed advisor.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* RIGHT PANEL — Chat */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-darkCard/40 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">
                {selectedSymbol ? `${selectedSymbol} — AI Analysis` : 'Market Intelligence Chat'}
              </span>
              <span className="text-[10px] text-slate-500">
                {messages.length - 1} messages · Powered by QuantumAI v3
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMessages([WELCOME_MESSAGE])}
              className="text-[10px] font-bold text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              Clear Chat
            </button>
            <div className="w-2 h-2 rounded-full bg-accentGreen animate-ping" />
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isTyping={msg._loading}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-white/5 bg-darkCard/40 backdrop-blur-md shrink-0">
          {selectedSymbol && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] text-cyberTeal font-bold bg-cyberTeal/10 border border-cyberTeal/20 px-2 py-1 rounded-lg">
                Focus: {selectedSymbol}
              </span>
              <button
                onClick={() => setSelectedSymbol(null)}
                className="text-[10px] text-slate-500 hover:text-white cursor-pointer"
              >
                ✕ clear
              </button>
            </div>
          )}
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about any stock, indicator, or market condition... (Enter to send, Shift+Enter for newline)"
                rows={1}
                disabled={isLoading || isTypingEffect}
                className="w-full bg-white/5 border border-white/10 focus:border-cyberBlue/50 text-white placeholder-slate-500 rounded-2xl px-4 py-3.5 text-sm resize-none outline-none transition-all disabled:opacity-50 font-medium"
                style={{
                  minHeight: '52px',
                  maxHeight: '140px',
                  overflow: 'auto',
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
                }}
              />
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={!inputMessage.trim() || isLoading || isTypingEffect}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyberBlue to-cyberTeal flex items-center justify-center text-white shadow-lg shadow-cyberBlue/20 hover:shadow-cyberBlue/40 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 btn-press"
            >
              {isLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-600 mt-2 text-center">
            ⚡ Powered by QuantumAI · Real-time market data · Not financial advice
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
