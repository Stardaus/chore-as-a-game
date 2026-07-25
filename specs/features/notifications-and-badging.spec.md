# Specification: Device Notifications & App Badging Module

**Specification Version:** 1.0.0  
**Project:** ChoreQuest  
**Status:** Active  

---

## 1. System Overview

The Device Notification module provides OS-level and web notifications, daily automated reminders, and native PWA icon badges to keep parents and children informed of quest progress and approvals.

---

## 2. Notification Types & Triggers

| Event Type | Trigger | Title | Notification Body | Options / Tag |
| :--- | :--- | :--- | :--- | :--- |
| **Assignment** | Parent assigns chore in `assignChore()` | `"New Quest Assigned!"` | `${child.name} has a new quest: ${chore.title}` | `tag: assign-${choreId}-${childId}` |
| **Approval Request** | Child completes chore needing approval in `toggleAssignment()` | `"Approval Requested"` | `${child.name} finished: ${chore.title}` | `tag: approve-${assignmentId}` |
| **Verification** | Parent approves chore in `approveAssignment()` | `"Quest Verified!"` | `Success! ${chore.title} is complete. +${points} XP` | `tag: verified-${assignmentId}` |
| **Evening Nudge** | Daily scheduled heartbeat in `ReminderService` | `"Evening Check-in 🌙"` | `Have ${child.name} finished "${chore.title}" yet for today?` | `requireInteraction: true`, `tag: evening-reminder` |

---

## 3. Implementation Specification

### 3.1 Service Architecture ([NotificationService](file:///Users/nina/development/projects/chore-as-a-game/src/services/NotificationService.ts#L10))
```typescript
sendNotification(title: string, options?: NotificationOptions)
```
1. Validates `("Notification" in window)` and `Notification.permission === "granted"`. If permission is missing, exits gracefully.
2. Checks for active ServiceWorker registration via `navigator.serviceWorker.getRegistration()`.
   - **If SW Registered:** Calls `registration.showNotification(title, { icon: '/pwa-192x192.png', badge: '/favicon-196.png', ...options })`.
   - **Fallback:** Calls `new Notification(title, options)`.

### 3.2 Scheduled Reminders ([ReminderService](file:///Users/nina/development/projects/chore-as-a-game/src/services/ReminderService.ts#L11))
- Executes every 60 seconds via `setInterval` in [useAppLifecycle](file:///Users/nina/development/projects/chore-as-a-game/src/hooks/useAppLifecycle.ts#L128) and on `visibilitychange`.
- Compares current time with `reminderSettings.time` (e.g. `20:00`).
- Validates `reminderSettings.lastSentDate !== todayStr` to prevent duplicate daily alerts.
- Picks a random incomplete assignment to personalize the reminder text.

### 3.3 App Icon Badging API
- Updates OS app launcher badge via `NotificationService.updateBadge(count)` using `navigator.setAppBadge(count)` / `navigator.clearAppBadge()`.
- Badge count formula:
$$\text{Badge Count} = \text{Pending Approvals} + \text{Pending Redemptions} + \text{Active Quests}$$
- Set to `0` when `notificationPrefs.badgeEnabled === false`.
