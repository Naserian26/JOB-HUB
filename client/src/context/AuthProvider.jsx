import { useState, useEffect } from 'react';
import AuthContext from './AuthContext';
import { initSocket, disconnectSocket } from '../utils/socket';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      if (!raw || raw === 'undefined' || !storedToken) return null;
      return { ...JSON.parse(raw), token: storedToken };
   } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  });

  const loading = false;

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      const storedUser = raw && raw !== 'undefined' ? JSON.parse(raw) : null;
      const storedToken = localStorage.getItem('token');
      if (storedUser?.id && storedToken) {
        initSocket(storedUser.id, storedToken);
      }
    } catch  {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser({ ...userData, token });
    initSocket(userData.id, token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    disconnectSocket();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}