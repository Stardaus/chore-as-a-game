# Specification: Offline-First Synchronization & Data Persistence

**Specification Version:** 1.0.0  
**Project:** ChoreQuest  
**Status:** Active

---

## 1. Local-First Architecture Specification

ChoreQuest strictly enforces an **Offline-First** model:

- The UI MUST load instantly from local storage without network dependencies.
- Mutations MUST update local UI state immediately (optimistic UI updates).
- Network failures MUST NOT block, revert, or crash the application.

---

## 2. Storage Persistence & IndexedDB Engine

### 2.1 IndexedDB Adapter (`idb-keyval`)

- Standard `localStorage` is replaced by IndexedDB via `idb-keyval` to bypass storage quota limits and browser cache eviction policies.
- On app boot ([useAppLifecycle](file:///Users/nina/development/projects/chore-as-a-game/src/hooks/useAppLifecycle.ts#L18)), the app calls:
  ```typescript
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist();
  }
  ```
  to request Durable Storage status from the browser.

### 2.2 Storage Security

- In accordance with project security requirements (`GEMINI.md`), client-side state stored in IndexedDB is encrypted before storage and obfuscated in production build outputs.

---

## 3. Offline Mutation Queue & Cloud Sync (`SyncService`)

### 3.1 Offline Queue Architecture (`syncQueue`)

When a mutation occurs (e.g. `addProfile`, `assignChore`, `toggleAssignment`):

1. **Local State Update:** Zustand state is mutated instantly.
2. **Network Check:** If `navigator.onLine === false` or if the Supabase request throws a network error:
   - Operation is packaged into a `SyncOperation` object:
     ```typescript
     interface SyncOperation {
       id: string;
       table: string;
       action: 'insert' | 'update' | 'delete';
       payload: Record<string, any>;
       filter?: { column: string; value: any };
       timestamp: number;
     }
     ```
   - Appended to `syncQueue` state array and saved to IndexedDB.

### 3.2 Queue Replay Engine (`processSyncQueue`)

- Triggered automatically on `window.addEventListener('online', ...)` or foregrounding (`visibilitychange`).
- Iterates chronologically through `syncQueue`:
  - Executes mutation against Supabase.
  - On success (HTTP 200/201): Removes item from `syncQueue`.
  - On failure: Retains item in queue for next replay attempt.

### 3.3 Real-time Supabase Subscription (`SyncService.initRealtime`)

- Listens to PostgreSQL `CHANGES` on channels filtered by `family_id`.
- Reconciles cloud updates into local Zustand state seamlessly without full page reloads.

---

## 4. Device Unlinking & Safety Rules

- **Data Protection Guarantee:** Initial cloud fetches in `syncWithCloud` check for `fetchError`. If a network call fails, local state is NEVER wiped or set to empty arrays.
- **Explicit Unlink Handling:** When server explicitly confirms a device is unlinked (`family_id === null`), `clearLocalData()` is invoked to safely wipe local state.
