import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { MapPin, Loader2, ArrowLeft, XCircle, HandCoins, CreditCard, Plus, X, Wallet as WalletIcon, Truck } from 'lucide-react';
import { clearAllCart, fetchCartItems, selectCartItems, selectCartLoading, selectCartError } from '../../features/cart/cartSlice';
import { logout, fetchProfile } from '../../features/auth/authSlice';
import { getAuthToken } from '../../services/apiClient';
import { AddressSelector } from './Address';
import Address from './Address';
import { createOrderAPI, createPaymentAPI, verifyPaymentAPI, updateOrderPaymentAPI, cancelOrderAPI } from '../../services/orderPaymentAPI';
import { applyCouponAPI } from '../../services/couponAPI';
import { getWalletBalance, redeemWallet, getFreeDeliveryStatus } from '../../services/walletAPI';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../ui/Toast';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from '../../utils/orderBreakdown';

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

const CheckOut = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const cartItems = useSelector(selectCartItems);
  const cartLoading = useSelector(selectCartLoading);
  const cartError = useSelector(selectCartError);
  const user = useSelector(state => state.auth.user);
  const token = useSelector(state => state.auth.token);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [checkoutStep, setCheckoutStep] = useState('initial');
  const [addressSelectorKey, setAddressSelectorKey] = useState(Date.now());
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [cartFetched, setCartFetched] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [stockInfo, setStockInfo] = useState({});
  const [noSizeProducts, setNoSizeProducts] = useState(new Set());
  const [loadingStock, setLoadingStock] = useState(false);
  const [stockChecked, setStockChecked] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);
  const [useWallet, setUseWallet] = useState(false);
  const [freeDeliveryAvailable, setFreeDeliveryAvailable] = useState(false);
  const [freeDeliveryApplied, setFreeDeliveryApplied] = useState(false);
  const isMountedRef = useRef(true);
  const createdOrderRef = useRef(null);
  const createdOrderDataRef = useRef(null);
  const paymentPollingRef = useRef(null);
  useEffect(() => {
    const scriptId = 'razorpay-checkout-js';
    if (document.getElementById(scriptId)) {
      return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
    };
    script.onerror = () => {
    };
    document.body.appendChild(script);
    return () => {
      const scriptElement = document.getElementById(scriptId);
      if (scriptElement) document.body.removeChild(scriptElement);
    };
  }, []);
  useEffect(() => {
    const authToken = getAuthToken();

    if (!authToken) {
      toast.error('Please log in to proceed to checkout.');
      dispatch(logout());
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (!user) {
      dispatch(fetchProfile());
    }
    if (cartItems.length === 0 && !cartFetched && !cartLoading) {
      dispatch(fetchCartItems()).then(() => {
        if (isMountedRef.current) setCartFetched(true);
      }).catch(() => {
        if (isMountedRef.current) setCartFetched(true);
      });
      return;
    }
    if (cartItems.length === 0 && cartFetched) {
      if (cartError) return;
      const lastOrderSuccess = localStorage.getItem('lastOrderSuccess');
      if (lastOrderSuccess) {
        navigate('/order-success', { replace: true });
      } else {
        navigate('/cart');
      }
      return;
    }
    }, [cartFetched, cartItems.length, cartLoading, cartError]);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  useEffect(() => {
    if (!token || !getAuthToken()) return;
    let cancelled = false;
    setWalletLoading(true);
    getWalletBalance()
      .then((res) => {
        if (!cancelled) setWalletBalance(Number(res.data?.balance) || 0);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setWalletLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);
  useEffect(() => {
    if (!token || !getAuthToken()) return;
    let cancelled = false;
    getFreeDeliveryStatus()
      .then((res) => {
        if (!cancelled) setFreeDeliveryAvailable(!!res.data?.available);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token]);
  useEffect(() => {
    if (cartError) {
      setErrorMsg(cartError);
    } else {
      setErrorMsg('');
    }
  }, [cartError]);
  useEffect(() => {
    if (!cartItems.length) return;
    setStockChecked(false);
    const fetchStock = async () => {
      setLoadingStock(true);
      const result = {};
      const noSizes = new Set();
      const unique = [...new Set(cartItems.map(i => i.productId?._id).filter(Boolean))];
      await Promise.all(unique.map(async (pid) => {
        try {
          const resp = await apiClient.get(`/products/${pid}`);
          const product = resp.data?.data ?? resp.data;
          const rawSizes = product?.size ?? product?.sizes ?? [];
          const normalizedSizes = Array.isArray(rawSizes)
            ? rawSizes.map(s => typeof s === 'string' ? { size: s, quantity: null } : s)
            : [];
          if (normalizedSizes.length > 0) {
            result[pid] = normalizedSizes;
          } else {
            noSizes.add(pid);
          }
        } catch {
          /* API failed — not added to result or noSizes, so isItemOutOfStock returns true */
        }
      }));
      if (isMountedRef.current) {
        setStockInfo(result);
        setNoSizeProducts(noSizes);
        setStockChecked(true);
      }
      setLoadingStock(false);
    };
    fetchStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems]);
  const getStockForItem = (item) => {
    const pid = item.productId?._id;
    const sizes = stockInfo[pid];
    if (!sizes) return null;
    const match = sizes.find(s => s.size === item.size);
    return match ?? null;
  };
  const isItemOutOfStock = (item) => {
    const pid = item.productId?._id;
    const stock = getStockForItem(item);
    if (stock === null) {
      if (noSizeProducts.has(pid)) return false;
      return true;
    }
    if (stock.quantity === null) return false;
    return stock.quantity <= 0 || stock.quantity < item.quantity;
  };
  const hasOutOfStockItems = cartItems.some(isItemOutOfStock);
  const subtotal = Math.round(cartItems.reduce((acc, item) => {
    const price = item.productId?.price || 0;
    const discount = item.productId?.discount || 0;
    const finalPrice = discount ? (price * (1 - discount / 100)) : price;
    return acc + (finalPrice * item.quantity);
  }, 0));
  const deliveryFee = freeDeliveryApplied ? 0 : (subtotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE);
  const platformFee = 0;
  const total = subtotal + deliveryFee + platformFee;
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await applyCouponAPI(couponCode.trim().toUpperCase(), total);
      setAppliedCoupon(res.data);
      setCouponCode('');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to apply coupon';
      setCouponError(msg);
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };
  const discountAmount = Math.round(appliedCoupon?.discountAmount || 0);
  const payableBeforeWallet = Math.round(total - discountAmount);
  const walletToUse = useWallet ? Math.min(walletBalance, payableBeforeWallet) : 0;
  const finalTotal = Math.round(payableBeforeWallet - walletToUse);
  const handlePaymentChange = (e) => {
    setPaymentMethod(e.target.value);
    setErrorMsg('');
    setDebugInfo('');
  };
  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setErrorMsg('');
    setDebugInfo('');
  };
  const handleCheckoutError = (err) => {
    setIsProcessing(false);
    const status = err.status || err.response?.status;
    const serverMessage = err.debug?.message || err.response?.data?.message || err.response?.data?.error;
    const serverData = err.debug || err.response?.data;
    const isNetworkError = err.code === 'ERR_NETWORK' || !err.response;
    const requestUrl = err.config?.url || err.debug?.url;
    const requestMethod = err.config?.method || err.debug?.method;
    const debugData = {
      status,
      message: serverMessage,
      fullData: typeof serverData === 'object' ? JSON.stringify(serverData) : serverData,
      url: requestUrl,
      method: requestMethod,
      isNetworkError,
      service: err.response?.data?.service || (err.config?.baseURL || ''),
      timestamp: new Date().toISOString(),
    };
    if (import.meta.env.DEV) console.error('Checkout error:', debugData);
    if (import.meta.env.DEV) setDebugInfo(JSON.stringify(debugData, null, 2));
    if (isNetworkError) {
      setErrorMsg('Payment service is unavailable. Please check that the API gateway and payment service are running, then try again.');
      return;
    }
    if (status === 502) {
      const serviceName = debugData.service || 'payment-service';
      setErrorMsg(`Payment gateway error (502): The ${serviceName} is not reachable. Ensure the service is running and the API gateway's PAYMENT_SERVICE_URL is correct.`);
      return;
    }
    if (status === 401) {
      const token = getAuthToken();
      if (token) {
        setErrorMsg(serverMessage || 'Authentication error: Your token is invalid or expired. Please log out and log back in.');
      } else {
        setErrorMsg('Your session has expired. Please log in again.');
        setTimeout(() => {
          if (isMountedRef.current) {
            dispatch(logout());
            navigate('/login', { state: { from: location.pathname } });
          }
        }, 3000);
      }
      return;
    }
    if (status === 400) {
      setErrorMsg(serverMessage || 'Invalid request. Please check your details.');
      return;
    }
    if (status === 404) {
      setErrorMsg(serverMessage || 'Payment endpoint not found. The deployed service may need updating.');
      return;
    }
    if (status >= 500) {
      setErrorMsg(serverMessage || 'Payment server error. Please try again later.');
      return;
    }
    const detailedError = serverMessage || err.message || 'An error occurred. Please try again.';
    setErrorMsg(detailedError);
  };
  const checkPaymentServiceHealth = async () => {
    try {
      const resp = await apiClient.get('/payments/health', { timeout: 5000 });
      const data = resp.data;
      if (data.status !== 'healthy' && data.status !== 'OK') {
        console.warn('[checkPaymentServiceHealth] Payment service degraded:', data);
      }
      return data;
    } catch (err) {
      const status = err.response?.status;
      const gwMsg = err.response?.data?.message || err.response?.data?.error;
      console.error('[checkPaymentServiceHealth] Payment service unreachable:', {
        status,
        message: gwMsg || err.message,
        target: err.response?.data?.target,
      });
      if (status === 502) {
        throw new Error(`Payment service is not reachable (gateway 502). ${gwMsg || 'Ensure the API gateway and payment-service are running.'}`);
      }
      if (!err.response) {
        throw new Error('Cannot reach API gateway. Ensure the backend is running.');
      }
      throw err;
    }
  };

  const createOrder = async () => {
    try {
      setCheckoutStep('creating');
      const items = cartItems.map(item => ({
        productId: item.productId._id,
        name: item.productId.name,
        image: Array.isArray(item.productId.image)
          ? item.productId.image[0]?.url || item.productId.image[0]
          : item.productId.image,
        size: item.size,
        quantity: item.quantity,
        price: item.productId.price,
      }));
      const pmMap = { razorpay: 'RAZORPAY', cod: 'COD' };
      const orderPayload = {
        items,
        addressId: selectedAddress._id,
        shippingAddress: selectedAddress,
        itemsPrice: subtotal,
        shippingPrice: deliveryFee,
        platformFee,
        walletDiscount: walletToUse || undefined,
        totalAmount: finalTotal,
        paymentMethod: pmMap[paymentMethod] || 'COD',
        couponCode: appliedCoupon?.code || undefined,
        couponDiscount: discountAmount || undefined,
        freeDelivery: freeDeliveryApplied || undefined,
      };
      const orderResponse = await createOrderAPI(orderPayload);
      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.message || 'Failed to create order');
      }
      const orderData = orderResponse.data;
      const orderId = orderData._id;
      const orderNumber = orderData.orderNumber;
      const orderStatus = orderData.status;
      if (walletToUse > 0) {
        try {
          await redeemWallet(walletToUse, orderId);
          setWalletBalance((b) => Math.max(0, b - walletToUse));
        } catch (e) {
          try {
            await cancelOrderAPI(orderId);
          } catch {
            // best-effort cleanup — the order stays PENDING_PAYMENT/PLACED
          }
          throw new Error(
            e.response?.data?.message || e.message || 'Wallet redemption failed. Your order was not placed. Please try again.'
          );
        }
      }
      if (orderResponse.warnings?.stock?.length) {
        setErrorMsg('Order created but stock update had issues: ' + orderResponse.warnings.stock.join('; '));
      }
      if (freeDeliveryApplied) {
        setFreeDeliveryApplied(false);
        setFreeDeliveryAvailable(false);
      }
      return { orderId, orderNumber, orderStatus, orderData };
    } catch (err) {
      throw err;
    }
  };
  const handleCODPayment = async (orderId, orderNumber, orderData) => {
    try {
      try {
        await dispatch(clearAllCart()).unwrap();
      } catch (e) {
      }
      const successData = {
        orderId,
        orderNumber,
        orderData,
        paymentMethod: 'COD',
        orderStatus: 'PLACED',
        paymentStatus: 'PENDING',
        totalAmount: finalTotal,
        couponCode: appliedCoupon?.code || null,
        couponDiscount: discountAmount || 0,
        walletDiscount: walletToUse || 0,
      };
      localStorage.setItem('lastOrderSuccess', JSON.stringify(successData));
      if (isMountedRef.current) {
        setOrderSuccess(successData);
      }
      navigate('/order-success', { replace: true });
    } catch (err) {
      throw err;
    }
  };
  const handleRazorpayPayment = async (userId) => {
    try {
      setCheckoutStep('creating');
      const { orderId, orderNumber, orderData } = await createOrder();
      createdOrderRef.current = orderId;
      createdOrderDataRef.current = orderData;

      setCheckoutStep('processing');
      const paymentPayload = { orderId, amount: finalTotal, currency: 'INR' };
      const paymentResponse = await createPaymentAPI(paymentPayload);
      if (!paymentResponse.success || !paymentResponse.data) {
        throw new Error(paymentResponse.message || 'Failed to create Razorpay payment');
      }
      const paymentId = paymentResponse.data._id;
      const razorpayOrderId = paymentResponse.data?.id;
      const razorpayKeyId = paymentResponse.key_id;
      const razorpayAmountPaise = paymentResponse.amountPaise;
      if (!razorpayOrderId) {
        throw new Error('Failed to create Razorpay order - Missing order ID');
      }
      if (!window.Razorpay) {
        throw new Error('Razorpay script not loaded. Please refresh the page.');
      }
      const onRazorpaySuccess = async (response) => {
        try {
          const verifyPayload = {
            orderId,
            paymentId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          };
          const verifyResult = await verifyPaymentAPI(verifyPayload);
          if (verifyResult?.data?.status === 'paid') {
            try {
              await updateOrderPaymentAPI(orderId, {
                paymentId: response.razorpay_payment_id,
                paymentStatus: 'PAID',
                orderStatus: 'CONFIRMED',
                orderNumber,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              });
            } catch {}
          }
          try {
            await dispatch(clearAllCart()).unwrap();
          } catch (e) {}
          const razorpaySuccessData = {
            orderId,
            orderNumber,
            orderData,
            paymentMethod: 'Razorpay',
            orderStatus: 'CONFIRMED',
            paymentStatus: 'PAID',
            totalAmount: finalTotal,
            couponCode: appliedCoupon?.code || null,
            couponDiscount: discountAmount || 0,
            walletDiscount: walletToUse || 0,
          };
          localStorage.setItem('lastOrderSuccess', JSON.stringify(razorpaySuccessData));
          if (isMountedRef.current) {
            setOrderSuccess(razorpaySuccessData);
          }
          navigate('/order-success', { replace: true });
        } catch (verifyErr) {
          handleCheckoutError(verifyErr);
        }
      };
      const onRazorpayCancel = () => {
        setErrorMsg('Payment cancelled. Your order (#' + orderNumber + ') has been created but payment is pending. You can retry from your orders page.');
        setIsProcessing(false);
        setCheckoutStep('initial');
      };
      const onRazorpayError = (error) => {
        setErrorMsg(`Payment failed: ${error.description || 'Unknown error'}. Your order (#' + orderNumber + ') has been created but payment is pending.`);
        setIsProcessing(false);
        setCheckoutStep('initial');
      };
      const contactNumber = (selectedAddress.phone || selectedAddress.phoneNumber || user?.phone || '').replace(/\D/g, '').slice(0, 10);
      const options = {
        key: razorpayKeyId || RAZORPAY_KEY_ID,
        amount: razorpayAmountPaise,
        currency: 'INR', // Do not change
        name: 'ChooseMood',
        description: `Payment for Order #${orderNumber}`,
        image: '/logo.png',
        order_id: razorpayOrderId,
        handler: onRazorpaySuccess,
        prefill: {
          name: selectedAddress.fullName || user?.name || '',
          email: selectedAddress.email || user?.email || '',
          contact: contactNumber,
        },
        notes: { user_id: userId, orderId, orderNumber },
        theme: { color: '#db2777' },
        modal: { ondismiss: onRazorpayCancel },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'All UPI Options',
                instruments: [
                  { method: 'upi' }
                ]
              }
            },
            preferences: {
              show_default_blocks: true
            }
          }
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', onRazorpayError);
      rzp.open();
    } catch (err) {
      throw err;
    }
  };
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    const authToken = getAuthToken();

    if (!authToken) {
      setErrorMsg('Your session has expired. Please log in again.');
      setTimeout(() => {
        dispatch(logout());
        navigate('/login', { state: { from: location.pathname } });
      }, 1000);
      return;
    }
    let currentUser = user;
    if (!currentUser?._id && authToken) {
      try {
        const profileData = await dispatch(fetchProfile()).unwrap();
        currentUser = profileData;
      } catch (profileErr) {
        setErrorMsg('Failed to load user information. Please try logging in again.');
        return;
      }
    }
    if (!selectedAddress || !currentUser?._id) {
      const error = !selectedAddress ? 'Please select a delivery address.' : 'User information not found. Please log in again.';
      setErrorMsg(error);
      return;
    }
    setIsProcessing(true);
    setErrorMsg('');
    setDebugInfo('');
    try {
      const outOfStockItems = cartItems.filter(isItemOutOfStock);
      if (outOfStockItems.length > 0) {
        const names = outOfStockItems.map(i => `${i.productId.name} (${i.size})`).join(', ');
        throw new Error(`Some items are out of stock: ${names}`);
      }
      if (paymentMethod === 'cod') {
        const { orderId, orderNumber, orderData } = await createOrder();
        createdOrderRef.current = orderId;
        createdOrderDataRef.current = orderData;
        await handleCODPayment(orderId, orderNumber, orderData);
      } else if (paymentMethod === 'razorpay') {
        await handleRazorpayPayment(currentUser._id);
      }
    } catch (err) {
      handleCheckoutError(err);
    }
  };
  return (
    <div className="min-h-screen page-bg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <button onClick={() => navigate('/cart')} className="btn-outline !py-2 !px-4 mb-6 !text-sm">
          <ArrowLeft size={18} /> Back to Cart
        </button>
        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            {/* Left Column: Shipping & Payment */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-8">
              {/* Shipping Address */}
              <div className="card !p-4 sm:!p-6">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-2"><MapPin size={18} className="text-pink-600" /> Shipping Address</h2>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button type="button" onClick={() => setShowAddressModal(true)} className="flex items-center gap-1 text-xs sm:text-sm font-bold text-pink-600 hover:underline">
                      <Plus size={14} /> Add Address
                    </button>
                    <button type="button" onClick={() => navigate('/addresses')} className="text-xs sm:text-sm font-bold text-pink-600 hover:underline">Manage</button>
                  </div>
                </div>
                <AddressSelector key={addressSelectorKey} onSelect={handleAddressSelect} />
              </div>
              {/* Payment Method */}
              <div className="card !p-4 sm:!p-6">
                <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2"><CreditCard size={18} className="text-pink-600" /> Payment Method</h2>
                <div className="space-y-3 sm:space-y-4">
                  <label className={`flex items-center p-3 sm:p-4 rounded-2xl border-2 cursor-pointer transition ${paymentMethod === 'razorpay' ? 'border-pink-500 bg-gradient-to-r from-rose-50/60 to-pink-50/60 shadow-md shadow-pink-100' : 'border-slate-200 bg-white hover:border-pink-200'}`}>
                    <input type="radio" name="paymentMethod" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={handlePaymentChange} disabled={isProcessing} className="h-4 w-4 text-pink-600 border-gray-300 focus:ring-pink-500" />
                    <div className="ml-3 sm:ml-4 flex-1 flex items-center gap-2 sm:gap-3">
                      <CreditCard size={18} className="text-pink-600 shrink-0" />
                      <span className="font-bold text-gray-800 text-sm sm:text-base">Online Payment (Razorpay)</span>
                    </div>
                  </label>

                  <label className={`flex items-center p-3 sm:p-4 rounded-2xl border-2 cursor-pointer transition ${paymentMethod === 'cod' ? 'border-pink-500 bg-gradient-to-r from-rose-50/60 to-pink-50/60 shadow-md shadow-pink-100' : 'border-slate-200 bg-white hover:border-pink-200'}`}>
                    <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={handlePaymentChange} disabled={isProcessing} className="h-4 w-4 text-pink-600 border-gray-300 focus:ring-pink-500" />
                    <div className="ml-3 sm:ml-4 flex-1 flex items-center gap-2 sm:gap-3">
                      <HandCoins size={18} className="text-green-600 shrink-0" />
                      <span className="font-bold text-gray-800 text-sm sm:text-base">Cash on Delivery</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            {/* Right Column: Order Summary */}
            <div className="lg:col-span-1">
              <div className="card !p-4 sm:!p-6 sticky top-24 border-pink-50">
                <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 inline-block" />
                  Order Summary
                </h2>
                {/* Checkout Progress */}
                {isProcessing && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-600">
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      <span className="font-semibold">
                        {checkoutStep === 'creating' && 'Creating order...'}
                        {checkoutStep === 'processing' && 'Processing payment...'}
                      </span>
                    </div>
                  </div>
                )}
                <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                  {cartItems.map(item => {
                    const outOfStock = isItemOutOfStock(item);
                    return (
                    <div key={item.productId._id + item.size} className={`flex gap-3 items-start text-xs sm:text-sm pb-3 border-b border-slate-100 ${outOfStock ? 'opacity-60' : ''}`}>
                      <Link
                        to={`/product/${item.productId._id || item.productId.id}`}
                        className="flex-shrink-0 relative block"
                      >
                        <img 
                          src={Array.isArray(item.productId.image) 
                            ? item.productId.image[0]?.url || item.productId.image[0] 
                            : item.productId.image} 
                          alt={item.productId.name}
                          className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg bg-slate-100 ring-1 ring-slate-100"
                        />
                        {outOfStock && (
                          <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                            <span className="text-[8px] sm:text-[10px] font-bold text-white bg-rose-600 px-1 py-0.5 rounded">OUT</span>
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/product/${item.productId._id || item.productId.id}`} className="block">
                          <p className="text-gray-800 font-semibold truncate text-sm hover:text-pink-600 transition">{item.productId.name}</p>
                        </Link>
                        <p className="text-gray-500 text-xs">Size: {item.size || 'default'}</p>
                        <p className="text-gray-600 text-xs mt-1">Qty: {item.quantity}</p>
                        {outOfStock && (
                          <p className="text-[10px] font-semibold text-rose-600 mt-0.5">Out of Stock</p>
                        )}
                      </div>
                      <span className="font-bold gradient-text flex-shrink-0 text-xs sm:text-sm">₹{Math.round(((item.productId?.discount ? item.productId.price * (1 - item.productId.discount / 100) : item.productId?.price ?? 0)) * (item.quantity || 1))}</span>
                    </div>
                    );
                  })}
                </div>
                {/* Coupon */}
                <div className="border-t border-slate-100 pt-3 sm:pt-4 mb-3">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-green-800">{appliedCoupon.code}</p>
                        <p className="text-xs text-green-600 truncate">{appliedCoupon.description || `${appliedCoupon.discountType === 'percentage' ? appliedCoupon.discountValue + '%' : '₹' + appliedCoupon.discountValue} off`}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-green-700">-₹{discountAmount}</span>
                        <button type="button" onClick={handleRemoveCoupon} className="text-rose-500 hover:text-rose-700 text-xs font-semibold">Remove</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                        className="input !py-2 !text-sm uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={!couponCode.trim() || couponLoading}
                        className="btn-gradient !px-4 !py-2 !text-sm"
                      >
                        {couponLoading ? <Loader2 className="animate-spin" size={16} /> : 'Apply'}
                      </button>
                    </div>
                  )}
                  {couponError && <p className="text-xs text-rose-600 mt-1">{couponError}</p>}
                </div>
                {/* Wallet Redeem */}
                <div className="border-t border-slate-100 pt-3 sm:pt-4 mb-3">
                  <div className="rounded-2xl border border-pink-100 bg-gradient-to-br from-rose-50/70 to-pink-50/70 p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-2 rounded-xl shrink-0"><WalletIcon size={16} /></div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">Redeem Wallet</p>
                          <p className="text-xs text-gray-500">
                            {walletLoading ? 'Loading balance...' : `Available: ₹${walletBalance}`}
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useWallet && walletBalance > 0}
                          disabled={walletBalance <= 0 || isProcessing}
                          onChange={(e) => setUseWallet(e.target.checked)}
                          className="h-4 w-4 text-pink-600 border-gray-300 focus:ring-pink-500 rounded"
                        />
                        <span className="text-xs sm:text-sm font-bold text-pink-600">Apply</span>
                      </label>
                    </div>
                    {walletBalance > 0 && payableBeforeWallet > 0 && (
                      <p className="text-[11px] text-gray-500 mt-2">
                        {walletToUse > 0
                          ? `₹${walletToUse} will be deducted from your wallet.`
                          : 'Apply your wallet balance to reduce your payable amount.'}
                      </p>
                    )}
                  </div>
                </div>
                {freeDeliveryAvailable && (
                  <div className="border-t border-slate-100 pt-3 sm:pt-4 mb-3">
                    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-teal-50/70 p-3 sm:p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-2 rounded-xl shrink-0"><Truck size={16} /></div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">Free Delivery Coupon</p>
                            <p className="text-xs text-gray-500">You won FREE delivery — apply it to skip the delivery fee.</p>
                          </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={freeDeliveryApplied}
                            disabled={isProcessing}
                            onChange={(e) => setFreeDeliveryApplied(e.target.checked)}
                            className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500 rounded"
                          />
                          <span className="text-xs sm:text-sm font-bold text-emerald-600">Apply</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-3 sm:space-y-4 border-t border-slate-100 pt-3 sm:pt-4">
                  <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-900">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                    <span>Delivery Fee</span>
                    <span className="font-semibold text-gray-900">{deliveryFee > 0 ? `₹${deliveryFee}` : 'FREE'}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                    <span>Platform Fee</span>
                    <span className="font-semibold text-gray-900">{platformFee > 0 ? `₹${platformFee}` : 'FREE'}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600 text-sm sm:text-base">
                      <span>Coupon Discount</span>
                      <span className="font-semibold">-₹{discountAmount}</span>
                    </div>
                  )}
                  {walletToUse > 0 && (
                    <div className="flex justify-between text-green-600 text-sm sm:text-base">
                      <span>Wallet Redemption</span>
                      <span className="font-semibold">-₹{walletToUse}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-100 pt-3 sm:pt-4 flex justify-between items-center">
                    <span className="text-base sm:text-lg font-extrabold text-gray-900">Total</span>
                    <span className="text-xl sm:text-2xl font-extrabold gradient-text">₹{finalTotal}</span>
                  </div>
                </div>
                    {errorMsg && (
                  <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle size={16} />
                      <span className="font-semibold">Error</span>
                    </div>
                    <p>{errorMsg}</p>
                    {cartError && (
                      <button
                        type="button"
                        onClick={() => { setCartFetched(false); dispatch(fetchCartItems()); }}
                        className="mt-2 text-xs font-semibold text-rose-800 underline hover:text-rose-900"
                      >
                        Retry loading cart
                      </button>
                    )}
                    {debugInfo && (
                      <details className="mt-2 text-xs">
                        <summary className="cursor-pointer underline">Debug Info</summary>
                        <pre className="mt-1 bg-white p-2 rounded overflow-auto max-h-48 text-gray-700">
                          {debugInfo}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isProcessing || !selectedAddress || !!cartError || hasOutOfStockItems || loadingStock || (cartItems.length > 0 && !stockChecked)}
                  className="btn-gradient w-full mt-4 sm:mt-6 !py-3.5 !text-base"
                >
                  {loadingStock || (cartItems.length > 0 && !stockChecked) ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Checking stock...
                    </>
                  ) : hasOutOfStockItems ? (
                    'Out of Stock'
                  ) : isProcessing ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Processing...
                    </>
                  ) : paymentMethod === 'cod' ? 'Place Order' : 'Proceed to Payment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {showAddressModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setShowAddressModal(false)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl relative my-4 sm:my-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowAddressModal(false)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-600 transition"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <Address
              isModal
              onClose={() => {
                setShowAddressModal(false);
                setAddressSelectorKey(Date.now());
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
export default CheckOut;
