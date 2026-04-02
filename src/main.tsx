import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Global handler for Vite chunk preload errors (prevents React error boundary)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error:', event);
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);

