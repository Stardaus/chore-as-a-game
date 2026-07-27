import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Global error handler for PWA/SSL issues
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('SSL') || event.reason?.message?.includes('ServiceWorker')) {
    console.warn('PWA Update blocked by SSL/Network. Continuing with cached version.');
    event.preventDefault();
  }
});

// Request persistent storage
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then((persistent) => {
    if (persistent) {
      console.log(
        '📦 Storage is PERSISTENT: Data will not be cleared by the browser automatically.'
      );
    } else {
      console.log(
        '⚠️ Storage is BEST-EFFORT: Data might be cleared if the device runs out of space. Tip: Install the app (Add to Home Screen) to improve persistence.'
      );
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
