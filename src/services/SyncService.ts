import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import { useFamilyStore } from '../store/useFamilyStore';
import { useAuthStore } from '../store/useAuthStore';
import { NotificationCenter } from './NotificationCenter';
import { SyncEngine } from './SyncEngine';
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
                            if (payload.old && (payload.old as any).id === myDeviceId) {
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
                            return;
                        }

                        // Check if this mutation was performed by the local device
                        const targetId = (payload.new as any)?.id || (payload.old as any)?.id;
                        const isSelfAction = targetId ? SyncEngine.isLocalMutation(targetId) : false;

                        // Sync state with cloud first
                        await store.syncWithCloud(familyId);

                        // If mutation originated from another device, dispatch smart notification
                        if (!isSelfAction && targetId) {
                            const currentState = useStore.getState();

                            if (payload.table === 'profiles' && payload.eventType === 'UPDATE') {
                                const newProf = payload.new as any;
                                const oldProf = payload.old as any;
                                const ptsDiff = (newProf?.points || 0) - (oldProf?.points || 0);

                                if (ptsDiff > 0 || newProf?.points !== oldProf?.points) {
                                    NotificationCenter.dispatchSmartNotification({
                                        title: "Points Awarded! 🎉",
                                        message: `${newProf?.name || 'Child'} earned points! Total: ${newProf?.points || 0} XP`,
                                        type: 'success',
                                        tag: `pts-${newProf?.id}-${Date.now()}`
                                    });
                                }
                            } else if (payload.table === 'assignments') {
                                const newAss = payload.new as any;
                                const oldAss = payload.old as any;

                                if (payload.eventType === 'INSERT') {
                                    const profile = currentState.profiles.find(p => p.id === newAss?.profile_id);
                                    const chore = currentState.chores.find(c => c.id === newAss?.chore_id);
                                    NotificationCenter.dispatchSmartNotification({
                                        title: "New Quest Assigned!",
                                        message: `${profile?.name || 'Child'} has a new quest: ${chore?.title || 'Chore'}`,
                                        type: 'quest',
                                        tag: `assign-${newAss?.id}`
                                    });
                                } else if (payload.eventType === 'UPDATE') {
                                    const chore = currentState.chores.find(c => c.id === newAss?.chore_id);
                                    const profile = currentState.profiles.find(p => p.id === newAss?.profile_id);

                                    if (newAss?.verified_at && (!oldAss || !oldAss.verified_at)) {
                                        NotificationCenter.dispatchSmartNotification({
                                            title: "Quest Verified! ⭐",
                                            message: `Success! ${chore?.title || 'Quest'} is verified. +${chore?.points || 0} XP`,
                                            type: 'success',
                                            tag: `verified-${newAss?.id}`
                                        });
                                    } else if (newAss?.completed && (!oldAss || !oldAss.completed)) {
                                        if (chore?.requiresApproval) {
                                            NotificationCenter.dispatchSmartNotification({
                                                title: "Approval Requested",
                                                message: `${profile?.name || 'Child'} finished: ${chore?.title || 'Chore'}`,
                                                type: 'quest',
                                                tag: `approve-${newAss?.id}`
                                            });
                                        } else {
                                            NotificationCenter.dispatchSmartNotification({
                                                title: "Quest Completed! 🎉",
                                                message: `${profile?.name || 'Child'} finished: ${chore?.title || 'Chore'}`,
                                                type: 'success',
                                                tag: `complete-${newAss?.id}`
                                            });
                                        }
                                    }
                                }
                            } else if (payload.table === 'redemptions') {
                                const newRed = payload.new as any;
                                if (payload.eventType === 'INSERT') {
                                    const profile = currentState.profiles.find(p => p.id === newRed?.profile_id);
                                    const reward = currentState.rewards.find(r => r.id === newRed?.reward_id);
                                    NotificationCenter.dispatchSmartNotification({
                                        title: "Reward Requested!",
                                        message: `${profile?.name || 'Child'} requested: ${reward?.title || 'Reward'}`,
                                        type: 'reward',
                                        tag: `redemption-${newRed?.id}`
                                    });
                                }
                            }
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
