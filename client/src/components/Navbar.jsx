import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path
      ? "text-cyberBlue font-semibold border-b-2 border-cyberBlue pb-1"
      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors";
  };

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-black/5 dark:border-white/5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand area */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-gradient-to-tr from-cyberBlue to-cyberTeal p-2 rounded-lg shadow-lg shadow-cyberBlue/10 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
            <span className="text-lg font-bold tracking-wider bg-gradient-to-r from-slate-800 via-slate-700 to-slate-500 dark:from-white dark:via-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
              QUANTUM<span className="text-cyberBlue font-black">STOCKS</span>
            </span>
          </Link>

          {/* Navigation Route & Controls */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-200/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-cyberBlue dark:hover:text-cyberTeal transition-all duration-300 cursor-pointer shadow-sm hover:scale-105 focus:outline-none"
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5 animate-[spin_40s_linear_infinite]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m12.728 12.728A9 9 0 115.636 5.636m12.728 12.728A9 9 0 015.636 5.636"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                </svg>
              )}
            </button>

            {user ? (
              <>
                <Link to="/dashboard" className={isActive('/dashboard')}>
                  Dashboard
                </Link>
                <Link to="/profile" className={isActive('/profile')}>
                  Profile
                </Link>
                <div className="hidden md:flex items-center space-x-2 bg-slate-200/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/10 px-3 py-1.5 rounded-full">
                  <div className="w-2.5 h-2.5 rounded-full bg-accentGreen animate-ping"></div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Live AI Feed</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyberBlue to-cyberTeal flex items-center justify-center font-bold text-white shadow-md">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium text-slate-700 dark:text-slate-300">
                      {user.name}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-slate-200/50 dark:bg-white/5 hover:bg-accentRed/10 border border-slate-300/30 dark:border-white/10 hover:border-accentRed/30 text-slate-700 dark:text-slate-300 hover:text-accentRed px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 shadow-sm"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-cyberBlue to-cyberTeal hover:from-cyberBlue/90 hover:to-cyberTeal/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg shadow-cyberBlue/20 hover:shadow-cyberBlue/35 hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
