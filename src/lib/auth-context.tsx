'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import NProgress from 'nprogress';
import type { User, UserRole, UserStatusData } from '@/types';
import { authApi } from './api/auth';
import { storage } from './storage';
import { isValidToken, isTokenExpired } from './token-validator';

interface AuthContextType {
  user: User | null;
  userStatus: UserStatusData | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshUserStatus: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
  isGuest: boolean;
  isEmployee: boolean;
  isManager: boolean;
  isHR: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatusData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch user status
  const refreshUserStatus = useCallback(async () => {
    try {
      const response = await authApi.getUserStatus();
      if (response.success && response.data) {
        setUserStatus(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch user status:', error);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = storage.getToken();
      const storedUser = storage.getUser();

      if (storedToken && storedUser && isValidToken(storedToken) && !isTokenExpired(storedToken)) {
        setUser(storedUser);
        setToken(storedToken);
        setIsAuthenticated(true);

        // Fetch latest user status
        try {
          await refreshUserStatus();
        } catch (error) {
          console.error('Failed to refresh user status:', error);
        }
      } else {
        storage.clear();
        setUser(null);
        setUserStatus(null);
        setToken(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    initAuth();
  }, [refreshUserStatus]);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });

      if (response.success && response.data) {
        const { token: accessToken, refreshToken } = response.data;

        // Store tokens
        storage.setToken(accessToken);
        storage.setRefreshToken(refreshToken);

        // Fetch user info
        const userInfoResponse = await authApi.getUserInfo();
        if (userInfoResponse.success && userInfoResponse.data) {
          storage.setUser(userInfoResponse.data);
          setUser(userInfoResponse.data);
          setToken(accessToken);
          setIsAuthenticated(true);

          // Fetch user status
          await refreshUserStatus();

          // Navigate to role-specific dashboard
          const roleRedirects: Record<UserRole, string> = {
            GUEST: '/dashboard/guest',
            EMPLOYEE: '/dashboard/employee',
            MANAGER: '/dashboard/manager',
            HR_MANAGER: '/dashboard/hr',
            ADMIN: '/dashboard/admin',
          };

          const redirect = roleRedirects[userInfoResponse.data.role];
          NProgress.start();
          router.push(redirect);

          return { success: true };
        }
      }

      return { success: false, message: response.error || 'Login failed' };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Network error. Please try again.';
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  // Register function
  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    try {
      const response = await authApi.register(data);

      if (response.success) {
        return {
          success: true,
          message:
            response.message ||
            'Registration successful. Please check your email to verify your account.',
        };
      }

      return { success: false, message: response.error || 'Registration failed' };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Network error. Please try again.';
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      storage.clear();
      setUser(null);
      setUserStatus(null);
      setToken(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      NProgress.start();
      // Navigate to login with a hard redirect to ensure clean URL (no query params)
      // Using window.location ensures a full page reload and clean URL
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      } else {
        router.replace('/login');
      }
    }
  };

  // Role checking functions
  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isGuest = user?.role === 'GUEST';
  const isEmployee = user?.role === 'EMPLOYEE';
  const isManager = user?.role === 'MANAGER';
  const isHR = user?.role === 'HR_MANAGER';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        userStatus,
        token,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshUserStatus,
        hasRole,
        isGuest,
        isEmployee,
        isManager,
        isHR,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
