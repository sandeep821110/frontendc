import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, AlertCircle, User, Phone, Calendar } from 'lucide-react';
import {
  sendOtpSignup,
  verifyOtpSignup,
  completeProfile,
  resendOtpSignup,
  clearError,
  setStep,
  setEmail,
  setName,
  setPhone,
  setGender,
  setDateOfBirth,
  setOtp,
  setTimer,
  selectStep,
  selectEmail,
  selectName,
  selectPhone,
  selectGender,
  selectDateOfBirth,
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
  const phone = useSelector(selectPhone);
  const gender = useSelector(selectGender);
  const dateOfBirth = useSelector(selectDateOfBirth);
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

  const handleSendOtp = (e) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(sendOtpSignup({ email }));
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(verifyOtpSignup({ email, otp }));
  };

  const handleCompleteProfile = (e) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(completeProfile({
      name,
      phone,
      gender: gender || undefined,
      dateOfBirth: dateOfBirth || undefined,
    }));
  };

  const handleResendOtp = () => {
    if (timer > 0) return;
    dispatch(clearError());
    dispatch(resendOtpSignup({ email }));
  };

  const handleBackToEmail = () => {
    dispatch(setStep(1));
  };

  const handleBackToOtp = () => {
    dispatch(setStep(2));
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen flex items-center justify-center page-bg px-3 sm:px-4 py-8 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 bg-rose-300/30 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 bg-pink-400/30 rounded-full blur-3xl" />

      <div className="relative max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-pink-200/60 ring-1 ring-pink-100 p-5 sm:p-8">
        <div className="text-center mb-8">
          <span className="section-badge mb-3">Join the mood</span>
          <h2 className="text-3xl font-extrabold gradient-text mt-2">Create Account</h2>
          <p className="text-gray-500 mt-2">
            {step === 1 && "Enter your email to get started"}
            {step === 2 && "Enter the 6-digit code sent to your email"}
            {step === 3 && "Complete your profile details"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
            <AlertCircle className="text-rose-500 shrink-0" size={18} />
            <span className="text-rose-700 text-sm">{error}</span>
          </div>
        )}

        {/* Step 1: Email only */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-gray-400" size={20} />
              <input
                type="email"
                placeholder="Email Address"
                className="input !py-3.5 pl-11 bg-gray-50/60 focus:bg-white"
                value={email}
                onChange={(e) => dispatch(setEmail(e.target.value))}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gradient w-full !py-3.5 !text-base"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  Send OTP
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Enter OTP"
                className="input !py-3.5 pl-11 bg-gray-50/60 focus:bg-white tracking-widest"
                value={otp}
                onChange={(e) => dispatch(setOtp(e.target.value))}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gradient w-full !py-3.5 !text-base"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  Verify & Continue
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="mt-6 space-y-2 text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={timer > 0 || loading}
                className={`text-sm font-medium block w-full ${timer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-pink-600 hover:underline'}`}
              >
                {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
              </button>
              <button
                type="button"
                onClick={handleBackToEmail}
                className="text-sm text-gray-500 hover:text-pink-600 hover:underline"
              >
                Back to Email
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Complete Profile */}
        {step === 3 && (
          <form onSubmit={handleCompleteProfile} className="space-y-5">
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Full Name"
                className="input !py-3.5 pl-11 bg-gray-50/60 focus:bg-white"
                value={name}
                onChange={(e) => dispatch(setName(e.target.value))}
                required
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 text-gray-400" size={20} />
              <input
                type="tel"
                placeholder="Phone Number"
                className="input !py-3.5 pl-11 bg-gray-50/60 focus:bg-white"
                value={phone}
                onChange={(e) => dispatch(setPhone(e.target.value.replace(/\D/g, '').slice(0, 15)))}
              />
            </div>

            <div className="relative">
              <User className="absolute left-3.5 top-3.5 text-gray-400" size={20} />
              <select
                className="input !py-3.5 pl-11 bg-gray-50/60 focus:bg-white appearance-none"
                value={gender}
                onChange={(e) => dispatch(setGender(e.target.value))}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="relative">
              <Calendar className="absolute left-3.5 top-3.5 text-gray-400" size={20} />
              <input
                type="date"
                placeholder="Date of Birth"
                className="input !py-3.5 pl-11 bg-gray-50/60 focus:bg-white"
                value={dateOfBirth}
                max={today}
                onChange={(e) => dispatch(setDateOfBirth(e.target.value))}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gradient w-full !py-3.5 !text-base"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  Create Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleBackToOtp}
                className="text-sm text-gray-500 hover:text-pink-600 hover:underline"
              >
                Back to OTP
              </button>
            </div>
          </form>
        )}

        {step !== 3 && (
          <p className="text-center mt-8 text-gray-600 text-sm">
            Already have an account? <Link to="/login" className="text-pink-600 font-bold hover:underline">Login</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default SignUp
