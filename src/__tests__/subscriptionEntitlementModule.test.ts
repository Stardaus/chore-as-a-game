import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubscriptionEntitlementModule } from '../services/SubscriptionEntitlementModule';
import { useStore } from '../store';

describe('SubscriptionEntitlementModule Seam Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      isPremium: false,
      profiles: [],
      chores: [],
      rewards: [],
    });
  });

  it('evaluates usage correctly under Free tier limits', () => {
    const profileUsage = SubscriptionEntitlementModule.getUsage('profiles');
    expect(profileUsage.isAllowed).toBe(true);
    expect(profileUsage.maxLimit).toBe(1);
    expect(profileUsage.remaining).toBe(1);

    const choreUsage = SubscriptionEntitlementModule.getUsage('chores');
    expect(choreUsage.isAllowed).toBe(true);
    expect(choreUsage.maxLimit).toBe(5);
    expect(choreUsage.remaining).toBe(5);
  });

  it('blocks addition when free tier limit is reached', () => {
    useStore.setState({
      profiles: [{ id: '1', name: 'Child 1', avatar: 'lion', points: 0, xp: 0, level: 1 }],
    });

    const res = SubscriptionEntitlementModule.canAdd('profiles');
    expect(res.allowed).toBe(false);
    expect(res.message).toContain('Free tier limit reached');
  });

  it('allows unlimited additions when Premium is active', () => {
    useStore.setState({
      isPremium: true,
      profiles: [{ id: '1', name: 'Child 1', avatar: 'lion', points: 0, xp: 0, level: 1 }],
    });

    const res = SubscriptionEntitlementModule.canAdd('profiles');
    expect(res.allowed).toBe(true);
    expect(res.usage.isUnlimited).toBe(true);
  });
});
