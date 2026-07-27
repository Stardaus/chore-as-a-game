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
...
## 3. Status
Completed.
-->

<!--
# Plan: Smart Notification Routing & In-App Toast System

## 1. Objective
Refactor the notification architecture to eliminate duplicate OS notifications for local self-actions, route remote family events to an In-App Toast Banner when the app is in the foreground, and reserve iOS/OS system notifications strictly for remote events when the app is in the background.

## 2. Notification Routing Matrix

| Trigger Event | Action Origin | App Visibility | Notification Output |
| :--- | :--- | :--- | :--- |
| **Local Action** (Assign, Complete, Approve) | Current Device | Foreground or Background | **None** (Local UI updates immediately, no notification pop-up) |
| **Remote Event** (Other family device action) | Other Device | **Foreground** (`visible`) | **In-App Toast Banner** (Sleek animated top banner in app UI) |
| **Remote Event** (Other family device action) | Other Device | **Background** (`hidden`) | **iOS / OS Notification** (Web Push / SW Notification if enabled) |
| **Evening Nudge** | Daily Schedule | Foreground / Background | In-App Toast (Foreground) / OS Notification (Background) |

## 3. Implementation Steps

### Step 1: Remove Self-Action Notification Triggers from Store Actions
- **Files:** `src/store/slices/choreSlice.ts`, `src/store/slices/rewardSlice.ts`
- **Changes:**
  - Remove direct `NotificationService.sendNotification(...)` calls inside local store mutation actions (`assignChore`, `toggleAssignment`, `approveAssignment`).
  - Local actions rely on immediate UI state updates.

### Step 2: Toast State Slice & In-App Toast Component
- **Files:** `src/store/slices/toastSlice.ts` (new), `src/components/ui/ToastContainer.tsx` (new), `src/App.tsx`
- **Changes:**
  - Create a toast slice in Zustand (`toasts: Toast[]`, `addToast`, `removeToast`).
  - Create a modern, animated `ToastContainer` component rendered at the top of the layout in `App.tsx`.

### Step 3: Remote Event Diffing & Notification Dispatcher in `SyncService`
- **Files:** `src/services/SyncService.ts`, `src/services/NotificationCenter.ts`
- **Changes:**
  - In `SyncService.initRealtime()`, inspect incoming Postgres `CHANGES` payloads.
  - Diff incoming remote data against current local state to determine the event type (e.g. `Assignment Completed`, `New Quest Assigned`, `Approval Requested`).
  - Check `document.visibilityState === 'visible'`:
    - **If Visible (Foreground):** Call `addToast({ title, message, type })`.
    - **If Hidden (Background):** Call `NotificationCenter.sendNotification(title, { body })` (if `notificationPrefs.enabled`).

### Step 4: Verification & Testing
- Test local action on device: verify no OS notification and no in-app toast pops up for self-action.
- Test remote action in foreground: verify sleek in-app toast banner slides down.
- Test remote action in background: verify iOS/OS system notification fires.
- Run `npm run build` (`tsc -b && vite build`) to verify compilation.

## 4. Status
Completed.
-->
