import { v4 as uuidv4 } from 'uuid';
import { get, set } from 'idb-keyval';
import { supabase, ensureDeviceIdHeader } from '../lib/supabase';

const DEVICE_ID_KEY = 'chore-quest-device-id';
const DEVICE_ROLE_KEY = 'chore-quest-device-role';
const DEVICE_NAME_KEY = 'chore-quest-device-name';

export type DeviceRole = 'main' | 'secondary_parent' | 'secondary_child';

/**
 * Service for identifying and linking the current physical device/browser.
 */
export const DeviceService = {
  /**
   * Retrieves or generates a persistent unique ID for this browser installation.
   */
  getDeviceId: async (): Promise<string> => {
    let deviceId = await get<string>(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = uuidv4();
      await set(DEVICE_ID_KEY, deviceId);
    }
    await ensureDeviceIdHeader();
    return deviceId;
  },

  /**
   * Retrieves the locally stored device role.
   */
  getDeviceRole: async (): Promise<DeviceRole | null> => {
    return (await get<DeviceRole>(DEVICE_ROLE_KEY)) || null;
  },

  /**
   * Persists the device role locally.
   */
  setDeviceRole: async (role: DeviceRole): Promise<void> => {
    await set(DEVICE_ROLE_KEY, role);
  },

  /**
   * Retrieves the locally stored device name.
   */
  getStoredDeviceName: async (): Promise<string | null> => {
    return (await get<string>(DEVICE_NAME_KEY)) || null;
  },

  /**
   * Persists the device name locally.
   */
  setStoredDeviceName: async (name: string): Promise<void> => {
    await set(DEVICE_NAME_KEY, name);
  },

  /**
   * Ensures this physical device is registered in the public.devices database table.
   * Works for primary parent devices as well as secondary devices.
   */
  ensureDeviceRegistered: async (
    familyId: string,
    customName?: string,
    role?: DeviceRole
  ): Promise<string> => {
    const deviceId = await DeviceService.getDeviceId();
    const storedName = await DeviceService.getStoredDeviceName();
    const storedRole = await DeviceService.getDeviceRole();

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const defaultName = isMobile ? 'Mobile Device' : 'Primary Device';
    const name = customName || storedName || defaultName;

    let finalRole = role || storedRole;

    if (!finalRole) {
      // Check if this family already has an active main device in the database
      const { data: existingMain } = await supabase
        .from('devices')
        .select('id')
        .eq('family_id', familyId)
        .eq('role', 'main')
        .neq('id', deviceId)
        .maybeSingle();

      if (existingMain) {
        throw new Error('A Main App is already registered for this family.');
      } else {
        finalRole = 'main';
      }
    }

    await DeviceService.setStoredDeviceName(name);
    await DeviceService.setDeviceRole(finalRole);

    try {
      const { error } = await supabase.from('devices').upsert(
        {
          id: deviceId,
          family_id: familyId,
          name,
          role: finalRole,
          is_stale: false,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (error) {
        console.warn('Failed to register device in database:', error);
      } else {
        console.log(`✅ Registered device (${name}, role: ${finalRole}) in family:`, familyId);
      }
    } catch (err) {
      console.warn('Device registration error:', err);
    }

    return deviceId;
  },

  /**
   * Attempts to link this device to a family using a 6-digit join code.
   * Logic is executed server-side via RPC for maximum security and brute-force protection.
   *
   * @param joinCode - The 6-digit code provided by the parent.
   * @param deviceName - A friendly name for this device (e.g. "Adam's Tablet").
   * @param role - The selected device role ('secondary_parent' or 'secondary_child').
   */
  linkDevice: async (
    joinCode: string,
    deviceName: string,
    role: 'secondary_parent' | 'secondary_child' = 'secondary_child'
  ) => {
    const deviceId = await DeviceService.getDeviceId();

    // Perform the registration via a secure Database Function (RPC)
    const { data: familyId, error } = await supabase.rpc('register_device_by_code', {
      input_code: joinCode,
      input_device_id: deviceId,
      input_device_name: deviceName,
      input_role: role,
    });

    if (error) {
      // Translate database exceptions into user-friendly messages
      if (error.message.includes('Invalid or expired')) {
        throw new Error('Invalid or expired join code.');
      }
      if (error.message.includes('limit reached')) {
        throw new Error('Device limit reached. The main app has been notified to free up slots!');
      }
      throw new Error('Failed to link device. Please try again.');
    }

    // Store the linked family ID and role locally for real-time synchronization
    await set('linked-family-id', familyId);
    await DeviceService.setDeviceRole(role);
    await DeviceService.setStoredDeviceName(deviceName);
    await ensureDeviceIdHeader();

    return familyId;
  },
};
