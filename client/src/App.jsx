import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Markets from './pages/Markets';
import Watchlist from './pages/Watchlist';
import Predictions from './pages/Predictions';
import Profile from './pages/Profile';
import Portfolio from './pages/Portfolio';
import Analytics from './pages/Analytics';
import Admin from './pages/Admin';
import FullscreenChart from './pages/FullscreenChart';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 transition-colors duration-300 selection:bg-cyberBlue/35 selection:text-white">
              <Routes>
                {/* Public Authentication routes */}
                <Route
                  path="/login"
                  element={
                    <>
                      <Navbar />
                      <div className="flex-grow w-full flex flex-col justify-start">
                        <Login />
                      </div>
                    </>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <>
                      <Navbar />
                      <div className="flex-grow w-full flex flex-col justify-start">
                        <Signup />
                      </div>
                    </>
                  }
                />

                {/* Protected Dashboard Workspaces */}
                <Route
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard"   element={<Dashboard />}   />
                  <Route path="/portfolio"   element={<Portfolio />}   />
                  <Route path="/markets"     element={<Markets />}     />
                  <Route path="/watchlist"   element={<Watchlist />}   />
                  <Route path="/predictions" element={<Predictions />} />
                  <Route path="/analytics"   element={<Analytics />}   />
                  <Route path="/profile"     element={<Profile />}     />
                  <Route path="/admin"       element={<Admin />}       />
                </Route>

                {/* Standalone Fullscreen Chart Protected Route */}
                <Route 
                  path="/chart/:symbol" 
                  element={
                    <ProtectedRoute>
                      <FullscreenChart />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/chart" 
                  element={
                    <ProtectedRoute>
                      <FullscreenChart />
                    </ProtectedRoute>
                  } 
                />

                {/* Default fallbacks */}
                <Route path="/"  element={<Navigate to="/dashboard" replace />} />
                <Route path="*"  element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
