import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { apiClient, setAuthToken, clearAuthToken } from '../../services/apiClient'

// Standalone refresh token function (useful for axios interceptors outside Redux)
// Concurrent calls (StrictMode double effects, parallel 401 retries) share one
// in-flight request so the single-use refresh token is never consumed twice.
let refreshInFlight = null;
export const refreshAccessToken = async () => {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const res = await axios.post('/api/auth/refresh-token', {}, {
        withCredentials: true
      });
      const token = res.data.accessToken || res.data.token || res.data.jwt;
      if (token) setAuthToken(token);
      return token;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};

// Async thunks
export const sendOtpLogin = createAsyncThunk(
  'auth/sendOtpLogin',
  async (email, { rejectWithValue }) => {
    try {
      await apiClient.post('/auth/login', { email })

      return { email }
    } catch (error) {
      if (error.response?.status === 429) {
        localStorage.setItem('otpCooldown', Date.now() + 120000);
        return rejectWithValue('Too many requests. Please wait 2 minutes before trying again.');
      }
      const errorMsg = error.response?.data?.error || error.response?.data?.message || `Failed to send OTP: ${error.message}`;
      return rejectWithValue(errorMsg)
    }
  }
)

export const verifyOtpLogin = createAsyncThunk(
  'auth/verifyOtpLogin',
  async ({ email, otp }, { rejectWithValue }) => {
    try {

      const res = await apiClient.post('/auth/verify-otp', { email, otp })

      // Token could be in 'accessToken', 'jwt', or 'token'
      const token = res.data.accessToken || res.data.jwt || res.data.token || res.data.data?.token

      if (!token) {
        throw new Error(`Token not found. Response: ${JSON.stringify(res.data)}`)
      }

      return {
        token,
        user: res.data.user
      }
    } catch (error) {

      return rejectWithValue(error.response?.data?.message || error.message || 'Invalid OTP')
    }
  }
)

export const sendOtpSignup = createAsyncThunk(
  'auth/sendOtpSignup',
  async ({ email }, { rejectWithValue }) => {
    try {
      await apiClient.post('/auth/signup', { email })

      return { email }
    } catch (error) {
      if (error.response?.status === 429) {
        localStorage.setItem('otpCooldown', Date.now() + 120000);
        return rejectWithValue('Too many requests. Please wait 2 minutes before trying again.');
      }
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || `Failed to send OTP: ${error.message}`)
    }
  }
)

export const verifyOtpSignup = createAsyncThunk(
  'auth/verifyOtpSignup',
  async ({ email, otp }, { rejectWithValue }) => {
    try {

      const res = await apiClient.post('/auth/verify-otp', { email, otp })

      // Token could be in 'accessToken', 'jwt', or 'token'
      const token = res.data.accessToken || res.data.jwt || res.data.token || res.data.data?.token

      if (!token) {
        throw new Error(`Token not found. Response: ${JSON.stringify(res.data)}`)
      }

      return {
        token,
        user: res.data.user,
      }
    } catch (error) {

      return rejectWithValue(error.response?.data?.message || error.message || 'Invalid OTP')
    }
  }
)

export const resendOtpLogin = createAsyncThunk(
  'auth/resendOtpLogin',
  async (email, { rejectWithValue }) => {
    try {
      await apiClient.post('/auth/resend-otp', { email })
      return { email }
    } catch (error) {
      if (error.response?.status === 429) {
        localStorage.setItem('otpCooldown', Date.now() + 120000);
        return rejectWithValue('Too many requests. Please wait 2 minutes before trying again.');
      }
      return rejectWithValue(error.response?.data?.message || `Failed to resend OTP: ${error.message}`)
    }
  }
)

export const completeProfile = createAsyncThunk(
  'auth/completeProfile',
  async ({ name, phone, gender, dateOfBirth }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post('/auth/complete-profile', { name, phone, gender, dateOfBirth })
      return { user: res.data.user }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to complete profile')
    }
  }
)

export const uploadAvatar = createAsyncThunk(
  'auth/uploadAvatar',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await apiClient.put('/auth/profile/avatar', formData)
      const avatar = res.data?.data?.avatar || res.data?.avatar
      if (!avatar) throw new Error('No avatar URL in response')
      return { avatar }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to upload avatar')
    }
  }
)

export const deleteAvatar = createAsyncThunk(
  'auth/deleteAvatar',
  async (_, { rejectWithValue }) => {
    try {
      await apiClient.delete('/auth/profile/avatar')
      return { avatar: null }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to remove avatar')
    }
  }
)

export const resendOtpSignup = createAsyncThunk(
  'auth/resendOtpSignup',
  async ({ email }, { rejectWithValue }) => {
    try {
      await apiClient.post('/auth/resend-otp', { email })
      return { email }
    } catch (error) {
      if (error.response?.status === 429) {
        localStorage.setItem('otpCooldown', Date.now() + 120000);
        return rejectWithValue('Too many requests. Please wait 2 minutes before trying again.');
      }
      return rejectWithValue(error.response?.data?.message || `Failed to resend OTP: ${error.message}`)
    }
  }
)

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token
      if (!token) {
        throw new Error('No token found')
      }

      const res = await apiClient.get('/auth/profile')

      // Extract user data from response (handle different API formats)
      const userData = res.data.user || res.data.data || res.data

      return {
        name: userData.name,
        email: userData.email,
        _id: userData._id || userData.id,
        ...userData // Include all other fields too
      }
    } catch (error) {

      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message || 'Invalid OTP')
    }
  }
)

