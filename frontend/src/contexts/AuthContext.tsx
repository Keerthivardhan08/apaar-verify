// ============================================================
// APAAR Verify — Authentication Context
// ============================================================

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAICTEAdmin: () => boolean;
  isInstitutionOperator: () => boolean;
  isInstitutionAdmin: () => boolean;
  isReviewer: () => boolean;
  isVerifier: () => boolean;
  getUserInstitutionId: () => string | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('apaar_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('apaar_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load current user profile if token exists
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const userData = await authApi.getMe();
          setUser(userData);
          localStorage.setItem('apaar_user', JSON.stringify(userData));
        } catch (error) {
          console.warn('Failed to fetch user session from token:', error);
          // If token invalid, clear
          localStorage.removeItem('apaar_token');
          localStorage.removeItem('apaar_user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const data = await authApi.login(email, password);
      const authToken = data.access_token;
      const loggedUser = data.user;

      localStorage.setItem('apaar_token', authToken);
      localStorage.setItem('apaar_user', JSON.stringify(loggedUser));
      setToken(authToken);
      setUser(loggedUser);
      toast.success(`Welcome back, ${loggedUser.full_name || 'User'}!`);
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      localStorage.removeItem('apaar_token');
      localStorage.removeItem('apaar_user');
      setToken(null);
      setUser(null);
      toast.success('Signed out successfully.');
    }
  }, []);

  const isAuthenticated = useMemo(() => {
    return Boolean(token && user);
  }, [token, user]);

  const hasRole = useCallback((roleName: string): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.some((r) => r.role === roleName || r.role.toLowerCase() === roleName.toLowerCase());
  }, [user]);

  const isAICTEAdmin = useCallback((): boolean => {
    return hasRole('aicte_admin') || hasRole('admin') || hasRole('superadmin');
  }, [hasRole]);

  const isInstitutionOperator = useCallback((): boolean => {
    return hasRole('institution_operator') || hasRole('operator');
  }, [hasRole]);

  const isInstitutionAdmin = useCallback((): boolean => {
    return hasRole('institution_admin');
  }, [hasRole]);

  const isReviewer = useCallback((): boolean => {
    return hasRole('reviewer') || isAICTEAdmin();
  }, [hasRole, isAICTEAdmin]);

  const isVerifier = useCallback((): boolean => {
    return hasRole('verifier');
  }, [hasRole]);

  const getUserInstitutionId = useCallback((): string | null => {
    if (!user || !user.roles) return null;
    const instRole = user.roles.find((r) => r.institution_id);
    return instRole?.institution_id || null;
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated,
      login,
      logout,
      isAICTEAdmin,
      isInstitutionOperator,
      isInstitutionAdmin,
      isReviewer,
      isVerifier,
      getUserInstitutionId,
      setUser,
    }),
    [
      user,
      token,
      isLoading,
      isAuthenticated,
      login,
      logout,
      isAICTEAdmin,
      isInstitutionOperator,
      isInstitutionAdmin,
      isReviewer,
      isVerifier,
      getUserInstitutionId,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
