import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // TanStackRouterVite(), // Removed for now - using simple state-based routing
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/convex": path.resolve(__dirname, "./convex"),
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist']
  },
  define: {
    // Define global for PDF.js compatibility
    global: 'globalThis',
  }
}) 