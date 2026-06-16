import React, { useState, useEffect, useRef } from 'react';

// ─── Static event data ───────────────────────────────────────────────────────
const now = new Date();
const d = (daysOffset, h = 9, m = 30) => {
  const dt = new Date(now);
  dt.setDate(dt.getDate() + daysOffset);
  dt.setHours(h, m, 0, 0);
  return dt;
};

const EVENTS = [
  // Week 1
  { id: 1,  date: d(0),  time: '08:30', title: 'Initial Jobless Claims',        category: 'Employment', impact: 'LOW',    actual: '218K',  forecast: '225K', previous: '220K', description: 'Weekly measure of unemployment insurance filings.', affectedSectors: ['Banking','Consumer','Fintech'] },
  { id: 2,  date: d(1),  time: '08:30', title: 'Non-Farm Payrolls',             category: 'Employment', impact: 'HIGH',   actual: null,    forecast: '185K', previous: '175K', description: 'Monthly measure of new jobs added in the US economy excluding farm workers.', affectedSectors: ['Technology','Banking','Consumer'] },
  { id: 3,  date: d(1),  time: '10:00', title: 'Consumer Confidence Index',     category: 'Consumer',   impact: 'MEDIUM', actual: null,    forecast: '102.5',previous: '99.8', description: 'Survey-based measure of consumer optimism about economic conditions.', affectedSectors: ['Consumer','E-Commerce','Entertainment'] },
  { id: 4,  date: d(2),  time: '09:00', title: 'PMI Manufacturing',             category: 'Industry',   impact: 'LOW',    actual: null,    forecast: '51.2', previous: '50.8', description: 'Purchasing Managers Index measures manufacturing sector health.', affectedSectors: ['Auto/EV','Energy'] },
  // Week 2
  { id: 5,  date: d(5),  time: '08:30', title: 'CPI Data Release',              category: 'Inflation',  impact: 'HIGH',   actual: null,    forecast: '3.1%', previous: '3.4%', description: 'Consumer Price Index - key inflation measure closely watched by the Fed.', affectedSectors: ['Banking','Fintech','Technology'] },
  { id: 6,  date: d(6),  time: '14:00', title: 'FOMC Meeting & Rate Decision',  category: 'Fed Events', impact: 'HIGH',   actual: null,    forecast: '5.25–5.50%', previous: '5.25–5.50%', description: 'Federal Open Market Committee rate decision and policy statement.', affectedSectors: ['Banking','Technology','Real Estate'] },
  { id: 7,  date: d(7),  time: '14:30', title: 'Fed Chair Powell Speech',        category: 'Fed Events', impact: 'HIGH',   actual: null,    forecast: 'Hawkish', previous: 'Neutral', description: 'Fed Chair press conference following FOMC decision.', affectedSectors: ['Banking','Technology','Fintech'] },
  { id: 8,  date: d(8),  time: '08:30', title: 'PPI Data Release',              category: 'Inflation',  impact: 'MEDIUM', actual: null,    forecast: '2.8%', previous: '2.9%', description: 'Producer Price Index measures inflation from the producer perspective.', affectedSectors: ['Energy','Consumer'] },
  { id: 9,  date: d(9),  time: '08:30', title: 'Retail Sales',                  category: 'Consumer',   impact: 'MEDIUM', actual: null,    forecast: '+0.4%',previous: '+0.7%', description: 'Monthly measure of total goods sold to consumers.', affectedSectors: ['Consumer','E-Commerce'] },
  // Week 3 – Earnings
  { id: 10, date: d(12), time: 'AMC',   title: 'AAPL Earnings Q2',              category: 'Earnings',   impact: 'HIGH',   actual: null,    forecast: '$1.55 EPS', previous: '$1.46 EPS', description: 'Apple Q2 earnings report. Focus on iPhone sales and services revenue.', affectedSectors: ['Technology'] },
  { id: 11, date: d(13), time: 'BMO',   title: 'MSFT Earnings Q4',              category: 'Earnings',   impact: 'HIGH',   actual: null,    forecast: '$2.93 EPS', previous: '$2.69 EPS', description: 'Microsoft quarterly results. Azure cloud growth and Copilot revenue key.', affectedSectors: ['Technology'] },
  { id: 12, date: d(13), time: '08:30', title: 'Initial Jobless Claims',        category: 'Employment', impact: 'LOW',    actual: null,    forecast: '220K', previous: '218K', description: 'Weekly unemployment insurance filings.', affectedSectors: ['Banking','Consumer'] },
  { id: 13, date: d(14), time: 'AMC',   title: 'NVDA Earnings Q1',              category: 'Earnings',   impact: 'HIGH',   actual: null,    forecast: '$5.60 EPS', previous: '$5.16 EPS', description: 'NVIDIA quarterly report. Data center and AI chip demand in focus.', affectedSectors: ['Technology'] },
  { id: 14, date: d(15), time: '08:30', title: 'GDP Report (Advance)',          category: 'GDP',        impact: 'HIGH',   actual: null,    forecast: '2.4%', previous: '3.4%', description: 'Advance estimate of US GDP growth. Leading indicator for economic health.', affectedSectors: ['Banking','Technology','Consumer'] },
  { id: 15, date: d(16), time: 'AMC',   title: 'AMZN Earnings Q2',             category: 'Earnings',   impact: 'HIGH',   actual: null,    forecast: '$0.82 EPS', previous: '$0.70 EPS', description: 'Amazon quarterly earnings. AWS growth and advertising revenue key metrics.', affectedSectors: ['E-Commerce','Technology'] },
  // Week 4
  { id: 16, date: d(19), time: '10:00', title: 'Consumer Confidence',           category: 'Consumer',   impact: 'MEDIUM', actual: null,    forecast: '103.1',previous: '102.5',description: 'The Conference Board Consumer Confidence Index.', affectedSectors: ['Consumer','Retail'] },
  { id: 17, date: d(19), time: 'AMC',   title: 'GOOGL Earnings Q2',            category: 'Earnings',   impact: 'HIGH',   actual: null,    forecast: '$1.84 EPS', previous: '$1.72 EPS', description: 'Alphabet quarterly earnings. Search ad revenue and YouTube performance.', affectedSectors: ['Technology','Entertainment'] },
  { id: 18, date: d(20), time: 'AMC',   title: 'META Earnings Q2',             category: 'Earnings',   impact: 'HIGH',   actual: null,    forecast: '$4.70 EPS', previous: '$4.36 EPS', description: 'Meta Platforms quarterly results. Ad revenue and Reality Labs in focus.', affectedSectors: ['Technology','Entertainment'] },
  { id: 19, date: d(21), time: '08:30', title: 'Initial Jobless Claims',        category: 'Employment', impact: 'LOW',    actual: null,    forecast: '222K', previous: '220K', description: 'Weekly unemployment insurance filings.', affectedSectors: ['Banking'] },
  { id: 20, date: d(22), time: '08:30', title: 'PCE Price Index',               category: 'Inflation',  impact: 'HIGH',   actual: null,    forecast: '2.6%', previous: '2.7%', description: 'Personal Consumption Expenditures - the Fed preferred inflation gauge.', affectedSectors: ['Banking','Technology'] },
  { id: 21, date: d(22), time: 'AMC',   title: 'TSLA Earnings Q2',             category: 'Earnings',   impact: 'HIGH',   actual: null,    forecast: '$0.51 EPS', previous: '$0.45 EPS', description: 'Tesla quarterly earnings. Delivery numbers and energy business growth.', affectedSectors: ['Auto/EV','Energy'] },
  // Week 5
  { id: 22, date: d(26), time: '14:00', title: 'Fed Beige Book Release',        category: 'Fed Events', impact: 'MEDIUM', actual: null,    forecast: null,    previous: null,   description: 'Summary of economic conditions from each Fed district.', affectedSectors: ['Banking'] },
  { id: 23, date: d(27), time: '08:30', title: 'Durable Goods Orders',          category: 'Industry',   impact: 'MEDIUM', actual: null,    forecast: '+0.6%',previous: '+0.9%', description: 'Monthly measure of orders for durable manufactured goods.', affectedSectors: ['Auto/EV','Technology'] },
  { id: 24, date: d(28), time: '08:30', title: 'Initial Jobless Claims',        category: 'Employment', impact: 'LOW',    actual: null,    forecast: '219K', previous: '222K', description: 'Weekly unemployment filings.', affectedSectors: ['Banking'] },
  { id: 25, date: d(29), time: '08:30', title: 'Non-Farm Payrolls (Next Month)',category: 'Employment', impact: 'HIGH',   actual: null,    forecast: '190K', previous: '185K', description: 'Monthly employment report — most market-moving data point.', affectedSectors: ['Banking','Technology','Consumer'] },
  // Week 6-8
  { id: 26, date: d(33), time: '08:30', title: 'CPI Release (Next Month)',      category: 'Inflation',  impact: 'HIGH',   actual: null,    forecast: '3.0%', previous: '3.1%', description: 'Consumer inflation data for previous month.', affectedSectors: ['Banking','Technology','Consumer'] },
  { id: 27, date: d(35), time: '09:00', title: 'Fed Governor Speech',           category: 'Fed Events', impact: 'MEDIUM', actual: null,    forecast: null,    previous: null,   description: 'Remarks from a voting member of the Federal Reserve.', affectedSectors: ['Banking'] },
  { id: 28, date: d(40), time: '14:00', title: 'FOMC Minutes Release',          category: 'Fed Events', impact: 'HIGH',   actual: null,    forecast: null,    previous: null,   description: 'Detailed minutes from the previous FOMC meeting.', affectedSectors: ['Banking','Technology','Fintech'] },
  { id: 29, date: d(45), time: '08:30', title: 'Retail Sales (Monthly)',        category: 'Consumer',   impact: 'MEDIUM', actual: null,    forecast: '+0.5%',previous: '+0.4%', description: 'Monthly retail sales data.', affectedSectors: ['Consumer','E-Commerce'] },
  { id: 30, date: d(50), time: '08:30', title: 'GDP Report (Second Estimate)',  category: 'GDP',        impact: 'HIGH',   actual: null,    forecast: '2.3%', previous: '2.4%', description: 'Second estimate of quarterly GDP growth.', affectedSectors: ['Banking','Technology','Consumer'] },
];

