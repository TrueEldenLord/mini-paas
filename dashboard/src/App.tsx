import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthGuard from './components/AuthGuard';
import Login from './pages/Login';
import Register from './pages/Register';
import DeploymentList from './pages/DeploymentList';
import DeploymentDetail from './pages/DeploymentDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<AuthGuard><DeploymentList /></AuthGuard>} />
        <Route path="/deployments/:id" element={<AuthGuard><DeploymentDetail /></AuthGuard>} />
      </Routes>
    </BrowserRouter>
  );
}
