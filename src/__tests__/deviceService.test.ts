import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeviceService } from '../services/DeviceService';
import { Validation } from '../lib/validation';

describe('DeviceService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates or retrieves a device ID', async () => {
    const id = await DeviceService.getDeviceId();
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(10);
  });

  it('sets and retrieves local device role', async () => {
    await DeviceService.setDeviceRole('secondary_parent');
    const role = await DeviceService.getDeviceRole();
    expect(role).toBe('secondary_parent');

    await DeviceService.setDeviceRole('secondary_child');
    const childRole = await DeviceService.getDeviceRole();
    expect(childRole).toBe('secondary_child');
  });

  it('sets and retrieves local device name', async () => {
    await DeviceService.setStoredDeviceName("Dad's iPad");
    const name = await DeviceService.getStoredDeviceName();
    expect(name).toBe("Dad's iPad");
  });

  it('validates device names correctly', () => {
    expect(Validation.device({ name: 'Living Room TV' }).valid).toBe(true);
    expect(Validation.device({ name: '' }).valid).toBe(false);
    expect(Validation.device({ name: 'This name is way too long for a device name' }).valid).toBe(
      false
    );
  });
});
