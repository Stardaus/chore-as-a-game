import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../lib/supabase';
import { Validation } from '../../lib/validation';
import type { StoreSet, StoreGet, ProfileSlice } from './types';

export const createProfileSlice = (set: StoreSet, get: StoreGet): ProfileSlice => ({
  profiles: [],

  addProfile: async (name, avatar) => {
    let familyId = get().familyId;
    const { profiles, safeSync } = get();
    if (!familyId) {
      const idb = await import('idb-keyval');
      familyId = (await idb.get<string>('linked-family-id')) || null;
      if (!familyId) {
        const { useFamilyStore } = await import('../useFamilyStore');
        familyId = await useFamilyStore.getState().fetchFamily();
      }
      if (familyId) set({ familyId });
    }

    const result = Validation.profile({ name });
    if (!result.valid) {
      alert(result.error);
      return;
    }
    const { SubscriptionEntitlementModule } =
      await import('../../services/SubscriptionEntitlementModule');
    const entitlement = SubscriptionEntitlementModule.canAdd('profiles');
    if (!entitlement.allowed) {
      alert(entitlement.message || 'Free tier limit reached!');
      return;
    }

    const newProfile = {
      id: uuidv4(),
      name: result.data!.name,
      avatar,
      points: 0,
      xp: 0,
      level: 1,
    };
    set({ profiles: [...profiles, newProfile] });
    if (familyId) await safeSync('profiles', 'insert', { ...newProfile, family_id: familyId });
  },

  updateProfile: async (id, updates) => {
    const { familyId, profiles, safeSync } = get();
    if (updates.name) {
      const result = Validation.profile({ name: updates.name });
      if (!result.valid) {
        alert(result.error);
        return;
      }
      updates.name = result.data!.name;
    }
    set({ profiles: profiles.map((p) => (p.id === id ? { ...p, ...updates } : p)) });
    if (familyId) await safeSync('profiles', 'update', updates, { column: 'id', value: id });
  },

  deleteProfile: async (id) => {
    const { familyId, profiles, assignments, redemptions, safeSync } = get();
    set({
      profiles: profiles.filter((p) => p.id !== id),
      assignments: assignments.filter((a) => a.childId !== id),
      redemptions: redemptions.filter((r) => r.childId !== id),
    });
    if (familyId) await safeSync('profiles', 'delete', undefined, { column: 'id', value: id });
  },

  resetPoints: async () => {
    const { familyId, queueSyncOperation } = get();

    set((state) => ({
      profiles: state.profiles.map((p) => ({ ...p, points: 0, xp: 0, level: 1 })),
      assignments: state.assignments.map((a) => ({
        ...a,
        completed: false,
        completedAt: undefined,
        verifiedAt: undefined,
      })),
      redemptions: [],
    }));

    if (familyId) {
      if (navigator.onLine) {
        try {
          const { error } = await supabase.rpc('reset_family_points', {
            target_family_id: familyId,
          });
          if (error) throw error;
          console.log('✅ Remote points and history reset successfully.');
        } catch (error) {
          console.error('❌ Failed to reset remote progress:', error);
        }
      } else {
        queueSyncOperation({
          id: uuidv4(),
          table: 'rpc',
          action: 'update',
          payload: { function: 'reset_family_points', params: { target_family_id: familyId } },
          timestamp: Date.now(),
        } as any);
      }
    }
  },
});
