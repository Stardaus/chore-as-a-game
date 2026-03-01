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
    const isLinked = !!linkedFamilyId;
    
    set({ isDeviceLinked: isLinked });
    
    // If we just got linked, tell the main store to sync immediately
    if (isLinked) {
      useStore.getState().syncWithCloud(linkedFamilyId);
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    const idb = await import('idb-keyval');
    await idb.del('linked-family-id');
    set({ session: null, user: null, isDeviceLinked: false });
    useStore.getState().resetAllData();
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
