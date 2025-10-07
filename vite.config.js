import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/bde-evidencija/',
  build: {
    rollupOptions: {
      output: {
        // Force completely new filenames with timestamp
        entryFileNames: `assets/app-v4-${Date.now()}-[hash].js`,
        chunkFileNames: `assets/chunk-v4-${Date.now()}-[hash].js`,
        assetFileNames: `assets/asset-v4-${Date.now()}-[hash].[ext]`
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
            cacheName: `bde-v4-ultra-${Date.now()}`,
            networkTimeoutSeconds: 3,
          }
        }]
      },
      includeAssets: ['favicon.png', 'assets/icon.png', 'assets/logo.png'],
      manifest: {
        name: 'BDEVidencija - Evidencija dostave v4.0',
        short_name: 'BDEVidencija v4',
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
})
