import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProfileSelection } from './pages/ProfileSelection';
import { ParentDashboard } from './pages/ParentDashboard';
import { ChildDashboard } from './pages/ChildDashboard';
import { Layout } from './layouts/Layout';

function App() {
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
