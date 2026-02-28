import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from './Button';
import { RefreshCw, X, WifiOff, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * PWA Update & Offline Ready Notification.
 * 
 * @description
 * Replaces system alert() dialogs with a themed toast notification at the bottom of the screen.
 * Handles:
 * - "New content available": Prompts the user to reload the app.
 * - "Ready to work offline": Confirms the app is cached for offline use.
 */
export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className={cn(
        "p-4 rounded-3xl border-2 shadow-2xl flex flex-col gap-3",
        needRefresh 
          ? "bg-indigo-600 border-indigo-400 text-white" 
          : "bg-emerald-600 border-emerald-400 text-white"
      )}>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            {needRefresh ? (
              <RefreshCw className="h-5 w-5 animate-spin-slow" />
            ) : (
              <WifiOff className="h-5 w-5" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-lg leading-tight">
              {needRefresh ? 'New Quest Available!' : 'App Ready Offline'}
            </h4>
            <p className="text-sm opacity-90 leading-tight mt-1">
              {needRefresh 
                ? 'A new version of ChoreQuest is ready. Reload to update your game!' 
                : 'ChoreQuest is now cached and ready to work without internet.'}
            </p>
          </div>

          <button 
            onClick={close}
            className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 mt-1">
          {needRefresh && (
            <Button 
              onClick={() => updateServiceWorker(true)}
              className="flex-1 bg-white text-indigo-600 hover:bg-indigo-50 border-none font-bold"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload Now
            </Button>
          )}
          {!needRefresh && (
            <Button 
              onClick={close}
              className="flex-1 bg-white text-emerald-600 hover:bg-emerald-50 border-none font-bold"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Awesome!
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
