import { createClient } from '@supabase/supabase-js';
import { get } from 'idb-keyval';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Global Supabase client instance.
 */
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    global: {
      headers: { 'X-Client-Info': 'chorequest-web' }
    }
  }
);

/**
 * Dynamically injects the Device ID header into Supabase client REST headers.
 * Sets strictly lower-case 'x-device-id' to avoid header duplication in PostgREST.
 */
export const ensureDeviceIdHeader = async (): Promise<string | undefined> => {
    const deviceId = await get<string>('chore-quest-device-id');
    if (deviceId) {
        const currentHeaders = { ...(supabase as any).rest.headers };
        delete currentHeaders['X-Device-ID'];
        delete currentHeaders['x-device-id'];

        (supabase as any).rest.headers = {
            ...currentHeaders,
            'x-device-id': deviceId
        };
    }
    return deviceId;
};

// Initialize device ID header on module load
ensureDeviceIdHeader();