export const refreshAuthToken = createAsyncThunk(
  'auth/refreshAuthToken',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const token = await refreshAccessToken();
      if (!token) throw new Error('No token found in response');
      return { token };
    } catch (error) {
      dispatch(logout()); // Log out completely if the refresh token is also invalid/expired
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to refresh token');
    }
  }
)

let loggingOut = false;

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    if (loggingOut) return true;
    loggingOut = true;
    try {
      await apiClient.post('/auth/logout', {});
    } catch (error) {
      if (error.response?.status !== 429) {
        console.error('Logout error:', error);
      }
    }
    loggingOut = false;
    return true
  }
)

export const listSessions = createAsyncThunk(
  'auth/listSessions',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get('/auth/sessions')
      return { sessions: res.data.sessions || [], count: res.data.count || 0 }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to fetch sessions'
      return rejectWithValue(msg)
    }
  }
)

export const revokeSession = createAsyncThunk(
  'auth/revokeSession',
  async (jti, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/auth/sessions/${jti}`)
      return { jti }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to revoke session'
      return rejectWithValue(msg)
    }
  }
)

export const revokeAllSessions = createAsyncThunk(
  'auth/revokeAllSessions',
  async (_, { rejectWithValue }) => {
    try {
      await apiClient.delete('/auth/sessions')
      return { message: 'All other sessions revoked' }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to revoke sessions'
      return rejectWithValue(msg)
    }
  }
)

// Session bootstrap: the access token is NOT stored anywhere persistent, so on
// app startup we exchange the httpOnly refreshToken cookie for a fresh access
// token and load the user profile.
export const bootstrapAuth = createAsyncThunk(
  'auth/bootstrapAuth',
  async (_, { rejectWithValue }) => {
    try {
      const token = await refreshAccessToken()
      if (!token) {
        throw new Error('No active session')
      }

      let user = null
      try {
        const res = await apiClient.get('/auth/profile')
        user = res.data.user || res.data.data || res.data
      } catch { /* profile fetch failure is non-fatal */ }

      return { token, user }
    } catch (error) {
      return rejectWithValue(error.message || 'Session expired')
    }
  }
)

const normalizeUser = (user) => (user ? { ...user, _id: user._id || user.id } : user);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  bootstrapDone: false,
  step: 1, // 1: email, 2: otp, 3: details (name, phone, gender)
  email: '',
  name: '',
  phone: '',
  gender: '',
  dateOfBirth: '',
  otp: '',
  timer: 0,
  loading: false,
  error: null,
  profileLoading: false,
  avatarUploading: false,
  sessions: [],
  sessionsCount: 0,
  sessionsLoading: false,
  profileCompleted: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setStep: (state, action) => {
      state.step = action.payload
    },
    setEmail: (state, action) => {
      state.email = action.payload
    },
    setName: (state, action) => {
      state.name = action.payload
    },
    setOtp: (state, action) => {
      state.otp = action.payload
    },
    setPhone: (state, action) => {
      state.phone = action.payload
    },
    setGender: (state, action) => {
      state.gender = action.payload
    },
    setDateOfBirth: (state, action) => {
      state.dateOfBirth = action.payload
    },
    setProfileCompleted: (state, action) => {
      state.profileCompleted = action.payload
    },
    setTimer: (state, action) => {
      state.timer = action.payload
    },
    resetAuth: (state) => {
      clearAuthToken()
      Object.assign(state, { ...initialState, token: null, isAuthenticated: false })
    },
    setToken: (state, action) => {
      state.token = action.payload
      state.isAuthenticated = true
      setAuthToken(action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      // sendOtpLogin
      .addCase(sendOtpLogin.pending, (state) => {
        state.loading = true
        state.error = null
        state.step = 1
      })
      .addCase(sendOtpLogin.fulfilled, (state, action) => {
        state.loading = false
        state.email = action.payload.email
        state.step = 2
        state.timer = 60
      })
      .addCase(sendOtpLogin.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // verifyOtpLogin
      .addCase(verifyOtpLogin.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(verifyOtpLogin.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.token
        state.user = normalizeUser(action.payload.user)
        state.isAuthenticated = true
        state.step = 1
        state.error = null
        setAuthToken(action.payload.token)
      })
      .addCase(verifyOtpLogin.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // sendOtpSignup
      .addCase(sendOtpSignup.pending, (state) => {
        state.loading = true
        state.error = null
        state.step = 1
      })
      .addCase(sendOtpSignup.fulfilled, (state, action) => {
        state.loading = false
        state.email = action.payload.email
        state.step = 2
        state.timer = 60
      })
      .addCase(sendOtpSignup.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // verifyOtpSignup
      .addCase(verifyOtpSignup.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(verifyOtpSignup.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.token
        state.user = normalizeUser(action.payload.user)
        state.isAuthenticated = false
        state.step = 3
        state.error = null
        setAuthToken(action.payload.token)
      })
      .addCase(verifyOtpSignup.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // resendOtpLogin
      .addCase(resendOtpLogin.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(resendOtpLogin.fulfilled, (state) => {
        state.loading = false
        state.timer = 60
      })
      .addCase(resendOtpLogin.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // resendOtpSignup
      .addCase(resendOtpSignup.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(resendOtpSignup.fulfilled, (state) => {
        state.loading = false
        state.timer = 60
      })
      .addCase(resendOtpSignup.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // completeProfile
      .addCase(completeProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(completeProfile.fulfilled, (state, action) => {
        state.loading = false
        state.user = normalizeUser(action.payload.user)
        state.name = action.payload.user?.name || ''
        state.isAuthenticated = true
        state.profileCompleted = true
        state.step = 1
        state.error = null
      })
      .addCase(completeProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // uploadAvatar
      .addCase(uploadAvatar.pending, (state) => {
        state.avatarUploading = true
        state.error = null
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.avatarUploading = false
        if (state.user) state.user.avatar = action.payload.avatar
        state.error = null
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.avatarUploading = false
        state.error = action.payload
      })
      // deleteAvatar
      .addCase(deleteAvatar.pending, (state) => {
        state.avatarUploading = true
        state.error = null
      })
      .addCase(deleteAvatar.fulfilled, (state) => {
        state.avatarUploading = false
        if (state.user) state.user.avatar = null
        state.error = null
      })
      .addCase(deleteAvatar.rejected, (state, action) => {
        state.avatarUploading = false
        state.error = action.payload
      })
      // fetchProfile
      .addCase(fetchProfile.pending, (state) => {
        state.profileLoading = true
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.profileLoading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.profileLoading = false
        state.error = action.payload
      })
      // logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.error = null
        clearAuthToken()
      })
      // refreshAuthToken
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        state.token = action.payload.token
        state.isAuthenticated = true
        state.error = null
        setAuthToken(action.payload.token)
      })
      .addCase(refreshAuthToken.rejected, (state, action) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.error = action.payload
        clearAuthToken()
      })
      // bootstrapAuth
      .addCase(bootstrapAuth.pending, (state) => {
        state.bootstrapDone = false
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.bootstrapDone = true
        state.token = action.payload.token
        state.isAuthenticated = true
        state.user = normalizeUser(action.payload.user)
        state.error = null
        setAuthToken(action.payload.token)
      })
      .addCase(bootstrapAuth.rejected, (state, action) => {
        state.bootstrapDone = true
        state.token = null
        state.isAuthenticated = false
        state.error = action.payload
        clearAuthToken()
      })
      // listSessions
      .addCase(listSessions.pending, (state) => {
        state.sessionsLoading = true; state.error = null
      })
      .addCase(listSessions.fulfilled, (state, action) => {
        state.sessionsLoading = false
        state.sessions = action.payload.sessions
        state.sessionsCount = action.payload.count
      })
      .addCase(listSessions.rejected, (state, action) => {
        state.sessionsLoading = false; state.error = action.payload
      })
      // revokeSession
      .addCase(revokeSession.fulfilled, (state, action) => {
        state.sessions = state.sessions.filter(s => s.jti !== action.payload.jti)
        state.sessionsCount = Math.max(0, state.sessionsCount - 1)
      })
      // revokeAllSessions
      .addCase(revokeAllSessions.fulfilled, (state) => {
        state.sessions = state.sessions.filter(s => s.isCurrent)
        state.sessionsCount = state.sessions.filter(s => s.isCurrent).length
      })
  }
})

export const { clearError, setStep, setEmail, setName, setOtp, setPhone, setGender, setDateOfBirth, setProfileCompleted, setTimer, resetAuth, setToken } = authSlice.actions
export default authSlice.reducer

// Selectors
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectBootstrapDone = (state) => state.auth.bootstrapDone
export const selectUser = (state) => state.auth.user
export const selectToken = (state) => state.auth.token
export const selectLoading = (state) => state.auth.loading
export const selectError = (state) => state.auth.error
export const selectStep = (state) => state.auth.step
export const selectEmail = (state) => state.auth.email
export const selectName = (state) => state.auth.name
export const selectPhone = (state) => state.auth.phone
export const selectGender = (state) => state.auth.gender
export const selectDateOfBirth = (state) => state.auth.dateOfBirth
export const selectOtp = (state) => state.auth.otp
export const selectTimer = (state) => state.auth.timer
export const selectProfileLoading = (state) => state.auth.profileLoading
export const selectAvatarUploading = (state) => state.auth.avatarUploading
export const selectSessions = (state) => state.auth.sessions
export const selectSessionsCount = (state) => state.auth.sessionsCount
export const selectSessionsLoading = (state) => state.auth.sessionsLoading
export const selectAuthMethod = (state) => state.auth.authMethod
