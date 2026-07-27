# Specification: ChoreQuest System Overview

**Specification Version:** 1.0.0  
**Project:** ChoreQuest (Gamified Family Chore Management PWA)  
**Status:** Active

---

## 1. Vision & Purpose

ChoreQuest transforms household chores into an engaging, gamified RPG experience for children while giving parents complete administrative oversight. The application is built with a **Local-First Architecture**, ensuring 100% functionality offline while seamlessly synchronizing across family devices via Supabase when connectivity is available.

---

## 2. Technology Stack & Technical Constraints

### 2.1 Core Stack

- **UI Framework:** React 19 + TypeScript (`vite-plugin-react`)
- **Build System:** Vite
- **Styling:** Tailwind CSS + Lucide Icons + `clsx` / `tailwind-merge`
- **State Management:** Zustand (Slice pattern with IndexedDB persistence)
- **Local Persistence:** IndexedDB via `idb-keyval` (Swapped out `localStorage` for durable storage)
- **Cloud Sync & Backend:** Supabase JS Client (`@supabase/supabase-js`)
- **Progressive Web App:** Workbox via `vite-plugin-pwa`

### 2.2 Project Guidelines & Technical Rules

- **Obfuscation:** Production builds MUST perform code minification/obfuscation (`vite.config.ts` build settings).
- **Data Protection:** Client-side storage MUST use encrypted/durable storage adapters for IndexedDB.
- **Workflow:** All feature modifications follow Spec-Driven Development and strict workflow planning via `docs/PLAN.md`.

---

## 3. High-Level Architecture

```
+-----------------------------------------------------------------------+
|                            User Interface                             |
|    Child View (RPG Quests)           Parent Dashboard (Admin & PIN)   |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                          Zustand State Store                          |
|  choreSlice | rewardSlice | syncSlice | configSlice | useAuthStore    |
+-----------------------------------+-----------------------------------+
                                    |
                    +---------------+---------------+
                    |                               |
                    v                               v
+-----------------------+               +-----------------------+
|   Local Persistence   |               |   Cloud Sync Engine   |
| IndexedDB (idb-keyval)|               | SyncService (Supabase)|
| Durable Storage API   |               |  Offline Queue Replay |
+-----------------------+               +-----------------------+
```

---

## 4. Specification Index

The system functionality is specified across the following sub-documents:

- [specs/domain-model.spec.md](file:///Users/nina/development/projects/chore-as-a-game/specs/domain-model.spec.md): Entities, ubiquitous language, and state machines.
- [specs/features/chores-and-gamification.spec.md](file:///Users/nina/development/projects/chore-as-a-game/specs/features/chores-and-gamification.spec.md): Quest lifecycle, XP/Level progression, and Rewards market.
- [specs/features/offline-and-sync.spec.md](file:///Users/nina/development/projects/chore-as-a-game/specs/features/offline-and-sync.spec.md): Offline-first queue, Supabase real-time sync, and data preservation.
- [specs/features/notifications-and-badging.spec.md](file:///Users/nina/development/projects/chore-as-a-game/specs/features/notifications-and-badging.spec.md): PWA notifications, scheduled reminders, and App Badging API.
- [specs/features/security-and-freemium.spec.md](file:///Users/nina/development/projects/chore-as-a-game/specs/features/security-and-freemium.spec.md): Parent authentication, forgot PIN recovery, and tier limits.
