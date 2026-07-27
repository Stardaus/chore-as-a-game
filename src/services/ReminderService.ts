import { useStore } from '../store';
import { NotificationCenter } from './NotificationCenter';

/**
 * Service to handle scheduled evening reminders.
 *
 * @description
 * Logic to check uncompleted tasks and send a personalized nudge
 * to the parent/device at a specific time.
 */
export const ReminderService = {
  /**
   * Checks if a reminder should be sent and fires the notification.
   */
  checkAndSendReminder: async () => {
    const state = useStore.getState();
    const { reminderSettings, notificationPrefs, assignments, profiles, chores } = state;

    if (!reminderSettings.enabled || !notificationPrefs.enabled) return;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 1. Check if already sent today
    if (reminderSettings.lastSentDate === todayStr) return;

    // 2. Check if current time matches reminder time
    const [targetHour, targetMinute] = reminderSettings.time.split(':').map(Number);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Fire if it's the target hour and we are past or at the target minute
    if (currentHour === targetHour && currentMinute >= targetMinute) {
      // 3. Find uncompleted quests
      const incomplete = assignments.filter((a) => !a.completed);

      if (incomplete.length > 0) {
        // Pick a random one for personalization
        const randomAssignment = incomplete[Math.floor(Math.random() * incomplete.length)];
        const profile = profiles.find((p) => p.id === randomAssignment.childId);
        const chore = chores.find((c) => c.id === randomAssignment.choreId);

        const message =
          profile && chore
            ? `Have ${profile.name} finished "${chore.title}" yet for today?`
            : `Some quests are still waiting to be finished today!`;

        await NotificationCenter.dispatchSmartNotification({
          title: 'Evening Check-in 🌙',
          message,
          type: 'quest',
          tag: 'evening-reminder',
        });
      }

      // 4. Mark as sent
      state.updateReminderSettings({ lastSentDate: todayStr });
    }
  },
};
