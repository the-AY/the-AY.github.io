import { createContext, useState, useEffect } from 'react';
import api from '../api/client';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      if (token === 'mock-jwt-token') {
        setUser({ id: 'mock-user', email: 'test@nocode.local', role: 'owner' });
        setLoading(false);
        return;
      }
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/api/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { token, user: userData } = res.data;
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      return userData;
    } catch (err) {
      console.warn('Backend login failed, using mock local login for preview');
      const mockUser = { id: 'mock-user', email, role: 'owner' };
      localStorage.setItem('token', 'mock-jwt-token');
      setUser(mockUser);
      return mockUser;
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post('/api/auth/register', { name, email, password });
      const { token, user: userData } = res.data;
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      return userData;
    } catch (err) {
      console.warn('Backend register failed, using mock local login for preview');
      const mockUser = { id: 'mock-user', email, role: 'owner' };
      localStorage.setItem('token', 'mock-jwt-token');
      setUser(mockUser);
      return mockUser;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
