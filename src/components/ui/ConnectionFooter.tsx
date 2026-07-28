import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { APP_VERSION } from '../../constants';
import { cn } from '../../lib/utils';
import { Globe, WifiOff, Cloud, Database, Sparkles } from 'lucide-react';

/**
 * Shared footer component that displays connection status and app version.
 * Provides HIGH-VISIBILITY feedback on connectivity and link status.
 */
export function ConnectionFooter() {
  const { isDeviceLinked: isLinked } = useAuthStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  return (
    <div className="mt-auto pt-10 pb-6 space-y-6">
      <div className="flex flex-col items-center gap-3">
        {/* Mode Indicator (Hub vs Standalone) - LARGE & OBVIOUS */}
        <div
          className={cn(
            'w-full max-w-[240px] px-4 py-2.5 rounded-2xl flex items-center justify-between gap-3 shadow-lg border-2 transition-all',
            isLinked
              ? 'bg-indigo-600 border-indigo-400 text-white shadow-indigo-100'
              : 'bg-white border-slate-200 text-slate-600 shadow-slate-100'
          )}
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-8 w-8 rounded-xl flex items-center justify-center shrink-0',
                isLinked ? 'bg-white/20' : 'bg-slate-100'
              )}
            >
              {isLinked ? <Cloud className="h-4 w-4" /> : <Database className="h-4 w-4" />}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                {isLinked ? 'Family Hub' : 'Local Only'}
              </span>
              <span
                className={cn(
                  'text-xs font-bold leading-tight',
                  isLinked ? 'text-indigo-100' : 'text-slate-400'
                )}
              >
                {isLinked ? 'Cloud Sync Active' : 'Standalone Device'}
              </span>
            </div>
          </div>
          {isLinked && <Sparkles className="h-4 w-4 text-indigo-200 animate-pulse" />}
        </div>

        {/* Real-time Connection Status (Small) */}
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all',
            isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 animate-bounce'
          )}
        >
          <div
            className={cn('h-1.5 w-1.5 rounded-full', isOnline ? 'bg-green-500' : 'bg-red-500')}
          />
          {isOnline ? (
            <>
              <Globe className="h-2.5 w-2.5" />
              <span>Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-2.5 w-2.5" />
              <span>No Internet</span>
            </>
          )}
        </div>
      </div>

      {/* App Version */}
      <div className="flex flex-col items-center gap-1">
        <div className="h-px w-8 bg-slate-200" />
        <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
          CQ-OS {APP_VERSION} {typeof __COMMIT_HASH__ !== 'undefined' && `#${__COMMIT_HASH__}`}
        </p>
      </div>
    </div>
  );
}
