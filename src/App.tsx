import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProfileSelection } from './pages/ProfileSelection';
import { Layout } from './layouts/Layout';
import { useStore } from './store';
import { useAuthStore } from './store/useAuthStore';
import { ReloadPrompt } from './components/ui/ReloadPrompt';
import { NotificationService } from './services/NotificationService';
import { ReminderService } from './services/ReminderService';
import { SyncService } from './services/SyncService';
import { get } from 'idb-keyval';

// Lazy load heavy dashboard pages
const ParentDashboard = lazy(() => import('./pages/ParentDashboard').then(m => ({ default: m.ParentDashboard })));
const ChildDashboard = lazy(() => import('./pages/ChildDashboard').then(m => ({ default: m.ChildDashboard })));

/**
 * Global Loading State for code-splitting and Auth.
 */
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
  </div>
);

function App() {
  const { refreshAssignments, assignments, redemptions, notificationPrefs, syncWithCloud, familyId, setFamilyId, processSyncQueue } = useStore();
  const { initialize: initializeAuth, loading: authLoading, session } = useAuthStore();

  // 1. Initial Load: Auth and Refresh
  useEffect(() => {
    initializeAuth();
    refreshAssignments();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshAssignments();
        ReminderService.checkAndSendReminder();
        // Check for PWA updates when coming back to the app
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(reg => {
                if (reg) reg.update();
            });
        }
      }
    };

    // Offline -> Online synchronization handler
    const handleOnline = async () => {
      console.log('📡 Connection restored! Processing offline queue...');
      await processSyncQueue();
      const targetFamilyId = familyId || await get('linked-family-id');
      if (targetFamilyId) {
        syncWithCloud(targetFamilyId);
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    // If we load the app while online, process any left-over offline queue items immediately
    if (navigator.onLine) {
        handleOnline();
    }

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [refreshAssignments, initializeAuth, processSyncQueue, syncWithCloud, familyId]);

  // 2. Cloud Sync Initializer: PRIORITIZE Linked Device or Session
  useEffect(() => {
    const initSync = async () => {
      // Check for local link first (for kids/tablets)
      let targetFamilyId = await get('linked-family-id');
      let fetchSuccessful = false;

      // If no local link, check for parent session (ONLY if online)
      if (!targetFamilyId && session?.user && navigator.onLine) {
        try {
          const { data, error } = await import('./lib/supabase').then(m => 
            m.supabase.from('families').select('id').single()
          );
          
          if (!error) {
            targetFamilyId = data?.id || null;
            fetchSuccessful = true;
          } else {
            console.warn("Server returned error during sync init:", error.message);
          }
        } catch (e) {
          console.warn("Network error during family session verification.");
        }
      } else if (targetFamilyId) {
          // If we have a local link ID, we consider the "fetch" of that ID successful (it exists locally)
          fetchSuccessful = true;
      }

      if (targetFamilyId) {
        syncWithCloud(targetFamilyId);
      } else if (fetchSuccessful) {
        // ONLY cleanup if we successfully communicated with the server 
        // AND it explicitly confirmed no family ID exists for this user.
        const currentFamilyId = useStore.getState().familyId;
        if (currentFamilyId) {
          console.log("🧹 Cleanup: Server confirmed device unlinked, clearing data.");
          useStore.getState().resetAllData();
        } else {
          setFamilyId(null);
        }
      } else {
          // If we are offline or fetch failed, DO NOTHING. 
          // Preserving local data is the highest priority.
          console.log("📡 Offline or network error: Staying in local mode.");
      }
    };

    if (!authLoading) {
      initSync();
    }
  }, [session, authLoading, syncWithCloud, setFamilyId]);

  // 3. Real-time Subscription: Only run if familyId is set
  useEffect(() => {
    if (familyId) {
      const cleanup = SyncService.initRealtime(familyId);
      return cleanup;
    }
  }, [familyId]);

  // Global Badging Logic
  useEffect(() => {
    if (!notificationPrefs.badgeEnabled) {
      NotificationService.updateBadge(0);
      return;
    }

    const pendingApprovals = assignments.filter(a => a.completed && !a.verifiedAt).length;
    const pendingRedemptions = redemptions.filter(r => !r.approved).length;
    const activeQuests = assignments.filter(a => !a.completed).length;

    NotificationService.updateBadge(pendingApprovals + pendingRedemptions + activeQuests);
  }, [assignments, redemptions, notificationPrefs.badgeEnabled]);

  // Global Reminder Heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      ReminderService.checkAndSendReminder();
    }, 60000);
    ReminderService.checkAndSendReminder();
    return () => clearInterval(interval);
  }, []);

  if (authLoading) return <PageLoader />;

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<ProfileSelection />} />
            <Route path="/parent/*" element={<ParentDashboard />} />
            <Route path="/child/:childId" element={<ChildDashboard />} />
          </Route>
        </Routes>
      </Suspense>
      <ReloadPrompt />
    </BrowserRouter>
  );
}

export default App;
