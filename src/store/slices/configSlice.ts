import type { StoreSet, StoreGet, ConfigSlice } from './types';

export const createConfigSlice = (set: StoreSet, _get: StoreGet): ConfigSlice => ({
  isPremium: false,
  parentPin: '0000',
  recoveryQuestion: '',
  recoveryAnswer: '',
  notificationPrefs: { enabled: false, badgeEnabled: true },
  reminderSettings: { enabled: true, time: '21:00', lastSentDate: null },

  setPremium: async (status) => {
    const { SubscriptionEntitlementModule } =
      await import('../../services/SubscriptionEntitlementModule');
    await SubscriptionEntitlementModule.setSubscriptionTier(status);
  },

  setNotificationPrefs: (prefs) =>
    set((state) => ({
      notificationPrefs: { ...state.notificationPrefs, ...prefs },
    })),

  updateReminderSettings: (settings) =>
    set((state) => ({
      reminderSettings: { ...state.reminderSettings, ...settings },
    })),

  setParentPin: (pin: string) => set({ parentPin: pin }),

  setRecoveryInfo: (question, answer) =>
    set({
      recoveryQuestion: question,
      recoveryAnswer: answer.toLowerCase().trim(),
    }),
});
