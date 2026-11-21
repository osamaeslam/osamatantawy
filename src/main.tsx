import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register Workbox PWA service worker for offline browsing & auto-updates
try {
  registerSW({
    immediate: true,
    onOfflineReady() {
      // App shell cached and ready for offline browsing
    },
  });
} catch (error) {
  console.warn('PWA ServiceWorker registration:', error);
}

createRoot(document.getElementById('root')!).render(<App />);
