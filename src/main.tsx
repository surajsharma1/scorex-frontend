import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// ── Service Worker Registration ──────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[SW] Registered, scope:', registration.scope);

        // When a new SW is waiting (new deploy detected), activate it immediately
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New version available — activating...');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch((err) => console.warn('[SW] Registration failed:', err));

    // When a new SW takes control, reload the page to get fresh assets
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('[SW] Controller changed — reloading for fresh version');
        window.location.reload();
      }
    });
  });
}

// ── Global handler for Vite chunk preload errors ─────────────────────────────
window.addEventListener('vite:preloadError', (event) => {
  console.warn('[Vite] Preload error — reloading:', event);
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
