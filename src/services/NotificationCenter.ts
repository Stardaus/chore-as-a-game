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
        if (!("Notification" in window)) {
            alert("This browser does not support desktop notifications");
            return false;
        }

        const permission = await Notification.requestPermission();
        return permission === "granted";
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

        const pendingApprovals = assignments.filter(a => a.completed && !a.verifiedAt).length;
        const pendingRedemptions = redemptions.filter(r => !r.approved).length;
        const activeQuests = assignments.filter(a => !a.completed).length;

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
    }
};
