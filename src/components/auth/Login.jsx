import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, AlertCircle, ShoppingBag, Sparkles, Truck, ShieldCheck } from 'lucide-react';
import {
  sendOtpLogin,
  verifyOtpLogin,
  resendOtpLogin,
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
    dispatch(resendOtpLogin(email));
  };

  const handleEmailChange = (e) => {
    dispatch(setEmail(e.target.value));
  };

  const handleOtpChange = (e) => {
    dispatch(setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)));
  };

  const handleBack = () => {
    dispatch(setStep(1));
  };

  const visibleError = error;

  return (
    <div className="min-h-screen flex items-center justify-center page-bg px-3 sm:px-4 py-8 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 bg-rose-300/30 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 bg-pink-400/30 rounded-full blur-3xl" />

      <div className="relative w-full max-w-4xl grid md:grid-cols-2 bg-white rounded-3xl shadow-2xl shadow-pink-200/60 ring-1 ring-pink-100 overflow-hidden">
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-rose-700 via-pink-700 to-pink-800 text-white relative overflow-hidden">
          <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 w-72 h-72 bg-pink-500/20 rounded-full blur-2xl" />

          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <ShoppingBag size={22} />
              </div>
              <span className="text-xl font-black tracking-tight">ChooseMood</span>
            </div>

            <h1 className="text-3xl font-black mt-8 leading-tight">Style that speaks your mood</h1>
            <p className="mt-3 text-pink-100 leading-relaxed">
              Discover fashion curated for how you feel today — effortless checkout, live order tracking and secure sessions.
            </p>

            <ul className="mt-8 space-y-4">
              <li className="flex items-center gap-3">
                <Sparkles className="text-amber-300 shrink-0" size={18} />
                <span className="text-sm">Trending picks tailored to you</span>
              </li>
              <li className="flex items-center gap-3">
                <Truck className="text-amber-300 shrink-0" size={18} />
                <span className="text-sm">Fast delivery with live tracking</span>
              </li>
              <li className="flex items-center gap-3">
                <ShieldCheck className="text-amber-300 shrink-0" size={18} />
                <span className="text-sm">Secure, cookie-based sign in</span>
              </li>
            </ul>
          </div>

          <p className="relative text-pink-200 text-sm italic">“Dress for the mood you want.”</p>
        </div>

        <div className="p-6 sm:p-10">
          <div className="md:hidden flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-700 flex items-center justify-center text-white mb-3 shadow-lg shadow-pink-500/40">
              <ShoppingBag size={24} />
            </div>
            <h2 className="text-2xl font-black gradient-text">ChooseMood</h2>
          </div>

          <div className="text-center md:text-left mb-6">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Welcome back</h2>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              {step === 1 ? "Enter your email to receive an OTP" : "Enter the 6-digit code sent to your email"}
            </p>
          </div>

          {visibleError && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5">
              <AlertCircle className="text-rose-500 shrink-0" size={18} />
              <span className="text-rose-700 text-sm">{visibleError}</span>
            </div>
          )}

          <form onSubmit={step === 1 ? handleSendOtp : verifyOtp} className="space-y-5">
            {step === 1 ? (
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-gray-400" size={20} />
                <input
                  type="email"
                  placeholder="Email Address"
                  autoFocus
                  className="input !py-3.5 pl-11 bg-gray-50/60 focus:bg-white"
                  value={email}
                  onChange={handleEmailChange}
                  required
                />
              </div>
            ) : (
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-gray-400" size={20} />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter OTP"
                  autoFocus
                  className="input !py-3.5 pl-11 bg-gray-50/60 focus:bg-white text-center text-xl font-bold tracking-[0.5em]"
                  value={otp}
                  onChange={handleOtpChange}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-gradient w-full !py-3.5 !text-base"
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
                className={`text-sm font-medium block w-full ${timer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-pink-600 hover:underline'}`}
              >
                {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
              </button>
              <button
                onClick={handleBack}
                className="text-sm text-gray-500 hover:text-pink-600 hover:underline"
              >
                Change Email
              </button>
            </div>
          )}

          <p className="text-center mt-8 text-gray-600 text-sm">
            Don't have an account? <Link to="/signup" className="text-pink-600 font-bold hover:underline">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login
