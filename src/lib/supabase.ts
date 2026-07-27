import { createClient } from '@supabase/supabase-js';
import { get } from 'idb-keyval';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.startsWith('http')
    ? import.meta.env.VITE_SUPABASE_URL
    : 'https://placeholder.supabase.co';

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.warn(
    '⚠️ VITE_SUPABASE_URL is missing. Please create a .env file based on .env.example and set VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY.'
  );
}

/**
 * Global Supabase client instance.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: { 'X-Client-Info': 'chorequest-web' },
  },
});

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
      'x-device-id': deviceId,
    };
  }
  return deviceId;
};

// Initialize device ID header on module load
ensureDeviceIdHeader();
