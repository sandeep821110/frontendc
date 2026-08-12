import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, PartyPopper, Sparkles, Star, Gift, Bell, ArrowRight } from 'lucide-react';
import { getOrderBreakdown } from '../../utils/orderBreakdown';

const CONFETTI_COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6b9d', '#c44dff', '#ff9f43', '#00d2d3'];

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(10);
  const [orderData, setOrderData] = useState(null);

   useEffect(() => {
    try {
      const payuStatus = searchParams.get('payu_status') || searchParams.get('status');
      if (payuStatus === 'success') {
        const stored = localStorage.getItem('lastOrderSuccess');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.paymentStatus !== 'PAID') {
            parsed.paymentStatus = 'PAID';
            parsed.orderStatus = 'CONFIRMED';
            localStorage.setItem('lastOrderSuccess', JSON.stringify(parsed));
          }
        }
      }
    } catch { 
      // Silently handle parse error
    }
    try {
      const stored = localStorage.getItem('lastOrderSuccess');
      if (stored) {
        setOrderData(JSON.parse(stored));
      }
    } catch {
      // Silently handle parse error
    }
  }, [searchParams]);

  useEffect(() => {
    if (!orderData) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          localStorage.removeItem('lastOrderSuccess');
          navigate('/orders', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [orderData, navigate]);

  const goToOrders = () => {
    localStorage.removeItem('lastOrderSuccess');
    navigate('/orders', { replace: true });
  };

  const confettiPieces = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 10,
      rotation: Math.random() * 360,
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
    })),
  []);

  return (
    <div className="min-h-screen page-bg flex items-center justify-center p-4 overflow-hidden relative">
      {confettiPieces.map((p) => (
        <div
          key={p.id}
          className="absolute pointer-events-none animate-confetti-fall opacity-0"
          style={{
            left: `${p.left}%`,
            width: p.shape === 'circle' ? `${p.size}px` : `${p.size * 0.5}px`,
            height: p.shape === 'circle' ? `${p.size}px` : `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
            boxShadow: `0 0 6px ${p.color}66`,
          }}
        />
      ))}

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-300/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-pink-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-lg mx-auto">
        <div className="absolute -top-12 -left-8 animate-float">
          <PartyPopper className="text-amber-500" size={32} />
        </div>
        <div className="absolute -top-8 -right-6 animate-float" style={{ animationDelay: '0.5s' }}>
          <Sparkles className="text-pink-500" size={28} />
        </div>
        <div className="absolute top-20 -right-12 animate-float" style={{ animationDelay: '1s' }}>
          <Star className="text-amber-400 fill-amber-400" size={24} />
        </div>
        <div className="absolute bottom-20 -left-10 animate-float" style={{ animationDelay: '1.5s' }}>
          <Gift className="text-pink-500" size={26} />
        </div>
        <div className="absolute bottom-32 -right-8 animate-float" style={{ animationDelay: '2s' }}>
          <Bell className="text-rose-400" size={22} />
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 text-center border border-white/60 shadow-2xl shadow-pink-200/60 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-rose-50/80 to-transparent pointer-events-none" />

          <div className="animate-fade-in mb-4">
            <span className="inline-block text-2xl md:text-3xl font-black gradient-text animate-bounce">
              Hurray!
            </span>
          </div>

          <div className="relative mx-auto mb-8" style={{ width: 120, height: 120 }}>
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="4" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke="url(#successGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset="0"
                className="animate-[ring-fill_0.8s_ease-out_forwards]"
              />
            </svg>

            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-rose-200/60 to-pink-300/60 animate-[ping-slow_2.5s_ease-out_infinite]" />
            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-pink-200/70 to-pink-300/70 animate-pulse" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-[check-appear_0.5s_ease-out_0.3s_both]">
                <CheckCircle2 className="text-pink-500 drop-shadow-[0_0_20px_rgba(99,102,241,0.4)]" size={64} strokeWidth={1.5} />
              </div>
            </div>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <h1 className="text-4xl md:text-5xl font-black gradient-text-animated mb-2">
              Order Successful!
            </h1>
            {!orderData && (
              <div className="flex items-center justify-center gap-3 text-pink-500/80 mt-4">
                <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading order details...</span>
              </div>
            )}
          </div>

          {orderData && (
            <>
              <div className="animate-fade-in" style={{ animationDelay: '0.9s' }}>
                <div className="bg-gradient-to-br from-rose-50/70 via-pink-50/50 to-pink-50/70 rounded-2xl p-6 border border-pink-100 text-left space-y-3 my-6">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">Order ID</span>
                    <span className="font-mono text-slate-900 font-bold text-xs bg-white px-3 py-1 rounded-lg border border-pink-100 truncate max-w-[200px]">
                      {orderData.orderId}
                    </span>
                  </div>
                  <div className="h-px bg-pink-100/70" />
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">Order No</span>
                    <span className="font-mono text-slate-900 font-bold text-sm bg-white px-3 py-1 rounded-lg border border-pink-100">
                      {orderData.orderNumber || orderData.orderId}
                    </span>
                  </div>
                  <div className="h-px bg-pink-100/70" />
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Payment</span>
                    <span className="font-semibold text-slate-900">
                      {orderData.paymentMethod === 'COD' ? 'Cash on Delivery' :
                       orderData.paymentMethod === 'PayU' ? 'Online (PayU)' :
                       orderData.paymentMethod === 'Razorpay' ? 'Online (Razorpay)' : 'Online'}
                    </span>
                  </div>
                  <div className="h-px bg-pink-100/70" />
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Status</span>
                    <span className="font-bold text-emerald-500 capitalize">{orderData.orderStatus}</span>
                  </div>
                  {(() => {
                    const bd = getOrderBreakdown(orderData.orderData || orderData);
                    return (
                      <>
                        <div className="h-px bg-pink-100/70" />
                        <div className="flex justify-between">
                          <span className="text-slate-500 text-sm">Subtotal</span>
                          <span className="font-semibold text-slate-900">₹{Math.round(bd.subtotal)}</span>
                        </div>
                        <div className="h-px bg-pink-100/70" />
                        <div className="flex justify-between">
                          <span className="text-slate-500 text-sm">Platform Fee</span>
                          <span className="font-semibold text-slate-900">{bd.platformFee > 0 ? `₹${Math.round(bd.platformFee)}` : 'FREE'}</span>
                        </div>
                        <div className="h-px bg-pink-100/70" />
                        <div className="flex justify-between">
                          <span className="text-slate-500 text-sm">Delivery Fee</span>
                          <span className="font-semibold text-slate-900">{bd.delivery > 0 ? `₹${Math.round(bd.delivery)}` : 'FREE'}</span>
                        </div>
                      </>
                    );
                  })()}
                  {orderData.couponCode && (
                    <>
                      <div className="h-px bg-pink-100/70" />
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-sm">Coupon ({orderData.couponCode})</span>
                        <span className="font-semibold text-emerald-600">-₹{Math.round(Number(orderData.couponDiscount) || 0)}</span>
                      </div>
                    </>
                  )}
                  {Number(orderData.walletDiscount) > 0 && (
                    <>
                      <div className="h-px bg-pink-100/70" />
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-sm">Wallet</span>
                        <span className="font-semibold text-emerald-600">-₹{Math.round(Number(orderData.walletDiscount) || 0)}</span>
                      </div>
                    </>
                  )}
                  <div className="h-px bg-pink-100/70" />
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">Total</span>
                    <span className="text-2xl font-black gradient-text">₹{Math.round(Number(getOrderBreakdown(orderData.orderData || orderData).grandTotal) || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="animate-fade-in" style={{ animationDelay: '1.2s' }}>
                <p className="text-slate-500 text-sm mb-4">
                  Redirecting to your orders in <span className="text-slate-900 font-bold text-lg">{countdown}s</span>
                </p>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-6 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-pink-600 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(countdown / 10) * 100}%` }}
                  />
                </div>
                <button
                  onClick={goToOrders}
                  className="btn-gradient !px-8 !py-3"
                >
                  Go to Orders <ArrowRight size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <svg className="absolute w-0 h-0">
        <defs>
          <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#be185d" />
          </linearGradient>
          <style>{`
            @keyframes confetti-fall {
              0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
              10% { opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
            @keyframes ring-fill {
              0% { stroke-dashoffset: ${2 * Math.PI * 52}; }
              100% { stroke-dashoffset: 0; }
            }
            @keyframes ping-slow {
              0%, 100% { transform: scale(1); opacity: 0.4; }
              50% { transform: scale(1.15); opacity: 0.15; }
            }
            @keyframes check-appear {
              0% { opacity: 0; transform: scale(0) rotate(-30deg); }
              60% { transform: scale(1.2) rotate(5deg); }
              100% { opacity: 1; transform: scale(1) rotate(0deg); }
            }
            .animate-confetti-fall {
              animation: confetti-fall ease-in infinite;
            }
          `}</style>
        </defs>
      </svg>
    </div>
  );
};

export default OrderSuccess;



