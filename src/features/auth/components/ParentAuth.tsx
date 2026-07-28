import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../../components/ui/Card';
import { Mail, Lock, ShieldCheck, Sparkles, AlertCircle, Clock } from 'lucide-react';
import { cn } from '../../../lib/utils';

function formatCooldownTime(totalSeconds: number): string {
  if (totalSeconds >= 3600) {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h ${secs}s`;
  }
  if (totalSeconds >= 60) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  return `${totalSeconds}s`;
}

/**
 * Authentication screen for Parents.
 *
 * Provides a unified toggle for Sign In and Sign Up.
 * Communicates directly with Supabase Auth.
 */
export function ParentAuth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [cooldown, setCooldown] = useState<number | null>(null);

  useEffect(() => {
    if (cooldown === null || cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev === null || prev <= 1) {
          setError(null);
          return null;
        }
        const next = prev - 1;
        setError(
          `Email rate limit exceeded. Please wait ${formatCooldownTime(next)} before trying again.`
        );
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleAuthError = (err: any) => {
    const message = err.message || '';
    const lower = message.toLowerCase();

    if (
      lower.includes('rate limit') ||
      lower.includes('too many requests') ||
      lower.includes('once every') ||
      err.status === 429
    ) {
      let seconds = 3600; // Default to 60 minutes for Supabase email hourly rate limit

      const secMatch = message.match(/(\d+)\s*seconds?/i);
      const minMatch = message.match(/(\d+)\s*minutes?/i);
      const hrMatch = message.match(/(\d+)\s*hours?/i);

      if (secMatch) {
        seconds = parseInt(secMatch[1], 10);
      } else if (minMatch) {
        seconds = parseInt(minMatch[1], 10) * 60;
      } else if (hrMatch) {
        seconds = parseInt(hrMatch[1], 10) * 3600;
      }

      setCooldown(seconds);
      setError(
        `Email rate limit exceeded. Please wait ${formatCooldownTime(seconds)} before trying again.`
      );
    } else {
      setError(message || 'An error occurred during authentication.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown !== null && cooldown > 0) return;

    setLoading(true);
    setError(null);
    useAuthStore.getState().setValidatingAuth(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role: 'parent' },
          },
        });
        if (error) throw error;

        if (data.session) {
          useAuthStore.getState().setSession(data.session);
        } else {
          alert('Verification email sent! Please check your inbox to confirm your account.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
          const { DeviceService } = await import('../../../services/DeviceService');
          const deviceId = await DeviceService.getDeviceId();

          // Check if another device is already registered as the Main App
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
              const mainDevice = allDevices.find((d) => d.role === 'main') || allDevices[0];

              if (mainDevice.id !== deviceId) {
                // 1. Notify current Main App via Edge Function
                const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                const deviceName = isMobile ? 'Mobile Device' : 'Desktop Device';
                try {
                  await supabase.functions.invoke('send-push', {
                    body: {
                      family_id: familyData.id,
                      title: '⚠️ Security Alert',
                      body: `A login attempt from "${deviceName}" was blocked because this family account is active on "${mainDevice.name}".`,
                      tag: 'login-blocked',
                      exclude_device_id: deviceId,
                    },
                  });
                } catch (_e) {
                  // Ignore push error if edge function is unreachable
                }

                // 2. Clean up temporary row, clear local role, and sign out
                await supabase.from('devices').delete().eq('id', deviceId);
                await DeviceService.clearDeviceRole();
                await supabase.auth.signOut();

                // 3. Fail connection and display error to connecting app
                setError(
                  `Access Blocked: Another device ("${mainDevice.name}") is currently active as the Main App. Only one device can hold Main App status at a time. The Main App has been notified of this attempt.`
                );
                return;
              }
            }

            // Register this device as the main device
            await DeviceService.ensureDeviceRegistered(familyData.id, undefined, 'main');
          }

          useAuthStore.getState().setSession(data.session);
          const { useFamilyStore } = await import('../../../store/useFamilyStore');
          await useFamilyStore.getState().fetchFamily();
        }
      }
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      useAuthStore.getState().setValidatingAuth(false);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    if (cooldown !== null && cooldown > 0) return;

    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setResetSent(true);
      alert('Password reset link sent! Please check your email.');
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-xl mb-4 rotate-3 animate-bounce-slow">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Family Hub</h1>
          <p className="text-slate-500 font-medium italic">Secure your family quest data</p>
        </div>

        <Card className="border-2 border-indigo-100 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-indigo-50/50 pb-8 pt-8 px-8 border-b border-indigo-100/50">
            <CardTitle className="text-2xl font-bold text-center text-indigo-900">
              {isSignUp ? 'Create Family Account' : 'Welcome Back, Admin'}
            </CardTitle>
            <CardDescription className="text-center font-medium text-indigo-600/70">
              {isSignUp
                ? 'Start your multi-device journey'
                : 'Sign in to manage your family quests'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div
                  className={cn(
                    'p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-2',
                    cooldown !== null && cooldown > 0
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-red-50 border-red-100 text-red-700'
                  )}
                >
                  {cooldown !== null && cooldown > 0 ? (
                    <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm font-medium leading-tight">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="Parent Email"
                    className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-lg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="Secure Password"
                    className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                disabled={loading || (cooldown !== null && cooldown > 0)}
              >
                {loading ? (
                  <div className="h-6 w-6 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : cooldown !== null && cooldown > 0 ? (
                  <span className="flex items-center justify-center gap-2">
                    <Clock className="h-5 w-5" /> Retry in {formatCooldownTime(cooldown)}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {isSignUp ? (
                      <Sparkles className="h-5 w-5" />
                    ) : (
                      <ShieldCheck className="h-5 w-5" />
                    )}
                    {isSignUp ? 'Create Family' : 'Enter Dashboard'}
                  </span>
                )}
              </Button>

              {!isSignUp && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading || resetSent || (cooldown !== null && cooldown > 0)}
                    className="text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
                  >
                    {resetSent
                      ? 'Reset link sent'
                      : cooldown !== null && cooldown > 0
                        ? `Retry available in ${formatCooldownTime(cooldown)}`
                        : 'Forgot Password?'}
                  </button>
                </div>
              )}
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign In' : 'New family? Create an account'}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 font-medium px-8">
          By continuing, you agree to secure your family quest data on ChoreQuest Cloud.
        </p>
      </div>
    </div>
  );
}
