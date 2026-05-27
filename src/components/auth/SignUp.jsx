import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import {
  sendOtpSignup,
  verifyOtpSignup,
  clearError,
  setStep,
  setEmail,
  setName,
  setOtp,
  setTimer,
  selectStep,
  selectEmail,
  selectName,
  selectOtp,
  selectTimer,
  selectLoading,
  selectError,
  selectIsAuthenticated
} from '../../features/auth/authSlice';

const SignUp = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const step = useSelector(selectStep);
  const name = useSelector(selectName);
  const email = useSelector(selectEmail);
  const otp = useSelector(selectOtp);
  const timer = useSelector(selectTimer);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        dispatch(setTimer(timer - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer, dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSignupSendOtp = (e) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(sendOtpSignup({ name, email }));
  };

  const verifyOtp = (e) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(verifyOtpSignup({ email, otp, name }));
  };

  const resendOtp = () => {
    if (timer > 0) return;
    dispatch(clearError());
    dispatch(sendOtpSignup({ name, email }));
  };

  const handleNameChange = (e) => {
    dispatch(setName(e.target.value));
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
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-500 mt-2">
            {step === 1 ? "Join us today! Enter your details" : "Enter the 6-digit code sent to your email"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <AlertCircle className="text-red-500 shrink-0" size={18} />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={step === 1 ? handleSignupSendOtp : verifyOtp} className="space-y-6">
          {step === 1 ? (
            <>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  value={name}
                  onChange={handleNameChange}
                  required
                />
              </div>
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
            </>
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
                {step === 1 ? "Sign Up" : "Verify & Create Account"}
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
              Back to Details
            </button>
          </div>
        )}

        <p className="text-center mt-8 text-gray-600 text-sm">
          Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp
