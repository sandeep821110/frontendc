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
    success: body.success !== false,
    data: order,
    message: body.message || (body.success === false ? 'Failed to create order' : 'Order created successfully'),
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
  const debugMeta = {
    url: '/create',
    method: 'post',
    timestamp: new Date().toISOString(),
    paymentData: { ...paymentData, amount: paymentData.amount },
  }
  if (import.meta.env.DEV) { console.debug('[createPaymentAPI] Calling /create', debugMeta) }

  let response
  try {
    response = await paymentsApi.post('/create', paymentData, {
      headers: getAuthHeaders(),
    })
  } catch (err) {
    const errorInfo = {
      ...debugMeta,
      status: err.response?.status,
      statusText: err.response?.statusText,
      fullData: err.response?.data,
      isNetworkError: !err.response || err.code === 'ERR_NETWORK',
      message: err.message,
      code: err.code,
    }
    if (import.meta.env.DEV) { console.error('[createPaymentAPI] FAILED', errorInfo) }
    throw Object.assign(new Error(err.response?.data?.message || err.message || 'Payment service unavailable'), {
      status: err.response?.status || 502,
      debug: errorInfo,
      response: err.response,
    })
  }

  const body = response.data
  const rzpData = body.data || body

  return {
    success: body.success !== false,
    data: rzpData,
    key_id: body.key_id,
    amountPaise: body.amountPaise,
    message: body.message || (body.success === false ? 'Failed to create payment' : 'Payment created successfully'),
  }
}

export const verifyPaymentAPI = async (verifyData) => {
  const response = await paymentsApi.post('/verify', verifyData, {
    headers: getAuthHeaders(),
  })
  const body = response.data

  return {
    success: body.success !== false,
    data: body.data || body,
    message: body.message || (body.success === false ? 'Payment verification failed' : 'Payment verified successfully'),
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
  const debugMeta = {
    url: '/payu/create',
    method: 'post',
    timestamp: new Date().toISOString(),
    paymentData: { ...paymentData, amount: paymentData.amount },
  }
  if (import.meta.env.DEV) { console.debug('[createPayuPaymentAPI] Calling /payu/create', debugMeta) }

  let response
  try {
    response = await paymentsApi.post('/payu/create', paymentData, {
      headers: getAuthHeaders(),
    })
  } catch (err) {
    const errorInfo = {
      ...debugMeta,
      status: err.response?.status,
      statusText: err.response?.statusText,
      fullData: err.response?.data,
      isNetworkError: !err.response || err.code === 'ERR_NETWORK',
      message: err.message,
      code: err.code,
    }
    if (import.meta.env.DEV) { console.error('[createPayuPaymentAPI] FAILED', errorInfo) }
    throw Object.assign(new Error(err.response?.data?.message || err.message || 'PayU service unavailable'), {
      status: err.response?.status || 502,
      debug: errorInfo,
      response: err.response,
    })
  }

  const body = response.data

  return {
    success: body.success !== false,
    data: body.data || body,
    message: body.message || (body.success === false ? 'Failed to create PayU payment' : 'PayU payment created successfully'),
  }
}

export const verifyPayuPaymentAPI = async (verifyData) => {
  const response = await paymentsApi.post('/payu/verify', verifyData, {
    headers: getAuthHeaders(),
  })
  const body = response.data

  return {
    success: body.success !== false,
    data: body.data || body,
    message: body.message || (body.success === false ? 'PayU payment verification failed' : 'PayU payment verified successfully'),
  }
}
