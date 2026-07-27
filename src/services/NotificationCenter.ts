import { NotificationService } from './NotificationService';
import { ReminderService } from './ReminderService';
import { useStore } from '../store';

/**
 * NotificationCenter
 *
 * Event-driven deep module encapsulating OS PWA notifications, scheduled evening heartbeats,
 * browser permission guards, and dynamic App Icon Badging.
 */
export const NotificationCenter = {
  /**
   * Request browser notification permission.
   */
  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications');
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const { PushSubscriptionService } = await import('./PushSubscriptionService');
      PushSubscriptionService.subscribe().catch((e) => {
        console.warn('Failed to initialize push subscription:', e);
      });
      return true;
    }
    return false;
  },

  /**
   * Calculate app badge count and apply it to OS launcher icon.
   */
  updateBadgeFromState: (): void => {
    const state = useStore.getState();
    const { assignments, redemptions, notificationPrefs } = state;

    if (!notificationPrefs.badgeEnabled) {
      NotificationService.updateBadge(0);
      return;
    }

    const pendingApprovals = assignments.filter((a) => a.completed && !a.verifiedAt).length;
    const pendingRedemptions = redemptions.filter((r) => !r.approved).length;
    const activeQuests = assignments.filter((a) => !a.completed).length;

    NotificationService.updateBadge(pendingApprovals + pendingRedemptions + activeQuests);
  },

  /**
   * Trigger scheduled reminder evaluation.
   */
  checkScheduledReminders: async (): Promise<void> => {
    await ReminderService.checkAndSendReminder();
  },

  /**
   * Send a local notification.
   */
  sendNotification: async (title: string, options?: NotificationOptions): Promise<void> => {
    await NotificationService.sendNotification(title, options);
  },

  /**
   * Smart Notification Dispatcher:
   * - If app is in FOREGROUND (`document.visibilityState === 'visible'`), display an In-App Toast Banner.
   * - If app is in BACKGROUND (`document.visibilityState === 'hidden'`), trigger OS system notification.
   */
  dispatchSmartNotification: async (options: {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'quest' | 'reward';
    tag?: string;
  }): Promise<void> => {
    const isForeground = document.visibilityState === 'visible';

    if (isForeground) {
      useStore.getState().addToast({
        title: options.title,
        message: options.message,
        type: options.type || 'info',
      });
    } else {
      const { notificationPrefs, setNotificationPrefs } = useStore.getState();
      const hasPermission = 'Notification' in window && Notification.permission === 'granted';

      if (hasPermission && !notificationPrefs.enabled) {
        setNotificationPrefs({ enabled: true });
      }

      if (notificationPrefs.enabled || hasPermission) {
        await NotificationService.sendNotification(options.title, {
          body: options.message,
          tag: options.tag,
        });
      }
    }
  },
};
