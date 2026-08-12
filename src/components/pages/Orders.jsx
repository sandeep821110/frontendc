import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import BrandLoader from '../BrandLoader';
import { Package, XCircle, ChevronRight, Calendar, IndianRupee, CreditCard, Clock, Download, MapPin, Truck, Star } from 'lucide-react';
import { logout } from '../../features/auth/authSlice';
import { createApiClient } from '../../services/apiClient';
import { cancelOrderAPI } from '../../services/orderPaymentAPI';
import { downloadInvoice } from '../../utils/downloadInvoice';
import { getOrderBreakdown } from '../../utils/orderBreakdown';
import { getMyReviewsAPI } from '../../services/reviewAPI';
import WriteReviewModal from '../reviews/WriteReviewModal';

const ordersApi = createApiClient('/api/orders');
const trackingApi = createApiClient('/api/tracking');

const statusColors = {
  placed: 'bg-rose-100 text-rose-800',
  pending_payment: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-pink-100 text-pink-800',
  paid: 'bg-green-100 text-green-800',
  shipped: 'bg-pink-100 text-pink-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const paymentLabels = {
  razorpay: 'Online Payment (Razorpay)',
  payu: 'Online Payment (PayU)',
  cod: 'Cash on Delivery',
};

const ORDER_STATUS = ['order_placed', 'order_confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

const statusBadge = (s) => {
  const map = {
    order_placed: 'bg-rose-100 text-rose-800',
    order_confirmed: 'bg-pink-100 text-pink-800',
    processing: 'bg-yellow-100 text-yellow-800',
    packed: 'bg-pink-100 text-pink-800',
    shipped: 'bg-orange-100 text-orange-800',
    out_for_delivery: 'bg-pink-100 text-pink-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    returned: 'bg-gray-100 text-gray-800',
  };
  return map[s] || 'bg-gray-100 text-gray-800';
};

const STATUS_LABELS = {
  order_placed: 'Placed', order_confirmed: 'Confirmed', processing: 'Processing',
  packed: 'Packed', shipped: 'Shipped', out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered', cancelled: 'Cancelled', returned: 'Returned',
};

const getItemProductId = (item) => item.productId || item.id || item.product?._id || item.product?.id || '';

const getProductLinkId = (item) => {
  const raw = item.productId || item.product;
  if (raw && typeof raw === 'object') return raw._id || raw.id || '';
  return raw || item.product?._id || item.product?.id || '';
};

const getItemImage = (item) => {
  const img = [].concat(item.image || item.productImage || item.product?.image || item.product?.images || []).filter(Boolean);
  return typeof img[0] === 'object' ? img[0]?.url : img[0];
};

const Orders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trackingMap, setTrackingMap] = useState({});
  const [selectedTracking, setSelectedTracking] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const [reviewsByProduct, setReviewsByProduct] = useState({});
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const fetchMyReviews = useCallback(async () => {
    try {
      const res = await getMyReviewsAPI();
      const map = {};
      (res.reviews || []).forEach((r) => { map[String(r.productId)] = r; });
      setReviewsByProduct(map);
    } catch {
      // reviews are optional; ignore failures
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await ordersApi.get('/');
      const orderList = res.data.orders || res.data.data || res.data;
      setOrders(orderList);

      fetchMyReviews();

      // Fetch tracking info for each order
      const map = {};
      const results = await Promise.allSettled(
        orderList.map(async order => {
          const uid = order._id || order.id;
          if (!uid) return null;
          try {
            const r = await trackingApi.get(`/my-orders/${uid}`);
            return r.data?.data || null;
          } catch {
            const num = order.orderNumber || order.orderId;
            if (!num) return null;
            try {
              const r = await trackingApi.get(`/by-order/${encodeURIComponent(num)}`);
              return r.data?.data || null;
            } catch {
              return null;
            }
          }
        })
      );
      results.forEach((result, i) => {
        if (result.status === 'fulfilled' && result.value) {
          const order = orderList[i];
          map[order._id] = result.value;
        }
      });
      setTrackingMap(map);
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message || err.response?.data?.error;
      if (err.code === 'ERR_NETWORK') {
        // Silently handle cancel error
      } else if (status === 401) {
        setError('Your session has expired. Please log in again.');
        setTimeout(() => {
          dispatch(logout());
          navigate('/login', { state: { from: location.pathname } });
        }, 2000);
        return;
      }
      setError(serverMsg || `Error fetching orders (${status || 'network error'}).`);
    } finally {
      setLoading(false);
    }
  }, [dispatch, navigate, location.pathname, fetchMyReviews]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const openTracking = (tracking) => {
    setSelectedTracking(tracking);
    setShowTrackingModal(true);
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancellingId(orderId);
    try {
      await cancelOrderAPI(orderId);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: 'CANCELLED', status: 'cancelled' } : o));
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to cancel order';
      alert(msg);
    } finally {
      setCancellingId(null);
    }
  };

  const openReview = (item, orderId) => {
    setReviewTarget({ item, orderId });
    setReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setReviewTarget(null);
  };

  const isDelivered = (order) => (order.orderStatus || order.status || '').toLowerCase() === 'delivered';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center page-bg">
        <BrandLoader text="Loading orders..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen page-bg py-6 sm:py-12 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-pink-700 flex items-center justify-center shadow-lg shadow-pink-500/30">
            <Package className="text-white w-6 h-6" size={28} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900">My Orders</h1>
            <span className="chip bg-gradient-to-r from-rose-100 to-pink-100 text-pink-700 font-bold mt-1">
              {orders.length} Orders
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
            <XCircle className="text-rose-600 shrink-0" size={20} />
            <span className="text-rose-700 font-semibold">{error}</span>
          </div>
        )}

        {error && orders.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-50 flex items-center justify-center mb-3">
              <XCircle className="text-rose-400" size={40} />
            </div>
            <p className="text-rose-600 font-bold text-lg">Failed to load orders</p>
            <p className="text-gray-500 mt-1">Please check your connection and try again.</p>
            <button
              onClick={fetchOrders}
              className="btn-gradient !px-6 !py-2.5 mt-4"
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
            <div className="card p-6 sm:p-12 text-center">
            <div className="bg-gradient-to-br from-rose-100 via-pink-100 to-pink-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-inner">
              <Package className="text-pink-600 w-6 h-6 sm:w-8 sm:h-8" size={32} />
            </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base">Start shopping to see your orders here.</p>
            <Link
              to="/"
              className="btn-gradient !px-8 !py-3 !text-sm sm:!text-base"
            >
              Browse Products <ChevronRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const tracking = trackingMap[order._id];
              return (
              <div key={order._id} className="card card-hover !p-4 sm:!p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar size={14} /> {formatDate(order.createdAt)}
                    </span>
                    <span className="text-sm font-mono text-gray-400">{order.orderNumber || `#${order._id?.slice(-8)}`}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {['PLACED', 'PENDING_PAYMENT'].includes((order.orderStatus || order.status || '').toUpperCase()) && (
                      <button
                        onClick={() => handleCancel(order._id)}
                        disabled={cancellingId === order._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 rounded-full hover:bg-rose-100 transition disabled:opacity-50"
                        title="Cancel Order"
                      >
                        {cancellingId === order._id ? '...' : 'Cancel'}
                      </button>
                    )}
                    <button
                      onClick={() => downloadInvoice(order)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-pink-600 bg-gradient-to-r from-rose-100 to-pink-100 rounded-full hover:brightness-95 transition"
                      title="Download Invoice"
                    >
                      <Download size={14} /> Invoice
                    </button>
                    <span className={`chip !px-3 !py-1 font-bold uppercase ${statusColors[(order.orderStatus || order.status || '').toLowerCase()] || 'bg-slate-100 text-slate-800'}`}>
                      {(order.orderStatus || order.status || 'PENDING').replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-3">
                  {(order.items || order.products || []).map((item, idx) => {
                    const img = [].concat(item.image || item.productImage || item.product?.image || item.product?.images || []).filter(Boolean);
                    const src = typeof img[0] === 'object' ? img[0]?.url : img[0];
                    return (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Link to={`/product/${getProductLinkId(item)}`} className="shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-pink-100 rounded-xl flex items-center justify-center overflow-hidden">
                            {src ? (
                              <img src={src} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<svg class="w-5 h-5 text-pink-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16.5 7.5C16.5 9.985 14.485 12 12 12S7.5 9.985 7.5 7.5 9.515 3 12 3s4.5 2.015 4.5 4.5z"/><path d="M3 21c0-4.97 4.03-9 9-9s9 4.03 9 9"/></svg>'; }} />
                            ) : (
                              <Package className="text-pink-600" size={20} />
                            )}
                          </div>
                        </Link>
                        <div>
                          <Link to={`/product/${getProductLinkId(item)}`} className="block">
                            <p className="font-semibold text-gray-800 hover:text-pink-600 transition">{item.name || item.product?.name || `Item ${idx + 1}`}</p>
                          </Link>
                          <p className="text-sm text-gray-500">Qty: {item.quantity || item.qty || 1}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold gradient-text">
                          <IndianRupee size={14} className="inline" />{Math.round((item.price || item.product?.price || 0) * (item.quantity || item.qty || 1))}
                        </p>
                        {isDelivered(order) && (
                          <button
                            onClick={() => openReview(item, order._id || order.id)}
                            className={`mt-1.5 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full transition ${
                              reviewsByProduct[String(getItemProductId(item))]
                                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                            }`}
                          >
                            <Star size={12} className={reviewsByProduct[String(getItemProductId(item))] ? 'fill-current' : ''} />
                            {reviewsByProduct[String(getItemProductId(item))] ? 'Reviewed · Edit' : 'Rate & Review'}
                          </button>
                        )}
                      </div>
                    </div>
                    );
                  })}
                  </div>

                  {tracking && tracking.shippingAddressSnapshot && (
                    <div className="border-t border-slate-100 mt-4 pt-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                            <MapPin size={12} /> Shipping Address
                          </div>
                          <p className="font-semibold text-gray-800 text-sm">{tracking.shippingAddressSnapshot.fullName}</p>
                          <p className="text-xs text-gray-600">{tracking.shippingAddressSnapshot.addressLine1}{tracking.shippingAddressSnapshot.addressLine2 ? ", " + tracking.shippingAddressSnapshot.addressLine2 : ""}</p>
                          <p className="text-xs text-gray-600">{[tracking.shippingAddressSnapshot.city, tracking.shippingAddressSnapshot.state, tracking.shippingAddressSnapshot.postalCode].filter(Boolean).join(", ")}</p>
                          <p className="text-xs text-rose-500 font-semibold">{tracking.shippingAddressSnapshot.phoneNumber}</p>
                        </div>
                        <button
                          onClick={() => openTracking(tracking)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-green-600 bg-green-50 rounded-full hover:bg-green-100 transition shrink-0 self-start"
                        >
                          <Truck size={14} /> {tracking.trackingNumber}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-100 mt-4 pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          {order.paymentMethod === 'cod' ? <Clock size={14} /> : <CreditCard size={14} />}
                          {paymentLabels[order.paymentMethod] || order.paymentMethod || 'N/A'}
                        </span>
                        {order.paymentStatus && (
                          <span className={`chip !px-2 !py-0.5 font-bold ${
                            ['PAID', 'CONFIRMED', 'COMPLETED'].includes(order.paymentStatus?.toUpperCase())
                              ? 'bg-green-100 text-green-700'
                              : order.paymentStatus?.toUpperCase() === 'FAILED'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.paymentStatus.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      {(() => {
                        const bd = getOrderBreakdown(order);
                        return (
                          <>
                            <div className="flex justify-between text-gray-500">
                              <span>Subtotal</span>
                              <span>₹{Math.round(bd.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                              <span>Platform Fee</span>
                              <span>{bd.platformFee > 0 ? `₹${Math.round(bd.platformFee)}` : 'FREE'}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                              <span>Delivery Fee</span>
                              <span>{bd.delivery > 0 ? `₹${Math.round(bd.delivery)}` : 'FREE'}</span>
                            </div>
                            {bd.couponDiscount > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Coupon {order.couponCode ? `(${order.couponCode})` : ''}</span>
                                <span>-₹{Math.round(bd.couponDiscount)}</span>
                              </div>
                            )}
                            {bd.walletDiscount > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Wallet</span>
                                <span>-₹{Math.round(bd.walletDiscount)}</span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-100 mt-2 pt-2">
                      <p className="text-sm text-gray-500 font-semibold">Total</p>
                      <p className="text-xl font-extrabold gradient-text">
                        <IndianRupee size={16} className="inline" />{Math.round(Number(getOrderBreakdown(order).grandTotal))}
                      </p>
                    </div>
                  </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tracking Detail Modal */}
      {showTrackingModal && selectedTracking && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl ring-1 ring-slate-100 max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-rose-700 via-pink-600 to-pink-800 text-white p-5 rounded-t-3xl flex justify-between items-center sticky top-0">
              <div>
                <h2 className="text-lg font-bold">Order Tracking</h2>
                <p className="text-pink-200 text-sm font-mono mt-0.5">{selectedTracking.trackingNumber}</p>
              </div>
              <button onClick={() => setShowTrackingModal(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition text-2xl leading-none">&times;</button>
            </div>

            <div className="p-5 space-y-5">
              {/* Current Status */}
              <div className="bg-gradient-to-r from-rose-50/60 to-pink-50/60 p-4 rounded-xl border border-pink-100/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-500 font-medium">Current Status</span>
                  <span className={`chip !px-3 !py-1 font-bold ${statusBadge(selectedTracking.status)}`}>
                    {STATUS_LABELS[selectedTracking.status] || selectedTracking.status}
                  </span>
                </div>
                {selectedTracking.currentLocation && (
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <MapPin size={14} /> {selectedTracking.currentLocation}
                  </p>
                )}
              </div>

              {/* Timeline */}
              {selectedTracking.trackingHistory?.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-800 mb-3">Timeline</h3>
                  <div className="space-y-0">
                    {[...selectedTracking.trackingHistory].reverse().map((h, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-green-600' : 'bg-gray-300'} ring-2 ring-white`}></div>
                          {i < selectedTracking.trackingHistory.length - 1 && <div className="w-0.5 h-full min-h-[2rem] bg-gray-200"></div>}
                        </div>
                        <div className={`pb-4 ${i === 0 ? '' : 'pt-1'}`}>
                          <div className="flex items-center gap-2">
                            <span className={`chip !px-2 !py-0.5 ${statusBadge(h.status)}`}>
                              {STATUS_LABELS[h.status] || h.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {h.timestamp ? new Date(h.timestamp).toLocaleString() : ''}
                            </span>
                          </div>
                          {h.location && <p className="text-xs text-gray-600 mt-0.5">{h.location}</p>}
                          {h.description && <p className="text-xs text-gray-500 mt-0.5">{h.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Carrier Info */}
              {selectedTracking.carrier?.name && (
                <div className="bg-gradient-to-r from-rose-50/60 to-pink-50/60 p-4 rounded-xl border border-pink-100/60">
                  <h3 className="font-semibold text-gray-700 text-sm mb-1">Carrier</h3>
                  <p className="text-gray-800 font-medium">{selectedTracking.carrier.name}</p>
                  {selectedTracking.carrier.contactNumber && (
                    <p className="text-sm text-gray-500">{selectedTracking.carrier.contactNumber}</p>
                  )}
                </div>
              )}

              {/* Estimated Delivery */}
              {selectedTracking.estimatedDeliveryDate && (
                <div className="bg-gradient-to-r from-rose-50/60 to-pink-50/60 p-4 rounded-xl border border-pink-100/60">
                  <h3 className="font-semibold text-gray-700 text-sm mb-1">Estimated Delivery</h3>
                  <p className="text-gray-800 font-medium">{new Date(selectedTracking.estimatedDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              )}

              {/* Delivery Attempts */}
              {selectedTracking.deliveryAttempts?.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">Delivery Attempts</h3>
                  <div className="space-y-2">
                    {selectedTracking.deliveryAttempts.map((a, i) => (
                      <div key={i} className="card !p-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className={`chip !px-2 !py-0.5 ${
                            a.status === 'successful' ? 'bg-green-100 text-green-800' :
                            a.status === 'failed' ? 'bg-rose-100 text-rose-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>{a.status}</span>
                          <span className="text-xs text-gray-500">{a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}</span>
                        </div>
                        {a.reason && <p className="text-xs text-gray-600 mt-1">{a.reason}</p>}
                        {a.nextAttemptDate && <p className="text-xs text-gray-500 mt-1">Next: {new Date(a.nextAttemptDate).toLocaleDateString()}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shipping Address */}
              {selectedTracking.shippingAddressSnapshot && (
                <div className="bg-gradient-to-r from-rose-50/60 to-pink-50/60 p-4 rounded-xl border border-pink-100/60">
                  <h3 className="font-semibold text-gray-700 text-sm mb-1">Shipping Address</h3>
                  <p className="font-medium text-gray-800">{selectedTracking.shippingAddressSnapshot.fullName}</p>
                  <p className="text-sm text-gray-600">
                    {selectedTracking.shippingAddressSnapshot.addressLine1}
                    {selectedTracking.shippingAddressSnapshot.addressLine2 ? `, ${selectedTracking.shippingAddressSnapshot.addressLine2}` : ''}
                  </p>
                  <p className="text-sm text-gray-600">
                    {[selectedTracking.shippingAddressSnapshot.city, selectedTracking.shippingAddressSnapshot.state, selectedTracking.shippingAddressSnapshot.postalCode].filter(Boolean).join(', ')}
                  </p>
                  <p className="text-sm text-rose-500 font-semibold">{selectedTracking.shippingAddressSnapshot.phoneNumber}</p>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100">
              <button
                onClick={() => setShowTrackingModal(false)}
                className="btn-dark w-full !py-3"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && reviewTarget && (
        <WriteReviewModal
          open={reviewModalOpen}
          onClose={closeReviewModal}
          product={{
            productId: getItemProductId(reviewTarget.item),
            name: reviewTarget.item.name || reviewTarget.item.product?.name || 'Product',
            image: getItemImage(reviewTarget.item) ? [getItemImage(reviewTarget.item)] : null,
          }}
          orderId={reviewTarget.orderId}
          existingReview={reviewsByProduct[String(getItemProductId(reviewTarget.item))] || null}
          onSubmitted={fetchMyReviews}
        />
      )}
    </div>
  );
};

export default Orders;
