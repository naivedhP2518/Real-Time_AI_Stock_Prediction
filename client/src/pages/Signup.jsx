import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [validationError, setValidationError] = useState('');
  const { register, user, error, loading, clearError } = useContext(AuthContext);
  const navigate = useNavigate();

  const { name, email, password, confirmPassword } = formData;

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

    // Validations
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setValidationError('Please fill in all requested credentials.');
      return;
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please input a valid email structure.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must contain at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match. Check spelling.');
      return;
    }

    const outcome = await register(name, email, password);
    if (outcome.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50 dark:from-[#0B0F19] dark:via-[#0E1528] dark:to-[#0B0F19] relative overflow-hidden transition-colors duration-300">
      {/* Visual cyber backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyberBlue/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyberTeal/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Column: Platform Pitch Banner */}
        <div className="lg:col-span-6 hidden lg:flex flex-col text-slate-900 dark:text-slate-100 pr-8 transition-colors duration-300">
          <div className="inline-flex items-center space-x-2 bg-cyberBlue/10 border border-cyberBlue/20 px-3.5 py-1.5 rounded-full w-fit mb-6 animate-pulse">
            <svg className="w-4 h-4 text-cyberBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
            <span className="text-xs font-semibold text-cyberTeal tracking-wide uppercase">Next-Gen Stock Intelligence</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl leading-tight text-slate-900 dark:text-white transition-colors duration-300">
            Unlock High-Yield <br />
            <span className="bg-gradient-to-r from-cyberBlue via-cyberTeal to-accentGreen bg-clip-text text-transparent">
              AI Market Predictions
            </span>
          </h1>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed transition-colors duration-300">
            Gain the competitive edge with advanced algorithmic pattern forecasts, real-time risk charts, and automated watchlist modeling, all locked securely behind state-of-the-art authentication.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 p-1 bg-accentGreen/10 rounded-md border border-accentGreen/20 mt-1">
                <svg className="w-5 h-5 text-accentGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 transition-colors duration-300">Real-Time Forecast Feeds</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 transition-colors duration-300">Instantly stream model predictions and volatility indexes.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 p-1 bg-cyberBlue/10 rounded-md border border-cyberBlue/20 mt-1">
                <svg className="w-5 h-5 text-cyberBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 transition-colors duration-300">Zero-Leak JWT Safeguards</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 transition-colors duration-300">Robust salted bcrypt password cryptography & session token encryption.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Glassmorphic Signup Form */}
        <div className="lg:col-span-6 w-full">
          <div className="glass-panel-glow rounded-2xl p-8 sm:p-10 border border-slate-200/50 dark:border-white/10 relative">
            <div className="text-center sm:text-left mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors duration-300">Create Account</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 transition-colors duration-300">
                Join the quantum stock analysis feed.
              </p>
            </div>

            {/* Error notifications */}
            {(validationError || error) && (
              <div className="bg-accentRed/10 border border-accentRed/30 text-accentRed rounded-xl p-3.5 text-sm mb-5 flex items-start space-x-2 animate-shake">
                <svg className="w-5 h-5 text-accentRed flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                </svg>
                <div className="flex-1">
                  <span className="font-semibold">Oops!</span> {validationError || error}
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

            <form className="space-y-4" onSubmit={handleSubmit}>
              
              {/* Name field */}
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors duration-300">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 dark:bg-black/35 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyberBlue focus:ring-1 focus:ring-cyberBlue transition-all text-sm"
                    placeholder="Enter name"
                  />
                </div>
              </div>

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
                <label htmlFor="password" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors duration-300">
                  Password
                </label>
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
                    required
                    value={password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 dark:bg-black/35 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyberBlue focus:ring-1 focus:ring-cyberBlue transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Confirm Password field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 transition-colors duration-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </span>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 dark:bg-black/35 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyberBlue focus:ring-1 focus:ring-cyberBlue transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Action Button */}
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
                    <span>Establishing User Record...</span>
                  </div>
                ) : (
                  'Create Secure Account'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 transition-colors duration-300">
                Already have a membership?{' '}
                <Link to="/login" className="font-semibold text-cyberTeal hover:text-cyberTeal/80 transition-colors">
                  Log In instead
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
