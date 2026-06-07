import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// On GitHub Pages the app is served from https://<user>.github.io/<repo>/, so the
// build needs base = "/<repo>/". The deploy workflow sets VITE_BASE to that path
// automatically; locally and on root-domain hosts it falls back to "/".
const base = process.env.VITE_BASE ?? '/'

// https://vitejs.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo-icon.svg', 'logo-mark.svg'],
      manifest: {
        name: 'WISEcon27',
        short_name: 'WISEcon27',
        description: 'WISEcon27 — Uniwise annual assessment conference',
        theme_color: '#628010',
        background_color: '#628010',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'logo-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'logo-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
