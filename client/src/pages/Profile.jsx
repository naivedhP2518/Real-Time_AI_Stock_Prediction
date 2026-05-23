import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorProfile, setErrorProfile] = useState('');

  // Call the private API on mount to verify backend JWT validation works
  useEffect(() => {
    const fetchPrivateProfile = async () => {
      try {
        const { data } = await API.get('/auth/profile');
        setProfileData(data);
      } catch (err) {
        console.error('Error fetching profile from private API:', err);
        setErrorProfile('Failed to sync data with secure endpoint. Token might be invalid.');
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchPrivateProfile();
  }, []);

  // Parse JWT details for visual verification
  const getDecryptedClaims = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const claims = getDecryptedClaims();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 relative transition-colors duration-300">
      {/* Absolute visual ambient glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyberBlue/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="flex items-center space-x-3 mb-8">
        <div className="p-2.5 bg-cyberBlue/10 border border-cyberBlue/20 rounded-xl">
          <svg className="w-6 h-6 text-cyberBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white transition-colors duration-300">Security & Profile</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 transition-colors duration-300">JWT Auth claims and session details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* LEFT COLUMN: Main User Profile Card */}
        <div className="md:col-span-6 space-y-6">
          <div className="glass-panel-glow rounded-2xl p-6 sm:p-8 border border-slate-200/50 dark:border-white/5 relative">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyberBlue to-cyberTeal flex items-center justify-center font-bold text-xl text-white shadow-lg">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none transition-colors duration-300">{user?.name}</h3>
                <p className="text-xs text-cyberTeal mt-1.5 font-semibold uppercase tracking-wider flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyberTeal mr-1.5 animate-pulse"></span>
                  Verified Session Account
                </p>
              </div>
            </div>

            {loadingProfile ? (
              <div className="space-y-4 py-4 animate-pulse">
                <div className="h-4 bg-slate-200/50 dark:bg-white/5 rounded w-1/3"></div>
                <div className="h-8 bg-slate-200/50 dark:bg-white/5 rounded"></div>
                <div className="h-4 bg-slate-200/50 dark:bg-white/5 rounded w-1/2"></div>
                <div className="h-8 bg-slate-200/50 dark:bg-white/5 rounded"></div>
              </div>
            ) : errorProfile ? (
              <div className="bg-accentRed/10 border border-accentRed/20 text-accentRed text-xs p-3.5 rounded-xl flex items-center space-x-2">
                <svg className="w-4 h-4 text-accentRed flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{errorProfile}</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-slate-200/50 dark:bg-white/5 rounded-xl border border-slate-300/30 dark:border-white/5 transition-colors duration-300">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest block transition-colors duration-300">
                    REGISTERED EMAIL
                  </span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 block transition-colors duration-300">
                    {profileData?.email}
                  </span>
                </div>

                <div className="p-3 bg-slate-200/50 dark:bg-white/5 rounded-xl border border-slate-300/30 dark:border-white/5 transition-colors duration-300">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest block transition-colors duration-300">
                    DATABASE KEY (_id)
                  </span>
                  <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 mt-1 block select-all transition-colors duration-300">
                    {profileData?._id}
                  </span>
                </div>

                <div className="p-3 bg-slate-200/50 dark:bg-white/5 rounded-xl border border-slate-300/30 dark:border-white/5 transition-colors duration-300">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest block transition-colors duration-300">
                    ACCOUNT CREATED ON
                  </span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 block transition-colors duration-300">
                    {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: JWT Token Decryption Panel */}
        <div className="md:col-span-6 space-y-6">
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-white/5 transition-colors duration-300">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase mb-1 transition-colors duration-300">
              Parsed Token Payload
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-500 mb-4 transition-colors duration-300">
              Real-time deserialized claim attributes.
            </p>

            {claims ? (
              <div className="space-y-3.5">
                <div className="p-3.5 bg-slate-100 dark:bg-black/45 border border-slate-200 dark:border-white/5 rounded-xl font-mono text-xs text-slate-800 dark:text-slate-300 select-all overflow-x-auto whitespace-pre-wrap transition-colors duration-300">
                  {JSON.stringify(claims, null, 2)}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-200 dark:border-white/5 pb-2 transition-colors duration-300">
                    <span className="text-slate-600 dark:text-slate-400 font-medium transition-colors duration-300">Issuer ID (claims.id)</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold select-all font-mono transition-colors duration-300">{claims.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-white/5 pb-2 transition-colors duration-300">
                    <span className="text-slate-600 dark:text-slate-400 font-medium transition-colors duration-300">Issued At (claims.iat)</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold font-mono transition-colors duration-300">
                      {new Date(claims.iat * 1000).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-600 dark:text-slate-400 font-medium transition-colors duration-300">Expires At (claims.exp)</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold font-mono text-cyberTeal transition-colors duration-300">
                      {new Date(claims.exp * 1000).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-400/10 border border-yellow-400/20 text-yellow-500 text-xs p-3.5 rounded-xl text-center">
                No token claims found in localStorage. Please authorize your session again.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
