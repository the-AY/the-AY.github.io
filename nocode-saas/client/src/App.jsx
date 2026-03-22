import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AppBuilder from './pages/AppBuilder';
import DbBuilder from './pages/DbBuilder';
import UiBuilder from './pages/UiBuilder';
import RuntimeView from './pages/RuntimeView';
import PosPage from './pages/PosPage';
import Layout from './components/common/Layout';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/app/:appId" element={<AppBuilder />} />
                <Route path="/app/:appId/db" element={<DbBuilder />} />
                <Route path="/app/:appId/ui" element={<UiBuilder />} />
                <Route path="/app/:appId/preview" element={<RuntimeView />} />
                <Route path="/app/:appId/pos" element={<PosPage />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
