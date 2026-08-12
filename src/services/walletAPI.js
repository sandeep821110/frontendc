import { apiClient } from './apiClient'

export const getWalletBalance = async () => {
  const { data } = await apiClient.get('/wallet/balance')
  return data
}

export const getWalletTransactions = async (page = 1, limit = 20) => {
  const { data } = await apiClient.get('/wallet/transactions', {
    params: { page, limit },
  })
  return data
}

export const getWalletActiveEntries = async () => {
  const { data } = await apiClient.get('/wallet/entries')
  return data
}

export const checkSpinAvailable = async () => {
  const { data } = await apiClient.get('/wallet/spin-check')
  return data
}

export const creditSpinWin = async (segmentIndex) => {
  const { data } = await apiClient.post('/wallet/spin-win', { segmentIndex })
  return data
}

export const redeemWallet = async (amount, orderId = null) => {
  const { data } = await apiClient.post('/wallet/redeem', { amount, orderId })
  return data
}

export const getFreeDeliveryStatus = async () => {
  const { data } = await apiClient.get('/wallet/free-delivery')
  return data
}
