import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: '/bde-evidencija/',

  build: {
    chunkSizeWarningLimit: 600,
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app-v5-[hash].js',
        chunkFileNames: 'assets/chunk-v5-[hash].js',
        assetFileNames: 'assets/asset-v5-[hash].[ext]',
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
          'vendor-maps': ['leaflet', 'react-leaflet'],
          'vendor-data': ['@tanstack/react-query', '@supabase/supabase-js'],
          'vendor-utils': ['date-fns'],
          screens: [
            './src/screens/HomeScreenModern.jsx',
            './src/screens/DeliveriesScreen.jsx',
            './src/screens/DriversScreen.jsx',
            './src/screens/StatistikaScreen.jsx'
          ],
          admin: [
            './src/screens/AdminPanelScreen.jsx',
            './src/components/admin/GitHubTab.jsx',
            './src/components/admin/DriversTab.jsx',
            './src/components/admin/RidesTab.jsx'
          ],
          services: [
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
      injectRegister: 'auto',
      includeAssets: ['favicon.png', 'assets/icon.png', 'assets/logo.png'],
      manifest: {
        name: 'BDEVidencija - Evidencija dostave v5.0',
        short_name: 'BDEVidencija v5',
        start_url: '/bde-evidencija/',
        scope: '/bde-evidencija/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1e3a8a',
        description: 'Vaša digitalna evidencija vožnji i dostava',
        icons: [
          {
            src: 'assets/icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'assets/icon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        navigateFallback: '/bde-evidencija/',
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,webmanifest,txt,woff2,mjs}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 3
            }
          },
          {
            urlPattern: ({ request }) =>
              request.destination === 'script' ||
              request.destination === 'style' ||
              request.destination === 'worker',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources'
            }
          },
          {
            urlPattern: ({ request }) =>
              request.destination === 'image' ||
              request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'external-requests',
              networkTimeoutSeconds: 5
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],

  server: {
    port: 5173,
    host: true,
    hmr: {
      port: 5173,
      host: 'localhost'
    }
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})
