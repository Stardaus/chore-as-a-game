import { useEffect } from 'react';
import { useStore } from '../store';
import { useAuthStore } from '../store/useAuthStore';
import { NotificationCenter } from '../services/NotificationCenter';
import { SyncService } from '../services/SyncService';
import { get } from 'idb-keyval';

/**
 * Custom hook to manage the global application lifecycle.
 * Handles:
 * - Auth initialization
 * - Cloud synchronization & Cleanup
 * - Real-time listeners
 * - Network & Visibility events
 * - Notification Center integration
 */
export function useAppLifecycle() {
  const {
    refreshAssignments,
    assignments,
    redemptions,
    notificationPrefs,
    syncWithCloud,
    familyId,
    setFamilyId,
    processSyncQueue,
    clearLocalData,
  } = useStore();

  const { initialize: initializeAuth, loading: authLoading, session } = useAuthStore();

  // 1. Initial Load: Auth and Refresh
  useEffect(() => {
    initializeAuth();
    refreshAssignments();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshAssignments();
        NotificationCenter.checkScheduledReminders();
        import('../services/DeviceService').then(({ DeviceService }) => {
          DeviceService.touchLastSeen();
        });
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration().then((reg) => {
            if (reg) reg.update();
          });
        }
      }
    };

    const handleOnline = async () => {
      console.log('📡 Connection restored! Processing offline queue...');
      await processSyncQueue();
      const targetFamilyId = familyId || (await get('linked-family-id'));
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
      let targetFamilyId = await get<string>('linked-family-id');
      let fetchSuccessful = false;

      if (!targetFamilyId && session?.user && navigator.onLine) {
        try {
          const { useFamilyStore } = await import('../store/useFamilyStore');
          const familyId = await useFamilyStore.getState().fetchFamily();
          if (familyId) {
            targetFamilyId = familyId;
            fetchSuccessful = true;
          }
        } catch (e) {
          console.warn('Network error during family session verification.');
        }
      } else if (targetFamilyId) {
        fetchSuccessful = true;
      }

      if (targetFamilyId) {
        syncWithCloud(targetFamilyId);
        import('../services/DeviceSessionModule').then(({ DeviceSessionModule }) => {
          DeviceSessionModule.init(targetFamilyId);
        });
      } else if (fetchSuccessful && navigator.onLine) {
        if (familyId) {
          console.log('🧹 Cleanup: Server confirmed device unlinked, clearing data.');
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
    NotificationCenter.updateBadgeFromState();
  }, [assignments, redemptions, notificationPrefs.badgeEnabled]);

  // 5. Global Reminder & Device Liveness Heartbeat
  useEffect(() => {
    const triggerHeartbeat = () => {
      NotificationCenter.checkScheduledReminders();
      import('../services/DeviceService').then(({ DeviceService }) => {
        DeviceService.touchLastSeen();
      });
    };

    const interval = setInterval(triggerHeartbeat, 60000);
    triggerHeartbeat();
    return () => clearInterval(interval);
  }, []);

  return { authLoading };
}
