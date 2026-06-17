/* global process */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api/auth': {
          target: env.VITE_AUTH_URL || 'http://localhost:5000',
          changeOrigin: true,
        },
        '/api/cart': {
          target: env.VITE_CART_URL || 'http://localhost:8001',
          changeOrigin: true,
        },
        '/api/orders': {
          target: env.VITE_ORDERS_URL || 'http://localhost:7000',
          changeOrigin: true,
        },
        '/api/products': {
          target: env.VITE_PRODUCTS_URL || 'http://localhost:4001',
          changeOrigin: true,
        },
        '/api/pincodes': {
          target: env.VITE_PINCODES_URL || 'http://localhost:5005',
          changeOrigin: true,
        },
        '/api/address': {
          target: env.VITE_ADDRESS_URL || 'http://35.154.51.162:5015',
          changeOrigin: true,
        },
        '/api/payments': {
          target: env.VITE_PAYMENTS_URL || 'http://localhost:8000',
          changeOrigin: true,
        },
        '/api/wishlist': {
          target: env.VITE_WISHLIST_URL || 'http://localhost:5006',
          changeOrigin: true,
        },
        '/api/carousel': {
          target: env.VITE_CAROUSEL_URL || 'http://localhost:5010',
          changeOrigin: true,
        },
        '/api/queries': {
          target: env.VITE_QUERIES_URL || 'http://localhost:9010',
          changeOrigin: true,
        },
        '/api/checkout': {
          target: env.VITE_CHECKOUT_URL || 'http://localhost:9000',
          changeOrigin: true,
        },
        '/api/coupons': {
          target: env.VITE_COUPONS_URL || 'http://localhost:5020',
          changeOrigin: true,
        },
        '/api/tracking': {
          target: env.VITE_TRACKING_URL || 'http://localhost:2010',
          changeOrigin: true,
        },
        '/api/search': {
          target: env.VITE_SEARCH_URL || 'http://localhost:4010',
          changeOrigin: true,
        },
        '/api/chat': {
          target: env.VITE_CHAT_URL || 'http://localhost:5001',
          changeOrigin: true,
        },
        '/uploads': {
          target: (env.VITE_UPLOADS_URL || 'http://13.126.106.40:4001').replace(/\/api\/?$/, ''),
          changeOrigin: true,
        },
      },
    },
  }
})

