import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProfileSelection } from './pages/ProfileSelection';
import { Layout } from './layouts/Layout';
import { ReloadPrompt } from './components/ui/ReloadPrompt';
import { ToastContainer } from './components/ui/ToastContainer';
import { useAppLifecycle } from './hooks/useAppLifecycle';
import { DevVersionBadge } from './components/ui/DevVersionBadge';
import { DeviceService, type DeviceRole } from './services/DeviceService';

// Lazy load heavy dashboard pages
const ParentDashboard = lazy(() =>
  import('./pages/ParentDashboard').then((m) => ({ default: m.ParentDashboard }))
);
const ChildDashboard = lazy(() =>
  import('./pages/ChildDashboard').then((m) => ({ default: m.ChildDashboard }))
);

/**
 * Global Loading State for code-splitting and Auth.
 */
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
  </div>
);

/**
 * Route guard that blocks child devices from accessing parent routes.
 */
function ParentRouteGuard({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<DeviceRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DeviceService.getDeviceRole().then((r) => {
      setRole(r);
      setLoading(false);
    });
  }, []);

  if (loading) return <PageLoader />;

  if (role === 'secondary_child') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  // Centralized Application Lifecycle (Auth, Sync, Listeners, Badging)
  const { authLoading } = useAppLifecycle();

  if (authLoading) return <PageLoader />;

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<ProfileSelection />} />
            <Route
              path="/parent/*"
              element={
                <ParentRouteGuard>
                  <ParentDashboard />
                </ParentRouteGuard>
              }
            />
            <Route path="/child/:childId" element={<ChildDashboard />} />
          </Route>
        </Routes>
      </Suspense>
      <ToastContainer />
      <ReloadPrompt />
      <DevVersionBadge />
    </BrowserRouter>
  );
}

export default App;
