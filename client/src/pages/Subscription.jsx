import React, { useState } from 'react';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    color: 'from-slate-500 to-slate-600',
    borderColor: 'border-slate-300 dark:border-white/10',
    badge: '',
    description: 'Perfect for exploring the platform and learning about AI-powered trading.',
    features: [
      { label: '5 Stock Watchlist', included: true },
      { label: 'Basic AI Predictions (LSTM)', included: true },
      { label: 'Live Market Quotes', included: true },
      { label: 'News Feed (10/day)', included: true },
      { label: 'Basic Portfolio Tracking', included: true },
      { label: 'API Access (1,000 calls/mo)', included: true },
      { label: 'Paper Trading', included: false },
      { label: 'Multi-Model AI (8 models)', included: false },
      { label: 'Ensemble AI Forecasting', included: false },
      { label: 'Market Scanner', included: false },
      { label: 'Strategy Builder', included: false },
      { label: 'AI Chat Assistant', included: false },
      { label: 'Custom Indicators', included: false },
      { label: 'Order Flow Analysis', included: false },
      { label: 'Webhook Integrations', included: false },
    ],
    cta: 'Current Plan',
    ctaStyle: 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 cursor-default',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    period: '/month',
    color: 'from-cyberBlue to-cyberTeal',
    borderColor: 'border-cyberBlue/40',
    badge: 'Most Popular',
    description: 'For serious traders who want institutional-grade AI tools and automation.',
    features: [
      { label: 'Unlimited Watchlist', included: true },
      { label: 'All 8 AI Prediction Models', included: true },
      { label: 'Ensemble AI Consensus', included: true },
      { label: 'Live Market Quotes', included: true },
      { label: 'Unlimited News Feed', included: true },
      { label: 'Advanced Portfolio Analytics', included: true },
      { label: 'API Access (10,000 calls/mo)', included: true },
      { label: 'Paper Trading Engine', included: true },
      { label: 'AI Auto-Trading Simulation', included: true },
      { label: 'Market Scanner', included: true },
      { label: 'Strategy Builder + Backtesting', included: true },
      { label: 'AI Chat Trading Assistant', included: true },
      { label: 'Custom Indicator Builder', included: true },
      { label: 'Sector Heatmap', included: true },
      { label: 'Webhook Integrations (5 events)', included: true },
    ],
    cta: 'Upgrade to Pro',
    ctaStyle: 'bg-gradient-to-r from-cyberBlue to-cyberTeal text-white cursor-pointer hover:opacity-90',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$149',
    period: '/month',
    color: 'from-purple-500 to-purple-700',
    borderColor: 'border-purple-500/40',
    badge: 'Institutional',
    description: 'For hedge funds, trading desks, and enterprise teams needing advanced analytics.',
    features: [
      { label: 'Everything in Pro', included: true },
      { label: 'Unlimited API Access', included: true },
      { label: 'Order Flow Analysis', included: true },
      { label: 'Insider Trading Tracker', included: true },
      { label: 'Pattern Recognition AI', included: true },
      { label: 'Smart Portfolio Rebalancer', included: true },
      { label: 'RL Trading Agent Access', included: true },
      { label: 'Economic Calendar (Full)', included: true },
      { label: 'Multi-Market (Crypto/Forex)', included: true },
      { label: 'Enterprise Analytics Suite', included: true },
      { label: 'Team Collaboration (10 seats)', included: true },
      { label: 'Dedicated API Priority', included: true },
      { label: 'Custom Model Training', included: true },
      { label: 'SLA Uptime Guarantee', included: true },
      { label: 'Dedicated Support', included: true },
    ],
    cta: 'Contact Sales',
    ctaStyle: 'bg-gradient-to-r from-purple-600 to-purple-800 text-white cursor-pointer hover:opacity-90',
  },
];

const FAQS = [
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel anytime from your account settings. Your access continues until the end of the billing period.' },
  { q: 'Is paper trading completely virtual?', a: 'Yes. Paper trading uses real-time price data but no real money is involved. It\'s a full simulation environment.' },
  { q: 'How accurate are the AI predictions?', a: 'Our ensemble model achieves 87-93% directional accuracy in backtesting. Live results may vary. Past performance does not guarantee future results.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.' },
  { q: 'Can I use the API for my own trading bot?', a: 'Yes, Pro and Enterprise plans include full API access for external integrations and automation.' },
];

