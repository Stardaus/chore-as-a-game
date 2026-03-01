import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import { useFamilyStore } from '../store/useFamilyStore';
import { useAuthStore } from '../store/useAuthStore';
import { get } from 'idb-keyval';

/**
 * Service for managing real-time data synchronization and remote lifecycle events.
 */
export const SyncService = {
    /**
     * Initializes real-time listeners for a specific family.
     */
    initRealtime: (familyId: string) => {
        if (!navigator.onLine) return () => {}; // Skip realtime init if offline

        const store = useStore.getState();
        const familyStore = useFamilyStore.getState();
        const authStore = useAuthStore.getState();

        try {
            const channel = supabase
                .channel(`family-realtime-${familyId}`)
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public' },
                    async (payload) => {
                        console.log('🔔 Realtime Event:', payload.table, payload.eventType);
                        
                        // Handle Remote Unlinking
                        if (payload.table === 'devices' && payload.eventType === 'DELETE') {
                            const myDeviceId = await get('chore-quest-device-id');
                            // If MY device was the one deleted, force logout
                            if (payload.old && payload.old.id === myDeviceId) {
                                alert('This device has been unlinked from the family hub by a parent.');
                                authStore.signOut(); // This clears local storage and redirects
                                return;
                            }
                            // Otherwise, just refresh the list for the parent
                            familyStore.fetchDevices(familyId);
                            return;
                        }

                        if (payload.table === 'devices') {
                            familyStore.fetchDevices(familyId);
                        } else {
                            store.syncWithCloud(familyId);
                        }
                    }
                )
                .subscribe((status) => {
                    if (status === 'CHANNEL_ERROR') {
                        console.warn('⚠️ Realtime connection error (network issue?)');
                    }
                });

            return () => {
                supabase.removeChannel(channel);
            };
        } catch (e) {
            console.warn('Failed to initialize realtime channel:', e);
            return () => {};
        }
    }
};
