import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';

export interface User {
  id: string;
  nombre: string;
  email: string;
  celular?: string;
  rol: 'ADMIN' | 'VENDEDOR' | 'RELACIONADOR' | 'CONTROL';
  permisos: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: (payload: { credential?: string; testEmail?: string; testName?: string }) => Promise<void>;
  logout: () => Promise<void>;
  hasPermiso: (permiso: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  hasPermiso: () => false,
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const data = await api.login(email, pass);
    setUser(data.user);
  };

  const loginWithGoogle = async (payload: { credential?: string; testEmail?: string; testName?: string }) => {
    const data = await api.loginWithGoogle(payload);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  };

  const hasPermiso = (permiso: string) => {
    if (!user) return false;
    return user.permisos.includes(permiso);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout, hasPermiso, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
