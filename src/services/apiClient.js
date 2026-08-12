import axios from 'axios'

const API_BASE_URL = '/api'

// ---- Token storage policy -------------------------------------------------
// Access + refresh tokens live ONLY in httpOnly cookies set by the auth
// service (authToken / refreshToken). The access token is additionally kept
// in memory so the axios interceptor can attach it as a Bearer header.
// Nothing token-related is persisted in localStorage or non-httpOnly cookies.

const LEGACY_LOCAL_KEYS = ['token', 'refresh_token', 'user_data']
const LEGACY_COOKIE_NAMES = ['authToken', 'access_token', 'refresh_token', 'user_data']

// One-time cleanup: purge any tokens the old frontend wrote to localStorage
// or non-httpOnly cookies. document.cookie can only touch the non-httpOnly
// copies, so the server's httpOnly cookies are never affected.
const purgeLegacyTokenStorage = () => {
  try {
    LEGACY_LOCAL_KEYS.forEach((key) => localStorage.removeItem(key))
  } catch { /* ignore */ }
  LEGACY_COOKIE_NAMES.forEach((name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`
  })
}
purgeLegacyTokenStorage()

const getCookie = (name) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

// Access token held in memory ONLY (survives refresh, never persisted)
let token = null

export const setAuthToken = (newToken) => {
  token = newToken || null
}

export const getAuthToken = () => token

export const clearAuthToken = () => {
  token = null
}

// Callback for when token refresh fails (e.g., dispatch logout)
let onUnauthorizedCallback = null

export const setOnUnauthorized = (callback) => {
  onUnauthorizedCallback = callback
}

// Shared refresh promise across ALL axios instances to prevent TOKEN_REUSE
let refreshPromise = null

const doRefresh = async () => {
  const { data } = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, {
    withCredentials: true,
  })
  const newToken = data.accessToken || data.token || data.jwt
  if (!newToken) {
    throw new Error('No access token in refresh response')
  }
  setAuthToken(newToken)
  return newToken
}

const attachAuthInterceptor = (instance) => {
  instance.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      const method = (config.method || 'get').toUpperCase()
      if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
        const csrf = getCookie('XSRF-TOKEN')
        if (csrf) {
          config.headers['X-CSRF-Token'] = csrf
        }
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      if (error.response?.status === 401) {
        const fullUrl = originalRequest.baseURL
          ? `${originalRequest.baseURL}${originalRequest.url || ''}`
          : (originalRequest.url || '')
        const isAuthRequest = fullUrl.includes('/api/auth')

        if (!originalRequest._retry) {
          originalRequest._retry = true

          if (!refreshPromise) {
            refreshPromise = doRefresh().catch((err) => {
              // Only clear auth state if the ORIGINAL 401 came from an auth endpoint
              // Non-auth 401s (cart, orders, etc.) should not log the user out
              if (isAuthRequest) {
                clearAuthToken()
                if (onUnauthorizedCallback) onUnauthorizedCallback(err)
              }
              throw err
            }).finally(() => {
              refreshPromise = null
            })
          }

          try {
            const newToken = await refreshPromise
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return instance(originalRequest)
          } catch (refreshError) {
            return Promise.reject(refreshError)
          }
        }

        // On second 401 (retry already done), only trigger logout for auth API
        if (isAuthRequest && onUnauthorizedCallback) onUnauthorizedCallback(error)
      }

      return Promise.reject(error)
    }
  )

  return instance
}

export const apiClient = attachAuthInterceptor(axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
}))

export const createApiClient = (baseURL) => attachAuthInterceptor(axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: true,
}))
