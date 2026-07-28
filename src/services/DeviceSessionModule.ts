import { DeviceService, type DeviceRole } from './DeviceService';
import { PushSubscriptionService } from './PushSubscriptionService';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

export interface DeviceSessionState {
  deviceId: string;
  role: DeviceRole | null;
  familyId: string | null;
  isAuthenticated: boolean;
}

export interface ParentCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  blockedMainDevice?: { id: string; name: string };
  error?: string;
}

export interface JoinResult {
  success: boolean;
  familyId?: string;
  error?: string;
}

/**
 * Deep Module encapsulating Device Identity, Role Exclusivity,
 * Parent Session Auth, and WebPush Subscription lifecycles.
 */
export const DeviceSessionModule = {
  /**
   * Initializes device identity and evaluates session state on app boot.
   */
  async init(familyId?: string): Promise<DeviceSessionState> {
    const deviceId = await DeviceService.getDeviceId();
    const role = await DeviceService.getDeviceRole();

    if (familyId) {
      await DeviceService.ensureDeviceRegistered(familyId, undefined, role || undefined);
      try {
        await PushSubscriptionService.subscribe();
      } catch (e) {
        console.warn('Push subscription init warning:', e);
      }
    }

    return {
      deviceId,
      role,
      familyId: familyId || null,
      isAuthenticated: !!useAuthStore.getState().session,
    };
  },

  /**
   * Authenticates as Main App via email/password.
   * Enforces single-main exclusivity and manages WebPush subscriptions.
   */
  async loginMain(credentials: ParentCredentials): Promise<AuthResult> {
    useAuthStore.getState().setValidatingAuth(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      if (error) throw error;

      if (!data.session) {
        return { success: false, error: 'No active session returned.' };
      }

      const deviceId = await DeviceService.getDeviceId();

      // Check if another device is registered as Main App
      const { data: familyData } = await supabase
        .from('families')
        .select('id')
        .eq('parent_id', data.session.user.id)
        .maybeSingle();

      if (familyData?.id) {
        const { data: allDevices } = await supabase
          .from('devices')
          .select('id, name, role, created_at')
          .eq('family_id', familyData.id)
          .order('created_at', { ascending: true });

        if (allDevices && allDevices.length > 0) {
          const mainDevice = allDevices.find((d) => d.role === 'main');

          if (mainDevice && mainDevice.id !== deviceId) {
            // Dispatch security alert push
            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            const deviceName = isMobile ? 'Mobile Device' : 'Desktop Device';
            try {
              await supabase.functions.invoke('send-push', {
                body: {
                  family_id: familyData.id,
                  target_role: 'main',
                  title: '⚠️ Security Alert',
                  body: `A login attempt from "${deviceName}" was blocked because this family account is active on "${mainDevice.name}".`,
                  tag: 'login-blocked',
                  exclude_device_id: deviceId,
                },
              });
            } catch (_e) {
              // Ignore push error
            }

            // Cleanup & sign out
            await supabase.from('devices').delete().eq('id', deviceId);
            await DeviceService.clearDeviceRole();
            await supabase.auth.signOut();

            return {
              success: false,
              blockedMainDevice: { id: mainDevice.id, name: mainDevice.name },
            };
          }
        }

        // Register as Main App
        await DeviceService.ensureDeviceRegistered(familyData.id, undefined, 'main');
      }

      useAuthStore.getState().setSession(data.session);
      const { useFamilyStore } = await import('../store/useFamilyStore');
      await useFamilyStore.getState().fetchFamily();

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Authentication failed' };
    } finally {
      useAuthStore.getState().setValidatingAuth(false);
    }
  },

  /**
   * Links a secondary device via family join code.
   */
  async joinFamily(
    joinCode: string,
    name: string,
    role: 'secondary_parent' | 'secondary_child'
  ): Promise<JoinResult> {
    try {
      const familyId = await DeviceService.linkDevice(joinCode, name, role);
      const idb = await import('idb-keyval');
      await idb.set('linked-family-id', familyId);

      const { useFamilyStore } = await import('../store/useFamilyStore');
      await useFamilyStore.getState().fetchFamily();

      return { success: true, familyId };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid or expired join code' };
    }
  },

  /**
   * Releases Main App ownership, deletes device from database, unsubscribes WebPush,
   * signs out, and resets local storage to an unlinked state.
   */
  async transferMainApp(): Promise<void> {
    const deviceId = await DeviceService.getDeviceId();

    try {
      await PushSubscriptionService.unsubscribe();
      await supabase.from('devices').delete().eq('id', deviceId);
    } catch (e) {
      console.warn('Error during main app transfer cleanup:', e);
    }

    await useAuthStore.getState().signOut();
  },

  /**
   * Signs out current parent session without releasing Main App ownership.
   */
  async signOut(): Promise<void> {
    try {
      await PushSubscriptionService.unsubscribe();
    } catch (e) {
      console.warn('Failed to unsubscribe push notifications on sign out:', e);
    }

    await supabase.auth.signOut();
    await DeviceService.clearDeviceRole();
    const idb = await import('idb-keyval');
    await idb.del('linked-family-id');

    useAuthStore.setState({
      session: null,
      user: null,
      isDeviceLinked: false,
      isValidatingAuth: false,
    });
    const { useStore } = await import('../store');
    useStore.getState().clearLocalData();
  },
};
