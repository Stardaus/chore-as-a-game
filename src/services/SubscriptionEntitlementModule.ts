import { useStore } from '../store';
import { FREE_TIER_LIMITS } from '../constants';
import { supabase } from '../lib/supabase';

export type EntitlementFeature = 'profiles' | 'chores' | 'rewards';

export interface EntitlementUsage {
  feature: EntitlementFeature;
  currentCount: number;
  maxLimit: number;
  remaining: number;
  isAllowed: boolean;
  isUnlimited: boolean;
}

export interface EntitlementCheckResult {
  allowed: boolean;
  usage: EntitlementUsage;
  message?: string;
}

/**
 * Deep Module encapsulating Subscription Tiers, Freemium Limits,
 * Feature Entitlements, and Cloud Subscription Persistence.
 */
export const SubscriptionEntitlementModule = {
  /**
   * Evaluates feature quota usage and remaining allowance.
   */
  getUsage(feature: EntitlementFeature): EntitlementUsage {
    const { isPremium, profiles, chores, rewards } = useStore.getState();

    let currentCount = 0;
    let maxLimit = FREE_TIER_LIMITS.CHORES;

    if (feature === 'profiles') {
      currentCount = profiles.length;
      maxLimit = FREE_TIER_LIMITS.PROFILES;
    } else if (feature === 'chores') {
      currentCount = chores.filter((c) => c.status === 'active').length;
      maxLimit = FREE_TIER_LIMITS.CHORES;
    } else if (feature === 'rewards') {
      currentCount = rewards.filter((r) => r.status === 'active').length;
      maxLimit = FREE_TIER_LIMITS.REWARDS;
    }

    if (isPremium) {
      return {
        feature,
        currentCount,
        maxLimit: Infinity,
        remaining: Infinity,
        isAllowed: true,
        isUnlimited: true,
      };
    }

    const remaining = Math.max(0, maxLimit - currentCount);
    const isAllowed = currentCount < maxLimit;

    return {
      feature,
      currentCount,
      maxLimit,
      remaining,
      isAllowed,
      isUnlimited: false,
    };
  },

  /**
   * Asserts whether a single item OR a batch of N items can be created/assigned
   * under the active subscription tier.
   */
  canAdd(feature: EntitlementFeature, countToAdd: number = 1): EntitlementCheckResult {
    const usage = this.getUsage(feature);

    if (usage.isUnlimited) {
      return { allowed: true, usage };
    }

    const projectedCount = usage.currentCount + countToAdd;
    const isAllowed = projectedCount <= usage.maxLimit;

    if (isAllowed) {
      return { allowed: true, usage };
    }

    const featureNames: Record<EntitlementFeature, string> = {
      profiles: 'Child Profiles',
      chores: 'Active Chores',
      rewards: 'Active Rewards',
    };

    const name = featureNames[feature] || feature;
    const message =
      countToAdd > 1
        ? `Free tier limit reached (${usage.currentCount}/${usage.maxLimit} ${name}). Adding ${countToAdd} item(s) would exceed your free limit (${projectedCount}/${usage.maxLimit}). Upgrade to Premium for unlimited access!`
        : `Free tier limit reached (${usage.currentCount}/${usage.maxLimit} ${name}). Upgrade to Premium for unlimited access!`;

    return {
      allowed: false,
      usage,
      message,
    };
  },

  /**
   * Updates subscription tier in local store & PostgreSQL cloud DB.
   */
  async setSubscriptionTier(status: boolean): Promise<void> {
    const { familyId, queueSyncOperation } = useStore.getState();
    useStore.setState({ isPremium: status });

    if (familyId) {
      try {
        const { error } = await supabase
          .from('families')
          .update({ subscription_tier: status ? 'premium' : 'free' })
          .eq('id', familyId);
        if (error) throw error;
      } catch (error) {
        console.error('Failed to update subscription tier in cloud:', error);
        queueSyncOperation({
          table: 'families',
          action: 'update',
          payload: { subscription_tier: status ? 'premium' : 'free' },
          match: { column: 'id', value: familyId },
        });
      }
    }
  },
};
