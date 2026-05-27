import axios from 'axios'
import { getAuthToken } from './apiClient'

export const applyCouponAPI = async (code, orderAmount) => {
  const token = getAuthToken()
  const { data } = await axios.post('/api/coupons/apply', { code, orderAmount }, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return data
}
