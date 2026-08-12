import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import BrandLoader from '../BrandLoader';
import { User, Mail, Fingerprint, LogOut, Loader2, AlertCircle, Smartphone, Shield, MessageSquare, Camera, Wallet } from 'lucide-react';
import {
  fetchProfile,
  logout,
  listSessions,
  revokeSession,
  revokeAllSessions,
  uploadAvatar,
  deleteAvatar,
  clearError,
  selectUser,
  selectToken,
  selectIsAuthenticated,
  selectProfileLoading,
  selectAvatarUploading,
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
  const avatarUploading = useSelector(selectAvatarUploading);
  const error = useSelector(selectError);
  const sessions = useSelector(selectSessions);
  const sessionsLoading = useSelector(selectSessionsLoading);
  const fileInputRef = useRef(null);

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

  const handleLogout = async () => {
    await dispatch(logout());
    window.location.href = '/';
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    dispatch(uploadAvatar(file));
  };

  const handleRevokeSession = (jti) => {
    dispatch(revokeSession(jti));
    setRevokeConfirm(null);
  };

  const handleRevokeAll = () => {
    dispatch(revokeAllSessions());
  };

  if (profileLoading) {
    return <div className="min-h-screen flex items-center justify-center page-bg"><BrandLoader text="Loading profile..." /></div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 page-bg">
        {error && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 max-w-md">
            <AlertCircle className="text-rose-500" size={20} />
            <span className="text-rose-700">{error}</span>
          </div>
        )}
        <p className="text-gray-600 mb-4 text-lg">Please login to view your profile</p>
        <button 
          onClick={() => navigate('/login')}
          className="btn-gradient !px-6 !py-2.5"
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
    { id: 'wallet', label: 'Wallet', icon: Wallet, href: '/wallet' },
    { id: 'sessions', label: 'Sessions', icon: Smartphone },
  ];

  return (
    <div className="min-h-screen page-bg py-6 sm:py-12 px-3 sm:px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl shadow-pink-200/50 ring-1 ring-pink-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-rose-700 via-pink-600 to-pink-800 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-8 w-56 h-56 bg-pink-500/20 rounded-full blur-2xl" />
        </div>
        <div className="px-8 pb-8">
          <div className="relative -mt-16 mb-6 flex flex-col items-center">
            <div className="relative group">
              <img
                src={user.avatar || randomAvatar}
                alt="Profile"
                className="w-32 h-32 rounded-full border-4 border-white bg-gray-100 shadow-xl ring-1 ring-slate-100 object-cover"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition"
                title="Change profile picture"
              >
                <Camera size={30} />
              </button>
              {avatarUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                  <Loader2 className="animate-spin text-white" size={34} />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            {user.avatar && (
              <button
                type="button"
                onClick={() => dispatch(deleteAvatar())}
                disabled={avatarUploading}
                className="mt-2 text-xs text-rose-500 hover:underline font-medium disabled:opacity-50"
              >
                Remove photo
              </button>
            )}
          </div>

          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { if (tab.href) navigate(tab.href); else setActiveTab(tab.id); dispatch(clearError()); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
                  activeTab === tab.id ? 'btn-gradient !px-4 !py-2 !text-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="text-rose-500 shrink-0" size={18} />
              <span className="text-rose-700 text-sm">{error}</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-extrabold gradient-text">{user.name || 'User'}</h2>
                <span className="chip bg-gradient-to-r from-rose-100 to-pink-100 text-pink-700 font-bold mt-1 uppercase">
                  {user.role || 'user'}
                </span>
                <span className="chip bg-slate-100 text-slate-600 font-bold mt-1 ml-2 uppercase">
                  {user.authMethod || 'otp'}
                </span>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-rose-50/60 to-pink-50/60 rounded-2xl border border-pink-100/60">
                <User className="text-pink-600 shrink-0" size={20} />
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold">Name</p>
                  <p className="text-gray-700 font-medium">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-rose-50/60 to-pink-50/60 rounded-2xl border border-pink-100/60">
                <Mail className="text-pink-600 shrink-0" size={20} />
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold">Email</p>
                  <p className="text-gray-700 font-medium">{user.email || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-rose-50/60 to-pink-50/60 rounded-2xl border border-pink-100/60">
                <Fingerprint className="text-pink-600 shrink-0" size={20} />
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold">User ID</p>
                  <p className="text-gray-700 text-sm font-mono">{user._id || user.id || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-rose-50/60 to-pink-50/60 rounded-2xl border border-pink-100/60">
                <Shield className="text-pink-600 shrink-0" size={20} />
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
                    className="text-sm text-rose-600 hover:underline font-medium"
                  >
                    Revoke All Others
                  </button>
                )}
              </div>

              {sessionsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-pink-600" size={24} /></div>
              ) : sessions?.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No active sessions</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.jti} className={`card p-4 ${session.isCurrent ? 'border-pink-200 bg-pink-50/50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Smartphone className={session.isCurrent ? 'text-pink-600' : 'text-gray-400'} size={20} />
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {session.device || session.userAgent || 'Unknown Device'}
                              {session.isCurrent && <span className="ml-2 text-xs text-pink-600">(Current)</span>}
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
                                  className="text-xs bg-rose-500 text-white px-3 py-1 rounded-lg font-bold hover:bg-rose-600"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setRevokeConfirm(null)}
                                  className="text-xs bg-slate-300 text-slate-700 px-3 py-1 rounded-lg font-bold hover:bg-slate-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setRevokeConfirm(session.jti)}
                                className="text-xs text-rose-500 hover:underline font-medium"
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

          <button onClick={handleLogout} className="w-full mt-8 flex items-center justify-center gap-2 bg-rose-50 text-rose-600 py-3 rounded-xl font-bold hover:bg-rose-100 transition">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile
