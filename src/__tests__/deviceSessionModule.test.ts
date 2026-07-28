import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeviceSessionModule } from '../services/DeviceSessionModule';

describe('DeviceSessionModule Seam Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes session state correctly on boot', async () => {
    const session = await DeviceSessionModule.init();
    expect(session.deviceId).toBeDefined();
    expect(session.isAuthenticated).toBe(false);
  });
});
