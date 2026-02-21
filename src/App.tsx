import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProfileSelection } from './pages/ProfileSelection';
import { ParentDashboard } from './pages/ParentDashboard';
import { ChildDashboard } from './pages/ChildDashboard';
import { Layout } from './layouts/Layout';
import { useStore } from './store';

function App() {
  const refreshAssignments = useStore(state => state.refreshAssignments);

  useEffect(() => {
    refreshAssignments();
  }, [refreshAssignments]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ProfileSelection />} />
          <Route path="/parent/*" element={<ParentDashboard />} />
          <Route path="/child/:childId" element={<ChildDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
