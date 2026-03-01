import { v4 as uuidv4 } from 'uuid';
import { Validation } from '../../lib/validation';
import { FREE_TIER_LIMITS } from '../../constants';
import type { StoreSet, StoreGet, RewardSlice } from './types';

export const createRewardSlice = (set: StoreSet, get: StoreGet): RewardSlice => ({
    rewards: [],
    redemptions: [],

    addReward: async (reward) => {
        const { familyId, rewards, isPremium, safeSync } = get();
        const result = Validation.reward(reward);
        if (!result.valid) { alert(result.error); return; }
        
        const active = rewards.filter(r => r.status === 'active');
        if (!isPremium && active.length >= FREE_TIER_LIMITS.REWARDS) { alert("Free tier limit!"); return; }
        
        const newReward = { ...reward, title: result.data!.title, cost: result.data!.cost, id: uuidv4(), status: 'active' as const };
        set({ rewards: [...rewards, newReward] });
        if (familyId) await safeSync('rewards', 'insert', { ...newReward, family_id: familyId });
    },

    archiveReward: async (id) => {
        const { familyId, rewards, safeSync } = get();
        set({ rewards: rewards.map(r => r.id === id ? { ...r, status: 'archived' } : r) });
        if (familyId) await safeSync('rewards', 'update', { status: 'archived' }, { column: 'id', value: id });
    },

    redeemReward: async (rewardId, childId) => {
        const { familyId, rewards, profiles, redemptions, safeSync } = get();
        const reward = rewards.find(r => r.id === rewardId);
        const profile = profiles.find(p => p.id === childId);
        if (!reward || !profile || profile.points < reward.cost) return;
        const newRedemption = { id: uuidv4(), rewardId, childId, redeemedAt: new Date().toISOString(), approved: false };
        const nextProfiles = profiles.map(p => p.id === childId ? { ...p, points: p.points - reward.cost } : p);
        set({ profiles: nextProfiles, redemptions: [...redemptions, newRedemption] });
        if (familyId) {
            await safeSync('redemptions', 'insert', { id: newRedemption.id, family_id: familyId, reward_id: rewardId, profile_id: childId, redeemed_at: newRedemption.redeemedAt, approved: false });
            const p = nextProfiles.find(p => p.id === childId);
            if (p) await safeSync('profiles', 'update', { points: p.points }, { column: 'id', value: p.id });
        }
    }
});
