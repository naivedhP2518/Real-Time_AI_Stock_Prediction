import React, { useState, useEffect, useRef, useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { io } from 'socket.io-client';
import API from '../services/api';

const DashboardLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeToastAlert, setActiveToastAlert] = useState(null);
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'NVDA reached a peak of $924.80!', time: '2 mins ago', read: false },
    { id: 2, message: 'AI Forecast updated for TSLA (Strong Buy)', time: '1 hour ago', read: false },
    { id: 3, message: 'Solana is surging today, up over 7%', time: '3 hours ago', read: true },
  ]);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Socket.io Price Alert trigger listener
  useEffect(() => {
    if (!user || !user._id) return;

    console.log(`[Alert System Client] Connecting websocket channels for user: ${user.name}`);
    const socket = io('http://localhost:5000');

    socket.on(`alert-triggered-${user._id}`, (data) => {
      console.log('[Alert System Client] Target Crossed:', data);
      setActiveToastAlert(data);
      
      // Add to notifications dropdown list
      setNotifications(prev => [
        {
          id: Date.now(),
          message: data.message,
          time: 'Just now',
          read: false
        },
        ...prev
      ]);
      
      // Auto dismiss after 8 seconds
      setTimeout(() => {
        setActiveToastAlert(prev => prev && prev._id === data._id ? null : prev);
      }, 8000);
    });

    return () => {
      console.log('[Alert System Client] Closing socket connections...');
      socket.disconnect();
    };
  }, [user]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSuggestions([]);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search suggestions
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setIsSearching(true);
        try {
          const { data } = await API.get(`/stocks/search/${searchQuery}`);
          setSuggestions(data);
        } catch (error) {
          console.error('Error fetching stock suggestions:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSuggestionClick = (symbol) => {
    setSearchQuery('');
    setSuggestions([]);
    navigate(`/dashboard?symbol=${symbol}`);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const markAllNotificationsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      )
    },
    {
      name: 'Portfolio',
      path: '/portfolio',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      name: 'Markets',
      path: '/markets',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      )
    },
    {
      name: 'Watchlist',
      path: '/watchlist',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    },
    {
      name: 'Predictions',
      path: '/predictions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      name: 'Technical Hub',
      path: '/analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2M4 21h16a2 2 0 002-2V5a2 2 0 00-2-2H4a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    ...(user && user.isAdmin ? [{
      name: 'Admin Panel',
      path: '/admin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      )
    }] : [])
  ];                  

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 transition-colors duration-300 overflow-hidden">
      
      {/* 1. SIDEBAR FOR DESKTOP */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 glass-panel border-r border-slate-200 dark:border-white/5 h-full shrink-0 relative z-30 transition-all duration-300">
        {/* Brand Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-white/5 gap-3">
          <div className="bg-gradient-to-tr from-cyberBlue to-cyberTeal p-2 rounded-lg shadow-lg shadow-cyberBlue/10">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            </svg>
          </div>
          <span className="text-md font-bold tracking-wider bg-gradient-to-r from-slate-800 via-slate-700 to-slate-500 dark:from-white dark:via-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
            QUANTUM<span className="text-cyberBlue font-black">STOCKS</span>
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isItemActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
                  isItemActive
                    ? 'bg-gradient-to-r from-cyberBlue/10 to-cyberTeal/5 text-cyberBlue border-l-4 border-cyberBlue shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div className="p-4 border-t border-slate-200 dark:border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3.5 px-4 py-3 text-sm font-semibold text-accentRed hover:bg-accentRed/10 rounded-xl transition-all duration-300 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MOBILE SIDEBAR MOBILE OVERLAY DRAWER */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 glass-panel border-r border-slate-200 dark:border-white/5 flex flex-col h-full transform lg:hidden transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-cyberBlue to-cyberTeal p-2 rounded-lg shadow-lg shadow-cyberBlue/10">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
            <span className="text-md font-bold tracking-wider bg-gradient-to-r from-slate-800 via-slate-700 to-slate-500 dark:from-white dark:via-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
              QUANTUM<span className="text-cyberBlue font-black">STOCKS</span>
            </span>
          </div>
          <button onClick={toggleSidebar} className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isItemActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={toggleSidebar}
                className={`flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
                  isItemActive
                    ? 'bg-gradient-to-r from-cyberBlue/10 to-cyberTeal/5 text-cyberBlue border-l-4 border-cyberBlue shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-white/5">
          <button
            onClick={() => {
              toggleSidebar();
              handleLogout();
            }}
            className="w-full flex items-center space-x-3.5 px-4 py-3 text-sm font-semibold text-accentRed hover:bg-accentRed/10 rounded-xl transition-all duration-300 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN APP CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* TOP NAVBAR */}
        <header className="h-16 w-full glass-panel border-b border-slate-200 dark:border-white/5 px-4 sm:px-6 flex items-center justify-between shrink-0 relative z-30 transition-all duration-300">
          
          {/* Left Area: Mobile Menu Toggle & Title */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg bg-slate-200/50 dark:bg-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden sm:block">
              <span className="text-xs text-cyberBlue dark:text-cyberTeal font-bold tracking-wider uppercase"></span>
            </div>
          </div>

          {/* Search Bar - Live Suggestions */}
          <div ref={searchRef} className="flex-1 max-w-md mx-4 relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Search stock symbol or name (e.g. AAPL, TSLA)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-200/50 dark:bg-black/35 border border-slate-300/30 dark:border-white/5 focus:outline-none focus:border-cyberBlue/60 text-slate-900 dark:text-slate-100 transition-all shadow-inner placeholder-slate-400 dark:placeholder-slate-500"
              />
              <span className="absolute left-3.5 top-2.5 text-slate-400 dark:text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              {isSearching && (
                <span className="absolute right-3.5 top-2.5">
                  <svg className="animate-spin h-4 w-4 text-cyberTeal" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </span>
              )}
            </div>

            {/* Live Suggestions Overlay Panel */}
            {suggestions.length > 0 && (
              <div className="absolute top-12 left-0 right-0 glass-panel border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 text-xs">
                {suggestions.map((stock) => (
                  <div
                    key={stock.symbol}
                    onClick={() => handleSuggestionClick(stock.symbol)}
                    className="p-3.5 flex justify-between items-center hover:bg-slate-200/50 dark:hover:bg-white/5 cursor-pointer border-b border-slate-200/30 dark:border-white/5 last:border-0 transition-colors"
                  >
                    <div>
                      <span className="font-extrabold text-slate-950 dark:text-white">{stock.symbol}</span>
                      <span className="text-slate-500 dark:text-slate-400 ml-2">{stock.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 dark:text-white">${stock.price.toFixed(2)}</span>
                      <span className={`block font-semibold text-[10px] ${stock.change >= 0 ? 'text-accentGreen' : 'text-accentRed'}`}>
                        {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Controls: Theme Toggle, Notifications, Profile */}
          <div className="flex items-center space-x-3.5">
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-200/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-cyberBlue dark:hover:text-cyberTeal transition-all duration-300 cursor-pointer shadow-sm active:scale-95"
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? (
                <svg className="w-4.5 h-4.5 text-amber-500 animate-[spin_40s_linear_infinite]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
              ) : (
                <svg className="w-4.5 h-4.5 text-slate-600 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              )}
            </button>

            {/* Notifications Popover Toggle */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg bg-slate-200/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-cyberBlue dark:hover:text-cyberTeal transition-all duration-300 cursor-pointer shadow-sm relative active:scale-95"
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accentRed text-[9px] font-black text-white rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 glass-panel border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 text-xs">
                  <div className="p-4 bg-slate-200/40 dark:bg-black/35 border-b border-slate-200/30 dark:border-white/5 flex justify-between items-center">
                    <span className="font-extrabold text-slate-900 dark:text-white">Notifications</span>
                    {unreadNotifCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-[10px] text-cyberBlue dark:text-cyberTeal font-bold hover:underline cursor-pointer"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-200/30 dark:divide-white/5 max-h-64 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3.5 transition-colors ${!notif.read ? 'bg-cyberBlue/5' : 'hover:bg-slate-200/10 dark:hover:bg-white/5'}`}
                      >
                        <p className="text-slate-800 dark:text-slate-200 leading-normal">{notif.message}</p>
                        <span className="block text-[9px] text-slate-500 mt-1">{notif.time}</span>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                        All caught up!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Bubble Avatar */}
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyberBlue to-cyberTeal flex items-center justify-center font-bold text-white shadow-md text-sm cursor-pointer select-none">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden md:inline text-xs font-semibold text-slate-700 dark:text-slate-300">
                {user?.name || 'User'}
              </span>
            </div>

          </div>

        </header>

        {/* WORKSPACE CONTENT AREA WITH SCROLLABILITY */}
        <main className="flex-grow w-full overflow-y-auto bg-slate-50 dark:bg-[#0B0F19] transition-colors duration-300">
          <div className="w-full">
            <Outlet />
          </div>
        </main>

      </div>

      {/* Real-time price trigger alert toast */}
      {activeToastAlert && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel border-l-4 border-l-accentGreen rounded-2xl p-5 shadow-2xl shadow-accentGreen/10 max-w-sm animate-bounce w-80">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-accentGreen/10 rounded-full flex items-center justify-center border border-accentGreen/20 text-accentGreen flex-shrink-0 relative">
                <span className="w-1.5 h-1.5 bg-accentGreen rounded-full absolute animate-ping"></span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 0 1-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                </svg>
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white block">Price Target Hit!</span>
                <span className="text-[10px] text-slate-500 font-bold tracking-wide uppercase font-mono mt-0.5">{activeToastAlert.symbol} crossed {activeToastAlert.type}</span>
              </div>
            </div>
            <button 
              onClick={() => setActiveToastAlert(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 cursor-pointer"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed font-semibold mt-3">
            {activeToastAlert.message}
          </p>
        </div>
      )}

    </div>
  );
};

export default DashboardLayout;
