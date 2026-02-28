import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProfileSelection } from './pages/ProfileSelection';
import { Layout } from './layouts/Layout';
import { useStore } from './store';
import { ReloadPrompt } from './components/ui/ReloadPrompt';
import { NotificationService } from './services/NotificationService';
import { ReminderService } from './services/ReminderService';

// Lazy load heavy dashboard pages
const ParentDashboard = lazy(() => import('./pages/ParentDashboard').then(m => ({ default: m.ParentDashboard })));
const ChildDashboard = lazy(() => import('./pages/ChildDashboard').then(m => ({ default: m.ChildDashboard })));

/**
 * Global Loading State for code-splitting.
 */
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
  </div>
);

function App() {
  const { refreshAssignments, assignments, redemptions, notificationPrefs } = useStore();

  useEffect(() => {
    refreshAssignments();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshAssignments();
        // Check reminders immediately when app is opened/focused
        ReminderService.checkAndSendReminder();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshAssignments]);

  // Global Badging Logic
  useEffect(() => {
    if (!notificationPrefs.badgeEnabled) {
      NotificationService.updateBadge(0);
      return;
    }

    const pendingApprovals = assignments.filter(a => a.completed && !a.verifiedAt).length;
    const pendingRedemptions = redemptions.filter(r => !r.approved).length;
    const activeQuests = assignments.filter(a => !a.completed).length;

    // Badge shows total "attention required" items across roles
    NotificationService.updateBadge(pendingApprovals + pendingRedemptions + activeQuests);
  }, [assignments, redemptions, notificationPrefs.badgeEnabled]);

  // Global Reminder Heartbeat
  useEffect(() => {
    // Check every minute
    const interval = setInterval(() => {
      ReminderService.checkAndSendReminder();
    }, 60000);

    // Initial check
    ReminderService.checkAndSendReminder();

    return () => clearInterval(interval);
  }, []);

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
