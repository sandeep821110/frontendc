import { createApiClient, getAuthToken } from './apiClient';

const ORDERS_API_URL = '/api/orders';
const PAYMENTS_API_URL = '/api/payments';

const ordersApi = createApiClient(ORDERS_API_URL);
const paymentsApi = createApiClient(PAYMENTS_API_URL);

const getAuthHeaders = () => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication token is missing.');
  return { Authorization: `Bearer ${token}` };
};

export const createOrderAPI = async (orderData) => {
  const response = await ordersApi.post('/', orderData, {
    headers: getAuthHeaders(),
  })
  const body = response.data

  const order = body.order || body.data || body

  return {
    success: true,
    data: order,
    message: body.message || 'Order created successfully',
    warnings: body.warnings || null,
  }
}

export const fetchOrderByIdAPI = async (orderId) => {
  const response = await ordersApi.get(`/${orderId}`, {
    headers: getAuthHeaders(),
  })

  return {
    success: true,
    data: response.data.data || response.data,
    message: response.data.message || 'Order fetched successfully',
  }
}

export const createPaymentAPI = async (paymentData) => {
  const response = await paymentsApi.post('/create', paymentData, {
    headers: getAuthHeaders(),
  })
  const body = response.data

  const rzpData = body.data || body
  const paymentRecord = rzpData

  return {
    success: true,
    data: paymentRecord,
    key_id: body.key_id,
    amountPaise: body.amountPaise,
    message: body.message || 'Payment created successfully',
  }
}

export const verifyPaymentAPI = async (verifyData) => {
  const response = await paymentsApi.post('/verify', verifyData, {
    headers: getAuthHeaders(),
  })

  return {
    success: response.data.success || true,
    data: response.data.data || response.data,
    message: response.data.message || 'Payment verified successfully',
  }
}

export const cancelOrderAPI = async (orderId) => {
  const response = await ordersApi.post(`/${orderId}/cancel`, {}, {
    headers: getAuthHeaders(),
  })

  return {
    success: true,
    data: response.data.data || response.data,
    message: response.data.message || 'Order cancelled successfully',
  }
}

export const updateOrderPaymentAPI = async (orderId, paymentData) => {
  const response = await ordersApi.patch(`/${orderId}/payment`, paymentData, {
    headers: getAuthHeaders(),
  })

  return {
    success: true,
    data: response.data.data || response.data,
    message: response.data.message || 'Order payment updated successfully',
    razorpay_order_id: response.data.order?.razorpayOrderId || null,
    razorpay_signature: response.data.order?.razorpaySignature || null,
  }
}

export const createPayuPaymentAPI = async (paymentData) => {
  const response = await paymentsApi.post('/payu/create', paymentData, {
    headers: getAuthHeaders(),
  })
  const body = response.data

  return {
    success: true,
    data: body.data || body,
    message: body.message || 'PayU payment created successfully',
  }
}

export const verifyPayuPaymentAPI = async (verifyData) => {
  const response = await paymentsApi.post('/payu/verify', verifyData, {
    headers: getAuthHeaders(),
  })

  return {
    success: response.data.success || true,
    data: response.data.data || response.data,
    message: response.data.message || 'PayU payment verified successfully',
  }
}
