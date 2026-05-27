import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import {
  sendOtpLogin,
  verifyOtpLogin,
  clearError,
  setStep,
  setEmail,
  setOtp,
  setTimer,
  selectStep,
  selectEmail,
  selectOtp,
  selectTimer,
  selectLoading,
  selectError,
  selectIsAuthenticated
} from '../../features/auth/authSlice';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const step = useSelector(selectStep);
  const email = useSelector(selectEmail);
  const otp = useSelector(selectOtp);
  const timer = useSelector(selectTimer);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    const remaining = localStorage.getItem('otpCooldown');
    if (remaining) {
      const left = Math.max(0, Math.round((Number(remaining) - Date.now()) / 1000));
      if (left > 0) dispatch(setTimer(left));
      else localStorage.removeItem('otpCooldown');
    }
  }, [dispatch]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        const next = timer - 1;
        if (next <= 0) localStorage.removeItem('otpCooldown');
        dispatch(setTimer(next));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer, dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (timer > 0) return;
    dispatch(clearError());
    dispatch(sendOtpLogin(email));
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(verifyOtpLogin({ email, otp }));
  };

  const resendOtp = async () => {
    if (timer > 0) return;
    dispatch(clearError());
    dispatch(sendOtpLogin(email));
  };

  const handleEmailChange = (e) => {
    dispatch(setEmail(e.target.value));
  };

  const handleOtpChange = (e) => {
    dispatch(setOtp(e.target.value));
  };

  const handleBack = () => {
    dispatch(setStep(1));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-3 sm:px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-5 sm:p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-500 mt-2">
            {step === 1 ? "Enter your email to receive an OTP" : "Enter the 6-digit code sent to your email"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <AlertCircle className="text-red-500 shrink-0" size={18} />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={step === 1 ? handleSendOtp : verifyOtp} className="space-y-6">
          {step === 1 ? (
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                value={email}
                onChange={handleEmailChange}
                required
              />
            </div>
          ) : (
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Enter OTP"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition tracking-widest"
                value={otp}
                onChange={handleOtpChange}
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                {step === 1 ? "Send OTP" : "Verify & Login"}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {step === 2 && (
          <div className="mt-6 space-y-2 text-center">
            <button 
              onClick={resendOtp}
              disabled={timer > 0 || loading}
              className={`text-sm font-medium block w-full ${timer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:underline'}`}
            >
              {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
            </button>
            <button 
              onClick={handleBack}
              className="text-sm text-gray-500 hover:text-indigo-600 hover:underline"
            >
              Change Email
            </button>
          </div>
        )}

        <p className="text-center mt-8 text-gray-600 text-sm">
          Don't have an account? <Link to="/signup" className="text-indigo-600 font-bold hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login
