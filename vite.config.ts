import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const tailwindPlugin = tailwindcss();

export default defineConfig({
  plugins: [
    react(),
    ...(Array.isArray(tailwindPlugin) ? tailwindPlugin : [tailwindPlugin]),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        suppressWarnings: true,
      },
      includeAssets: ['logo.svg', 'apple-touch-icon.png', 'favicon.ico', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'LiftLab - Gym Workout Tracker',
        short_name: 'LiftLab',
        description: 'Offline gym workout tracker, exercise logger, and rest timer',
        categories: ['fitness', 'health', 'sports'],
        orientation: 'portrait',
        theme_color: '#090a0b',
        background_color: '#090a0b',
        display: 'standalone',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'logo.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    allowedHosts: ['localhost', '127.0.0.1'],
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
  build: {
    emptyOutDir: false,
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks: {
          capacitor: ['@capacitor/core', '@capacitor/app', '@capacitor/haptics'],
          charts: ['recharts'],
          motion: ['motion'],
          icons: ['lucide-react'],
          anatomy: ['react-body-highlighter'],
        },
      },
    },
  },
});
