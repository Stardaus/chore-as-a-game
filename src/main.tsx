import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Request persistent storage
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then((persistent) => {
    if (persistent) {
      console.log('📦 Storage is PERSISTENT: Data will not be cleared by the browser automatically.');
    } else {
      console.log('⚠️ Storage is BEST-EFFORT: Data might be cleared if the device runs out of space. Tip: Install the app (Add to Home Screen) to improve persistence.');
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
