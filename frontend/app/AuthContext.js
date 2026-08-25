'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  refreshMe: async () => {},
  loading: true,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('charity_token');
    const storedUser = localStorage.getItem('charity_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('charity_token', newToken);
    localStorage.setItem('charity_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('charity_token');
    localStorage.removeItem('charity_user');
  };

  const refreshMe = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5005/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('charity_user', JSON.stringify(data.user));
      } else {
        // Token might have expired
        logout();
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshMe, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
