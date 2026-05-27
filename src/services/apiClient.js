import axios from 'axios'

const ACCESS_TOKEN_KEY = 'token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_KEY = 'user_data'

// Migrate old cookie-stored data to localStorage
const migrateFromCookies = () => {
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
    return match ? decodeURIComponent(match[1]) : null
  }
  const removeCookie = (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  }

  // Check current key first, then legacy cookie names
  const oldToken = getCookie(ACCESS_TOKEN_KEY) || getCookie('access_token')
  if (oldToken && !localStorage.getItem(ACCESS_TOKEN_KEY)) {
    localStorage.setItem(ACCESS_TOKEN_KEY, oldToken)
  }
  const oldRefresh = getCookie(REFRESH_TOKEN_KEY) || getCookie('refresh_token')
  if (oldRefresh && !localStorage.getItem(REFRESH_TOKEN_KEY)) {
    localStorage.setItem(REFRESH_TOKEN_KEY, oldRefresh)
  }
  const oldUser = getCookie(USER_KEY)
  if (oldUser && !localStorage.getItem(USER_KEY)) {
    localStorage.setItem(USER_KEY, oldUser)
  }

  removeCookie(ACCESS_TOKEN_KEY)
  removeCookie('access_token')
  removeCookie(REFRESH_TOKEN_KEY)
  removeCookie('refresh_token')
  removeCookie(USER_KEY)
}
migrateFromCookies()

// Access token
export const getStoredToken = () => localStorage.getItem(ACCESS_TOKEN_KEY)

export const setStoredToken = (token) => {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  }
}

export const clearStoredToken = () => localStorage.removeItem(ACCESS_TOKEN_KEY)

// Refresh token
export const getStoredRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY)

export const setStoredRefreshToken = (token) => {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

export const clearStoredRefreshToken = () => localStorage.removeItem(REFRESH_TOKEN_KEY)

// User data
export const getStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export const setStoredUser = (userData) => {
  if (!userData) { localStorage.removeItem(USER_KEY); return }
  localStorage.setItem(USER_KEY, JSON.stringify(userData))
}

export const clearStoredUser = () => localStorage.removeItem(USER_KEY)

let token = getStoredToken()

// Sync token into a non-httpOnly cookie so middleware can find it via req.cookies.authToken
const syncAuthCookie = (tokenValue) => {
  if (tokenValue) {
    document.cookie = `authToken=${encodeURIComponent(tokenValue)}; path=/; SameSite=Lax`
  }
}
if (token) syncAuthCookie(token)

const setAuthCookie = (tokenValue) => {
  if (tokenValue) {
    document.cookie = `authToken=${encodeURIComponent(tokenValue)}; path=/; SameSite=Lax`
  } else {
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
  }
}

const clearAuthCookie = () => {
  document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
}

export const setAuthToken = (newToken) => {
  token = newToken
  setStoredToken(newToken)
  setAuthCookie(newToken)
}

export const getAuthToken = () => token

export const clearAuthToken = () => {
  token = null
  clearStoredToken()
  clearStoredRefreshToken()
  clearAuthCookie()
}

// Callback for when token refresh fails (e.g., dispatch logout)
let onUnauthorizedCallback = null

export const setOnUnauthorized = (callback) => {
  onUnauthorizedCallback = callback
}

// Shared refresh promise across ALL axios instances to prevent TOKEN_REUSE
let refreshPromise = null

const doRefresh = async () => {
  const { data } = await axios.post('/api/auth/refresh-token', {}, {
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

const API_BASE_URL = '/api'

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
