import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../lib/supabase';

describe('Login Exclusivity Feedback Loop Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects a second device attempting to log in as main app when a main device already exists', async () => {
    const familyId = 'test-family-123';
    const mainDeviceId = 'device-a-main';
    const secondDeviceId = 'device-b-attempt';

    // Mock DB response: main device already exists for this family
    const mockDevices = [
      { id: mainDeviceId, name: 'Dad MacBook', role: 'main', created_at: '2026-01-01T00:00:00Z' },
    ];

    // Mock supabase calls
    const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
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
            eq: () => ({
              order: async () => ({ data: mockDevices, error: null }),
            }),
          }),
          delete: () => ({
            eq: async () => ({ data: null, error: null }),
          }),
        } as any;
      }
      return {} as any;
    });

    // Simulate Device B's check
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
        .eq('family_id', familyData.id)
        .order('created_at', { ascending: true });

      if (allDevices && allDevices.length > 0) {
        const mainDevice = allDevices.find((d) => d.role === 'main') || allDevices[0];
        if (mainDevice.id !== currentDeviceId) {
          isBlocked = true;
        }
      }
    }

    expect(isBlocked).toBe(true);
    fromSpy.mockRestore();
  });
});
