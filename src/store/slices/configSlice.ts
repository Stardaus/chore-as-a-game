import { supabase } from '../../lib/supabase';
import type { StoreSet, StoreGet, ConfigSlice } from './types';

export const createConfigSlice = (set: StoreSet, get: StoreGet): ConfigSlice => ({
    isPremium: false,
    parentPin: '0000',
    recoveryQuestion: '',
    recoveryAnswer: '',
    notificationPrefs: { enabled: false, badgeEnabled: true },
    reminderSettings: { enabled: true, time: '21:00', lastSentDate: null },

    setPremium: async (status) => {
        const { familyId } = get();
        set({ isPremium: status });
        
        if (familyId) {
            try {
                const { error } = await supabase
                    .from('families')
                    .update({ subscription_tier: status ? 'premium' : 'free' })
                    .eq('id', familyId);
                if (error) throw error;
            } catch (error) {
                console.error('Failed to update premium status in cloud:', error);
                get().queueSyncOperation({ 
                    table: 'families', 
                    action: 'update', 
                    payload: { subscription_tier: status ? 'premium' : 'free' },
                    match: { column: 'id', value: familyId }
                });
            }
        }
    },

    setNotificationPrefs: (prefs) => set((state) => ({ 
        notificationPrefs: { ...state.notificationPrefs, ...prefs } 
    })),
    
    updateReminderSettings: (settings) => set((state) => ({ 
        reminderSettings: { ...state.reminderSettings, ...settings } 
    })),
    
    setParentPin: (pin: string) => set({ parentPin: pin }),
    
    setRecoveryInfo: (question, answer) => set({ 
        recoveryQuestion: question, 
        recoveryAnswer: answer.toLowerCase().trim() 
    }),
});
