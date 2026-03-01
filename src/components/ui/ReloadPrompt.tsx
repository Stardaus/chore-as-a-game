import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from './Button';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * PWA Update & Offline Ready Notification.
 * 
 * @description
 * Replaces system alert() dialogs with a themed toast notification at the bottom of the screen.
 */
export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
      // Optional: check for updates immediately on registration
      r?.update();
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] animate-in slide-in-from-top duration-500">
      <div className={cn(
        "px-4 py-3 shadow-2xl flex items-center justify-between gap-4",
        needRefresh 
          ? "bg-indigo-600 text-white" 
          : "bg-emerald-600 text-white"
      )}>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            {needRefresh ? (
              <RefreshCw className="h-4 w-4 animate-spin-slow" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </div>
          
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight">
              {needRefresh ? 'New Quest Version Available!' : 'Game Ready for Offline Play'}
            </p>
            {needRefresh && (
              <p className="text-[10px] opacity-80">Update now to get the latest features and fixes.</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {needRefresh && (
            <Button 
              size="sm"
              onClick={() => updateServiceWorker(true)}
              className="bg-white text-indigo-600 hover:bg-indigo-50 border-none font-bold text-xs h-8 px-4"
            >
              Update Now
            </Button>
          )}
          <button 
            onClick={close}
            className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
