<!--
# Plan: Optimize Unlinked Device Experience
...
### Status
Completed.
-->

<!--
# Plan: Offline-First Synchronization & Data Preservation

## 1. Objective
Fix the critical bug where starting the app offline wipes local data, and implement a robust offline-first synchronization engine so the app remains fully usable without internet, queuing changes to sync with Supabase when the connection returns.

## 2. Key Files & Context
- `src/store/useStore.ts`: Where state and Supabase interactions live.
- `src/App.tsx`: Where global event listeners (like `online`/`offline`) are registered.
- `src/types/index.ts`: To define the `SyncOperation` type.

## 3. Implementation Steps

### Step 3.1: Fix Destructive Cloud Sync
- **Issue:** `syncWithCloud` currently sets `profiles: p.data || []`. If Supabase fails (e.g., offline), `data` is `null` and it wipes the local storage.
- **Fix:** Update `syncWithCloud` to check for errors in the Supabase responses (`p.error`, `c.error`, etc.). If *any* fetch fails due to a network issue, abort the sync and preserve the existing local data.

### Step 3.2: Implement Offline Mutation Queue
- Add a `syncQueue: SyncOperation[]` array to the global state.
- Create a `queueSyncOperation` action that records failed or offline mutations (table, action, payload).
- Refactor all Supabase mutation calls (e.g., `addProfile`, `toggleAssignment`) to use a try-catch block. If the network call fails (or if `!navigator.onLine`), push the operation into the `syncQueue`.

### Step 3.3: Background Sync Processor
- Create a `processSyncQueue` action that iterates through the `syncQueue` chronologically.
- It will attempt to replay each mutation against Supabase.
- On success, the operation is removed from the queue. On failure, it remains for the next attempt.
- Add an event listener in `App.tsx` for the `online` event to automatically trigger `processSyncQueue` and `syncWithCloud` when the device regains connection.

## 4. Verification & Testing
- Load the app offline. Verify that data is not wiped and the UI remains usable.
- Perform an action (e.g., complete a chore) while offline. Verify it updates the local UI immediately.
- Reconnect to the internet. Verify the queued action is sent to Supabase successfully.

### Status
Completed.
-->

<!--
# Plan: Spec-Driven Development Specification Documentation Setup

## 1. Objective
Establish formal Spec-Driven Development (SDD) specification documentation for the ChoreQuest project under a dedicated `specs/` directory. This will provide a clear, testable, and comprehensive specification of the system architecture, domain models, feature specifications, offline-first sync engine, notification system, and security & freemium rules to enable effective code reviews and future development.

## 2. Proposed Specification Files (`specs/`)

### `specs/overview.spec.md`
- **System Purpose & Vision**: Gamified family chore management PWA.
- **Tech Stack & Constraints**: React 19, TypeScript, Vite, Tailwind CSS, Zustand, IndexedDB (`idb-keyval`), Supabase, Workbox PWA.
- **Architecture Requirements**: Local-first design, code obfuscation via Vite minification, IndexedDB encryption.

### `specs/domain-model.spec.md`
- **Ubiquitous Language**: Profiles (Parent/Child), Chores, Assignments, Rewards, Redemptions, Families, Sync Queue.
- **Entities & Schemas**: Detailed TypeScript interfaces and data contracts.
- **State Machine Transitions**:
  - Chore Assignment lifecycle: `Created -> Assigned -> Completed (Pending Approval) -> Verified (Rewarded) / Re-opened`.
  - Reward Redemption lifecycle: `Requested -> Approved / Rejected`.

### `specs/features/chores-and-gamification.spec.md`
- **Quest System Spec**: Chore creation, recurrence schedules, point values, approval requirement flags.
- **Gamification Mechanics**: Point earning rules, XP calculation (`XP = total points`), Level progression formula (`Level = floor(XP / 100) + 1`).
- **Reward Marketplace**: Catalog management, redemption requests, balance checks, deduction rules.

### `specs/features/offline-and-sync.spec.md`
- **Local-First Persistence Spec**: IndexedDB schema, storage persistence (`navigator.storage.persist()`), state persistence via Zustand middleware.
- **Offline Mutation Queue & Sync Engine**: Queueing mutations when offline (`SyncOperation`), backoff & replay logic upon `online` events, Supabase real-time subscription lifecycle.
- **Data Cleanup & Unlinking**: Handling device unlinking without data corruption.

