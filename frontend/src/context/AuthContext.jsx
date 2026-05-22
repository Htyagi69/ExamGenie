import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Synchronize auth state on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          
          // Verify token validity with profile request
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser({
              ...parsed,
              ...res.data.data
            });
          }
        }
      } catch (error) {
        console.warn('Token expired or invalid, logging out.');
        logout();
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const userData = res.data.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true };
      }
    } catch (error) {
      console.error('Login request failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Invalid email or password'
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { username, email, password });
      if (res.data.success) {
        const userData = res.data.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true };
      }
    } catch (error) {
      console.error('Register request failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
