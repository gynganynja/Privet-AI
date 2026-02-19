import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/Privet-AI/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.jpg'],
      manifest: {
        name: 'Privet AI - Russian Tutor',
        short_name: 'Privet AI',
        description: 'Your personal AI-powered Russian language tutor.',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'logo.jpg',
            sizes: '192x192',
            type: 'image/jpg'
          },
          {
            src: 'logo.jpg',
            sizes: '512x512',
            type: 'image/jpg'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Tauri Configuration
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
})
