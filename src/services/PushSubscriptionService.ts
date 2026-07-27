import { supabase } from '../lib/supabase';
import { DeviceService } from './DeviceService';
import { useStore } from '../store';
import { get } from 'idb-keyval';

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

export const PushSubscriptionService = {
  /**
   * Subscribe this device to VAPID Web Push notifications and save subscription payload to Supabase.
   */
  subscribe: async (): Promise<PushSubscription | null> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Web Push is not supported in this environment.');
      return null;
    }

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.warn('VITE_VAPID_PUBLIC_KEY is not configured in environment variables.');
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

      // Ensure the device row exists in public.devices before updating subscription
      const activeFamilyId =
        useStore.getState().familyId || (await get<string>('linked-family-id'));
      if (activeFamilyId) {
        await DeviceService.ensureDeviceRegistered(activeFamilyId);
      }

      const deviceId = await DeviceService.getDeviceId();
      const subJson = sub.toJSON();

      const { error } = await supabase
        .from('devices')
        .update({ push_subscription: subJson })
        .eq('id', deviceId);

      if (error) {
        console.error('Failed to save push subscription to device row:', error);
      } else {
        console.log('✅ Remote Web Push subscription saved for device:', deviceId);
      }

      return sub;
    } catch (error) {
      console.error('Failed to subscribe to Web Push:', error);
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
