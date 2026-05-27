import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { createApiClient } from '../../services/apiClient'

const WISHLIST_API_URL = import.meta.env.VITE_WISHLIST_API_BASE_URL || '/api/wishlist'
const wishlistApi = createApiClient(WISHLIST_API_URL)

const normalizeWishlistItem = (item) => {
  // This function ensures that every item in the wishlist state has a consistent structure:
  // { productId: { ...productDetails } }

  // Case 1: Already normalized, e.g., from an API response like { productId: { ... } }
  if (item.productId && typeof item.productId === 'object' && item.productId._id) {
    return item;
  }

  // Case 2: API returns a flat object with a `productId` string field.
  // This matches the data structure you provided and is common when fetching a list.
  if (typeof item.productId === 'string') {
    const { _id, productId, ...productDetails } = item;
    return { productId: { _id: productId, ...productDetails } };
  }
  
  // Case 3: API returns a raw product object with `_id` but no `productId` field.
  // This provides backward compatibility for other possible API response formats.
  if (item.name && item._id && typeof item.productId === 'undefined') {
    return { productId: item };
  }

  // If none of the above, return as is. The component will handle invalid data.
  return item;
};

export const fetchWishlistItems = createAsyncThunk(
  'wishlist/fetchItems',
  async (_, { rejectWithValue }) => {
    try {

      const res = await wishlistApi.get('/wishlist')
      const { data } = res


      if (Array.isArray(data)) return data
      if (data && Array.isArray(data.products)) return data.products
      if (data && Array.isArray(data.items)) return data.items
      if (data && data.wishlist && Array.isArray(data.wishlist)) return data.wishlist
      return []
    } catch (error) {

      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch wishlist')
    }
  }
)

export const addToWishlist = createAsyncThunk(
  'wishlist/addItem',
  async (productInput, { rejectWithValue }) => {
    try {
      const payload = typeof productInput === 'string'
        ? { productId: productInput }
        : {
            productId: productInput.productId || productInput._id,
            name: productInput.name || productInput.title,
            price: productInput.price ?? productInput.discountPrice,
            image: productInput.image || productInput.images?.[0] || productInput.displayImages?.[0],
            discount: productInput.discount,
          };

      const res = await wishlistApi.post('/wishlist', payload)

      return res.data
    } catch (error) {

      return rejectWithValue(error.response?.data?.message || 'Failed to add to wishlist')
    }
  }
)

export const removeFromWishlist = createAsyncThunk(
  'wishlist/removeItem',
  async (idToRemove, { rejectWithValue }) => {
    try {

      await wishlistApi.delete(`/wishlist/${idToRemove}`)

      return idToRemove
    } catch (error) {

      if (error.response?.status === 404) {

        return idToRemove
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from wishlist')
    }
  }
)

export const clearAllWishlist = createAsyncThunk(
  'wishlist/clearAll',
  async (_, { rejectWithValue }) => {
    try {

      await wishlistApi.delete('/wishlist/')

      return true
    } catch (error) {

      return rejectWithValue(error.response?.data?.message || 'Failed to clear wishlist')
    }
  }
)

const initialState = {
  items: [],
  loading: false,
  error: null
}

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearWishlist: (state) => {
      state.items = []
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch wishlist
      .addCase(fetchWishlistItems.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchWishlistItems.fulfilled, (state, action) => {
        state.loading = false
        state.items = Array.isArray(action.payload) ? action.payload.map(normalizeWishlistItem) : []
      })
      .addCase(fetchWishlistItems.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Add item
      .addCase(addToWishlist.pending, (state) => {
        state.error = null
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        if (action.payload) {
          const newItem = normalizeWishlistItem(action.payload);
          const newProductId = newItem.productId?._id;

          if (!newProductId) return; // Can't add if we don't have a product ID.

          const exists = state.items.some(item => String(item.productId?._id) === String(newProductId));
          if (!exists) {
            state.items.push(newItem);
          }
        }
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.error = action.payload
      })
      // Remove item
      .addCase(removeFromWishlist.pending, (state) => {
        state.error = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        // Optimistically remove the item from the state for instant UI feedback.
        const removedId = String(action.payload);
        // The payload can be either a productId (from product page) or a wishlistItemId (from wishlist page).
        // We filter by both to ensure the item is removed regardless of which ID was used.
        state.items = state.items.filter(item => {
          const wishlistItemId = String(item._id);
          const productId = String(item.productId?._id);
          return wishlistItemId !== removedId && productId !== removedId;
        });
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.error = action.payload
      })
      // Clear all
      .addCase(clearAllWishlist.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(clearAllWishlist.fulfilled, (state) => {
        state.loading = false
        state.items = []
      })
      .addCase(clearAllWishlist.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { clearWishlist, clearError } = wishlistSlice.actions
export default wishlistSlice.reducer

// Selectors
/**
 * Selects wishlist items. Note that each item in the array has a nested `productId` object
 * containing the product details, like: `{ productId: { _id, name, price, ... } }`
 */
export const selectWishlistItems = (state) => state.wishlist.items
export const selectWishlistLoading = (state) => state.wishlist.loading
export const selectWishlistError = (state) => state.wishlist.error
export const selectWishlistCount = (state) => state.wishlist.items.length

