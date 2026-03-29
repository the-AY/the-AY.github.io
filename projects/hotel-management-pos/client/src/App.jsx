import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import CashierPOS from './pages/CashierPOS';
import KitchenKDS from './pages/KitchenKDS';
import Login from './pages/Login';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  const handleLogin = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-background text-text flex flex-col font-sans">
        {user && (
          <header className="bg-surface p-4 flex justify-between items-center shadow-md">
            <h1 className="text-xl font-bold text-primary tracking-wide">Smart Hotel POS</h1>
            <div className="flex gap-4 items-center">
              <span className="text-gray-400 capitalize">Role: {user.role}</span>
              <button onClick={handleLogout} className="bg-red-500/10 text-red-400 px-4 py-2 rounded-md hover:bg-red-500/20 transition">Logout</button>
            </div>
          </header>
        )}
        <main className="flex-1 p-4 overflow-y-auto">
          <Routes>
            <Route path="/login" element={!user ? <Login onLogin={handleLogin} api={API_URL} /> : <Navigate to={user.role === 'kitchen' ? '/kitchen' : (user.role === 'cashier' || user.role === 'waiter') ? '/cashier' : '/admin'} />} />
            
            <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard api={API_URL} /> : <Navigate to="/login" />} />
            <Route path="/cashier" element={(user?.role === 'cashier' || user?.role === 'admin' || user?.role === 'waiter') ? <CashierPOS api={API_URL} user={user} /> : <Navigate to="/login" />} />
            <Route path="/kitchen" element={(user?.role === 'kitchen' || user?.role === 'admin') ? <KitchenKDS api={API_URL} /> : <Navigate to="/login" />} />
            
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
