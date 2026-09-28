import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, type UserProfile, type UserRole } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (user: UserProfile) => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('threatx_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('threatx_token');
  });

  const [isLoading, setIsLoading] = useState(true);

  // Validate existing token on mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const storedToken = localStorage.getItem('threatx_token');
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const response = await api.getMe();
        if (isMounted && response?.user) {
          setUser(response.user);
          localStorage.setItem('threatx_user', JSON.stringify(response.user));
        }
      } catch (err: any) {
        console.warn('[Auth] Session validation failed or expired:', err.message);
        if (isMounted) {
          setUser(null);
          setToken(null);
          localStorage.removeItem('threatx_token');
          localStorage.removeItem('threatx_user');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    // Listen to session expired event from axios interceptor
    const handleSessionExpired = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('threatx:session_expired', handleSessionExpired);
    return () => {
      isMounted = false;
      window.removeEventListener('threatx:session_expired', handleSessionExpired);
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.login(email, password);
      if (res?.token && res?.user) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('threatx_token', res.token);
        localStorage.setItem('threatx_user', JSON.stringify(res.user));
        return { success: true };
      }
      return { success: false, error: 'Authentication payload incomplete' };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Login failed';
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('threatx_token');
      localStorage.removeItem('threatx_user');
      window.location.href = '/login';
    }
  };

  const updateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('threatx_user', JSON.stringify(updatedUser));
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: Boolean(token && user),
        login,
        logout,
        updateUser,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
