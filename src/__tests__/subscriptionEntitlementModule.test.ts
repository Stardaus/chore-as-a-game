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

  it('blocks batch additions when projected count exceeds free tier limit', () => {
    useStore.setState({
      chores: [
        {
          id: '1',
          title: 'Chore 1',
          points: 10,
          frequency: 'daily',
          requiresApproval: false,
          icon: 'Check',
          tags: [],
          status: 'active',
        },
        {
          id: '2',
          title: 'Chore 2',
          points: 10,
          frequency: 'daily',
          requiresApproval: false,
          icon: 'Check',
          tags: [],
          status: 'active',
        },
        {
          id: '3',
          title: 'Chore 3',
          points: 10,
          frequency: 'daily',
          requiresApproval: false,
          icon: 'Check',
          tags: [],
          status: 'active',
        },
      ],
    });

    // Adding 1 chore is allowed (3 + 1 <= 5)
    expect(SubscriptionEntitlementModule.canAdd('chores', 1).allowed).toBe(true);

    // Adding 4 chores from a template is blocked (3 + 4 = 7 > 5)
    const batchRes = SubscriptionEntitlementModule.canAdd('chores', 4);
    expect(batchRes.allowed).toBe(false);
    expect(batchRes.message).toContain('Adding 4 item(s) would exceed your free limit (7/5)');
  });
});
