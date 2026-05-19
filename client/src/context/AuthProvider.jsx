import { useState, useEffect } from 'react';
import AuthContext from './AuthContext';
import { initSocket, disconnectSocket } from '../utils/socket';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      if (!storedUser || !storedToken) return null;
      return { ...JSON.parse(storedUser), token: storedToken };
    } catch (error) {
      console.error('Failed to parse user from localStorage:', error);
      return null;
    }
  });

  const loading = false;

  // Handle page refresh — user already logged in
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    const storedToken = localStorage.getItem('token');
    if (storedUser?._id && storedToken) {
      initSocket(storedUser._id, storedToken);
    }
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser({ ...userData, token });
    initSocket(userData._id, token);
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