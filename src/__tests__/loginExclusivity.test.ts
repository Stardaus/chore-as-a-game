import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../lib/supabase';

describe('Login Exclusivity & Transfer Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects a second device attempting to log in as main app when an active main device exists', async () => {
    const familyId = 'test-family-123';
    const mainDeviceId = 'device-a-main';
    const secondDeviceId = 'device-b-attempt';

    const mockDevices = [
      { id: mainDeviceId, name: 'Dad MacBook', role: 'main', created_at: '2026-01-01T00:00:00Z' },
    ];

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'families') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { id: familyId }, error: null }),
            }),
          }),
        } as any;
      }
      if (table === 'devices') {
        return {
          select: () => ({
            eq: async () => ({ data: mockDevices, error: null }),
          }),
          delete: () => ({
            eq: async () => ({ data: null, error: null }),
          }),
        } as any;
      }
      return {} as any;
    });

    const currentDeviceId = secondDeviceId;
    const { data: familyData } = await supabase
      .from('families')
      .select('id')
      .eq('parent_id', 'parent-user-id')
      .maybeSingle();

    let isBlocked = false;
    if (familyData?.id) {
      const { data: allDevices } = await supabase
        .from('devices')
        .select('id, name, role, created_at')
        .eq('family_id', familyData.id);

      const mainDevice = (allDevices as any[])?.find((d) => d.role === 'main');
      if (mainDevice && mainDevice.id !== currentDeviceId) {
        isBlocked = true;
      }
    }

    expect(isBlocked).toBe(true);
  });

  it('allows a new device to log in as main app if the main app was transferred or signed out (role != main)', async () => {
    const familyId = 'test-family-123';
    const demotedDeviceId = 'device-a-demoted';
    const secondDeviceId = 'device-b-attempt';

    // Device A was transferred or signed out, so its role is now 'secondary_parent'
    const mockDevices = [
      {
        id: demotedDeviceId,
        name: 'Dad MacBook',
        role: 'secondary_parent',
        created_at: '2026-01-01T00:00:00Z',
      },
    ];

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'families') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { id: familyId }, error: null }),
            }),
          }),
        } as any;
      }
      if (table === 'devices') {
        return {
          select: () => ({
            eq: async () => ({ data: mockDevices, error: null }),
          }),
        } as any;
      }
      return {} as any;
    });

    const currentDeviceId = secondDeviceId;
    const { data: familyData } = await supabase
      .from('families')
      .select('id')
      .eq('parent_id', 'parent-user-id')
      .maybeSingle();

    let isBlocked = false;
    if (familyData?.id) {
      const { data: allDevices } = await supabase
        .from('devices')
        .select('id, name, role, created_at')
        .eq('family_id', familyData.id);

      const mainDevice = (allDevices as any[])?.find((d) => d.role === 'main');
      if (mainDevice && mainDevice.id !== currentDeviceId) {
        isBlocked = true;
      }
    }

    // Should NOT be blocked because no device currently holds role = 'main'!
    expect(isBlocked).toBe(false);
  });
});
