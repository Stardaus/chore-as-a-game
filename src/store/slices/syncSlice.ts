import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../lib/supabase';
import { Mappers } from '../../lib/mappers';
import type { StoreSet, StoreGet, SyncSlice } from './types';
import { SyncEngine } from '../../services/SyncEngine';


export const createSyncSlice = (set: StoreSet, get: StoreGet): SyncSlice => ({
    syncQueue: [],
    familyId: null,
    isSyncing: false,

    safeSync: async (table, action, payload, match) => {
        await SyncEngine.dispatch({ table, action, payload, match });
    },

    queueSyncOperation: (op) => {
        set((state) => ({
            syncQueue: [...state.syncQueue, { ...op, id: uuidv4(), timestamp: Date.now() }]
        }));
    },

    processSyncQueue: async () => {
        await SyncEngine.processQueue();
    },

    syncWithCloud: async (familyId: string) => {
        if (!navigator.onLine) return;
        
        set({ isSyncing: true, familyId });
        try {
            const [p, c, a, r, rd, f] = await Promise.all([
                supabase.from('profiles').select('*').eq('family_id', familyId),
                supabase.from('chores').select('*').eq('family_id', familyId),
                supabase.from('assignments').select('*').eq('family_id', familyId),
                supabase.from('rewards').select('*').eq('family_id', familyId),
                supabase.from('redemptions').select('*').eq('family_id', familyId),
                supabase.from('families').select('subscription_tier').eq('id', familyId).single(),
            ]);

            if (p.error || c.error || a.error || r.error || rd.error || f.error) {
                console.warn('Sync partially failed (network issue?), preserving local data.');
                return; 
            }

            set({
                profiles: p.data || [],
                chores: (c.data || []).map(Mappers.chore),
                assignments: (a.data || []).map(Mappers.assignment),
                rewards: r.data || [],
                redemptions: (rd.data || []).map(Mappers.redemption),
                isPremium: f.data?.subscription_tier === 'premium'
            });
        } catch (error) { 
            console.error('Cloud Sync Error:', error); 
        } finally { 
            set({ isSyncing: false }); 
        }
    },

    setFamilyId: (id) => set({ familyId: id }),

    clearLocalData: () => set({ 
        profiles: [], chores: [], assignments: [], rewards: [], redemptions: [], syncQueue: [],
        familyId: null,
        parentPin: '0000',
        recoveryQuestion: '',
        recoveryAnswer: '',
        notificationPrefs: { enabled: false, badgeEnabled: true },
        reminderSettings: { enabled: true, time: '21:00', lastSentDate: null }
    }),

    wipeFamilyData: async () => {
        const { familyId } = get();
        
        if (familyId && navigator.onLine) {
            try {
                const { error } = await supabase.rpc('wipe_family_data', { target_family_id: familyId });
                if (error) throw error;
                console.log('✅ Remote family data and devices wiped successfully.');
            } catch (error) {
                console.error('❌ Failed to wipe remote family data:', error);
            }
        } else if (familyId) {
            get().queueSyncOperation({ 
                id: uuidv4(),
                table: 'rpc', 
                action: 'delete', 
                payload: { function: 'wipe_family_data', params: { target_family_id: familyId } },
                timestamp: Date.now()
            } as any);
        }

        get().clearLocalData();

        const idb = await import('idb-keyval');
        await idb.del('linked-family-id');
    }
});
