import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import { useFamilyStore } from '../store/useFamilyStore';

/**
 * Service for managing real-time data synchronization.
 * 
 * @description
 * Listens for changes in Supabase tables and updates local stores.
 */
export const SyncService = {
    /**
     * Initializes real-time listeners for a specific family.
     */
    initRealtime: (familyId: string) => {
        console.log('🚀 Initializing Realtime Sync for family:', familyId);
        
        const store = useStore.getState();
        const familyStore = useFamilyStore.getState();

        // Single channel for all family updates
        const channel = supabase
            .channel(`family-realtime-${familyId}`)
            .on(
                'postgres_changes',
                { 
                    event: '*', 
                    schema: 'public', 
                    // No filter here to ensure we catch everything, we'll filter in JS 
                    // if needed, but the channel name is already scoped
                },
                (payload) => {
                    console.log('🔔 Realtime Event:', payload.table, payload.eventType);
                    
                    // The payload might not always have family_id in some event types (like delete)
                    // but since the publication/channel is set up, we can trust the source.
                    
                    if (payload.table === 'devices') {
                        // Refresh the device list in the FamilyStore
                        familyStore.fetchDevices(familyId);
                    } else {
                        // Refresh all game data in the MainStore
                        store.syncWithCloud(familyId);
                    }
                }
            )
            .subscribe((status) => {
                console.log('📡 Sync Status:', status);
            });

        return () => {
            console.log('🔌 Disconnecting Realtime Sync');
            supabase.removeChannel(channel);
        };
    }
};
