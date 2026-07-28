import { useStore } from '../../store';
import { Sparkles, Gift, CheckCircle2, Bell, X } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * InApp Toast Notification Container.
 *
 * Displays sleek, compact, non-intrusive animated top banners for real-time
 * family actions. Capped at max 2 items to prevent screen clutter.
 */
export function ToastContainer() {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  // Render max 2 visible toasts
  const visibleToasts = toasts.slice(-2);

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[300] w-full max-w-sm px-4 space-y-2 pointer-events-none">
      {visibleToasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto p-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 border transition-all duration-300 animate-in slide-in-from-top-3 fade-in-50',
            toast.type === 'quest' &&
              'bg-indigo-900/95 text-white border-indigo-500/50 backdrop-blur-md',
            toast.type === 'reward' &&
              'bg-amber-900/95 text-white border-amber-500/50 backdrop-blur-md',
            toast.type === 'success' &&
              'bg-emerald-900/95 text-white border-emerald-500/50 backdrop-blur-md',
            (!toast.type || toast.type === 'info') &&
              'bg-slate-900/95 text-white border-slate-700 backdrop-blur-md'
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              {toast.type === 'quest' && <Sparkles className="h-4 w-4 text-indigo-300" />}
              {toast.type === 'reward' && <Gift className="h-4 w-4 text-amber-300" />}
              {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
              {(!toast.type || toast.type === 'info') && (
                <Bell className="h-4 w-4 text-slate-300" />
              )}
            </div>

            <div className="min-w-0">
              <h4 className="text-xs font-bold leading-tight truncate">{toast.title}</h4>
              <p className="text-[11px] opacity-90 leading-tight mt-0.5 truncate">
                {toast.message}
              </p>
            </div>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="h-6 w-6 rounded-full hover:bg-white/10 flex items-center justify-center shrink-0 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
