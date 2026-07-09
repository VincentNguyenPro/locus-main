import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Front served on :5173, proxie /run vers le backend Express (:8787)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/run': 'http://localhost:8787',
      '/prewarm': 'http://localhost:8787',
      '/send-email': 'http://localhost:8787',
      '/ask': 'http://localhost:8787',
      '/account': 'http://localhost:8787',
    },
  },
  // `vite preview` (build de secours) doit proxifier aussi, sinon /run 404.
  preview: {
    proxy: {
      '/run': 'http://localhost:8787',
      '/prewarm': 'http://localhost:8787',
      '/send-email': 'http://localhost:8787',
      '/ask': 'http://localhost:8787',
      '/account': 'http://localhost:8787',
    },
  },
})
