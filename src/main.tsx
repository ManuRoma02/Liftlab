import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { Capacitor } from '@capacitor/core';
import { initOta } from './lib/otaUpdate';

// In native Capacitor (Android/iOS), assets are already bundled locally in the APK.
// Unregister any stale ServiceWorker and clear CacheStorage so WebView always renders latest code.
if (Capacitor.isNativePlatform()) {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    }).catch(() => {});
  }
  if (typeof window !== 'undefined' && 'caches' in window) {
    caches.keys().then((keys) => {
      for (const key of keys) {
        caches.delete(key).catch(() => {});
      }
    }).catch(() => {});
  }
} else {
  registerSW({ immediate: true });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Initialize OTA live updates only after React mounts successfully (safeguards rollback watchdog)
initOta();
