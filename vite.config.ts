import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Sanchara.AI — one PWA. Data in public/data, AI through Firebase AI Logic, live state in Firestore.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Sanchara.AI — Bagalkot heritage companion',
        short_name: 'Sanchara',
        description:
          'See the heritage. Hear the story. Discover the people. A multilingual, crowd-aware guide to Bagalkot district.',
        theme_color: '#8E1B1B',
        background_color: '#FBF6EE',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        lang: 'en',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell + all JSON datasets are precached => the core journey works offline.
        globPatterns: ['**/*.{js,css,html,svg,woff2,json,webmanifest,png}'],
        globIgnores: ['**/photos/**', '**/demo/**', '**/audio/**'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // OSM tiles: cache what the visitor has already seen. Never bulk-prefetch (OSM tile policy).
            urlPattern: ({ url }) => url.hostname.endsWith('tile.openstreetmap.org'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Photos never change once published: cache the image files only.
            urlPattern: ({ url }) => /^\/(photos|demo)\/.+\.(jpe?g|png|webp|avif)$/i.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'images', expiration: { maxEntries: 250, maxAgeSeconds: 60 * 60 * 24 * 60 } },
          },
          {
            // The list of demo photos changes during the build week: always try the network first.
            urlPattern: ({ url }) => url.pathname === '/demo/samples.json',
            handler: 'NetworkFirst',
            options: { cacheName: 'demo-list', networkTimeoutSeconds: 4 },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/audio/'),
            handler: 'CacheFirst',
            options: { cacheName: 'audio', rangeRequests: true, expiration: { maxEntries: 150 } },
          },
        ],
      },
    }),
  ],
  build: { target: 'es2022', sourcemap: false, chunkSizeWarningLimit: 900 },
})
