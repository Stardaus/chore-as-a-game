export type Frequency = 'one-time' | 'daily' | 'weekly';

export interface Profile {
  id: string;
  name: string;
  avatar: string; // URL or identifier for avatar svg
  points: number;
  xp: number;
  level: number;
  // TODO: Add customization options if needed
}

export interface Chore {
  id: string;
  title: string;
  points: number;
  frequency: Frequency;
  requiresApproval: boolean;
  icon: string; // Lucide icon name or emoji
  tags?: string[];
  status: 'active' | 'archived';
}

export interface Assignment {
  id: string;
  choreId: string;
  childId: string;
  completed: boolean;
  completedAt?: string; // ISO date string
  verifiedAt?: string; // ISO date string if approval required
  createdAt?: string; // ISO date string
}

export interface Reward {
  id: string;
  title: string;
  cost: number;
  status: 'active' | 'archived';
  description?: string;
}

export interface Redemption {
  id: string;
  rewardId: string;
  childId: string;
  redeemedAt: string;
  approved: boolean;
}

export interface SyncOperation {
  id: string;
  table: string;
  action: 'insert' | 'update' | 'delete';
  payload?: any;
  match?: { column: string; value: string };
  timestamp: number;
}
