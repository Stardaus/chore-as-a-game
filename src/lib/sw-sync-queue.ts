import { createStore, get, set, del } from 'idb-keyval';
import type { SyncOperation } from '../types';

const swSyncStore = createStore('chorequest-sw-db', 'chorequest-sw-sync-queue');
const QUEUE_KEY = 'pending-sync-operations';

export const SWSyncQueue = {
  getQueue: async (): Promise<SyncOperation[]> => {
    try {
      const queue = await get<SyncOperation[]>(QUEUE_KEY, swSyncStore);
      return queue || [];
    } catch (e) {
      console.error('Failed to get SW sync queue:', e);
      return [];
    }
  },

  addOperation: async (op: SyncOperation): Promise<void> => {
    try {
      const current = await SWSyncQueue.getQueue();
      const updated = [...current, op];
      await set(QUEUE_KEY, updated, swSyncStore);
    } catch (e) {
      console.error('Failed to add to SW sync queue:', e);
    }
  },

  setQueue: async (queue: SyncOperation[]): Promise<void> => {
    try {
      await set(QUEUE_KEY, queue, swSyncStore);
    } catch (e) {
      console.error('Failed to set SW sync queue:', e);
    }
  },

  clearQueue: async (): Promise<void> => {
    try {
      await del(QUEUE_KEY, swSyncStore);
    } catch (e) {
      console.error('Failed to clear SW sync queue:', e);
    }
  },
};
