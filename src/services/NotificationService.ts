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
            // Use Service Worker if available for better background handling
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                registration.showNotification(title, {
                    icon: '/pwa-192x192.png',
                    badge: '/favicon-196.png',
                    ...options
                });
            } else {
                new Notification(title, options);
            }
        } catch (error) {
            console.error('Failed to send notification:', error);
        }
    }
};
