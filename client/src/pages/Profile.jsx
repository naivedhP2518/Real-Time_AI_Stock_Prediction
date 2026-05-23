import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorProfile, setErrorProfile] = useState('');
  
  // Custom Interactive States
  const [copiedField, setCopiedField] = useState(null);
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const [showKeyGenerator, setShowKeyGenerator] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [apiKeys, setApiKeys] = useState([
    {
      id: 1,
      name: 'Primary Terminal Key',
      value: 'sk_live_qts_8f9c2d1e0a7b6c5d4e3f2a1b',
      createdAt: '2026-05-22',
      status: 'active',
      visible: false
    }
  ]);
  
  const [sessions, setSessions] = useState([
    {
      id: 1,
      device: 'Chrome on Windows 11',
      ip: '192.168.1.104',
      location: 'Mumbai, India',
      status: 'active',
      isCurrent: true,
      lastActive: 'Active now'
    },
    {
      id: 2,
      device: 'Safari on iPhone 15 Pro',
      ip: '103.22.45.18',
      location: 'Delhi, India',
      status: 'idle',
      isCurrent: false,
      lastActive: 'Last active 14m ago'
    },
    {
      id: 3,
      device: 'Firefox on macOS Sonoma',
      ip: '198.51.100.42',
      location: 'New York, USA',
      status: 'idle',
      isCurrent: false,
      lastActive: 'Last active 2 days ago'
    }
  ]);

  const [preferences, setPreferences] = useState({
    twoFactor: false,
    tradeAlerts: true,
    emailDigests: false,
    aiCalculationPush: true
  });

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

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggleKeyVisibility = (id) => {
    setApiKeys(apiKeys.map(key => key.id === id ? { ...key, visible: !key.visible } : key));
  };

  const handleDeleteKey = (id) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
  };

  const handleGenerateKey = (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    
    const randomHex = Array.from({ length: 24 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    const newKey = {
      id: Date.now(),
      name: newKeyName,
      value: `sk_live_qts_${randomHex}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
      visible: false
    };

    setApiKeys([...apiKeys, newKey]);
    setNewKeyName('');
    setShowKeyGenerator(false);
  };

  const handleRevokeSession = (id) => {
    setSessions(sessions.filter(s => s.id !== id));
  };

  const handleRevokeAllOthers = () => {
    setSessions(sessions.filter(s => s.isCurrent));
  };

  const togglePreference = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative transition-colors duration-300">
      
      {/* Absolute visual ambient glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-cyberBlue/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyberTeal/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Modern Banner/Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-slate-200 dark:border-white/5 gap-4 relative z-10">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-cyberBlue/10 border border-cyberBlue/20 rounded-2xl shadow-inner">
            <svg className="w-6 h-6 text-cyberBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white transition-colors duration-300">Security & API Hub</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 transition-colors duration-300">Manage developer API access credentials, secure session tokens, and account limits.</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 bg-slate-200/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/5 rounded-full text-[10px] font-mono text-slate-500 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Shield: Active</span>
          </div>
          <div className="text-[10px] font-mono px-3 py-1 bg-cyberBlue/10 border border-cyberBlue/20 text-cyberBlue rounded-full">
            SSL Enabled
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* LEFT BLOCK: User Core Identity, Key Details, & Preferences (col-span-7) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* USER PROFILE INFO */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-200/50 dark:border-white/5 relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyberBlue/5 to-transparent rounded-bl-full pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyberBlue via-cyan-500 to-cyberTeal p-0.5 shadow-lg">
                  <div className="w-full h-full rounded-full bg-[#0B0F19] flex items-center justify-center font-black text-2xl text-white">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide transition-colors duration-300">
                    {user?.name || 'Authorized Terminal Operator'}
                  </h3>
                  <p className="text-xs text-cyberTeal mt-1 font-semibold uppercase tracking-wider flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyberTeal mr-1.5 animate-pulse"></span>
                    Verified Session Account
                  </p>
                </div>
              </div>
              
              <button 
                onClick={logout}
                className="px-3.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:text-white bg-slate-200/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/10 rounded-xl hover:bg-rose-500/25 dark:hover:bg-rose-500/20 hover:border-rose-500/30 transition-all cursor-pointer font-bold"
              >
                Terminate Session
              </button>
            </div>

            {loadingProfile ? (
              <div className="space-y-4 py-4 animate-pulse">
                <div className="h-10 bg-slate-200/50 dark:bg-white/5 rounded-xl"></div>
                <div className="h-10 bg-slate-200/50 dark:bg-white/5 rounded-xl"></div>
                <div className="h-10 bg-slate-200/50 dark:bg-white/5 rounded-xl"></div>
              </div>
            ) : errorProfile ? (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs p-4 rounded-xl flex items-start space-x-2">
                <svg className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{errorProfile}</span>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Registered Email */}
                <div className="group p-3.5 bg-slate-200/40 dark:bg-black/35 rounded-xl border border-slate-300/30 dark:border-white/5 flex items-center justify-between transition-all hover:border-cyberBlue/20 duration-300">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                      REGISTERED EMAIL
                    </span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {profileData?.email}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleCopy(profileData?.email, 'email')}
                    className="p-2 rounded-lg bg-slate-300/40 dark:bg-white/5 text-slate-500 hover:text-cyberBlue dark:hover:text-cyberTeal cursor-pointer transition-colors relative"
                    title="Copy Email"
                  >
                    {copiedField === 'email' ? (
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Database Key ID */}
                <div className="group p-3.5 bg-slate-200/40 dark:bg-black/35 rounded-xl border border-slate-300/30 dark:border-white/5 flex items-center justify-between transition-all hover:border-cyberBlue/20 duration-300">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                      DATABASE ID (_ID)
                    </span>
                    <span className="text-[11.5px] font-mono text-slate-700 dark:text-slate-300 font-semibold select-all">
                      {profileData?._id}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleCopy(profileData?._id, '_id')}
                    className="p-2 rounded-lg bg-slate-300/40 dark:bg-white/5 text-slate-500 hover:text-cyberBlue dark:hover:text-cyberTeal cursor-pointer transition-colors"
                    title="Copy Database Key"
                  >
                    {copiedField === '_id' ? (
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Account Created On */}
                <div className="p-3.5 bg-slate-200/40 dark:bg-black/35 rounded-xl border border-slate-300/30 dark:border-white/5 flex items-center justify-between duration-300">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                      PROVISIONING DATE
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div className="text-[10px] font-semibold text-cyberTeal bg-cyberTeal/10 border border-cyberTeal/20 px-2 py-0.5 rounded-md">
                    Authorized
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* DEVELOPER API ACCESS */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-200/50 dark:border-white/5 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide uppercase">Developer API Keys</h3>
                <p className="text-xs text-slate-500 mt-0.5">Generate secret keys to ingest AI forecast models into personal code pipelines.</p>
              </div>
              
              <button 
                onClick={() => setShowKeyGenerator(!showKeyGenerator)}
                className="px-3 py-1.5 text-xs text-white bg-gradient-to-r from-cyberBlue to-cyberTeal hover:from-cyberBlue/90 hover:to-cyberTeal/90 font-bold rounded-xl active:scale-95 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>New Key</span>
              </button>
            </div>

            {/* In-place Key Generator Form */}
            {showKeyGenerator && (
              <form onSubmit={handleGenerateKey} className="mb-6 p-4 bg-slate-200/30 dark:bg-black/25 border border-slate-300/30 dark:border-white/5 rounded-xl space-y-3.5 animate-[fadeIn_0.2s_ease-out]">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    API Key Description
                  </label>
                  <input
                    type="text"
                    required
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. Algorithmic Trading Server Key"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#0B0F19] border border-slate-300/30 dark:border-white/5 focus:outline-none focus:border-cyberBlue text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                  />
                </div>
                <div className="flex justify-end space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setShowKeyGenerator(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-cyberBlue hover:bg-cyberBlue/90 rounded-lg shadow cursor-pointer active:scale-95 transition-transform"
                  >
                    Generate Secret
                  </button>
                </div>
              </form>
            )}

            {apiKeys.length === 0 ? (
              <div className="text-center py-6 text-slate-400 border border-dashed border-slate-300/50 dark:border-white/5 rounded-xl">
                No custom API keys provisioned. Click "New Key" above to generate a client secret.
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div key={key.id} className="p-4 bg-slate-200/40 dark:bg-black/35 border border-slate-300/30 dark:border-white/5 rounded-xl space-y-3.5 transition-all hover:border-cyberTeal/10">
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide">{key.name}</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-[10px] text-slate-400 font-mono">Created: {key.createdAt}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                          <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Active</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1.5">
                        <button 
                          onClick={() => toggleKeyVisibility(key.id)}
                          className="p-1.5 rounded-lg bg-slate-300/40 dark:bg-white/5 text-slate-500 hover:text-cyberBlue dark:hover:text-cyberTeal cursor-pointer transition-colors"
                          title={key.visible ? "Hide secret" : "Reveal secret"}
                        >
                          {key.visible ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </button>
                        
                        <button 
                          onClick={() => handleCopy(key.value, `key_${key.id}`)}
                          className="p-1.5 rounded-lg bg-slate-300/40 dark:bg-white/5 text-slate-500 hover:text-cyberBlue dark:hover:text-cyberTeal cursor-pointer transition-colors"
                          title="Copy key"
                        >
                          {copiedField === `key_${key.id}` ? (
                            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          )}
                        </button>
                        
                        <button 
                          onClick={() => handleDeleteKey(key.id)}
                          className="p-1.5 rounded-lg bg-slate-300/40 dark:bg-white/5 text-slate-500 hover:text-rose-500 cursor-pointer transition-colors"
                          title="Revoke access"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-100 dark:bg-[#0B0F19] rounded-lg border border-slate-300/20 dark:border-white/5 font-mono text-[10.5px] select-all truncate">
                      {key.visible ? key.value : '••••••••••••••••••••••••••••••••••••••••••••••••'}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ACTIVE DEVICE SESSIONS */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-200/50 dark:border-white/5 transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide uppercase">Secure Login Sessions</h3>
                <p className="text-xs text-slate-500 mt-0.5">Auditing active devices validated via signed state storage.</p>
              </div>
              {sessions.length > 1 && (
                <button
                  onClick={handleRevokeAllOthers}
                  className="text-xs text-cyberBlue dark:text-cyberTeal font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  Terminate other sessions
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-200/30 dark:divide-white/5">
              {sessions.map((session) => (
                <div key={session.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0 gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-300/40 dark:bg-white/5 rounded-xl border border-slate-300/10 dark:border-white/5">
                      <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V1M9 3a2 2 0 012-2h2a2 2 0 012 2m-4 0h4m-6 9h4m-6 3h6" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-950 dark:text-white">{session.device}</span>
                        {session.isCurrent && (
                          <span className="text-[9px] font-black text-cyberTeal bg-cyberTeal/10 border border-cyberTeal/20 px-1.5 py-0.5 rounded-full uppercase">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        <span>{session.ip}</span>
                        <span>•</span>
                        <span>{session.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="text-[10px] font-semibold text-slate-400 font-mono">{session.lastActive}</span>
                    {!session.isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="p-1.5 rounded-lg bg-slate-200/50 hover:bg-rose-500/10 hover:text-rose-500 text-slate-400 transition-colors cursor-pointer"
                        title="Revoke session key"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT BLOCK: JWT Token Decryption & Security Preferences (col-span-5) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* SUBSCRIPTION & RESOURCE LIMITS */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-200/50 dark:border-white/5 relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyberTeal/5 to-transparent rounded-bl-full pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase transition-colors duration-300">
                Subscription & API Ingestion
              </h3>
              <span className="text-[10px] font-black text-cyberBlue dark:text-cyberTeal bg-cyberBlue/10 dark:bg-cyberTeal/10 border border-cyberBlue/20 dark:border-cyberTeal/20 px-2.5 py-0.5 rounded-full uppercase">
                Premium Pro
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-500 mb-6 transition-colors duration-300">
              Live ingest resource utilization for predictive ML modules.
            </p>

            <div className="space-y-5">
              
              {/* Progress Bar 1: LSTM Model Queries */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">LSTM Model Queries (Daily)</span>
                  <span className="text-slate-950 dark:text-white font-mono font-bold">4,812 / 10,000 calls</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-black/45 h-2 rounded-full overflow-hidden border border-slate-300/20 dark:border-white/5 shadow-inner">
                  <div className="bg-gradient-to-r from-cyberBlue to-cyberTeal h-full rounded-full transition-all duration-500" style={{ width: '48.12%' }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Reset in 14 hours</span>
                  <span>48.12% utilized</span>
                </div>
              </div>

              {/* Progress Bar 2: Historical Tick Ingestion */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">Historical Ingestion Rows</span>
                  <span className="text-slate-950 dark:text-white font-mono font-bold">892,100 / 1,000,000 rows</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-black/45 h-2 rounded-full overflow-hidden border border-slate-300/20 dark:border-white/5 shadow-inner">
                  <div className="bg-gradient-to-r from-cyberTeal to-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: '89.21%' }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Upgrade to lift ceiling</span>
                  <span className="text-amber-500 font-bold">89.21% full</span>
                </div>
              </div>

              {/* API Streaming & Connection Telemetry Grid */}
              <div className="grid grid-cols-2 gap-3.5 pt-1.5">
                <div className="p-3 bg-slate-200/40 dark:bg-black/35 border border-slate-300/30 dark:border-white/5 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">WS Stream Latency</span>
                  <span className="text-base font-extrabold text-cyberTeal block mt-1 font-mono">12ms</span>
                  <span className="text-[9px] text-emerald-500 font-semibold block mt-0.5">Ultra Performance</span>
                </div>
                <div className="p-3 bg-slate-200/40 dark:bg-black/35 border border-slate-300/30 dark:border-white/5 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Concurrent Sockets</span>
                  <span className="text-base font-extrabold text-cyberBlue block mt-1 font-mono">3 / 3</span>
                  <span className="text-[9px] text-slate-400 font-medium block mt-0.5">Limit Reached</span>
                </div>
              </div>

              {/* Billing Cycle Details */}
              <div className="p-3.5 bg-slate-200/40 dark:bg-black/35 border border-slate-300/30 dark:border-white/5 rounded-xl text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Monthly Plan Cost</span>
                  <span className="text-slate-900 dark:text-white font-bold font-mono">$49.00 / month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Billing Cycle Ends</span>
                  <span className="text-slate-900 dark:text-white font-bold font-mono">June 22, 2026</span>
                </div>
                <div className="flex justify-between border-t border-slate-300/30 dark:border-white/5 pt-2">
                  <span className="text-slate-500 dark:text-slate-400">Payment Gateway</span>
                  <span className="text-cyberBlue font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 text-[10px]"></span>
                    Stripe Active
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* SECURITY & TELEMETRY PREFERENCES */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-200/50 dark:border-white/5 transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase mb-1">
              Terminal Preferences
            </h3>
            <p className="text-xs text-slate-500 mb-5">Configure security, web-push telemetry, and background sync options.</p>

            <div className="space-y-4">
              
              {/* 2FA Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Two-Factor Authentication (2FA)</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Enforce a prompt for OTP validation on login.</span>
                </div>
                
                <button
                  type="button"
                  onClick={() => togglePreference('twoFactor')}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer outline-none shrink-0 ${
                    preferences.twoFactor ? 'bg-cyberTeal' : 'bg-slate-300 dark:bg-white/10'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 left-0.75 transition-transform ${
                    preferences.twoFactor ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Trade Alerts Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Real-Time Trade Alerts</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Show notifications when high-confidence signals trigger.</span>
                </div>
                
                <button
                  type="button"
                  onClick={() => togglePreference('tradeAlerts')}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer outline-none shrink-0 ${
                    preferences.tradeAlerts ? 'bg-cyberTeal' : 'bg-slate-300 dark:bg-white/10'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 left-0.75 transition-transform ${
                    preferences.tradeAlerts ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* AI calculation background sync */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Deep LSTM Back-Calculation</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Execute model forecasts synchronously inside local browsers.</span>
                </div>
                
                <button
                  type="button"
                  onClick={() => togglePreference('aiCalculationPush')}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer outline-none shrink-0 ${
                    preferences.aiCalculationPush ? 'bg-cyberTeal' : 'bg-slate-300 dark:bg-white/10'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 left-0.75 transition-transform ${
                    preferences.aiCalculationPush ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Email Digest Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Weekly Model Performance Digests</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Receive structured reports mapping signal returns.</span>
                </div>
                
                <button
                  type="button"
                  onClick={() => togglePreference('emailDigests')}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer outline-none shrink-0 ${
                    preferences.emailDigests ? 'bg-cyberTeal' : 'bg-slate-300 dark:bg-white/10'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 left-0.75 transition-transform ${
                    preferences.emailDigests ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Collapsible Security Debug Console */}
      <div className="mt-8 relative z-10">
        <button
          onClick={() => setShowDebugConsole(!showDebugConsole)}
          className="w-full flex items-center justify-between p-4 bg-slate-200/30 dark:bg-black/25 border border-slate-300/30 dark:border-white/5 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-cyberBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Developer Session Diagnostic Console (JWT Session Claims)
          </span>
          <svg className={`w-4 h-4 transition-transform duration-200 ${showDebugConsole ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDebugConsole && (
          <div className="mt-4 glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/5 animate-[fadeIn_0.2s_ease-out] grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">Parsed Claims Structure</h4>
              <p className="text-[10px] text-slate-500 mb-3">Decoded JSON payload representing signed JWT assertions for active tokens.</p>
              {claims ? (
                <div className="p-3.5 bg-slate-100 dark:bg-black/45 border border-slate-200 dark:border-white/5 rounded-xl font-mono text-[11px] text-slate-800 dark:text-slate-300 select-all overflow-x-auto whitespace-pre shadow-inner max-h-48">
                  {JSON.stringify(claims, null, 2)}
                </div>
              ) : (
                <div className="bg-yellow-400/10 border border-yellow-400/20 text-yellow-500 text-xs p-3.5 rounded-xl text-center">
                  No active session claims found.
                </div>
              )}
            </div>

            <div className="space-y-3.5 text-xs pt-4 md:pt-8">
              {claims ? (
                <>
                  <div className="flex justify-between border-b border-slate-200 dark:border-white/5 pb-2.5">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Issuer ID (claims.id)</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold select-all font-mono">{claims.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-white/5 pb-2.5">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Issued At (claims.iat)</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold font-mono">
                      {new Date(claims.iat * 1000).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Expires At (claims.exp)</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold font-mono text-cyberTeal">
                      {new Date(claims.exp * 1000).toLocaleString()}
                    </span>
                  </div>
                </>
              ) : (
                <span className="text-slate-400 text-xs">No diagnostic telemetry available.</span>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Profile;
