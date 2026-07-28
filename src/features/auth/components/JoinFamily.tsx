import { useState, useEffect } from 'react';
import { DeviceService } from '../../../services/DeviceService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../../components/ui/Card';
import { Users, ArrowLeft, Smartphone, CheckCircle2, AlertCircle, Share } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { Modal } from '../../../components/ui/Modal';
import { Validation } from '../../../lib/validation';

interface JoinFamilyProps {
  onJoined: (familyId: string) => void;
  onBack: () => void;
}

/**
 * Screen for secondary devices to join an existing family using a code.
 */
export function JoinFamily({ onJoined, onBack }: JoinFamilyProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'secondary_child' | 'secondary_parent'>('secondary_child');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const { refreshLinkStatus } = useAuthStore();

  // Check if running in Standalone (Installed) mode
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
  const isIOS = /iPhone|iPad|iPod/.test(window.navigator.userAgent);

  useEffect(() => {
    // Automatically show the helpful modal if on iOS Safari
    if (isIOS && !isStandalone) {
      setShowInstallModal(true);
    }
  }, [isIOS, isStandalone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    const result = Validation.device({ name });
    if (!result.valid) {
      setError(result.error || 'Invalid device name.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const familyId = await DeviceService.linkDevice(code, result.data!.name, role);

      // Trigger global state refresh immediately after linking
      await refreshLinkStatus();

      setSuccess(true);
      setTimeout(() => onJoined(familyId), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to link device.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in duration-500">
        <div className="h-20 w-20 bg-green-500 text-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-100">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Device Linked!</h2>
        <p className="text-slate-500 font-medium mt-2">Welcome to the family hub.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      {/* iOS Installation Education Modal */}
      <Modal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        title="Better Experience Required"
      >
        <div className="space-y-6 py-4">
          <div className="h-20 w-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl rotate-3">
            <Smartphone className="h-10 w-10" />
          </div>

          <div className="space-y-2 text-center">
            <h3 className="text-xl font-bold text-slate-900">Install to Home Screen</h3>
            <p className="text-sm text-slate-500">
              To keep your device linked and enable offline play, ChoreQuest must be installed as an
              app.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
              How to Install
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-700">
              <div className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 font-bold text-indigo-600">
                1
              </div>
              <p>
                Tap the{' '}
                <span className="font-bold inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm text-indigo-600">
                  <Share className="h-3 w-3" /> Share
                </span>{' '}
                button below
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-700">
              <div className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 font-bold text-indigo-600">
                2
              </div>
              <p>
                Scroll down and tap <span className="font-bold">"Add to Home Screen"</span>
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 leading-tight">
              <span className="font-bold">Note:</span> If you link now in Safari, the connection
              will be lost when you install later. It's best to install first!
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              className="w-full bg-indigo-600 font-bold h-12 rounded-xl"
              onClick={() => setShowInstallModal(false)}
            >
              I understand, continue anyway
            </Button>
            <Button variant="ghost" className="w-full text-slate-400 text-xs" onClick={onBack}>
              Go Back
            </Button>
          </div>
        </div>
      </Modal>

      <div className="w-full max-w-md space-y-6">
        <Button variant="ghost" onClick={onBack} className="text-slate-500 font-bold -ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500 text-white shadow-xl mb-4 rotate-3">
            <Users className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Join Family</h1>
          <p className="text-slate-500 font-medium italic">Enter your family's secret code</p>
        </div>

        <Card className="border-2 border-amber-100 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-amber-50/50 pb-8 pt-8 px-8 border-b border-amber-100/50">
            <CardTitle className="text-xl font-bold text-center text-amber-900">
              Enter Join Code
            </CardTitle>
            <CardDescription className="text-center font-medium text-amber-700/70 text-sm">
              Ask your parent for the 6-digit code in their dashboard settings.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium leading-tight">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2 text-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Join Code
                  </label>
                  <Input
                    placeholder="000000"
                    className="h-16 text-center text-3xl font-black tracking-[0.5em] rounded-2xl border-2 border-amber-100 bg-amber-50/30 focus:bg-white focus:border-amber-400 transition-all uppercase"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Device Name (Max 20)
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      placeholder="e.g. iPad Mini, Kids Tab"
                      className="pl-12 h-12 rounded-xl border-slate-200"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={20}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Device Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('secondary_child')}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        role === 'secondary_child'
                          ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <div className="text-xs font-bold">👦 Child Device</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        Quests & shop only
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('secondary_parent')}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        role === 'secondary_parent'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-900 font-bold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <div className="text-xs font-bold">🛡️ Parent Device</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        Full parent hub access
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-lg font-bold shadow-lg shadow-amber-100 transition-all disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <div className="h-6 w-6 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  'Link This Device'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
