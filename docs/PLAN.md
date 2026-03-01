<!--
# Plan: Optimize Unlinked Device Experience
...
### Status
Completed.
-->

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
