import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register service worker for PWA installation capability & clear old caches
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          if (name !== 'tantawy-group-v3') {
            caches.delete(name);
          }
        }
      });
    }
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registration.update();
      })
      .catch((error) => {
        console.warn('PWA ServiceWorker registration:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
