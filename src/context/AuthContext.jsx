import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        // Simple JWT payload decoder to fetch username and email locally
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        
        // Check if token expired
        if (payload.exp && Date.now() > payload.exp) {
          logout();
        } else {
          setUser({
            id: payload.userId,
            username: payload.username,
            email: payload.email,
          });
        }
      } catch (e) {
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  };

  const verifyLoginOTP = async (email, otp) => {
    const res = await fetch('/api/auth/verify-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Verification failed');
    
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (username, email, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  };

  const verifyRegisterOTP = async (email, otp) => {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Verification failed');
    
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const authenticatedFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(url, {
      ...options,
      headers,
    });
    
    if (res.status === 401) {
      logout();
      throw new Error('Session expired. Please log in again.');
    }
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API Request failed');
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        verifyLoginOTP,
        register,
        verifyRegisterOTP,
        logout,
        fetch: authenticatedFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
