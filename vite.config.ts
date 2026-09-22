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
      includeAssets: ['logo.svg'],
      manifest: {
        name: 'LiftLab',
        short_name: 'LiftLab',
        description: 'Offline workout tracker',
        theme_color: '#090a0b',
        background_color: '#090a0b',
        display: 'standalone',
        icons: [
          {
            src: 'logo.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'logo.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
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
    allowedHosts: true,
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
  build: {
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ['recharts'],
          motion: ['motion'],
          icons: ['lucide-react'],
          anatomy: ['react-body-highlighter'],
        },
      },
    },
  },
});