### `specs/features/notifications-and-badging.spec.md`
- **Device Notification Module Spec**: Browser Notification API & ServiceWorker integration (`registration.showNotification`).
- **Notification Types**: New Quest Assigned, Approval Requested, Quest Verified, Evening Check-in Nudge.
- **Scheduled Heartbeat**: 60-second timer and `visibilitychange` triggers for `ReminderService`.
- **App Icon Badging Spec**: PWA Web App Badging API (`setAppBadge` / `clearAppBadge`) reflecting pending approvals, redemptions, and active quests.

### `specs/features/security-and-freemium.spec.md`
- **Parent Security & Auth**: PIN authentication, PIN change flow, recovery mechanisms (custom security question, randomized math challenge fallback).
- **Freemium Constraints**: Limits for Free tier (1 Child profile, 5 active chore types, 3 active rewards), upgrade simulation flow, UI & Store-level guard enforcement.

## 3. Execution Steps
1. Create directory `specs/` and `specs/features/`.
2. Draft `specs/overview.spec.md`.
3. Draft `specs/domain-model.spec.md`.
4. Draft `specs/features/chores-and-gamification.spec.md`.
5. Draft `specs/features/offline-and-sync.spec.md`.
6. Draft `specs/features/notifications-and-badging.spec.md`.
7. Draft `specs/features/security-and-freemium.spec.md`.

## 4. Status
Completed.
<!--
# Plan: Implement Architecture & Deep Module Refactoring

## 1. Objective
Refactor the ChoreQuest codebase to deepen key modules, resolve architectural friction across Security, Scalability, and Feasibility, and fulfill mandatory requirements (IndexedDB encryption, clean offline sync, event-driven notifications, and decoupled security logic).

## 2. Proposed Refactoring Steps

### Phase 1: IndexedDB Encrypted Storage Adapter (Security)
- **Files:** `src/lib/encryption.ts` (new), `src/store/useStore.ts`
- **Changes:**
  - Create `EncryptedStorageAdapter` using browser Web Crypto API (`crypto.subtle`) with AES-GCM 256-bit encryption, PBKDF2 key derivation, and unique IV generation per operation.
  - Integrate `EncryptedStorageAdapter` into `useStore.ts` as the custom `StateStorage` engine for Zustand `persist` middleware.
  - Implement fallback handling to seamlessly migrate unencrypted state if present.

### Phase 2: Unified Offline Sync Engine (Scalability & Reliability)
- **Files:** `src/services/SyncEngine.ts` (new), `src/store/slices/syncSlice.ts`, `src/store/slices/choreSlice.ts`, `src/store/slices/profileSlice.ts`, `src/store/slices/rewardSlice.ts`
- **Changes:**
  - Create `SyncEngine` module to encapsulate Supabase mutation execution, `navigator.onLine` checks, offline queueing (`syncQueue`), and exponential backoff retry.
  - Provide a clean `syncEngine.dispatch({ table, action, payload, match })` interface.
  - Refactor store slices (`choreSlice`, `profileSlice`, `rewardSlice`) to remove scattered `safeSync` try-catch blocks and delegate network mutations to `SyncEngine`.

### Phase 3: Notification & App Badging Center (Feasibility & Maintainability)
- **Files:** `src/services/NotificationCenter.ts` (new), `src/services/NotificationService.ts`, `src/services/ReminderService.ts`, `src/hooks/useAppLifecycle.ts`
- **Changes:**
  - Create `NotificationCenter` to consolidate permission checks, Service Worker notification triggers, evening reminder heartbeats, and dynamic PWA app badging logic.
  - Move badge count derivation (`pendingApprovals + pendingRedemptions + activeQuests`) out of React `useEffect` in `useAppLifecycle.ts` into `NotificationCenter`.
  - Refactor `useAppLifecycle.ts` to be clean and focused purely on lifecycle subscriptions.

### Phase 4: Parent Security Vault (Security & Testability)
- **Files:** `src/services/SecurityVault.ts` (new), `src/features/auth/components/ParentAuth.tsx`, `src/features/settings/components/SettingsModal.tsx`
- **Changes:**
  - Create `SecurityVault` module providing methods for `verifyPin(input, pin)`, `generateMathChallenge()`, and `verifyChallengeAnswer(input, challenge)`.
  - Refactor `ParentAuth.tsx` to delegate math challenge generation and security question validation to `SecurityVault`.

### Phase 5: Verification & Testing
- Run `npm run build` (`tsc -b && vite build`) to ensure zero type errors and clean minification.
- Verify IndexedDB state encryption, offline queue sync behavior, PWA badging, and PIN authentication.

## 3. Status
Completed.
-->





