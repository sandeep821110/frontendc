import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import BrandLoader from '../BrandLoader';
import { User, Mail, Fingerprint, LogOut, Loader2, AlertCircle, Smartphone, Shield, MessageSquare } from 'lucide-react';
import {
  fetchProfile,
  logout,
  listSessions,
  revokeSession,
  revokeAllSessions,
  clearError,
  selectUser,
  selectToken,
  selectIsAuthenticated,
  selectProfileLoading,
  selectError,
  selectSessions,
  selectSessionsLoading,
} from '../../features/auth/authSlice';

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const token = useSelector(selectToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const profileLoading = useSelector(selectProfileLoading);
  const error = useSelector(selectError);
  const sessions = useSelector(selectSessions);
  const sessionsLoading = useSelector(selectSessionsLoading);

  const [activeTab, setActiveTab] = useState('profile');
  const [revokeConfirm, setRevokeConfirm] = useState(null);

  useEffect(() => {
    if (!token) return;
    dispatch(fetchProfile());
  }, [dispatch, token]);

  useEffect(() => {
    if (token && activeTab === 'sessions') {
      dispatch(listSessions());
    }
  }, [dispatch, token, activeTab]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleRevokeSession = (jti) => {
    dispatch(revokeSession(jti));
    setRevokeConfirm(null);
  };

  const handleRevokeAll = () => {
    dispatch(revokeAllSessions());
  };

  if (profileLoading) {
    return <div className="min-h-screen flex items-center justify-center"><BrandLoader text="Loading profile..." /></div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 max-w-md">
            <AlertCircle className="text-red-500" size={20} />
            <span className="text-red-700">{error}</span>
          </div>
        )}
        <p className="text-gray-600 mb-4 text-lg">Please login to view your profile</p>
        <button 
          onClick={() => navigate('/login')}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition"
        >
          Login
        </button>
      </div>
    );
  }

  const randomAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || user.email || 'user'}`;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'queries', label: 'My Queries', icon: MessageSquare, href: '/my-queries' },
    { id: 'sessions', label: 'Sessions', icon: Smartphone },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-3 sm:px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 h-32"></div>
        <div className="px-8 pb-8">
          <div className="relative -mt-16 mb-6 flex justify-center">
            <img src={randomAvatar} alt="Profile" className="w-32 h-32 rounded-full border-4 border-white bg-gray-100 shadow-lg" />
          </div>

          <div className="flex justify-center gap-2 mb-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { if (tab.href) navigate(tab.href); else setActiveTab(tab.id); dispatch(clearError()); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
                  activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="text-red-500 shrink-0" size={18} />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{user.name || 'User'}</h2>
                <span className="inline-block mt-1 px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase">
                  {user.role || 'user'}
                </span>
                <span className="inline-block mt-1 ml-2 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full uppercase">
                  {user.authMethod || 'otp'}
                </span>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <User className="text-indigo-600 shrink-0" size={20} />
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold">Name</p>
                  <p className="text-gray-700">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <Mail className="text-indigo-600 shrink-0" size={20} />
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold">Email</p>
                  <p className="text-gray-700">{user.email || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <Fingerprint className="text-indigo-600 shrink-0" size={20} />
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold">User ID</p>
                  <p className="text-gray-700 text-sm font-mono">{user._id || user.id || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <Shield className="text-indigo-600 shrink-0" size={20} />
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold">Auth Method</p>
                  <p className="text-gray-700 capitalize">{user.authMethod || 'OTP'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Active Sessions ({sessions?.length || 0})
                </h3>
                {sessions?.length > 1 && (
                  <button
                    onClick={handleRevokeAll}
                    className="text-sm text-red-600 hover:underline font-medium"
                  >
                    Revoke All Others
                  </button>
                )}
              </div>

              {sessionsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-600" size={24} /></div>
              ) : sessions?.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No active sessions</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.jti} className={`p-4 rounded-2xl border ${session.isCurrent ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Smartphone className={session.isCurrent ? 'text-indigo-600' : 'text-gray-400'} size={20} />
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {session.device || session.userAgent || 'Unknown Device'}
                              {session.isCurrent && <span className="ml-2 text-xs text-indigo-600">(Current)</span>}
                            </p>
                            <p className="text-xs text-gray-500">
                              {session.ip || 'Unknown IP'} · {session.expiresIn ? `${Math.round(session.expiresIn / 60)}m remaining` : 'No expiry'}
                            </p>
                          </div>
                        </div>
                        {!session.isCurrent && (
                          <div className="relative">
                            {revokeConfirm === session.jti ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRevokeSession(session.jti)}
                                  className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg font-bold hover:bg-red-600"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setRevokeConfirm(null)}
                                  className="text-xs bg-gray-300 text-gray-700 px-3 py-1 rounded-lg font-bold hover:bg-gray-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setRevokeConfirm(session.jti)}
                                className="text-xs text-red-500 hover:underline font-medium"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button onClick={handleLogout} className="w-full mt-8 flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 transition">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile
