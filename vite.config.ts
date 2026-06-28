import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// When deployed to GitHub Pages the app lives at /<repo>/, so assets must be
// requested from that sub-path. Locally (dev / preview) we keep it at root.
// Override with BASE_PATH if you deploy somewhere else.
const base = process.env.BASE_PATH ?? (process.env.GITHUB_ACTIONS ? '/Triplanner/' : '/')

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'favicon-32.png'],
      manifest: {
        name: 'Triplanner — Trip & Itinerary Planner',
        short_name: 'Triplanner',
        description: 'Plan routes on a map: checkpoints, restaurant menus, and nearby activities.',
        theme_color: '#0f766e',
        background_color: '#0f766e',
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache the app shell so it opens offline; cache OSM map tiles as they
        // are viewed so revisited areas work without a connection.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.host.endsWith('tile.openstreetmap.org'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
})
