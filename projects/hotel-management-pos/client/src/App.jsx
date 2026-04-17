import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import CashierPOS from './pages/CashierPOS';
import KitchenKDS from './pages/KitchenKDS';
import Login from './pages/Login';
import { Wifi, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const IS_STATIC = import.meta.env.VITE_STATIC_MODE === 'true';

function App() {
  const [user, setUser]           = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [sessionId, setSessionId] = useState(localStorage.getItem('session_id') || null);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [showNetBanner, setShowNetBanner] = useState(true);
  const pingRef = useRef(null);

  // ── Fetch network info (admin only + non-static mode) ────
  useEffect(() => {
    if (user?.role === 'admin' && !IS_STATIC) {
      fetch(`${API_URL.replace('/api', '')}/api/network-info`)
        .then(r => r.json())
        .then(d => setNetworkInfo(d))
        .catch(() => {});
    }
  }, [user]);

  // ── Session ping every 30 s ───────────────────────────────
  useEffect(() => {
    if (!sessionId || IS_STATIC) return;

    const doSinglePing = () => {
      fetch(`${API_URL}/sessions/${sessionId}/ping`, { method: 'POST' })
        .then(r => {
          if (r.status === 404) handleLogout(); // force-logout by admin
        })
        .catch(() => {});
    };

    doSinglePing();
    pingRef.current = setInterval(doSinglePing, 30_000);
    return () => clearInterval(pingRef.current);
  }, [sessionId]);

  const handleLogin = async (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    // Create server session
    if (!IS_STATIC) {
      try {
        const res = await fetch(`${API_URL}/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staff_id:   userData.id,
            staff_name: userData.name,
            role:       userData.role,
            device:     navigator.userAgent.substring(0, 120),
          }),
        });
        const data = await res.json();
        if (data.id) {
          localStorage.setItem('session_id', data.id);
          setSessionId(data.id);
        }
      } catch (_) {}
    }
  };

  const handleLogout = () => {
    if (sessionId && !IS_STATIC) {
      fetch(`${API_URL}/sessions/${sessionId}`, { method: 'DELETE' }).catch(() => {});
    }
    localStorage.removeItem('user');
    localStorage.removeItem('session_id');
    clearInterval(pingRef.current);
    setUser(null);
    setSessionId(null);
    setNetworkInfo(null);
  };

  const redirectPath = (role) => {
    if (role === 'kitchen') return '/kitchen';
    if (role === 'admin')   return '/admin';
    return '/cashier'; // cashier + waiter
  };

  return (
    <Router>
      <div className="min-h-screen bg-background text-text flex flex-col font-sans">

        {/* ── Header ─────────────────────────────────────── */}
        {user && (
          <header className="bg-surface p-3 flex justify-between items-center shadow-md border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-primary tracking-wide">Smart Hotel POS</h1>
              {IS_STATIC && (
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Simulation Mode
                </span>
              )}
            </div>
            <div className="flex gap-4 items-center">
              <span className="text-slate-400 text-sm capitalize">{user.name} · {user.role}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500/10 text-red-400 px-3 py-1.5 rounded-md hover:bg-red-500/20 transition text-sm"
              >
                Logout
              </button>
            </div>
          </header>
        )}

        {/* ── Network Info Banner (admin + real server) ──── */}
        {user?.role === 'admin' && networkInfo && showNetBanner && (
          <div className="bg-teal-500/10 border-b border-teal-500/30 px-4 py-2 flex justify-between items-center">
            <div className="flex items-center gap-3 text-sm">
              <Wifi size={16} className="text-teal-400 shrink-0" />
              <span className="text-slate-300">
                Other devices on WiFi can connect to:&nbsp;
                <code className="bg-slate-900 text-teal-300 px-2 py-0.5 rounded font-mono font-bold">
                  http://{networkInfo.ip}:{networkInfo.port}
                </code>
              </span>
            </div>
            <button onClick={() => setShowNetBanner(false)} className="text-slate-500 hover:text-slate-300 ml-4">
              <X size={16} />
            </button>
          </div>
        )}

        {/* ── Routes ─────────────────────────────────────── */}
        <main className="flex-1 p-4 overflow-y-auto">
          <Routes>
            <Route
              path="/login"
              element={
                !user
                  ? <Login onLogin={handleLogin} api={API_URL} />
                  : <Navigate to={redirectPath(user.role)} />
              }
            />
            <Route
              path="/admin"
              element={user?.role === 'admin' ? <AdminDashboard api={API_URL} /> : <Navigate to="/login" />}
            />
            <Route
              path="/cashier"
              element={
                ['cashier', 'admin', 'waiter'].includes(user?.role)
                  ? <CashierPOS api={API_URL} user={user} />
                  : <Navigate to="/login" />
              }
            />
            <Route
              path="/kitchen"
              element={
                ['kitchen', 'admin'].includes(user?.role)
                  ? <KitchenKDS api={API_URL} />
                  : <Navigate to="/login" />
              }
            />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
