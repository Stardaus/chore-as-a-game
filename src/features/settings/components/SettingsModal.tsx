import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useStore } from '../../../store';
import { useAuthStore } from '../../../store/useAuthStore';
import { useFamilyStore } from '../../../store/useFamilyStore';
import {
  Check,
  Star,
  Lock,
  Trash2,
  RefreshCcw,
  AlertTriangle,
  Key,
  Bell,
  Moon,
  Smartphone,
  LogOut,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { DeviceManager } from '../../auth/components/DeviceManager';
import { APP_VERSION } from '../../../constants';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Validation } from '../../../lib/validation';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    isPremium,
    setPremium,
    resetPoints,
    wipeFamilyData,
    parentPin,
    setParentPin,
    recoveryQuestion,
    recoveryAnswer,
    setRecoveryInfo,
    notificationPrefs,
    setNotificationPrefs,
    reminderSettings,
    updateReminderSettings,
  } = useStore();

  const session = useAuthStore((s) => s.session);
  const { updateServiceWorker } = useRegisterSW();

  const [newPin, setNewPin] = useState(parentPin);
  const [question, setQuestion] = useState(recoveryQuestion);
  const [answer, setAnswer] = useState(recoveryAnswer);
  const [isWiping, setIsWiping] = useState(false);
  const [isMainDevice, setIsMainDevice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      import('../../../services/DeviceService').then(({ DeviceService }) => {
        DeviceService.getDeviceRole().then((role) => {
          setIsMainDevice(role === 'main' || !!session);
        });
      });
    }
  }, [isOpen, session]);

  const handleUpgrade = () => {
    if (confirm('Confirm upgrade to Premium? (Simulated Payment)')) {
      setPremium(true);
    }
  };

  const handleDowngrade = () => {
    if (confirm('Are you sure you want to cancel Premium?')) {
      setPremium(false);
    }
  };

  const handleSaveAuth = () => {
    const result = Validation.security({ pin: newPin, question, answer });

    if (!result.valid) {
      alert(result.error);
      return;
    }

    if (question && !answer) {
      alert('Please provide an answer to your recovery question.');
      return;
    }
    setParentPin(newPin);
    setRecoveryInfo(question, answer);
    alert('Authentication settings updated!');
  };

  const handleResetPoints = async () => {
    if (
      confirm(
        'Are you sure you want to reset all points, levels, and history? Profiles and Chores will be kept.'
      )
    ) {
      await resetPoints();
      alert('Points and history have been reset.');
      onClose();
    }
  };

  const handleResetAll = async () => {
    if (
      confirm(
        'DANGER: This will permanently delete ALL profiles, chores, and rewards from the cloud and this device. This cannot be undone. Are you sure?'
      )
    ) {
      setIsWiping(true);
      try {
        await wipeFamilyData();
        alert('All family data has been permanently deleted.');
      } catch (e) {
        alert('Error wiping data. Check your connection.');
      } finally {
        setIsWiping(false);
        onClose();
      }
    }
  };

  const handleCheckUpdates = async () => {
    if (!navigator.onLine) {
      alert('Please connect to the internet to check for updates.');
      return;
    }

    console.log('Checking for updates...');
    // This triggers the service worker update flow
    await updateServiceWorker(true);
    // Fallback: forced reload if SW didn't trigger it
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleToggleNotifications = async () => {
    if (!notificationPrefs.enabled) {
      const { NotificationCenter } = await import('../../../services/NotificationCenter');
      const granted = await NotificationCenter.requestPermission();
      if (granted) {
        setNotificationPrefs({ enabled: true });
      }
    } else {
      setNotificationPrefs({ enabled: false });
      const { PushSubscriptionService } = await import('../../../services/PushSubscriptionService');
      await PushSubscriptionService.unsubscribe();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-2 hidden-scrollbar">
        {/* Subscription Status */}
        <div
          className={`p-4 rounded-xl border-2 ${isPremium ? 'border-indigo-100 bg-indigo-50' : 'border-slate-100 bg-slate-50'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-900">Subscription Status</h4>
            {isPremium ? (
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full flex items-center gap-1">
                <Star className="h-3 w-3 fill-indigo-700" /> Premium
              </span>
            ) : (
              <span className="px-2 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded-full">
                Free Tier
              </span>
            )}
          </div>

          {!isPremium ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">Unlock the full potential of ChoreQuest!</p>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-slate-400" />{' '}
                  <span>Limited to 1 Child Profile</span>
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-slate-400" /> <span>Limited to 5 Chore Types</span>
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-slate-400" /> <span>Limited to 3 Rewards</span>
                </li>
              </ul>
              <Button
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleUpgrade}
              >
                Upgrade for Unlimited Access
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">You have unlimited access to all features.</p>
              <ul className="space-y-2 text-sm text-indigo-900">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-600" />{' '}
                  <span>Unlimited Child Profiles</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-600" />{' '}
                  <span>Unlimited Chore Creation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-600" /> <span>Unlimited Rewards</span>
                </li>
              </ul>
              <Button
                variant="outline"
                className="w-full mt-4 text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleDowngrade}
              >
                Cancel Premium (Dev Only)
              </Button>
            </div>
          )}
        </div>

        {/* Notifications Section */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h4 className="font-semibold text-slate-900 flex items-center gap-2">
            <Bell className="h-4 w-4 text-indigo-500" />
            Engagement & Alerts
          </h4>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-slate-700">App Notifications</span>
              <span className="text-[10px] text-slate-500">
                Alerts for new quests and approvals
              </span>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={cn(
                'h-6 w-11 rounded-full transition-colors relative flex-shrink-0',
                notificationPrefs.enabled ? 'bg-indigo-600' : 'bg-slate-300'
              )}
            >
              <div
                className={cn(
                  'h-4 w-4 rounded-full bg-white absolute top-1 transition-all',
                  notificationPrefs.enabled ? 'left-6' : 'left-1'
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-slate-700">App Icon Badge</span>
              <span className="text-[10px] text-slate-500">
                Show pending tasks on home screen icon
              </span>
            </div>
            <button
              onClick={() =>
                setNotificationPrefs({ badgeEnabled: !notificationPrefs.badgeEnabled })
              }
              className={cn(
                'h-6 w-11 rounded-full transition-colors relative flex-shrink-0',
                notificationPrefs.badgeEnabled ? 'bg-indigo-600' : 'bg-slate-300'
              )}
            >
              <div
                className={cn(
                  'h-4 w-4 rounded-full bg-white absolute top-1 transition-all',
                  notificationPrefs.badgeEnabled ? 'left-6' : 'left-1'
                )}
              />
            </button>
          </div>

          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-bold text-slate-700">Evening Check-in</span>
              </div>
              <button
                onClick={() => updateReminderSettings({ enabled: !reminderSettings.enabled })}
                className={cn(
                  'h-6 w-11 rounded-full transition-colors relative flex-shrink-0',
                  reminderSettings.enabled ? 'bg-indigo-600' : 'bg-slate-300'
                )}
              >
                <div
                  className={cn(
                    'h-4 w-4 rounded-full bg-white absolute top-1 transition-all',
                    reminderSettings.enabled ? 'left-6' : 'left-1'
                  )}
                />
              </button>
            </div>
            {reminderSettings.enabled && (
              <div className="flex items-center justify-between pt-2 border-t border-indigo-100/50">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                  Reminder Time
                </span>
                <input
                  type="time"
                  value={reminderSettings.time}
                  onChange={(e) => updateReminderSettings({ time: e.target.value })}
                  className="bg-white border border-indigo-200 rounded px-2 py-1 text-xs font-bold text-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
              </div>
            )}
          </div>
        </div>

        {/* Device Management Section */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h4 className="font-semibold text-slate-900 flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-indigo-500" />
            Family Devices
          </h4>

          {/* Stale Threshold Setting */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Auto-Cleanup Inactive Devices
              </span>
              <select
                value={useFamilyStore.getState().family?.device_stale_days || 14}
                onChange={(e) => useFamilyStore.getState().updateStaleDays(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              >
                <option value={7}>7 Days</option>
                <option value={14}>14 Days (Default)</option>
                <option value={21}>21 Days</option>
                <option value={28}>28 Days</option>
              </select>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Devices inactive longer than this threshold will be automatically unlinked.
            </p>
          </div>

          <DeviceManager />

          {/* Transfer Main App Action */}
          {(session || isMainDevice) && (
            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50 text-xs font-bold"
                onClick={async () => {
                  if (
                    confirm(
                      'Transfer Main App status? This device will release Main App access, be removed from family devices, sign out, and restart as a fresh app so another device can claim Main App status.'
                    )
                  ) {
                    const { DeviceSessionModule } =
                      await import('../../../services/DeviceSessionModule');
                    await DeviceSessionModule.transferMainApp();
                    alert('Main App status released. Device removed and signed out.');
                    window.location.href = '/';
                  }
                }}
              >
                Transfer Main App to Another Device
              </Button>
            </div>
          )}
        </div>

        {/* PIN & Recovery Management */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h4 className="font-semibold text-slate-900 flex items-center gap-2">
            <Key className="h-4 w-4 text-indigo-500" />
            Parent Security
          </h4>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Dashboard PIN (4-6 digits)
            </label>
            <Input
              type="password"
              placeholder="New PIN"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Recovery Question
            </label>
            <Input
              placeholder="e.g. My first pet's name?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={100}
            />
            <Input
              placeholder="Your Answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              maxLength={50}
            />
          </div>

          <Button className="w-full" onClick={handleSaveAuth}>
            Save Security Settings
          </Button>
          <div className="pt-2">
            <Button
              variant="ghost"
              className="w-full text-slate-500 hover:text-red-600 hover:bg-red-50"
              onClick={async () => {
                const { useAuthStore } = await import('../../../store/useAuthStore');
                const { session, signOut, unlinkDevice } = useAuthStore.getState();

                if (session) {
                  if (confirm('Are you sure you want to sign out of your parent account?')) {
                    window.location.href = '/';
                    await signOut();
                  }
                } else {
                  if (confirm('Unlink this device from the family hub?')) {
                    window.location.href = '/';
                    await unlinkDevice();
                  }
                }
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {useAuthStore.getState().session
                ? 'Sign Out of Parent Account'
                : 'Unlink This Device'}
            </Button>
          </div>
        </div>

        {/* Data Management */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h4 className="font-semibold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Data Management
          </h4>
          <Button
            variant="outline"
            className="w-full justify-start text-slate-600"
            onClick={handleResetPoints}
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> Reset Points & Progress
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-indigo-600 border-indigo-100 hover:bg-indigo-50"
            onClick={handleCheckUpdates}
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> Check for App Updates
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleResetAll}
            disabled={isWiping}
          >
            {isWiping ? (
              <div className="mr-2 h-4 w-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete All Data
          </Button>
        </div>

        <div className="text-center text-[10px] font-mono text-slate-400">
          ChoreQuest {APP_VERSION} {typeof __COMMIT_HASH__ !== 'undefined' && `#${__COMMIT_HASH__}`}{' '}
          {typeof __BUILD_TIME__ !== 'undefined' && `• Built @ ${__BUILD_TIME__}`}
        </div>
      </div>
    </Modal>
  );
}
