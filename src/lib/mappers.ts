import type { Chore, Assignment, Redemption } from '../types';

/**
 * Data Mapping Utilities
 * 
 * @description
 * Translates between Supabase (snake_case) and the App (camelCase).
 * This ensures consistency and prevents data loss during synchronization.
 */

export const Mappers = {
    chore: (db: any): Chore => ({
        id: db.id,
        title: db.title,
        points: db.points,
        frequency: db.frequency,
        requiresApproval: db.requires_approval,
        icon: db.icon,
        tags: db.tags || [],
        status: db.status
    }),

    assignment: (db: any): Assignment => ({
        id: db.id,
        choreId: db.chore_id,
        childId: db.profile_id,
        completed: db.completed,
        completedAt: db.completed_at,
        verifiedAt: db.verified_at,
        createdAt: db.created_at
    }),

    redemption: (db: any): Redemption => ({
        id: db.id,
        rewardId: db.reward_id,
        childId: db.profile_id,
        redeemedAt: db.redeemed_at,
        approved: db.approved
    })
};
