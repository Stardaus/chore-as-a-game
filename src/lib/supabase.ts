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
 * Helper to dynamically inject the Device ID header into requests.
 * This avoids top-level await and ensures compatibility with older browsers.
 */
export const getAuthenticatedQuery = async (table: string) => {
    const deviceId = await get('chore-quest-device-id');
    const headers: Record<string, string> = {};
    if (deviceId) headers['X-Device-ID'] = deviceId;
    
    return supabase.from(table);
};

// Initialize device ID in the background without blocking
get('chore-quest-device-id').then(deviceId => {
    if (deviceId) {
        (supabase as any).rest.headers = {
            ...(supabase as any).rest.headers,
            'X-Device-ID': deviceId
        };
    }
});
