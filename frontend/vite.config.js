import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Removed 'basicSsl()' and 'https: true'
  server: {
    host: true
  }
})