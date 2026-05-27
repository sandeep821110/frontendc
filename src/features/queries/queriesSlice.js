import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { createApiClient } from '../../services/apiClient'

const queriesApi = createApiClient('/api')

export const fetchUserQueries = createAsyncThunk(
  'queries/fetchUserQueries',
  async (_, { rejectWithValue }) => {
    try {
      const res = await queriesApi.get('/queries/user/my-queries')
      
      return Array.isArray(res.data) ? res.data : (res.data.data || res.data.queries || [])
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch queries')
    }
  }
)

export const deleteQuery = createAsyncThunk(
  'queries/deleteQuery',
  async (queryId, { rejectWithValue }) => {
    try {
      await queriesApi.delete(`/queries/delete/${queryId}`)
      
      return queryId
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete query')
    }
  }
)

const initialState = {
  items: [],
  loading: false,
  error: null
}

const queriesSlice = createSlice({
  name: 'queries',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch user queries
      .addCase(fetchUserQueries.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserQueries.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchUserQueries.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Delete query
      .addCase(deleteQuery.pending, (state) => {
        state.error = null
      })
      .addCase(deleteQuery.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item._id !== action.payload)
      })
      .addCase(deleteQuery.rejected, (state, action) => {
        state.error = action.payload
      })
  }
})

export const { clearError } = queriesSlice.actions
export default queriesSlice.reducer

// Selectors
export const selectQueries = (state) => state.queries.items
export const selectQueriesLoading = (state) => state.queries.loading
export const selectQueriesError = (state) => state.queries.error
export const selectQueriesCount = (state) => state.queries.items.length
