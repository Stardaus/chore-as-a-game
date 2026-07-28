import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useAuthStore } from '../store/useAuthStore';
import { DeviceService, type DeviceRole } from '../services/DeviceService';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { ShieldCheck, UserCircle, Users, Smartphone, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { JoinFamily } from '../features/auth/components/JoinFamily';
import { ConnectionFooter } from '../components/ui/ConnectionFooter';

/**
 * Entry point for all users.
 *
 * @description
 * Allows users to:
 * 1. Enter the Parent Dashboard (PIN required).
 * 2. Enter a Child Dashboard (One-click).
 * 3. Link a new device to a family account.
 */
export function ProfileSelection() {
  const navigate = useNavigate();
  const { profiles, isSyncing } = useStore();
  const { isDeviceLinked: isLinked, session } = useAuthStore();
  const [view, setView] = useState<'select' | 'join'>('select');
  const [role, setRole] = useState<DeviceRole | null>(null);

  useEffect(() => {
    DeviceService.getDeviceRole().then(setRole);
  }, [isLinked, session, view]);

  // A device is only considered a secondary child device if linked AND explicitly assigned secondary_child role
  const isChildDevice = (isLinked || !!session) && role === 'secondary_child';

  const handleChildSelect = (childId: string) => {
    navigate(`/child/${childId}`);
  };

  const handleParentSelect = () => {
    navigate('/parent');
  };

  if (view === 'join') {
    return <JoinFamily onJoined={() => setView('select')} onBack={() => setView('select')} />;
  }

  // A device is "Connected" if it's explicitly linked via code OR if a parent is logged in
  const isConnected = isLinked || !!session;
  const showWelcomeView = !isConnected;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
      {/* Background elements for visual flair */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-amber-100/50 rounded-full blur-3xl" />

      <div className="w-full max-w-md space-y-10 relative z-10">
        {/* App Branding */}
        <div className="text-center space-y-2">
          <img
            src="/pwa-192x192.png"
            alt="ChoreQuest Logo"
            className="h-20 w-20 rounded-[2rem] shadow-2xl shadow-indigo-200 mb-2 rotate-3 transform hover:rotate-0 transition-transform cursor-default object-cover inline-block"
          />
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">ChoreQuest</h1>
          <p className="text-slate-500 font-medium italic">
            {showWelcomeView ? 'Start your adventure!' : 'Who is playing today?'}
          </p>
        </div>

        {showWelcomeView ? (
          /* Empty/Unlinked Welcome View */
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-2 border-indigo-100 shadow-xl rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2 text-center">
                  <h2 className="text-xl font-bold text-slate-900">Welcome to the Family!</h2>
                  <p className="text-sm text-slate-600 font-medium">
                    How would you like to start using ChoreQuest on this device?
                  </p>
                </div>

                <div className="grid gap-3">
                  <Button
                    onClick={handleParentSelect}
                    className="h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-between px-6 shadow-lg shadow-indigo-100"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <ShieldCheck className="h-6 w-6" />
                      <div>
                        <div className="text-sm">Create New Family</div>
                        <div className="text-[10px] text-indigo-100 font-medium">
                          Setup this device as the Hub
                        </div>
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setView('join')}
                    className="h-16 rounded-2xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold flex items-center justify-between px-6 transition-all"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <Users className="h-6 w-6 text-amber-800" />
                      <div>
                        <div className="text-sm text-amber-950">Join Existing Family</div>
                        <div className="text-[10px] text-amber-900 font-medium">
                          Link to a parent's account
                        </div>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Profiles Grid */
          <div className="grid grid-cols-2 gap-6 relative">
            {isSyncing && profiles.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 z-10 rounded-3xl backdrop-blur-sm">
                <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
              </div>
            )}

            {/* Parent Profile (Hidden for Child Devices) */}
            {!isChildDevice && (
              <button
                onClick={handleParentSelect}
                className="group flex flex-col items-center space-y-3 transition-all"
              >
                <div className="relative">
                  <div className="h-28 w-28 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-white shadow-lg group-hover:shadow-indigo-200 group-hover:scale-105 transition-all outline outline-0 outline-indigo-200 group-hover:outline-8">
                    <ShieldCheck className="h-12 w-12" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-md">
                    <UserCircle className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
                <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                  Parent Hub
                </span>
              </button>
            )}

            {/* Child Profiles */}
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleChildSelect(profile.id)}
                className="group flex flex-col items-center space-y-3 transition-all animate-in fade-in zoom-in duration-300"
              >
                <div className="relative">
                  <div className="h-28 w-28 rounded-[2.5rem] bg-white border-2 border-slate-100 overflow-hidden shadow-sm group-hover:shadow-indigo-100 group-hover:border-indigo-200 group-hover:scale-105 transition-all outline outline-0 outline-indigo-50 group-hover:outline-8">
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="h-full w-full object-cover grayscale-[0.2] group-hover:grayscale-0"
                    />
                  </div>
                </div>
                <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                  {profile.name}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Secondary Actions for standalone/unlinked users ONLY */}
        {!isConnected && !showWelcomeView && (
          <div className="pt-6 border-t border-slate-200">
            <Card className="border-2 border-dashed border-amber-200 bg-amber-50/30 shadow-none hover:bg-amber-50 transition-colors rounded-[2rem]">
              <CardContent className="p-4">
                <button
                  onClick={() => setView('join')}
                  className="w-full flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-100 transition-all">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-amber-900">Want to Sync?</p>
                      <p className="text-[10px] text-amber-700">Link this device to a family hub</p>
                    </div>
                  </div>
                  <Users className="h-4 w-4 text-amber-300 group-hover:text-amber-500 transition-colors" />
                </button>
              </CardContent>
            </Card>
          </div>
        )}

        <ConnectionFooter />
      </div>
    </div>
  );
}
