import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DeploymentList from './pages/DeploymentList';
import DeploymentDetail from './pages/DeploymentDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DeploymentList />} />
        <Route path="/deployments/:id" element={<DeploymentDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
