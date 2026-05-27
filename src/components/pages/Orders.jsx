import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import BrandLoader from '../BrandLoader';
import { Package, XCircle, ChevronRight, Calendar, IndianRupee, CreditCard, Clock, Download, MapPin, Truck } from 'lucide-react';
import { logout } from '../../features/auth/authSlice';
import { createApiClient, getAuthToken } from '../../services/apiClient';
import { cancelOrderAPI } from '../../services/orderPaymentAPI';
import { downloadInvoice } from '../../utils/downloadInvoice';

const ordersApi = createApiClient('/api/orders');
const trackingApi = createApiClient('/api/tracking');

const statusColors = {
  placed: 'bg-blue-100 text-blue-800',
  pending_payment: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-indigo-100 text-indigo-800',
  paid: 'bg-green-100 text-green-800',
  shipped: 'bg-purple-100 text-purple-800',
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
    order_placed: 'bg-blue-100 text-blue-800',
    order_confirmed: 'bg-indigo-100 text-indigo-800',
    processing: 'bg-yellow-100 text-yellow-800',
    packed: 'bg-purple-100 text-purple-800',
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

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await ordersApi.get('/');
      const orderList = res.data.orders || res.data.data || res.data;
      setOrders(orderList);

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
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <BrandLoader text="Loading orders..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
          <Package className="text-indigo-600 w-6 h-6 sm:w-8 sm:h-8" size={32} />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">My Orders</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <XCircle className="text-red-600 shrink-0" size={20} />
            <span className="text-red-700 font-semibold">{error}</span>
          </div>
        )}

        {error && orders.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-2xl shadow-sm border border-gray-100">
            <XCircle className="text-red-400 mx-auto mb-3" size={48} />
            <p className="text-red-600 font-semibold text-lg">Failed to load orders</p>
            <p className="text-gray-500 mt-1">Please check your connection and try again.</p>
            <button
              onClick={fetchOrders}
              className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition"
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
            <div className="text-center bg-white p-6 sm:p-12 rounded-2xl shadow-sm border border-gray-100">
            <Package className="text-gray-300 mx-auto mb-4 w-12 h-12 sm:w-16 sm:h-16" size={64} />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base">Start shopping to see your orders here.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold hover:bg-indigo-700 transition text-sm sm:text-base"
            >
              Browse Products <ChevronRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const tracking = trackingMap[order._id];
              return (
              <div key={order._id} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
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
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                        title="Cancel Order"
                      >
                        {cancellingId === order._id ? '...' : 'Cancel'}
                      </button>
                    )}
                    <button
                      onClick={() => downloadInvoice(order)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
                      title="Download Invoice"
                    >
                      <Download size={14} /> Invoice
                    </button>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[(order.orderStatus || order.status || '').toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
                      {(order.orderStatus || order.status || 'PENDING').replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-3">
                  {(order.items || order.products || []).map((item, idx) => {
                    const img = [].concat(item.image || item.productImage || item.product?.image || item.product?.images || []).filter(Boolean);
                    const src = typeof img[0] === 'object' ? img[0]?.url : img[0];
                    return (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                          {src ? (
                            <img src={src} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<svg class=\"w-5 h-5 text-indigo-600\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M16.5 7.5C16.5 9.985 14.485 12 12 12S7.5 9.985 7.5 7.5 9.515 3 12 3s4.5 2.015 4.5 4.5z\"/><path d=\"M3 21c0-4.97 4.03-9 9-9s9 4.03 9 9\"/></svg>' }} />
                          ) : (
                            <Package className="text-indigo-600" size={20} />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{item.name || item.product?.name || `Item ${idx + 1}`}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity || item.qty || 1}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-800">
                        <IndianRupee size={14} className="inline" />{Math.round((item.price || item.product?.price || 0) * (item.quantity || item.qty || 1))}
                      </p>
                    </div>
                    );
                  })}
                  </div>

                  {tracking && tracking.shippingAddressSnapshot && (
                    <div className="border-t border-gray-100 mt-4 pt-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                            <MapPin size={12} /> Shipping Address
                          </div>
                          <p className="font-semibold text-gray-800 text-sm">{tracking.shippingAddressSnapshot.fullName}</p>
                          <p className="text-xs text-gray-600">{tracking.shippingAddressSnapshot.addressLine1}{tracking.shippingAddressSnapshot.addressLine2 ? ", " + tracking.shippingAddressSnapshot.addressLine2 : ""}</p>
                          <p className="text-xs text-gray-600">{[tracking.shippingAddressSnapshot.city, tracking.shippingAddressSnapshot.state, tracking.shippingAddressSnapshot.postalCode].filter(Boolean).join(", ")}</p>
                          <p className="text-xs text-blue-600 font-semibold">{tracking.shippingAddressSnapshot.phoneNumber}</p>
                        </div>
                        <button
                          onClick={() => openTracking(tracking)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition shrink-0 self-start"
                        >
                          <Truck size={14} /> {tracking.trackingNumber}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-100 mt-4 pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          {order.paymentMethod === 'cod' ? <Clock size={14} /> : <CreditCard size={14} />}
                          {paymentLabels[order.paymentMethod] || order.paymentMethod || 'N/A'}
                        </span>
                        {order.paymentStatus && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            ['PAID', 'CONFIRMED', 'COMPLETED'].includes(order.paymentStatus?.toUpperCase())
                              ? 'bg-green-100 text-green-700'
                              : order.paymentStatus?.toUpperCase() === 'FAILED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.paymentStatus.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-gray-500">
                        <span>Subtotal</span>
                        <span>₹{Math.round(Number(order.itemsPrice || order.totalAmount || 0))}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Shipping</span>
                        <span>₹{Math.round(Number(order.shippingPrice || 0)) || 20}</span>
                      </div>
                      {Number(order.couponDiscount) > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Coupon {order.couponCode ? `(${order.couponCode})` : ''}</span>
                          <span>-₹{Math.round(Number(order.couponDiscount))}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-100 mt-2 pt-2">
                      <p className="text-sm text-gray-500 font-semibold">Total</p>
                      <p className="text-xl font-bold text-gray-900">
                        <IndianRupee size={16} className="inline" />{Math.round(Number(order.totalAmount || order.total || 0))}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="bg-green-600 text-white p-5 rounded-t-2xl flex justify-between items-center sticky top-0">
              <div>
                <h2 className="text-lg font-bold">Order Tracking</h2>
                <p className="text-green-100 text-sm font-mono mt-0.5">{selectedTracking.trackingNumber}</p>
              </div>
              <button onClick={() => setShowTrackingModal(false)} className="text-2xl hover:text-gray-200 transition">&times;</button>
            </div>

            <div className="p-5 space-y-5">
              {/* Current Status */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-500 font-medium">Current Status</span>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusBadge(selectedTracking.status)}`}>
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
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${statusBadge(h.status)}`}>
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
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-gray-700 text-sm mb-1">Carrier</h3>
                  <p className="text-gray-800 font-medium">{selectedTracking.carrier.name}</p>
                  {selectedTracking.carrier.contactNumber && (
                    <p className="text-sm text-gray-500">{selectedTracking.carrier.contactNumber}</p>
                  )}
                </div>
              )}

              {/* Estimated Delivery */}
              {selectedTracking.estimatedDeliveryDate && (
                <div className="bg-gray-50 p-4 rounded-xl">
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
                      <div key={i} className="bg-gray-50 p-3 rounded-xl border text-sm">
                        <div className="flex justify-between items-center">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                            a.status === 'successful' ? 'bg-green-100 text-green-800' :
                            a.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
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
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-gray-700 text-sm mb-1">Shipping Address</h3>
                  <p className="font-medium text-gray-800">{selectedTracking.shippingAddressSnapshot.fullName}</p>
                  <p className="text-sm text-gray-600">
                    {selectedTracking.shippingAddressSnapshot.addressLine1}
                    {selectedTracking.shippingAddressSnapshot.addressLine2 ? `, ${selectedTracking.shippingAddressSnapshot.addressLine2}` : ''}
                  </p>
                  <p className="text-sm text-gray-600">
                    {[selectedTracking.shippingAddressSnapshot.city, selectedTracking.shippingAddressSnapshot.state, selectedTracking.shippingAddressSnapshot.postalCode].filter(Boolean).join(', ')}
                  </p>
                  <p className="text-sm text-blue-600 font-semibold">{selectedTracking.shippingAddressSnapshot.phoneNumber}</p>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100">
              <button
                onClick={() => setShowTrackingModal(false)}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;

