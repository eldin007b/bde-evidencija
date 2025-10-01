import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/bde-evidencija/',
  build: {
    rollupOptions: {
      output: {
        // Force completely new filenames
        entryFileNames: `assets/app-v4-[hash].js`,
        chunkFileNames: `assets/chunk-v4-[hash].js`,
        assetFileNames: `assets/asset-v4-[hash].[ext]`
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        navigateFallback: '/bde-evidencija/index.html',
        navigateFallbackDenylist: [/^\/bde-evidencija\/api/],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        // Force cache invalidation
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: []
      },
      scope: '/bde-evidencija/',
      base: '/bde-evidencija/',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'BDEVidencija - Evidencija dostave v4.0',
        short_name: 'BDEVidencija v4',
        start_url: '/bde-evidencija/',
        scope: '/bde-evidencija/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1e3a8a',
        description: 'Vaša digitalna evidencija vožnji i dostava',
        icons: [
          {
            src: '/bde-evidencija/assets/icon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/bde-evidencija/assets/icon.png',
            sizes: '512x512',
            type: 'image/png',
          },
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
