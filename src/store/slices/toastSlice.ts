import { v4 as uuidv4 } from 'uuid';
import type { StoreSet, StoreGet, ToastSlice } from './types';

export const createToastSlice = (set: StoreSet, get: StoreGet): ToastSlice => ({
  toasts: [],

  addToast: (toast) => {
    const id = uuidv4();
    const now = Date.now();
    const newToast = { ...toast, id, createdAt: now };

    set((state) => {
      // 1. Deduplicate identical toasts within 2.5 seconds
      const isDuplicate = state.toasts.some(
        (t) => t.title === toast.title && t.message === toast.message && now - t.createdAt < 2500
      );
      if (isDuplicate) return state;

      // 2. Cap visible toasts to max 2 items
      const updated = [...state.toasts, newToast];
      const capped = updated.length > 2 ? updated.slice(updated.length - 2) : updated;

      return { toasts: capped };
    });

    // 3. Auto-remove this specific toast after 4 seconds
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
});
