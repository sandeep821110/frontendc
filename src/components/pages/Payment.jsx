import { createApiClient, getAuthToken } from '../../services/apiClient';

const PAYMENTS_API_URL = '/api/payments';
const paymentsApi = createApiClient(PAYMENTS_API_URL);

const getAuthHeaders = () => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication token is missing.');
  return { Authorization: `Bearer ${token}` };
};

export const cashOnDelivery = async (orderId) => {
  try {
    const { data } = await paymentsApi.post('/cod/confirm', { orderId }, {
      headers: getAuthHeaders(),
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const createRazorpayOrder = async (orderData) => {
  try {
    const { data } = await paymentsApi.post('/create', orderData, {
      headers: getAuthHeaders(),
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const verifyPayment = async (verifyData) => {
  try {
    const { data } = await paymentsApi.post('/verify', verifyData, {
      headers: getAuthHeaders(),
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const getPaymentStatus = async (orderId) => {
  try {
    const { data } = await paymentsApi.get(`/status/${orderId}`, {
      headers: getAuthHeaders(),
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const createPayuOrder = async (orderData) => {
  try {
    const { data } = await paymentsApi.post('/payu/create', orderData, {
      headers: getAuthHeaders(),
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const verifyPayuPayment = async (verifyData) => {
  try {
    const { data } = await paymentsApi.post('/payu/verify', verifyData, {
      headers: getAuthHeaders(),
    });
    return data;
  } catch (error) {
    throw error;
  }
};
