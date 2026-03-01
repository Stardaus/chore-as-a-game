import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProfileSelection } from './pages/ProfileSelection';
import { Layout } from './layouts/Layout';
import { ReloadPrompt } from './components/ui/ReloadPrompt';
import { useAppLifecycle } from './hooks/useAppLifecycle';

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
  // Centralized Application Lifecycle (Auth, Sync, Listeners, Badging)
  const { authLoading } = useAppLifecycle();

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
