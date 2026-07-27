# Specification: Chores & Gamification Mechanics

**Specification Version:** 1.0.0  
**Project:** ChoreQuest  
**Status:** Active

---

## 1. Chore Management Specification

### 1.1 Creation & Editing

- **Inputs:** `title`, `description`, `points` (1–1000), `category`, `recurrence`, `requiresApproval`.
- **Validation:**
  - `title` must be non-empty and max 50 characters.
  - `points` must be a positive integer > 0.
  - Free Tier limits: Maximum 5 active chores allowed unless `isPremium === true`.

### 1.2 Assignment & Recurrence

- A chore can be assigned to one or more Child profiles via `assignChore(choreId, childId)`.
- When assigned, a new `Assignment` record is created with `completed: false`.
- Duplicate active (uncompleted) assignments for the same `(choreId, childId)` pair are prevented.

---

## 2. Gamification & Progression Engine

### 2.1 Point & XP Calculation Rules

- **Points:** Spendable in-game currency earned upon chore completion.
- **Experience Points (XP):** Cumulative progress metric (`lifetime XP`). XP only increases and never decreases when spending points on rewards.

$$\text{New XP} = \text{Current XP} + \text{Chore Points}$$
$$\text{New Points} = \text{Current Points} + \text{Chore Points}$$

### 2.2 Level Progression Formula

Leveling up occurs automatically based on total accumulated XP:

$$\text{Level} = \left\lfloor \frac{\text{XP}}{100} \right\rfloor + 1$$

- **Level 1:** 0–99 XP
- **Level 2:** 100–199 XP
- **Level 3:** 200–299 XP
- **Level N:** $(N-1) \times 100$ XP

### 2.3 Verification & Reward Triggers

1. **Auto-Verified Chores (`requiresApproval === false`):**
   - Toggling completed immediately awards `points` and `XP` to the profile.
2. **Approval-Required Chores (`requiresApproval === true`):**
   - Toggling completed puts assignment into `Pending Approval` status.
   - Points and XP are withheld until Parent calls `approveAssignment(assignmentId)`.
   - Fires local device notification `"Approval Requested"` to Parent device.

---

## 3. Reward Marketplace Specification

### 3.1 Reward Creation & Catalog

- **Fields:** `title`, `cost` (points), `icon`, `category`.
- Free tier limit: Maximum 3 active rewards.

### 3.2 Redemption Flow

1. Child selects reward and clicks "Redeem".
2. **Pre-condition Check:** `profile.points >= reward.cost`. If false, redemption is blocked.
3. **Pending Request:** Creates a `Redemption` record with `approved: false`.
4. **Parent Approval (`approveRedemption`):**
   - Deducts `reward.cost` from `profile.points`.
   - Marks redemption `approved: true`.
   - Fires notification `"Reward Approved!"`.