const Subscription = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [openFaq, setOpenFaq] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('free');

  const getPrice = (plan) => {
    if (plan.price === '$0') return '$0';
    const base = parseInt(plan.price.replace('$', ''));
    return billingCycle === 'annual' ? `$${Math.floor(base * 0.75)}` : plan.price;
  };

  return (
    <div className="p-4 sm:p-8 space-y-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <span className="text-xs font-bold text-cyberBlue dark:text-cyberTeal uppercase tracking-widest">Subscription Plans</span>
        <h2 className="text-4xl font-black text-slate-900 dark:text-white">Institutional-Grade AI Trading</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Choose the plan that matches your trading sophistication. Upgrade or downgrade at any time.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-3 bg-slate-100 dark:bg-black/35 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${billingCycle === 'monthly' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${billingCycle === 'annual' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
          >
            Annual
            <span className="bg-accentGreen/15 text-accentGreen text-[9px] px-1.5 py-0.5 rounded font-black">SAVE 25%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`glass-panel rounded-3xl border-2 transition-all duration-300 overflow-hidden relative flex flex-col ${plan.borderColor} ${plan.id === 'pro' ? 'shadow-2xl shadow-cyberBlue/10 scale-105' : ''}`}
          >
            {plan.badge && (
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${plan.color}`} />
            )}
            {plan.badge && (
              <div className={`absolute -top-0 right-6 bg-gradient-to-r ${plan.color} text-white text-[9px] font-black px-3 py-1 rounded-b-xl`}>
                {plan.badge}
              </div>
            )}

            <div className="p-8 flex flex-col flex-1">
              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className={`text-4xl font-black bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>
                    {getPrice(plan)}
                  </span>
                  <span className="text-sm text-slate-400">{plan.price !== '$0' ? (billingCycle === 'annual' ? '/month, billed annually' : plan.period) : plan.period}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">{plan.description}</p>
              </div>

              <div className="flex-1 space-y-2.5 mb-8">
                {plan.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {feat.included ? (
                      <svg className="w-4 h-4 text-accentGreen flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className={`text-xs font-medium ${feat.included ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'}`}>
                      {feat.label}
                    </span>
                  </div>
                ))}
              </div>

              <button className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all ${plan.ctaStyle}`}>
                {plan.cta}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Feature comparison table */}
      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-white/5">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Detailed Feature Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/5">
                <th className="text-left p-4 text-slate-500 font-bold">Feature</th>
                {PLANS.map(p => (
                  <th key={p.id} className="p-4 text-center font-black text-slate-900 dark:text-white">{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['AI Models', '1 (LSTM)', 'All 8 Models', 'All 8 + Custom'],
                ['API Calls/Month', '1,000', '10,000', 'Unlimited'],
                ['Paper Trading', '✕', '✓', '✓'],
                ['Market Scanner', '✕', '✓', '✓'],
                ['AI Chat Assistant', '✕', '✓', '✓'],
                ['Order Flow Analysis', '✕', '✕', '✓'],
                ['Team Seats', '1', '1', 'Up to 10'],
                ['Support', 'Community', 'Email', 'Dedicated'],
              ].map(([feat, ...vals]) => (
                <tr key={feat} className="border-b border-slate-200/50 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/2 transition-colors">
                  <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">{feat}</td>
                  {vals.map((v, i) => (
                    <td key={i} className="p-4 text-center text-slate-700 dark:text-slate-200 font-bold">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQs */}
      <div className="max-w-3xl mx-auto">
        <h3 className="text-xl font-black text-slate-900 dark:text-white text-center mb-8">Frequently Asked Questions</h3>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="glass-panel rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full p-5 text-left flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/3 transition-colors"
              >
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{faq.q}</span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Enterprise CTA */}
      <div className="glass-panel rounded-3xl p-10 border border-purple-500/20 text-center bg-gradient-to-br from-purple-500/5 to-cyberBlue/5">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Need a Custom Enterprise Plan?</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Talk to our team about custom model training, private deployments, and institutional data packages.
        </p>
        <button className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold rounded-2xl cursor-pointer hover:opacity-90 transition-opacity">
          Contact Enterprise Sales →
        </button>
      </div>
    </div>
  );
};

export default Subscription;
