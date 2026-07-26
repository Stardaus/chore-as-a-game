import { useEffect } from 'react';
import { useStore } from '../../store';
import { Sparkles, Gift, CheckCircle2, Bell, X } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * InApp Toast Notification Container.
 * 
 * Displays sleek, animated top banners for real-time remote family actions
 * when the app is actively used in the foreground.
 */
export function ToastContainer() {
    const { toasts, removeToast } = useStore();

    useEffect(() => {
        if (toasts.length === 0) return;

        const timers = toasts.map((t) =>
            setTimeout(() => {
                removeToast(t.id);
            }, 5000)
        );

        return () => {
            timers.forEach(clearTimeout);
        };
    }, [toasts, removeToast]);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] w-full max-w-md px-4 space-y-2 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={cn(
                        "pointer-events-auto p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border transition-all duration-300 animate-in slide-in-from-top-4 fade-in-50",
                        toast.type === 'quest' && "bg-indigo-900/95 text-white border-indigo-500/50 backdrop-blur-md",
                        toast.type === 'reward' && "bg-amber-900/95 text-white border-amber-500/50 backdrop-blur-md",
                        toast.type === 'success' && "bg-emerald-900/95 text-white border-emerald-500/50 backdrop-blur-md",
                        (!toast.type || toast.type === 'info') && "bg-slate-900/95 text-white border-slate-700 backdrop-blur-md"
                    )}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                            {toast.type === 'quest' && <Sparkles className="h-5 w-5 text-indigo-300" />}
                            {toast.type === 'reward' && <Gift className="h-5 w-5 text-amber-300" />}
                            {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-300" />}
                            {(!toast.type || toast.type === 'info') && <Bell className="h-5 w-5 text-slate-300" />}
                        </div>
                        
                        <div className="min-w-0">
                            <h4 className="text-sm font-bold leading-tight truncate">{toast.title}</h4>
                            <p className="text-xs opacity-90 leading-tight mt-0.5 truncate">{toast.message}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => removeToast(toast.id)}
                        className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center shrink-0 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
