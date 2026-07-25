import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import type { StoreState } from './slices/types';
import { createProfileSlice } from './slices/profileSlice';
import { createChoreSlice } from './slices/choreSlice';
import { createRewardSlice } from './slices/rewardSlice';
import { createSyncSlice } from './slices/syncSlice';
import { createConfigSlice } from './slices/configSlice';

import { StorageEncryption } from '../lib/encryption';

// Encrypted storage adapter for IndexedDB
const storage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        const raw = await get(name);
        if (!raw) return null;
        return await StorageEncryption.decrypt(raw);
    },
    setItem: async (name: string, value: string): Promise<void> => {
        const encrypted = await StorageEncryption.encrypt(value);
        await set(name, encrypted);
    },
    removeItem: async (name: string): Promise<void> => { await del(name); },
};


/**
 * Global application state, composed of domain-specific slices.
 */
export const useStore = create<StoreState>()(
    persist(
        (set, get) => ({
            ...createProfileSlice(set, get),
            ...createChoreSlice(set, get),
            ...createRewardSlice(set, get),
            ...createSyncSlice(set, get),
            ...createConfigSlice(set, get),
        }),
        { 
            name: 'chore-quest-storage', 
            storage: createJSONStorage(() => storage) 
        }
    )
);
