import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useStore } from './useStore';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  isDeviceLinked: boolean;
  loading: boolean;
  initialized: boolean;
  isValidatingAuth: boolean;

  // Actions
  setSession: (session: Session | null) => void;
  setDeviceLinked: (linked: boolean) => void;
  setValidatingAuth: (validating: boolean) => void;
  refreshLinkStatus: () => Promise<void>;
  signOut: () => Promise<void>;
  unlinkDevice: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isDeviceLinked: false,
  loading: true,
  initialized: false,
  isValidatingAuth: false,

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      loading: false,
    }),

  setDeviceLinked: (linked) => set({ isDeviceLinked: linked }),
  setValidatingAuth: (validating) => set({ isValidatingAuth: validating }),

  refreshLinkStatus: async () => {
    const idb = await import('idb-keyval');
    const linkedFamilyId = await idb.get('linked-family-id');
    const { session } = useAuthStore.getState();
    const isLinked = !!linkedFamilyId || !!session;

    set({ isDeviceLinked: isLinked });

    // If we have a local ID, tell the main store to sync
    if (linkedFamilyId) {
      useStore.getState().syncWithCloud(linkedFamilyId);
    }
  },

  signOut: async () => {
    const { DeviceSessionModule } = await import('../services/DeviceSessionModule');
    await DeviceSessionModule.signOut();
  },

  unlinkDevice: async () => {
    const idb = await import('idb-keyval');
    const myDeviceId = await idb.get<string>('chore-quest-device-id');

    if (myDeviceId && navigator.onLine) {
      try {
        await supabase.from('devices').delete().eq('id', myDeviceId);
      } catch (e) {
        console.warn('Failed to remove device row remotely:', e);
      }
    }

    const { DeviceService } = await import('../services/DeviceService');
    await DeviceService.clearDeviceRole();
    await idb.del('linked-family-id');
    set({ isDeviceLinked: false, isValidatingAuth: false });
    useStore.getState().clearLocalData();
  },

  initialize: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const idb = await import('idb-keyval');
    const linkedFamilyId = await idb.get('linked-family-id');

    set({
      session,
      user: session?.user ?? null,
      isDeviceLinked: !!linkedFamilyId,
      loading: false,
      initialized: true,
    });

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        set({ session: null, user: null, loading: false, isValidatingAuth: false });
        return;
      }

      // Do NOT auto-set session while ParentAuth is validating single-main device rules
      if (!get().isValidatingAuth) {
        set({ session, user: session?.user ?? null, loading: false });
      }
    });
  },
}));
