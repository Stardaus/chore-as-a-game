import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Family {
  id: string;
  parent_id: string;
  subscription_tier: 'free' | 'premium';
  join_code: string | null;
  device_stale_days?: number;
}

export interface Device {
  id: string;
  name: string;
  role?: 'main' | 'secondary_parent' | 'secondary_child';
  is_stale?: boolean;
  last_seen_at: string;
}

interface FamilyState {
  family: Family | null;
  devices: Device[];
  loading: boolean;

  // Actions
  fetchFamily: () => Promise<string | null>;
  generateJoinCode: () => Promise<string | null>;
  fetchDevices: (familyId: string) => Promise<void>;
  removeDevice: (deviceId: string) => Promise<void>;
  renameDevice: (deviceId: string, newName: string) => Promise<void>;
  updateStaleDays: (days: number) => Promise<void>;
}

/**
 * Store for managing Family-level settings and connected devices.
 */
export const useFamilyStore = create<FamilyState>((set, get) => ({
  family: null,
  devices: [],
  loading: false,

  fetchFamily: async () => {
    set({ loading: true });
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('parent_id', userData.user.id)
        .maybeSingle();

      if (error) throw error;
      set({ family: data });

      if (data?.id) {
        const idb = await import('idb-keyval');
        await idb.set('linked-family-id', data.id);
        const { useStore } = await import('./useStore');
        useStore.getState().setFamilyId(data.id);
        useStore.getState().syncWithCloud(data.id);
      }

      return data?.id || null;
    } catch (error) {
      console.error('Error fetching family:', error);
      return null;
    } finally {
      set({ loading: false });
    }
  },

  generateJoinCode: async () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const { error } = await supabase
        .from('families')
        .update({
          join_code: code,
          join_code_expires_at: expiresAt.toISOString(),
        })
        .eq('parent_id', userData.user.id);

      if (error) throw error;

      set((state) => ({
        family: state.family ? { ...state.family, join_code: code } : null,
      }));
      return code;
    } catch (error) {
      console.error('Error generating join code:', error);
      return null;
    }
  },

  fetchDevices: async (familyId: string) => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('id, name, role, is_stale, last_seen_at')
        .eq('family_id', familyId)
        .order('last_seen_at', { ascending: false });

      if (error) throw error;
      set({ devices: data || [] });
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  },

  removeDevice: async (deviceId: string) => {
    try {
      const { error } = await supabase.from('devices').delete().eq('id', deviceId);

      if (error) throw error;
      set((state) => ({
        devices: state.devices.filter((d) => d.id !== deviceId),
      }));
    } catch (error) {
      console.error('Error removing device:', error);
    }
  },

  renameDevice: async (deviceId: string, newName: string) => {
    try {
      const { error } = await supabase.from('devices').update({ name: newName }).eq('id', deviceId);
      if (error) throw error;
      set((state) => ({
        devices: state.devices.map((d) => (d.id === deviceId ? { ...d, name: newName } : d)),
      }));
    } catch (error) {
      console.error('Error renaming device:', error);
    }
  },

  updateStaleDays: async (days: number) => {
    const family = get().family;
    if (!family) return;

    try {
      const { error } = await supabase
        .from('families')
        .update({ device_stale_days: days })
        .eq('id', family.id);

      if (error) throw error;
      set((state) => ({
        family: state.family ? { ...state.family, device_stale_days: days } : null,
      }));
    } catch (error) {
      console.error('Error updating stale threshold:', error);
    }
  },
}));
