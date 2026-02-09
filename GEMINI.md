# Gemini CLI Project Instructions

This project follows these specific technology and implementation guidelines:

- **Framework & Tooling:** Use **React** with **Vite** as the build tool.
- **Progressive Web App (PWA):**
    - Use **Workbox** for service worker implementation and offline capabilities.
    - Use `npx pwa-asset-generator` for generating PWA icons and splash screens.
- **Data Persistence:** Use **IndexedDB** for local storage and client-side data management.

**MUST DO**
    - code obfuscation via vite minification
    - encryption of IndexedDB
