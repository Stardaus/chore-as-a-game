import { useEffect } from 'react';
import { useStore } from '../store';
import { useAuthStore } from '../store/useAuthStore';
import { NotificationService } from '../services/NotificationService';
import { ReminderService } from '../services/ReminderService';
import { SyncService } from '../services/SyncService';
import { get } from 'idb-keyval';

/**
 * Custom hook to manage the global application lifecycle.
 * Handles:
 * - Auth initialization
 * - Cloud synchronization & Cleanup
 * - Real-time listeners
 * - Network & Visibility events
 * - App Badging & Reminders
 */
export function useAppLifecycle() {
    const { 
        refreshAssignments, assignments, redemptions, notificationPrefs, 
        syncWithCloud, familyId, setFamilyId, processSyncQueue, clearLocalData 
    } = useStore();
    
    const { initialize: initializeAuth, loading: authLoading, session } = useAuthStore();

    // 1. Initial Load: Auth and Refresh
    useEffect(() => {
        initializeAuth();
        refreshAssignments();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                refreshAssignments();
                ReminderService.checkAndSendReminder();
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistration().then(reg => {
                        if (reg) reg.update();
                    });
                }
            }
        };

        const handleOnline = async () => {
            console.log('📡 Connection restored! Processing offline queue...');
            await processSyncQueue();
            const targetFamilyId = familyId || await get('linked-family-id');
            if (targetFamilyId) {
                syncWithCloud(targetFamilyId);
            }
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('online', handleOnline);

        if (navigator.onLine) {
            handleOnline();
        }

        return () => {
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('online', handleOnline);
        };
    }, [refreshAssignments, initializeAuth, processSyncQueue, syncWithCloud, familyId]);

    // 2. Cloud Sync Initializer
    useEffect(() => {
        const initSync = async () => {
            let targetFamilyId = await get('linked-family-id');
            let fetchSuccessful = false;

            if (!targetFamilyId && session?.user && navigator.onLine) {
                try {
                    const { data, error } = await import('../lib/supabase').then(m => 
                        m.supabase.from('families').select('id').single()
                    );
                    if (!error) {
                        targetFamilyId = data?.id || null;
                        fetchSuccessful = true;
                    }
                } catch (e) {
                    console.warn("Network error during family session verification.");
                }
            } else if (targetFamilyId) {
                fetchSuccessful = true;
            }

            if (targetFamilyId) {
                syncWithCloud(targetFamilyId);
            } else if (fetchSuccessful && navigator.onLine) {
                if (familyId) {
                    console.log("🧹 Cleanup: Server confirmed device unlinked, clearing data.");
                    clearLocalData();
                } else {
                    setFamilyId(null);
                }
            }
        };

        if (!authLoading) {
            initSync();
        }
    }, [session, authLoading, syncWithCloud, setFamilyId, familyId, clearLocalData]);

    // 3. Real-time Subscription
    useEffect(() => {
        if (familyId) {
            const cleanup = SyncService.initRealtime(familyId);
            return cleanup;
        }
    }, [familyId]);

    // 4. Global Badging Logic
    useEffect(() => {
        if (!notificationPrefs.badgeEnabled) {
            NotificationService.updateBadge(0);
            return;
        }

        const pendingApprovals = assignments.filter(a => a.completed && !a.verifiedAt).length;
        const pendingRedemptions = redemptions.filter(r => !r.approved).length;
        const activeQuests = assignments.filter(a => !a.completed).length;

        NotificationService.updateBadge(pendingApprovals + pendingRedemptions + activeQuests);
    }, [assignments, redemptions, notificationPrefs.badgeEnabled]);

    // 5. Global Reminder Heartbeat
    useEffect(() => {
        const interval = setInterval(() => {
            ReminderService.checkAndSendReminder();
        }, 60000);
        ReminderService.checkAndSendReminder();
        return () => clearInterval(interval);
    }, []);

    return { authLoading };
}
