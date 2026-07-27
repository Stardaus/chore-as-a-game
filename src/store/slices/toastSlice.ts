import { v4 as uuidv4 } from 'uuid';
import type { StoreSet, StoreGet, ToastSlice } from './types';

export const createToastSlice = (set: StoreSet, _get: StoreGet): ToastSlice => ({
  toasts: [],

  addToast: (toast) => {
    const id = uuidv4();
    const newToast = { ...toast, id, createdAt: Date.now() };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
});
