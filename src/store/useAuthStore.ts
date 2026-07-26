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
  
  // Actions
  setSession: (session: Session | null) => void;
  setDeviceLinked: (linked: boolean) => void;
  refreshLinkStatus: () => Promise<void>;
  signOut: () => Promise<void>;
  unlinkDevice: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isDeviceLinked: false,
  loading: true,
  initialized: false,

  setSession: (session) => set({ 
    session, 
    user: session?.user ?? null, 
    loading: false 
  }),

  setDeviceLinked: (linked) => set({ isDeviceLinked: linked }),

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
    await supabase.auth.signOut();
    const idb = await import('idb-keyval');
    await idb.del('linked-family-id');
    set({ session: null, user: null, isDeviceLinked: false });
    useStore.getState().clearLocalData();
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

    await idb.del('linked-family-id');
    set({ isDeviceLinked: false });
    useStore.getState().clearLocalData();
  },

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const idb = await import('idb-keyval');
    const linkedFamilyId = await idb.get('linked-family-id');

    set({ 
      session, 
      user: session?.user ?? null, 
      isDeviceLinked: !!linkedFamilyId,
      loading: false, 
      initialized: true 
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, loading: false });
    });
  }
}));
