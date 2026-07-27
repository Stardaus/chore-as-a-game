import { supabase } from '../lib/supabase';
import { DeviceService } from './DeviceService';
import { useStore } from '../store';
import { get, set } from 'idb-keyval';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Resolves the active family ID for both Parent and Child sessions.
 */
async function getActiveFamilyId(): Promise<string | undefined> {
  // 1. Check IDB linked-family-id
  let familyId = await get<string>('linked-family-id');
  if (familyId) return familyId;

  // 2. Check Zustand main store
  familyId = useStore.getState().familyId || undefined;
  if (familyId) return familyId;

  // 3. Check useFamilyStore
  try {
    const { useFamilyStore } = await import('../store/useFamilyStore');
    familyId = useFamilyStore.getState().family?.id || undefined;
    if (familyId) return familyId;
  } catch (_e) {
    // Ignore dynamic import error if uninitialized
  }

  // 4. Query Supabase directly if logged in as Parent
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { data } = await supabase
        .from('families')
        .select('id')
        .eq('parent_id', session.user.id)
        .maybeSingle();

      if (data?.id) {
        await set('linked-family-id', data.id);
        useStore.getState().setFamilyId(data.id);
        return data.id;
      }
    }
  } catch (e) {
    console.warn('Failed to query family for session user:', e);
  }

  return undefined;
}

export const PushSubscriptionService = {
  /**
   * Subscribe this device to VAPID Web Push notifications and save subscription payload to Supabase.
   */
  subscribe: async (): Promise<{
    success: boolean;
    message?: string;
    sub?: PushSubscription | null;
  }> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      const msg = 'Web Push is not supported in this browser/device.';
      console.warn(msg);
      return { success: false, message: msg };
    }

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      const msg =
        'VITE_VAPID_PUBLIC_KEY is missing in app build. Please set VITE_VAPID_PUBLIC_KEY in environment variables and rebuild.';
      console.error('❌', msg);
      return { success: false, message: msg };
    }

    try {
      // Ensure Service Worker registration exists on iOS PWA
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        const isDev = import.meta.env.DEV;
        reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          type: isDev ? 'module' : 'classic',
        });
      }

      // Wait until SW is active
      if (reg.installing || reg.waiting) {
        await new Promise<void>((resolve) => {
          const sw = reg?.installing || reg?.waiting;
          if (sw) {
            sw.onstatechange = () => {
              if (sw.state === 'activated') resolve();
            };
          } else {
            resolve();
          }
        });
      }

      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey as unknown as BufferSource,
        });
      }

      const familyId = await getActiveFamilyId();
      if (!familyId) {
        const msg = 'Device is not linked to any family account yet.';
        console.warn('⚠️', msg);
        return { success: false, message: msg, sub };
      }

      const deviceId = await DeviceService.getDeviceId();
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const deviceName = isMobile ? 'iPhone App' : 'Primary Device';
      const subJson = sub.toJSON();

      // Upsert device row with push_subscription in public.devices
      const { error } = await supabase.from('devices').upsert(
        {
          id: deviceId,
          family_id: familyId,
          name: deviceName,
          push_subscription: subJson,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (error) {
        console.error('❌ Failed to upsert push_subscription in devices table:', error);
        return { success: false, message: `Database error: ${error.message}`, sub };
      }

      console.log('✅ Push subscription successfully saved in devices table for:', deviceId);
      return { success: true, sub };
    } catch (error: any) {
      console.error('❌ Error during Web Push subscription:', error);
      return { success: false, message: error?.message || 'Push subscription failed.' };
    }
  },

  /**
   * Unsubscribe this device from VAPID Web Push notifications.
   */
  unsubscribe: async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
        }
      }

      const deviceId = await DeviceService.getDeviceId();
      await supabase.from('devices').update({ push_subscription: null }).eq('id', deviceId);

      console.log('✅ Unsubscribed device from Remote Web Push.');
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from Web Push:', error);
      return false;
    }
  },
};
