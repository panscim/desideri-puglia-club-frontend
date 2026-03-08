import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI libraries
          'vendor-ui': ['lucide-react', 'framer-motion', 'react-hot-toast'],
          // Backend services
          'vendor-supabase': ['@supabase/supabase-js']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
