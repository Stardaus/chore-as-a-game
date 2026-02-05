# Product Requirements Document (PRD)

## Product Name (Working Title)
**ChoreQuest**

---

## 1. Problem Statement
Parents often struggle to motivate children to complete chores and daily responsibilities consistently. Traditional to-do lists lack engagement, while ad-hoc reward systems are inconsistent and difficult to manage. There is a need for a **parent-controlled, child-friendly, offline-first gamified system** that transforms chores into engaging quests while maintaining healthy motivation and clear boundaries.

---

## 2. Target Users

### Primary Users
- Parents with children aged **4–12 years**

### Secondary Users
- Children who respond positively to games, avatars, visual progress, and rewards

---

## 3. Goals & Success Metrics

### Product Goals
- Increase consistency of chore completion
- Encourage responsibility through structured rewards
- Reduce parent friction in managing chores and incentives
- Operate fully offline without accounts

### Success Metrics
- Number of chores completed per child per week
- Daily active usage per child profile
- Reward redemption frequency
- Parent retention (continued use over weeks)

---

## 4. Core Product Concept
ChoreQuest is a **Progressive Web App (PWA)** that allows parents to create and manage chores and rewards, while children interact with a game-like interface where completing chores earns points, levels, and avatar evolution.

The app supports **multiple child profiles**, configurable chores stored in a reusable **Chore Bank**, and a **reward redemption system** fully controlled by parents.

---

## 5. Key Features Overview

- Multi-child profile system
- Centralized Chore Bank
- Chore assignment with frequency control
- Points, XP, and leveling system
- Parent-defined rewards (Reward Bank)
- Avatar evolution and progression
- Offline-first architecture
- Parent PIN-protected controls

---

## 6. User Stories

### Parent User Stories

**Chore Configuration & Control**
- As a parent, I want to **create chores with configurable frequency (one-time, daily, weekly)** so tasks behave correctly without re-creating them.
- As a parent, I want to **set point values for each chore** so effort and reward are balanced.
- As a parent, I want to **require approval for specific chores** so important tasks are verified.

**Chore Bank Management**
- As a parent, I want all created chores stored in a **Chore Bank** so they can be reused.
- As a parent, I want to **assign chores from the Chore Bank to one or multiple children** easily.
- As a parent, I want to **edit a chore in the Chore Bank** and have changes apply to future assignments.
- As a parent, I want to **pause or archive chores** without deleting them.

**Rewards & Oversight**
- As a parent, I want to **create and manage rewards** so motivation stays healthy.
- As a parent, I want to **view chore completion and redemption history** per child.
- As a parent, I want all administrative actions to be **PIN-protected**.

---

### Child User Stories

- As a child, I want to see **only my active chores** so the app is easy to understand.
- As a child, I want to **earn points immediately** when I complete a chore.
- As a child, I want daily chores to **reset automatically**.
- As a child, I want my avatar to **level up and evolve** as I progress.
- As a child, I want to **redeem rewards myself** so I feel in control.

---

## 7. Page Flow Summary

1. Welcome / First-Time Setup (Parent)
2. Home Screen – Profile Selection
3. Kid Dashboard
4. Quests (Chores / To-Do List)
5. Rewards Shop
6. Redeemed Rewards History
7. Avatar Evolution / Progress
8. Parent Dashboard (PIN Protected)
9. Settings

---

## 8. Functional Requirements

### 8.1 Multi-Profile System
- Support multiple child profiles on one device
- Independent tracking of points, XP, levels, and history

---

### 8.2 Chore Bank

#### Description
A centralized repository where parents create, edit, archive, and manage chores.

#### Chore Attributes
- Chore name
- Icon / category
- Point value
- Frequency: one-time, daily, weekly
- Requires approval (boolean)
- Status: active / archived

---

### 8.3 Chore Assignment System

- Chores from the Chore Bank can be assigned to:
  - One child
  - Multiple children
- Assignment creates a **per-child instance**
- Completion status tracked per child

#### Reset Logic
| Frequency | Behavior |
|---------|---------|
| One-time | Removed after completion |
| Daily | Resets every day |
| Weekly | Resets every week |

---

### 8.4 Quests (Child View)

- Display active assigned chores only
- Visual feedback on completion (animation/sound)
- Optional parent approval workflow

---

### 8.5 Points, XP & Leveling

- Points earned from chores
- XP contributes to leveling
- Level thresholds configurable

---

### 8.6 Rewards System (Reward Bank)

#### Reward Attributes
- Reward title
- Cost in points
- Optional expiry
- Active / archived

#### Redemption Flow
- Child selects reward
- Points deducted
- Reward logged in redemption history
- Optional parent approval

---

### 8.7 Avatar Evolution

- Avatar evolves visually based on level
- Unlockables at defined milestones
- Non-monetary motivation loop

---

## 9. Non-Functional Requirements

- Fully offline-first
- Fast load time (<2 seconds)
- Touch-friendly, child-safe UI
- No ads, no third-party tracking
- Data stored locally

---

## 10. Technical Architecture (High Level)

### Frontend
- React
- Vite or Create React App
- Tailwind CSS or CSS Modules

### Storage
- IndexedDB (primary)
- Optional JSON export

### PWA Features
- Offline caching
- Installable app shell
- Cached sound and image assets

---

## 11. Data Model (Simplified)

### Child Profile
```json
{
  "id": "kid_1",
  "name": "Aisyah",
  "points": 120,
  "xp": 40,
  "level": 3,
  "avatar": {}
}
```

### Chore (Bank)
```json
{
  "id": "chore_1",
  "title": "Make Bed",
  "points": 10,
  "frequency": "daily",
  "requiresApproval": false,
  "status": "active"
}
```

### Chore Assignment
```json
{
  "assignmentId": "assign_1",
  "choreId": "chore_1",
  "childId": "kid_1",
  "completed": false,
  "lastCompletedAt": "2026-01-28"
}
```

### Reward
```json
{
  "id": "reward_1",
  "title": "30 Minutes Screen Time",
  "cost": 50,
  "status": "active"
}
```

---

## 12. Risks & Constraints

- Over-reliance on extrinsic rewards
- Parent inconsistency in approvals
- Device-only data loss (mitigated via export)

---

## 13. MVP Scope

### Included
- Offline-first PWA
- Multi-child profiles
- Chore Bank with assignment
- Points and leveling
- Reward Bank
- Avatar progression

### Excluded (Future)
- Cloud sync
- Cross-device accounts
- Achievements and streak analytics

---

## 14. Future Enhancements

- Cloud backup and sync
- Achievement badges
- Chore templates (e.g. Morning Routine)
- Streaks and habit insights
- Optional monetization (premium features)

---

## 15. Open Questions

- Weekly chore granularity
- Age-based UI scaling
- Parent approval UX design

