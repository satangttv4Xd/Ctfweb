import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    chunkSizeWarningLimit: 1600,
  },
  server: {
    allowedHosts: [
      'nonreducible-estrella-overclinically.ngrok-free.dev'
    ]
  }
})