const CATEGORIES = ['All', 'Fed Events', 'Employment', 'Inflation', 'GDP', 'Earnings'];
const IMPACTS    = ['All', 'HIGH', 'MEDIUM', 'LOW', 'Earnings'];

const impactMeta = {
  HIGH:   { bg: 'bg-accentRed/15',    text: 'text-accentRed',   border: 'border-accentRed/40',   dot: 'bg-accentRed'   },
  MEDIUM: { bg: 'bg-yellow-400/10',   text: 'text-yellow-400',  border: 'border-yellow-400/30',  dot: 'bg-yellow-400'  },
  LOW:    { bg: 'bg-slate-700/30',     text: 'text-slate-400',   border: 'border-slate-600/40',   dot: 'bg-slate-500'   },
};

const categoryIcon = (cat) => {
  switch (cat) {
    case 'Fed Events':  return '🏦';
    case 'Employment':  return '👷';
    case 'Inflation':   return '📈';
    case 'GDP':         return '🌐';
    case 'Earnings':    return '💰';
    default:            return '📅';
  }
};

// ─── Countdown hook ───────────────────────────────────────────────────────────
const useCountdown = (targetDate) => {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const calc = () => {
      const diff = targetDate - new Date();
      if (diff <= 0) { setTimeLeft('Now'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setTimeLeft(`${d}d ${h}h ${m}m`);
      else if (h > 0) setTimeLeft(`${h}h ${m}m ${s}s`);
      else setTimeLeft(`${m}m ${s}s`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return timeLeft;
};

// ─── Countdown Card ────────────────────────────────────────────────────────
const CountdownCard = ({ event }) => {
  const countdown = useCountdown(event.date);
  const m = impactMeta[event.impact];
  return (
    <div className={`glass-panel rounded-xl border p-4 neon-glow-card flex-shrink-0 w-64 ${m.border}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-lg">{categoryIcon(event.category)}</span>
        <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${m.bg} ${m.text} ${m.border}`}>
          {event.impact}
        </span>
      </div>
      <p className="text-xs font-black text-white leading-snug">{event.title}</p>
      <p className="text-[10px] text-slate-500 mt-1">
        {event.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {event.time}
      </p>
      <div className={`mt-3 font-mono text-sm font-black ${m.text}`}>
        ⏱ {countdown}
      </div>
      {event.impact === 'HIGH' && (
        <div className="mt-2 flex items-center gap-1 text-[9px] text-yellow-400">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          High Volatility Expected
        </div>
      )}
    </div>
  );
};

// ─── Event Detail Panel ───────────────────────────────────────────────────────
const EventDetail = ({ event, onClose }) => {
  const m = impactMeta[event.impact];
  return (
    <div className="glass-panel rounded-2xl border border-white/10 p-6 animate-slide-in-right">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{categoryIcon(event.category)}</span>
          <div>
            <h3 className="text-sm font-black text-white">{event.title}</h3>
            <p className="text-[10px] text-slate-500">{event.category}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors cursor-pointer text-lg leading-none">×</button>
      </div>

      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black mb-4 ${m.bg} ${m.text} ${m.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
        {event.impact} IMPACT
      </div>

      {/* Data table */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Previous', value: event.previous, color: 'text-slate-300' },
          { label: 'Forecast', value: event.forecast,  color: 'text-cyberTeal' },
          { label: 'Actual',   value: event.actual,    color: event.actual ? 'text-accentGreen' : 'text-slate-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
            <p className="text-[9px] text-slate-500 font-bold uppercase">{label}</p>
            <p className={`text-sm font-black mt-1 ${color}`}>{value || '—'}</p>
          </div>
        ))}
      </div>

      {/* Description */}
      <p className="text-xs text-slate-400 leading-relaxed mb-4">{event.description}</p>

      {/* Affected sectors */}
      {event.affectedSectors?.length > 0 && (
        <div>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-2">Affected Sectors</p>
          <div className="flex flex-wrap gap-1.5">
            {event.affectedSectors.map(s => (
              <span key={s} className="px-2 py-0.5 bg-cyberBlue/10 border border-cyberBlue/30 rounded-full text-[9px] text-cyberBlue font-bold">{s}</span>
            ))}
          </div>
        </div>
      )}

      {event.impact === 'HIGH' && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-accentRed/10 border border-accentRed/25 rounded-xl">
          <svg className="w-4 h-4 text-accentRed flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-[10px] text-accentRed font-semibold">High-impact event. Significant price volatility expected. Review positions before release.</p>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const EconomicCalendar = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedImpact,   setSelectedImpact]   = useState('All');
  const [selectedEvent,    setSelectedEvent]     = useState(null);
  const [weekOffset,       setWeekOffset]        = useState(0);

  // Compute week start (Monday)
  const getWeekStart = (offset) => {
    const d = new Date(now);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff + offset * 7);
    d.setHours(0,0,0,0);
    return d;
  };

  const weekStart = getWeekStart(weekOffset);
  const weekDays  = Array.from({ length: 5 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    return day;
  });

  const filteredEvents = EVENTS.filter(e => {
    if (selectedCategory !== 'All' && e.category !== selectedCategory) return false;
    if (selectedImpact !== 'All' && e.impact !== selectedImpact && !(selectedImpact === 'Earnings' && e.category === 'Earnings')) return false;
    return true;
  });

  const eventsForDay = (dayDate) =>
    filteredEvents.filter(e => {
      const ed = new Date(e.date);
      return ed.getFullYear() === dayDate.getFullYear() &&
             ed.getMonth()    === dayDate.getMonth() &&
             ed.getDate()     === dayDate.getDate();
    });

  // Upcoming high-impact events (next 7 days)
  const upcoming = EVENTS
    .filter(e => e.impact === 'HIGH' && e.date > new Date())
    .sort((a, b) => a.date - b.date)
    .slice(0, 4);

  // Earnings next 2 weeks
  const earningsEnd = new Date(now);
  earningsEnd.setDate(earningsEnd.getDate() + 14);
  const earnings = EVENTS.filter(e => e.category === 'Earnings' && e.date >= now && e.date <= earningsEnd);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 animate-fade-in">
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accentGreen/15 border border-accentGreen/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-accentGreen" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Economic Calendar</h1>
              <p className="text-xs text-slate-500">
                {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Week nav */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:border-white/20 transition-all cursor-pointer"
            >‹</button>
            <span className="text-xs font-bold text-white px-3">
              {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
              {weekDays[4].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <button
              onClick={() => setWeekOffset(w => w + 1)}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:border-white/20 transition-all cursor-pointer"
            >›</button>
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 text-[10px] font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
            >Today</button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex flex-wrap gap-1.5">
            {IMPACTS.map(imp => (
              <button
                key={imp}
                onClick={() => setSelectedImpact(imp)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                  selectedImpact === imp
                    ? imp === 'HIGH'   ? 'bg-accentRed text-white border-accentRed'
                    : imp === 'MEDIUM' ? 'bg-yellow-400 text-[#0B0F19] border-yellow-400'
                    : imp === 'Earnings' ? 'bg-accentGreen text-white border-accentGreen'
                    : 'bg-cyberBlue text-white border-cyberBlue'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >{imp}</button>
            ))}
          </div>
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-300 focus:outline-none focus:border-cyberBlue/50"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* ── UPCOMING HIGH IMPACT HIGHLIGHTS ─────────────────────────────── */}
        {upcoming.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3">🔴 Upcoming High-Impact Events</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {upcoming.map(e => <CountdownCard key={e.id} event={e} />)}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── CALENDAR GRID ───────────────────────────────────────────────── */}
          <div className={selectedEvent ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="grid grid-cols-5 gap-2">
              {weekDays.map(day => {
                const dayEvents  = eventsForDay(day);
                const isToday    = day.toDateString() === now.toDateString();
                return (
                  <div key={day.toISOString()} className="flex flex-col gap-1">
                    {/* Day header */}
                    <div className={`text-center py-2 rounded-lg border mb-1 ${
                      isToday
                        ? 'bg-cyberBlue/20 border-cyberBlue/50'
                        : 'bg-white/3 border-white/5'
                    }`}>
                      <p className={`text-[9px] font-black uppercase tracking-wider ${isToday ? 'text-cyberBlue' : 'text-slate-500'}`}>
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <p className={`text-sm font-black ${isToday ? 'text-white' : 'text-slate-400'}`}>
                        {day.getDate()}
                      </p>
                    </div>

                    {/* Events */}
                    {dayEvents.length === 0 ? (
                      <div className="flex-1 min-h-[60px] flex items-center justify-center">
                        <span className="text-[9px] text-slate-700">—</span>
                      </div>
                    ) : (
                      dayEvents.map(ev => {
                        const m = impactMeta[ev.impact];
                        return (
                          <button
                            key={ev.id}
                            onClick={() => setSelectedEvent(ev.id === selectedEvent?.id ? null : ev)}
                            className={`w-full text-left p-2 rounded-lg border text-[9px] transition-all cursor-pointer hover:scale-[1.02] ${m.border} ${m.bg} ${
                              selectedEvent?.id === ev.id ? 'ring-1 ring-cyberBlue/50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-1 mb-0.5">
                              <span className={`w-1.5 h-1.5 rounded-full mt-0.5 flex-shrink-0 ${m.dot}`} />
                              <span className={`font-bold leading-tight ${m.text}`}>{ev.title}</span>
                            </div>
                            <span className="text-slate-500 font-mono">{ev.time}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── EVENT DETAIL PANEL ──────────────────────────────────────────── */}
          {selectedEvent && (
            <div className="lg:col-span-1">
              <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />
            </div>
          )}
        </div>

        {/* ── EARNINGS CALENDAR ─────────────────────────────────────────────── */}
        {earnings.length > 0 && (
          <div className="mt-8">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3">💰 Upcoming Earnings — Next 2 Weeks</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {earnings.map(e => {
                const ticker = e.title.split(' ')[0];
                const colors = ['bg-cyberBlue','bg-cyberTeal','bg-accentGreen','bg-purple-500','bg-orange-500','bg-pink-500'];
                const ci = ticker.charCodeAt(0) % colors.length;
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelectedEvent(e)}
                    className="glass-panel rounded-xl border border-white/5 p-4 text-center hover:border-cyberBlue/30 neon-glow-card transition-all cursor-pointer group"
                  >
                    <div className={`w-10 h-10 ${colors[ci]} rounded-xl flex items-center justify-center mx-auto mb-2 text-white font-black text-sm`}>
                      {ticker[0]}
                    </div>
                    <p className="text-xs font-black text-white">{ticker}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      {e.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-[9px] text-slate-500">{e.time}</p>
                    <div className="mt-2 pt-2 border-t border-white/5">
                      <p className="text-[9px] text-slate-400">Forecast: <span className="text-cyberTeal font-bold">{e.forecast}</span></p>
                      <p className="text-[9px] text-slate-500">Prev: {e.previous}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EconomicCalendar;
