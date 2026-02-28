import { createClient } from '@supabase/supabase-js';
import { get } from 'idb-keyval';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Global Supabase client instance.
 * 
 * @description
 * Configured with a dynamic header 'X-Device-ID'.
 * This allows Row Level Security (RLS) to verify secondary devices 
 * without requiring a full email/password session.
 */
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    global: {
      headers: async () => {
        // Retrieve the persistent device fingerprint
        const deviceId = await get('chore-quest-device-id');
        return deviceId ? { 'X-Device-ID': deviceId } : {};
      }
    }
  }
);
