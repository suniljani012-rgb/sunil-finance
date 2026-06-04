import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

const getApiUrl = (path) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const isCapacitor = !!window.Capacitor || 
                      window.location.origin.includes('capacitor://') || 
                      (window.location.hostname === 'localhost' && !window.location.port);
  const base = isCapacitor ? 'https://sunil-finance-5y6.pages.dev' : '';
  return `${base}${path}`;
};

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
    const res = await fetch(getApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  };

  const verifyLoginOTP = async (email, otp) => {
    const res = await fetch(getApiUrl('/api/auth/verify-login'), {
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
    const res = await fetch(getApiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  };

  const verifyRegisterOTP = async (email, otp) => {
    const res = await fetch(getApiUrl('/api/auth/verify-otp'), {
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
    // Clear caches on logout
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith('cache:')) {
        localStorage.removeItem(key);
      }
    }
    setToken(null);
    setUser(null);
  };

  const processOfflineQueue = async () => {
    if (!navigator.onLine) return;
    const queue = JSON.parse(localStorage.getItem('offline_write_queue') || '[]');
    if (queue.length === 0) return;

    console.log(`Syncing ${queue.length} offline operations...`);
    const remaining = [];
    let successCount = 0;

    for (const item of queue) {
      try {
        const headers = {
          'Content-Type': 'application/json',
          ...item.options.headers,
        };
        // Re-read token dynamically
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
          headers['Authorization'] = `Bearer ${currentToken}`;
        }
        const res = await fetch(getApiUrl(item.url), {
          ...item.options,
          headers
        });
        if (res.ok) {
          successCount++;
        } else {
          console.error("Sync item rejected by server", res.status);
        }
      } catch (err) {
        remaining.push(item);
      }
    }

    localStorage.setItem('offline_write_queue', JSON.stringify(remaining));

    if (successCount > 0) {
      // Dispatch custom event to notify components to refresh
      window.dispatchEvent(new CustomEvent('offline-sync-completed', { detail: { count: successCount } }));
      
      // Trigger native/PWA local notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification("Sunil Fin Cloud Sync", {
          body: `Successfully synchronized ${successCount} offline transactions!`,
          icon: 'logo.png'
        });
      }
    }
  };

  useEffect(() => {
    // Register online listener
    window.addEventListener('online', processOfflineQueue);
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    if (navigator.onLine && token) {
      processOfflineQueue();
    }

    return () => window.removeEventListener('online', processOfflineQueue);
  }, [token]);

  const authenticatedFetch = async (url, options = {}) => {
    const isGet = !options.method || options.method.toUpperCase() === 'GET';
    
    // Offline routing
    if (!navigator.onLine) {
      if (isGet) {
        const cached = localStorage.getItem(`cache:${url}`);
        if (cached) {
          return JSON.parse(cached);
        }
        throw new Error('You are offline, and this resource is not cached.');
      } else {
        // Enqueue write operation
        const queue = JSON.parse(localStorage.getItem('offline_write_queue') || '[]');
        queue.push({ url, options });
        localStorage.setItem('offline_write_queue', JSON.stringify(queue));
        
        // Return mock success so the UI proceeds smoothly
        return { 
          success: true, 
          offline: true, 
          message: 'Saved offline. Will sync when back online.' 
        };
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(getApiUrl(url), {
        ...options,
        headers,
      });
      
      if (res.status === 401) {
        logout();
        throw new Error('Session expired. Please log in again.');
      }
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API Request failed');
      
      // Cache successful GET requests
      if (isGet) {
        localStorage.setItem(`cache:${url}`, JSON.stringify(data));
      }
      
      return data;
    } catch (err) {
      // Fallback to cache if network fails unexpectedly (e.g. timeout)
      if (isGet) {
        const cached = localStorage.getItem(`cache:${url}`);
        if (cached) {
          return JSON.parse(cached);
        }
      }
      throw err;
    }
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
        syncOffline: processOfflineQueue
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
