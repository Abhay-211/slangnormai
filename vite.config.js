import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // This tells Vite that you have two separate pages to bundle
        main: resolve(__dirname, 'index.html'), // Your landing page
        app: resolve(__dirname, 'app.html'),   // Your React app page
      },
    },
  },
  server: {
    // Optional: This ensures that if you accidentally type a wrong URL, 
    // it doesn't just hang, and helps with local routing.
    open: true 
  }
})