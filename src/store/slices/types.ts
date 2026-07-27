import type { Profile, Chore, Assignment, Reward, Redemption, SyncOperation } from '../../types';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'quest' | 'reward';
  createdAt: number;
}

export interface StoreState
  extends ProfileSlice, ChoreSlice, RewardSlice, SyncSlice, ConfigSlice, ToastSlice {}

export type StoreSet = {
  (
    partial:
      StoreState | Partial<StoreState> | ((state: StoreState) => StoreState | Partial<StoreState>),
    replace?: false
  ): void;
  (state: StoreState | ((state: StoreState) => StoreState), replace: true): void;
};

export type StoreGet = () => StoreState;

export interface SyncSlice {
  syncQueue: SyncOperation[];
  familyId: string | null;
  isSyncing: boolean;

  queueSyncOperation: (op: Omit<SyncOperation, 'id' | 'timestamp'>) => void;
  processSyncQueue: () => Promise<void>;
  syncWithCloud: (familyId: string) => Promise<void>;
  setFamilyId: (id: string | null) => void;
  wipeFamilyData: () => Promise<void>;
  clearLocalData: () => void;
  safeSync: (
    table: string,
    action: 'insert' | 'update' | 'delete',
    payload?: any,
    match?: { column: string; value: string }
  ) => Promise<void>;
}

export interface ProfileSlice {
  profiles: Profile[];
  addProfile: (name: string, avatar: string) => Promise<void>;
  updateProfile: (id: string, updates: Partial<Profile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  resetPoints: () => Promise<void>;
}

export interface ChoreSlice {
  chores: Chore[];
  assignments: Assignment[];
  addChore: (chore: Omit<Chore, 'id' | 'status'>) => Promise<void>;
  updateChore: (id: string, updates: Partial<Chore>) => Promise<void>;
  deleteChore: (id: string) => Promise<void>;
  archiveChore: (id: string) => Promise<void>;
  assignChore: (choreId: string, childId: string) => Promise<void>;
  unassignChore: (choreId: string, childId: string) => Promise<void>;
  toggleAssignment: (assignmentId: string) => Promise<void>;
  approveAssignment: (assignmentId: string) => Promise<void>;
  refreshAssignments: () => void;
  assignChoresByTag: (
    tag: string,
    childIds: string[]
  ) => Promise<{ added: number; skipped: number }>;
  addFromTemplate: (chores: Omit<Chore, 'id' | 'status'>[]) => Promise<void>;
}

export interface RewardSlice {
  rewards: Reward[];
  redemptions: Redemption[];
  addReward: (reward: Omit<Reward, 'id' | 'status'>) => Promise<void>;
  archiveReward: (id: string) => Promise<void>;
  redeemReward: (rewardId: string, childId: string) => Promise<void>;
}

export interface ConfigSlice {
  isPremium: boolean;
  parentPin: string;
  recoveryQuestion: string;
  recoveryAnswer: string;
  notificationPrefs: { enabled: boolean; badgeEnabled: boolean };
  reminderSettings: { enabled: boolean; time: string; lastSentDate: string | null };
  setPremium: (status: boolean) => Promise<void>;
  setNotificationPrefs: (prefs: Partial<{ enabled: boolean; badgeEnabled: boolean }>) => void;
  updateReminderSettings: (
    settings: Partial<{ enabled: boolean; time: string; lastSentDate: string | null }>
  ) => void;
  setParentPin: (pin: string) => void;
  setRecoveryInfo: (question: string, answer: string) => void;
}

export interface ToastSlice {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id' | 'createdAt'>) => void;
  removeToast: (id: string) => void;
}
