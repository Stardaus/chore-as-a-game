import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <main className="max-w-md mx-auto min-h-screen bg-white shadow-xl overflow-hidden relative">
        {/* Mobile-first container */}
        <Outlet />
      </main>
    </div>
  );
}
