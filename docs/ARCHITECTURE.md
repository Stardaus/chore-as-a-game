# ChoreQuest Architecture & Codebase Reference

This document provides an overview of the technical architecture, folder structure, and key components of ChoreQuest.

## 1. Architectural Philosophy
ChoreQuest follows a **Feature-Based (Modular) Architecture**. This approach groups related logic, components, and types by their domain (e.g., Chores, Rewards) rather than their technical role. This ensures high cohesion and makes the codebase easier to scale as new "game" mechanics are added.

## 2. Folder Structure

```text
src/
├── assets/              # Global static assets (images, icons, sounds)
├── components/          # Truly generic, reusable UI components
│   └── ui/              # Atomic elements (Button, Card, Input, Modal)
├── constants/           # App-wide constants (Points, Config, Enums)
├── features/            # Domain-driven modules (Core Business Logic)
│   ├── avatars/         # Evolution logic and avatar views
│   ├── chores/          # Chore Bank, assignments, and QuestList
│   ├── profiles/        # Profile selection and management
│   └── rewards/         # Reward Bank and Reward Shop
├── hooks/               # Global custom React hooks
├── layouts/             # Shared page structural wrappers
├── lib/                 # Third-party library configurations (e.g., Tailwind merge)
├── pages/               # Top-level route entry points
├── services/            # Infrastructure (e.g., IndexedDB/Storage wrappers)
├── store/               # Global state management (Zustand)
├── types/               # Shared TypeScript interfaces
└── utils/               # Pure utility functions
```

## 3. Global State (Zustand)

The application state is managed in `src/store/useStore.ts` using Zustand with persistence middleware.

### **Core Actions**
- **Profiles**: `addProfile`, `updateProfile`, `deleteProfile`.
- **Chores**: `addChore`, `updateChore`, `archiveChore`.
- **Assignments**:
  - `assignChore`: Links a chore to a child.
  - `toggleAssignment`: Marks a chore as complete. Awards points immediately if no approval is required.
  - `approveAssignment`: Finalizes a chore and awards points (Parent only).
- **Rewards**: `addReward`, `archiveReward`, `redeemReward` (Deducts points and logs transaction).
- **Bulk Operations**: `assignChoresByTag` and `seedDefaultChores`.

---

## 4. Component Reference

### **Feature: Profiles**
- **`ProfileManager`**: (`profiles/components/`) Interface for parents to manage child accounts.
- **`ChildHeader`**: (`profiles/components/`) Displays the "Game HUD" (XP, Level, Points) for children.
- **`ProfileSelection`**: (`pages/`) The "Who is playing?" landing screen.

### **Feature: Chores**
- **`ChoreBank`**: (`chores/components/`) The central library of chores created by parents.
- **`QuestList`**: (`chores/components/`) The child-facing to-do list with status feedback.
- **`ApprovalQueue`**: (`chores/components/`) List of chores pending parent verification.
- **`AssignChoreModal`**: (`chores/components/`) Dialog for individual chore assignment.
- **`BulkAssignModal`**: (`chores/components/`) Dialog for tagging-based group assignments.

### **Feature: Rewards**
- **`RewardBank`**: (`rewards/components/`) Library of parent-defined incentives.
- **`RewardShop`**: (`rewards/components/`) Child-facing store for redeeming points.

### **Common UI**
- **`Button`**: Variant-based button system (default, outline, ghost).
- **`Card`**: Standardized container for grouped content.
- **`Modal`**: Generic overlay for forms and dialogs.
- **`Input`**: Standardized text and number input fields.

---

## 5. Page Flow
1. **Root (`/`)**: `ProfileSelection` page.
2. **Child Path (`/child/:id`)**: `ChildDashboard` (HUD + Quests/Rewards).
3. **Parent Path (`/parent`)**: `ParentDashboard` (Management Tabs).

---

## 6. Utilities
- **`cn`**: (`src/lib/utils.ts`) Combines Tailwind classes conditionally and handles merging conflicts.

## 7. Dependency Mapping & Module Graph

The following table maps the critical file dependencies, illustrating how the Feature-Based Architecture is wired together.

| Scope | File / Module | Depends On (Imports) | Description |
| :--- | :--- | :--- | :--- |
| **Entry** | `src/main.tsx` | `App.tsx`, `index.css`, `virtual:pwa-register` | Application bootstrapper. |
| **Routing** | `src/App.tsx` | `pages/*`, `layouts/Layout` | Route definitions and layout wrapping. |
| **State** | `src/store/useStore.ts` | `zustand`, `idb-keyval`, `types/index.ts` | Centralized state; **no component imports** to avoid cycles. |
| **Pages** | `ChildDashboard.tsx` | `features/profiles/ChildHeader`<br>`features/chores/QuestList`<br>`features/rewards/RewardShop` | **Aggregator**: Combines read-only profile views with interactive chore/reward lists. |
| | `ParentDashboard.tsx` | `features/profiles/ProfileManager`<br>`features/chores/ChoreBank`<br>`features/rewards/RewardBank`<br>`features/settings/SettingsModal` | **Aggregator**: Hosts management components for all domains. |
| | `ProfileSelection.tsx` | `store`, `components/ui/` | Landing page using direct store access. |
| **Feature: Chores** | `QuestList.tsx` | `store`, `types`, `components/ui/` | Renders `Assignment` objects; dispatches `toggleAssignment`. |
| | `ChoreBank.tsx` | `store`, `types`, `components/ui/` | Renders/Edits `Chore` definitions. |
| **Feature: Profiles** | `ChildHeader.tsx` | `types` | Pure presentational component for stats (XP, Level). |
| | `ProfileManager.tsx` | `store`, `components/ui/` | Manages `Profile` CRUD operations. |
| **Feature: Auth** | `ParentAuth.tsx` | `store` (PIN/Recovery), `components/ui/` | Gatekeeper for Parent Dashboard. |
| **Shared** | `components/ui/*` | `react`, `lucide-react`, `lib/utils` | Pure UI elements; **zero domain logic**. |
