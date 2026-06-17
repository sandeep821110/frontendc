import axios from 'axios'
import { getAuthToken } from './apiClient'

const API_BASE = '/api/chat'

const getHeaders = () => {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const sendMessage = async (message, sessionId = null) => {
  const body = { message }
  if (sessionId) body.sessionId = sessionId
  const res = await axios.post(API_BASE, body, { headers: getHeaders() })
  return res.data
}

export const getChatHistory = async (sessionId) => {
  const res = await axios.get(`${API_BASE}/${sessionId}`, { headers: getHeaders() })
  return res.data
}

export const getUserChatSessions = async (page = 1, limit = 20) => {
  const res = await axios.get(`${API_BASE}?page=${page}&limit=${limit}`, { headers: getHeaders() })
  return res.data
}

export const deleteChatSession = async (sessionId) => {
  const res = await axios.delete(`${API_BASE}/${sessionId}`, { headers: getHeaders() })
  return res.data
}

export const getTrending = async () => {
  const res = await axios.get(`${API_BASE}/trending`)
  return res.data
}

export const getPriceInsights = async () => {
  const res = await axios.get(`${API_BASE}/price-insights`)
  return res.data
}
