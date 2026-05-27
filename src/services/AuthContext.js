import React, { createContext, useContext, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  sendOtpLogin,
  verifyOtpLogin,
  sendOtpSignup,
  verifyOtpSignup,
  logout,
  clearError,
  selectIsAuthenticated,
  selectUser,
  selectToken,
  selectLoading,
  selectError,
  selectStep,
  selectEmail,
  selectName,
  setStep,
  setEmail,
  setName,
} from '../features/auth/authSlice';
import { getAuthToken } from './apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();

  // Selectors to get data from Redux store
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const token = useSelector(selectToken);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const step = useSelector(selectStep);
  const email = useSelector(selectEmail);
  const name = useSelector(selectName);

  // Fallback to in-memory token if Redux hasn't synced yet
  const persistentToken = token || getAuthToken();

  // Dispatching actions
  const handleSendLoginOtp = (email) => dispatch(sendOtpLogin(email));
  const handleVerifyLoginOtp = (otp) => dispatch(verifyOtpLogin({ email, otp }));
  
  const handleSendSignupOtp = (userData) => dispatch(sendOtpSignup(userData));
  const handleVerifySignupOtp = (otp) => dispatch(verifyOtpSignup({ email, name, otp }));

  const handleLogout = useCallback(() => dispatch(logout()), [dispatch]);
  const handleClearError = useCallback(() => dispatch(clearError()), [dispatch]);

  const value = {
    // State
    isAuthenticated,
    user,
    token: persistentToken,
    loading,
    error,
    step,
    email,
    name,
    
    // Actions
    sendLoginOtp: handleSendLoginOtp,
    verifyLoginOtp: handleVerifyLoginOtp,
    sendSignupOtp: handleSendSignupOtp,
    verifySignupOtp: handleVerifySignupOtp,
    logout: handleLogout,
    clearError: handleClearError,
    setStep: (newStep) => dispatch(setStep(newStep)),
    setEmail: (newEmail) => dispatch(setEmail(newEmail)),
    setName: (newName) => dispatch(setName(newName)),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};