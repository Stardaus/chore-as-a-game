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
  subscribe: async (): Promise<PushSubscription | null> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Web Push is not supported in this browser.');
      return null;
    }

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error(
        '❌ VITE_VAPID_PUBLIC_KEY is not set in environment variables! Push subscription cancelled.'
      );
      return null;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
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
        console.warn('⚠️ Cannot save push subscription: Device is not linked to any family yet.');
        return sub;
      }

      const deviceId = await DeviceService.getDeviceId();
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const deviceName = isMobile ? 'Mobile Device' : 'Primary Device';
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
      } else {
        console.log('✅ Push subscription successfully saved in devices table for:', deviceId);
      }

      return sub;
    } catch (error) {
      console.error('❌ Error during Web Push subscription:', error);
      return null;
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
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
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
