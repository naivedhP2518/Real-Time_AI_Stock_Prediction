import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [validationError, setValidationError] = useState('');
  const { login, user, error, loading, clearError } = useContext(AuthContext);
  const navigate = useNavigate();

  const { email, password } = formData;

  useEffect(() => {
    clearError();
    setValidationError('');
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    clearError();

    if (!email.trim() || !password) {
      setValidationError('Please input all requested login credentials.');
      return;
    }

    const outcome = await login(email, password);
    if (outcome.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50 dark:from-[#0B0F19] dark:via-[#0E1528] dark:to-[#0B0F19] relative overflow-hidden transition-colors duration-300">
      {/* Background gradients glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyberBlue/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyberTeal/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Column: Cyber Financial Stats Banner */}
        <div className="lg:col-span-6 hidden lg:flex flex-col text-slate-900 dark:text-slate-100 pr-8 transition-colors duration-300">
          <div className="inline-flex items-center space-x-2 bg-cyberTeal/10 border border-cyberTeal/20 px-3.5 py-1.5 rounded-full w-fit mb-6">
            <span className="w-2 h-2 rounded-full bg-accentGreen animate-ping"></span>
            <span className="text-xs font-semibold text-cyberTeal tracking-wide uppercase">AI Model: Online</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl leading-tight text-slate-900 dark:text-white transition-colors duration-300">
            Log In to Access <br />
            <span className="bg-gradient-to-r from-cyberBlue via-cyberTeal to-accentGreen bg-clip-text text-transparent">
              High-Speed Signals
            </span>
          </h1>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed transition-colors duration-300">
            Authorized portal to the Quantum Stocks analysis platform. Sign in to view real-time volatility graphs, stock predictions, and customize your trading watchlists.
          </p>

          {/* Quick Mock Stock Ticker Widgets */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 transition-colors duration-300">AAPL.US</span>
                <span className="text-xs font-bold text-accentGreen">+3.42%</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-1.5 transition-colors duration-300">$189.84</p>
              <div className="text-[10px] text-cyberTeal font-medium mt-1">▲ AI Recommendation: BUY</div>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 transition-colors duration-300">TSLA.US</span>
                <span className="text-xs font-bold text-accentGreen">+5.89%</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-1.5 transition-colors duration-300">$246.50</p>
              <div className="text-[10px] text-cyberTeal font-medium mt-1">▲ AI Recommendation: BUY</div>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-white/5 col-span-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 transition-colors duration-300">GLOBAL STOCK VOLATILITY INDEX (VIX)</span>
                <span className="text-xs font-bold text-accentRed">-2.40%</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-300 mt-1 transition-colors duration-300">System Sentiment: Extremely Bullish</p>
            </div>
          </div>
        </div>

        {/* Right Column: Glassmorphic Login Form */}
        <div className="lg:col-span-6 w-full">
          <div className="glass-panel-glow rounded-2xl p-8 sm:p-10 border border-slate-200/50 dark:border-white/10 relative">
            <div className="text-center sm:text-left mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors duration-300">Welcome Back</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 transition-colors duration-300">
                Authenticate to restore your quantum dashboard session.
              </p>
            </div>

            {/* Error alerts */}
            {(validationError || error) && (
              <div className="bg-accentRed/10 border border-accentRed/30 text-accentRed rounded-xl p-3.5 text-sm mb-5 flex items-start space-x-2 animate-shake">
                <svg className="w-5 h-5 text-accentRed flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                </svg>
                <div className="flex-1">
                  <span className="font-semibold">Access Denied!</span> {validationError || error}
                </div>
                <button
                  type="button"
                  onClick={() => { setValidationError(''); clearError(); }}
                  className="text-accentRed hover:text-accentRed/70 font-semibold focus:outline-none transition-colors"
                >
                  ✕
                </button>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              
              {/* Email field */}
              <div>
                <label htmlFor="email-address" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors duration-300">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 dark:bg-black/35 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyberBlue focus:ring-1 focus:ring-cyberBlue transition-all text-sm"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-500 select-none transition-colors duration-300">
                    Security Level: High
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 dark:bg-black/35 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyberBlue focus:ring-1 focus:ring-cyberBlue transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyberBlue to-cyberTeal hover:from-cyberBlue/90 hover:to-cyberTeal/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyberBlue transition-all duration-300 shadow-lg shadow-cyberBlue/20 hover:shadow-cyberBlue/35 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Verifying Cryptographic Sig...</span>
                  </div>
                ) : (
                  'Authorize Access'
                )}
              </button>
            </form>

            {/* Practical Helper Tip Box */}
            <div className="mt-6 p-3 bg-slate-200/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/5 rounded-xl text-xs text-slate-600 dark:text-slate-400 flex items-start space-x-2 transition-colors duration-300">
              <svg className="w-4 h-4 text-cyberTeal flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <div>
                <span className="font-semibold text-cyberTeal">Testing Note:</span> If you haven't created an account, click "Register" below. The backend uses dynamic password salting for encryption.
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 transition-colors duration-300">
                New to the platform?{' '}
                <Link to="/signup" className="font-semibold text-cyberTeal hover:text-cyberTeal/80 transition-colors">
                  Register new account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
