import { v4 as uuidv4 } from 'uuid';
import { get, set } from 'idb-keyval';
import { supabase, ensureDeviceIdHeader } from '../lib/supabase';

const DEVICE_ID_KEY = 'chore-quest-device-id';

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
     * Attempts to link this device to a family using a 6-digit join code.
     * Logic is executed server-side via RPC for maximum security and brute-force protection.
     * 
     * @param joinCode - The 6-digit code provided by the parent.
     * @param deviceName - A friendly name for this device (e.g. "Adam's Tablet").
     */
    linkDevice: async (joinCode: string, deviceName: string) => {
        const deviceId = await DeviceService.getDeviceId();

        // Perform the registration via a secure Database Function (RPC)
        const { data: familyId, error } = await supabase.rpc('register_device_by_code', {
            input_code: joinCode,
            input_device_id: deviceId,
            input_device_name: deviceName
        });

        if (error) {
            // Translate database exceptions into user-friendly messages
            if (error.message.includes('Invalid or expired')) {
                throw new Error('Invalid or expired join code.');
            }
            if (error.message.includes('limit reached')) {
                throw new Error('Device limit reached. Upgrade to Premium for more slots!');
            }
            throw new Error('Failed to link device. Please try again.');
        }

        // Store the linked family ID locally for real-time synchronization
        await set('linked-family-id', familyId);
        await ensureDeviceIdHeader();
        
        return familyId;
    }
};
