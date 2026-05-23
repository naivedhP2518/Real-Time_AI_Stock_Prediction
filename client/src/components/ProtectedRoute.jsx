import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Route guard which redirects unauthorized users back to the login page.
 * Displays a premium dark layout skeleton while verifying tokens.
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0F19] text-slate-100">
        <div className="relative w-16 h-16">
          {/* Animated gradient spinning borders */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-cyberBlue border-r-cyberTeal animate-spin"></div>
        </div>
        <p className="mt-6 text-sm font-medium tracking-widest text-slate-400 uppercase animate-pulse">
          Decrypting Session Key...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
