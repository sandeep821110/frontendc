import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { createApiClient } from '../../services/apiClient'

const cartApi = createApiClient('/api/cart')

const normalizeCartItem = (item) => {
  if (item.productId && typeof item.productId === 'object' && item.productId !== null && item.productId._id) {
    return item;
  }

  if (item.name && typeof item.productId === 'string') {
    const { productId, name, price, image, discount, description, ...rest } = item;
    return { ...rest, productId: { _id: productId, name, price, image, discount, description } };
  }

  return item;
};

const extractCartItems = (data) => {
  if (Array.isArray(data)) return data;
  if (data?.data?.items) return data.data.items;
  if (data?.items) return data.items;
  if (data?.data?.products) return data.data.products;
  if (data?.cart && Array.isArray(data.cart)) return data.cart;
  return [];
};

export const fetchCartItems = createAsyncThunk(
  'cart/fetchCartItems',
  async (_, { rejectWithValue }) => {
    try {
      const res = await cartApi.get('/')

      return extractCartItems(res.data)
    } catch (error) {

      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch cart')
    }
  }
)

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (productData, { rejectWithValue }) => {
    try {

      
      const res = await cartApi.post('/add', productData)

      return extractCartItems(res.data)
    } catch (error) {

      return rejectWithValue(error.response?.data?.message || 'Failed to add to cart')
    }
  }
)

export const updateCartQuantity = createAsyncThunk(
  'cart/updateQuantity',
  async ({ productId, quantity, size }, { rejectWithValue }) => {
    try {

      
      const res = await cartApi.put(`/update/${productId}`, { productId, quantity, size })

      return extractCartItems(res.data)
    } catch (error) {

      return rejectWithValue(error.response?.data?.message || 'Failed to update cart')
    }
  }
)

export const removeCartItem = createAsyncThunk(
  'cart/removeItem',
  async ({ productId, size }, { rejectWithValue }) => {
    try {


      const res = await cartApi.delete(`/remove/${productId}`, {
        data: { productId, size }
      })

      return extractCartItems(res.data)
    } catch (error) {

      return rejectWithValue(error.response?.data?.message || 'Failed to remove item')
    }
  }
)

export const clearAllCart = createAsyncThunk(
  'cart/clearAll',
  async (_, { rejectWithValue }) => {
    try {


      const res = await cartApi.delete('/clear')

      return extractCartItems(res.data)
    } catch (error) {

      return rejectWithValue(error.response?.data?.message || 'Failed to clear cart')
    }
  }
)

export const buyNow = createAsyncThunk(
  'cart/buyNow',
  async ({ items, address }, { rejectWithValue }) => {
    try {

      
      if (!items || items.length === 0) {
        throw new Error('No items in checkout')
      }
      
      const validatedItems = items.map((item, index) => {
        let productId = null
        if (typeof item.productId === 'string') {
          productId = item.productId
        } else if (item.productId && typeof item.productId === 'object' && item.productId._id) {
          productId = item.productId._id
        } else if (item.productId) {
          productId = String(item.productId)
        }
        
        const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1))
        const size = String(item.size || 'default')
        
        if (!productId) throw new Error(`Item ${index}: Missing productId`)
        if (quantity < 1) throw new Error(`Item ${index}: Invalid quantity ${quantity}`)
        if (!size) throw new Error(`Item ${index}: Missing size`)
        
        return { productId, quantity, size }
      })
      
      const requestBody = { items: validatedItems, address }
      
      const res = await cartApi.post('/buy-now', requestBody)

      return res.data
    } catch (error) {

      const errorMsg = error.response?.data?.message || error.message || 'Failed to process buy now'
      return rejectWithValue(errorMsg)
    }
  }
)

const initialState = {
  items: [],
  loading: false,
  error: null
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCart: (state) => {
      state.items = []
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch cart items
      .addCase(fetchCartItems.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCartItems.fulfilled, (state, action) => {
        state.loading = false
        state.items = Array.isArray(action.payload) ? action.payload.map(normalizeCartItem) : []
      })
      .addCase(fetchCartItems.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false
        state.items = Array.isArray(action.payload) ? action.payload.map(normalizeCartItem) : []
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update quantity
      .addCase(updateCartQuantity.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateCartQuantity.fulfilled, (state, action) => {
        state.loading = false
        state.items = Array.isArray(action.payload) ? action.payload.map(normalizeCartItem) : []
      })
      .addCase(updateCartQuantity.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Remove item
      .addCase(removeCartItem.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.loading = false
        state.items = Array.isArray(action.payload) ? action.payload.map(normalizeCartItem) : []
      })
      .addCase(removeCartItem.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Clear all cart
      .addCase(clearAllCart.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(clearAllCart.fulfilled, (state, action) => {
        state.loading = false
        state.items = Array.isArray(action.payload) ? action.payload.map(normalizeCartItem) : []
      })
      .addCase(clearAllCart.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Buy now
      .addCase(buyNow.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(buyNow.fulfilled, (state, action) => {
        state.loading = false

      })
      .addCase(buyNow.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { clearCart, clearError } = cartSlice.actions
export default cartSlice.reducer

// Selectors
export const selectCartItems = (state) => state.cart.items
export const selectCartLoading = (state) => state.cart.loading
export const selectCartError = (state) => state.cart.error
export const selectCartTotal = (state) => {
  return state.cart.items.reduce((total, item) => {
    const price = item.price || item.productId?.price || 0
    const quantity = item.quantity || 1
    return total + (price * quantity)
  }, 0)
}
export const selectCartCount = (state) => {
  // Return the total number of units in the cart, not just the number of line items.
  return state.cart.items.reduce((total, item) => total + (item.quantity || 0), 0);
}

