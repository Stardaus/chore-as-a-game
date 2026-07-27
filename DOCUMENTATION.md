# ChoreQuest - PWA Implementation Guide

**Date:** February 10, 2026  
**Version:** 1.0.0

## 1. Project Overview

ChoreQuest is a gamified chore management Progressive Web App (PWA) designed for families. It allows parents to assign tasks, track progress, and reward children, operating fully offline with a local-first architecture.

### Core Tech Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand (with Persistence)
- **Local Database:** IndexedDB (via `idb-keyval`)
- **PWA capabilities:** `vite-plugin-pwa` (Workbox)

---

## 2. Progressive Web App (PWA) Implementation

The app is configured as an "Offline-First" PWA. It caches assets and logic to function without an internet connection and installs on mobile devices like a native app.

### 2.1 Configuration (`vite.config.ts`)

We use `vite-plugin-pwa` to generate the Service Worker and Web Manifest.

- **Strategy:** `generateSW` (Auto-generates the service worker file).
- **Register Type:** `autoUpdate` (Updates are pushed immediately).
- **Caching:**
  - **Assets:** Caches JS, CSS, HTML, ICO, PNG, and SVG files.
  - **Limit:** Increased to **10MB** to accommodate high-res assets (like the 1024px icon).
- **Behavior:**
  - `cleanupOutdatedCaches`: True (Prevents storage bloat).
  - `clientsClaim` & `skipWaiting`: True (Ensures the newest version takes control immediately upon load).

### 2.2 Asset Generation

PWA assets (icons, splash screens) are generated using `pwa-asset-generator` based on the source `public/icon.png`.

- **Manifest:** Located at `manifest.webmanifest`.
- **Icons:** 192x192, 512x512, and maskable variants.

### 2.3 Update Logic (`src/main.tsx`)

The app automatically checks for updates using the `virtual:pwa-register` module.

- **Trigger:** On app load/mount.
- **User Experience:** If a new service worker is found, the user is prompted: _"New content available. Reload?"_. Confirming reloads the page to swap the cache.

### 2.4 Data Persistence

To prevent browser data eviction (which often clears `localStorage` when disk space is low), we:

1.  **Use IndexedDB:** Swapped the default Zustand local storage engine for `idb-keyval`.
2.  **Request Persistence:** explicitly call `navigator.storage.persist()` on app boot to request "Durable Storage" from the browser.

---

## 3. Freemium Monetization Model

The app implements a Freemium model enforced strictly via client-side logic.

### 3.1 Limitations (Free Tier)

- **Profiles:** Max 1 Child Profile.
- **Chores:** Max 5 Active Chore Types.
- **Rewards:** Max 3 Active Rewards.

### 3.2 Implementation Details

- **State Flag:** `isPremium` boolean in `useStore.ts`.
- **Enforcement:**
  - **Store Level:** Actions like `addProfile` check `!isPremium && count >= limit` and block the mutation.
  - **UI Level:** Components (`ProfileManager`, `ChoreBank`) disable "Add" buttons and inputs when limits are reached, displaying an upgrade prompt.
- **Simulated Purchase:** The `SettingsModal` allows toggling `isPremium` via a simulated payment confirmation.

---

## 4. Authentication & Security

The Parent Dashboard is protected to prevent children from modifying chores or approving their own tasks.

### 4.1 Parent PIN

- **Storage:** Stored locally in `useStore` (`parentPin` string).
- **Default:** `0000`.
- **Guard:** `ParentDashboard.tsx` checks `isAuthenticated` state. If false, it renders the `ParentAuth` component.

### 4.2 Recovery System (`ParentAuth.tsx`)

If a parent forgets their PIN, two recovery methods are available:

1.  **Security Question:** User sets a custom Question/Answer pair in Settings.
2.  **Math Challenge (Fallback):** If no question is set, the user must solve a randomized complex multiplication problem (e.g., `87 × 12 + 450`) to prove they are an adult.

**Flow:**
`Forgot PIN?` -> `Verify Recovery` -> `Force New PIN Setup` -> `Access Granted`.

---

## 5. State Management (Zustand)

Global state is managed in `src/store/useStore.ts`.

### Key Slices

- **Profiles:** Array of child identities (XP, Level, Points).
- **Chores:** Library of task templates.
- **Assignments:** Links Chores to Profiles with status (Completed, Pending Approval).
- **Rewards/Redemptions:** Shop items and purchase history.

### Persistence Engine

We utilize a custom storage adapter for Zustand's `persist` middleware to bridge with IndexedDB:

```typescript
const storage: StateStorage = {
  getItem: async (name) => (await get(name)) || null,
  setItem: async (name, value) => await set(name, value),
  removeItem: async (name) => await del(name),
};
```

---

## 6. Development & Build

### Prerequisites

- Node.js & npm

### Commands

- **Install Dependencies:** `npm install`
- **Run Locally:** `npm run dev`
- **Build for Production:** `npm run build`
- **Preview Production Build:** `npm run preview`

### Note on Permissions

If you encounter `EACCES` errors when installing packages or building, ensure you have ownership of the directory:
`sudo chown -R $(whoami) .`
