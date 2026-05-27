import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/api/cart': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/api/orders': {
        target: 'http://localhost:7000',
        changeOrigin: true,
      },
      '/api/products': {
        target: 'http://localhost:4001',
        changeOrigin: true,
      },
      '/api/pincodes': {
        target: 'http://localhost:5005',
        changeOrigin: true,
      },
      '/api/address': {
        target: 'http://localhost:5015',
        changeOrigin: true,
      },
      '/api/payments': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/wishlist': {
        target: 'http://localhost:5006',
        changeOrigin: true,
      },
      '/api/carousel': {
        target: 'http://localhost:5010',
        changeOrigin: true,
      },
      '/api/queries': {
        target: 'http://localhost:9010',
        changeOrigin: true,
      },
      '/api/checkout': {
        target: 'http://localhost:9000',
        changeOrigin: true,
      },
      '/api/coupons': {
        target: 'http://localhost:5020',
        changeOrigin: true,
      },
      '/api/tracking': {
        target: 'http://localhost:2010',
        changeOrigin: true,
      },
      '/api/search': {
        target: 'http://localhost:4010',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:4001',
        changeOrigin: true,
      },
    },
  },
})
