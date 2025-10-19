import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  base: '/bde-evidencija/',
  build: {
    chunkSizeWarningLimit: 600, // Increase warning limit slightly
    rollupOptions: {
      output: {
        // Force completely new filenames with timestamp
  entryFileNames: `assets/app-v5-${Date.now()}-[hash].js`,
  chunkFileNames: `assets/chunk-v5-${Date.now()}-[hash].js`,
  assetFileNames: `assets/asset-v5-${Date.now()}-[hash].[ext]`,
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
      workbox: {
        navigateFallback: '/bde-evidencija/',
        globPatterns: ['**/*.{js,css,html,ico,png}'],
        skipWaiting: true,
        clientsClaim: true,
        // ULTRA AGGRESSIVE cache busting
        runtimeCaching: [{
          urlPattern: /^https?.*/,
          handler: 'NetworkFirst',
          options: {
            cacheName: `bde-v5-ultra-${Date.now()}`,
            networkTimeoutSeconds: 3,
          }
        }]
      },
      includeAssets: ['favicon.png', 'assets/icon.png', 'assets/logo.png'],
  manifest: {
  name: 'BDEVidencija - Evidencija dostave v5.0',
  short_name: 'BDEVidencija v5',
        start_url: '/bde-evidencija/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1e3a8a',
        description: 'Vaša digitalna evidencija vožnji i dostava',
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
