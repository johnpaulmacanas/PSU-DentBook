import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React runtime
          'vendor-react': ['react', 'react-dom'],
          // Router
          'vendor-router': ['react-router-dom'],
          // Supabase client (largest single dependency)
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
})
