import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { pythonStegoPlugin } from './scripts/vitePythonPlugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    pythonStegoPlugin()
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
