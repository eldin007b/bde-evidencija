import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  base: '/bde-evidencija/',
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    chunkSizeWarningLimit: 600, // Increase warning limit slightly
    rollupOptions: {
      output: {
        // Force completely new filenames with timestamp
        entryFileNames: `assets/app-v4-${Date.now()}-[hash].js`,
        chunkFileNames: `assets/chunk-v4-${Date.now()}-[hash].js`,
        assetFileNames: `assets/asset-v4-${Date.now()}-[hash].[ext]`,
        // Manual chunking strategy
        manualChunks: {
          // Vendor libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
          'vendor-maps': ['leaflet', 'react-leaflet'],
          'vendor-data': ['@tanstack/react-query', '@supabase/supabase-js'],
          'vendor-utils': ['date-fns'],
          
          // App specific chunks
          'screens': [
            './src/screens/HomeScreenModern.jsx',
            './src/screens/DeliveriesScreen.jsx',
            './src/screens/DriversScreen.jsx',
            './src/screens/StatistikaScreen.jsx'
          ],
          'admin': [
            './src/screens/AdminPanelScreen.jsx',
            './src/components/admin/GitHubTab.jsx',
            './src/components/admin/DriversTab.jsx',
            './src/components/admin/RidesTab.jsx'
          ],
          'services': [
            './src/services/AutoSyncService.js',
            './src/services/SupabasePayrollService.js',
            './src/db/supabaseClient.js'
          ]
        }
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png}'],
      },
      includeAssets: ['favicon.png', 'assets/icon.png', 'assets/logo.png'],
      manifest: {
        name: 'BD Evidencija - Evidencija dostave v5.0',
        short_name: 'BD Evidencija v5.0',
        start_url: './',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2563eb',
        description: 'Digitalni sistem za upravljanje dostavama sa Push Notifikacijama',
        icons: [
          {
            src: 'assets/icon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'assets/icon.png', 
            sizes: '512x512',
            type: 'image/png',
          }
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/vor-proxy': {
        target: 'https://anachb.vor.at/bin/mgate.exe?',
        changeOrigin: true,
        secure: false,
        rewrite: path => path.replace(/^\/vor-proxy/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
