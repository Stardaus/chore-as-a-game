# Specification: Security, Parent Authentication & Freemium Model

**Specification Version:** 1.0.0  
**Project:** ChoreQuest  
**Status:** Active

---

## 1. Parent Access Control & Security

### 1.1 Parent PIN Protection

- The Parent Dashboard is protected by a 4-digit PIN stored in `parentPin` state (default: `0000`).
- Guard component `ParentAuth.tsx` renders if `isAuthenticated === false`.
- Success unlocks session state `isAuthenticated = true`.

### 1.2 Forgot PIN Recovery Engine

If a parent forgets their PIN, the recovery system allows unlocking via two mechanisms:

1. **Custom Security Question:**
   - User configures Question + Answer in Settings.
   - Answer check is case-insensitive and whitespace-trimmed.
2. **Adult Verification Challenge (Math Fallback):**
   - If no security question is set, the app generates a complex multi-step math problem:
     $$\text{Challenge} = (A \times B) + C$$
     where $A \in [10, 99]$, $B \in [10, 20]$, $C \in [100, 500]$.
   - Solving correctly forces a PIN reset prompt and grants access.

---

## 2. Freemium Tier Model & Enforcement

### 2.1 Subscription Tiers & Resource Limits

| Resource           | Free Tier Limit       | Premium Tier (`isPremium === true`) |
| :----------------- | :-------------------- | :---------------------------------- |
| **Child Profiles** | Maximum 1 Profile     | Unlimited                           |
| **Active Chores**  | Maximum 5 Chore Types | Unlimited                           |
| **Active Rewards** | Maximum 3 Rewards     | Unlimited                           |

### 2.2 Enforcement Points

- **Store-Level Guard:** Actions like `addProfile`, `addChore`, `addReward` check `!isPremium && currentCount >= limit`. If limit is reached, action returns false / throws alert.
- **UI-Level Guard:** Add buttons and creation inputs are disabled when limit is reached, displaying an "Upgrade to Premium" badge.
- **Payment Simulation:** Users can toggle `isPremium` in `SettingsModal` via simulated payment.
