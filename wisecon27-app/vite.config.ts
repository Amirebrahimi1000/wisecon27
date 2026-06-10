import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Build version, shown in the app footer: "2026-06-11 · a1b2c3d".
// Uses the CI commit when available, local git otherwise.
const sha = (process.env.GITHUB_SHA ?? (() => {
  try { return execSync('git rev-parse HEAD').toString() } catch { return 'dev' }
})()).slice(0, 7)
const builtOn = new Date().toISOString().slice(0, 10)

// On GitHub Pages the app is served from https://<user>.github.io/<repo>/, so the
// build needs base = "/<repo>/". The deploy workflow sets VITE_BASE to that path
// automatically; locally and on root-domain hosts it falls back to "/".
const base = process.env.VITE_BASE ?? '/'

// https://vitejs.dev/config/
export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(`${builtOn} · ${sha}`),
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectManifest: { globPatterns: ['**/*.{js,css,html,svg,woff2,png}'] },
      includeAssets: ['logo-icon.svg', 'logo-mark.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'WISEcon27',
        short_name: 'WISEcon27',
        description: 'WISEcon27 — Uniwise annual assessment conference',
        theme_color: '#628010',
        background_color: '#628010',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
