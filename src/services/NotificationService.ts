/**
 * PWA Notification and App Badging Service.
 * 
 * @description
 * Provides a unified API for:
 * - Setting/Clearing the App Icon Badge.
 * - Sending local notifications (reminders, achievements).
 * - Checking permissions.
 */
export const NotificationService = {
    /**
     * Update the App Icon Badge count.
     * @param count - The number to show on the badge.
     */
    updateBadge: async (count: number) => {
        if (!('setAppBadge' in navigator)) return;
        
        try {
            if (count > 0) {
                await (navigator as any).setAppBadge(count);
            } else {
                await (navigator as any).clearAppBadge();
            }
        } catch (error) {
            console.error('Failed to update app badge:', error);
        }
    },

    /**
     * Send a local notification.
     * @param title - Notification title.
     * @param options - Notification options (body, icon, etc).
     */
    sendNotification: async (title: string, options?: NotificationOptions) => {
        if (!("Notification" in window) || Notification.permission !== "granted") {
            return;
        }

        try {
            let registration;
            if ('serviceWorker' in navigator) {
                registration = await navigator.serviceWorker.getRegistration();
                if (!registration && navigator.serviceWorker.ready) {
                    registration = await navigator.serviceWorker.ready;
                }
            }

            const notificationTag = options?.tag || `cq-notif-${Date.now()}`;
            const notificationPayload = {
                icon: '/pwa-192x192.png',
                badge: '/favicon-196.png',
                ...options,
                tag: notificationTag
            };

            if (registration && 'showNotification' in registration) {
                await registration.showNotification(title, notificationPayload);
            } else {
                try {
                    new Notification(title, notificationPayload);
                } catch (e) {
                    console.warn('Native Notification constructor unsupported (iOS Web Push requires Service Worker):', e);
                }
            }
        } catch (error) {
            console.error('Failed to send notification:', error);
        }
    }
};
