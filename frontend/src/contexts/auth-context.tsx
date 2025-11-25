'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { setupAuthInterceptors } from '@/lib/api';
import * as authApi from '@/lib/auth-api';
import { getUserFromToken } from '@/lib/jwt-utils';
import type {
  User,
  AuthContextType,
  LoginRequest,
  RegisterRequest,
  Permission,
} from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Use a ref to store the latest access token value
  // This prevents race conditions where the token changes but the interceptor hasn't been updated yet
  const accessTokenRef = useRef<string | null>(null);

  // Update ref whenever access token changes
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  // Setup API interceptors once on mount
  useEffect(() => {
    setupAuthInterceptors(
      () => accessTokenRef.current,  // Always gets the latest token from the ref
      (token: string) => setAccessToken(token),
      async () => {
        setAccessToken(null);
        setUser(null);
        router.push('/login');
      }
    );
  }, [router]);  // Only depend on router, not accessToken

  // Try to restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Try to refresh token to restore session
        const response = await authApi.refreshAccessToken();
        if (response.success && response.data.accessToken) {
          const token = response.data.accessToken;
          setAccessToken(token);

          // Extract user information from JWT token
          const userData = getUserFromToken(token);
          if (userData) {
            setUser(userData);
          }
        }
      } catch (error) {
        // Session restoration failed - user needs to login
        console.log('Session restoration failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  /**
   * Login with email and password
   */
  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean = false) => {
      setIsLoading(true);
      try {
        const credentials: LoginRequest = { email, password, rememberMe };
        const response = await authApi.login(credentials);

        // Set access token (refresh token is stored as HTTP-only cookie by backend)
        setAccessToken(response.accessToken);
        // IMPORTANT: Also update ref immediately so token is available for next API call
        accessTokenRef.current = response.accessToken;

        // Extract user information from JWT token (includes permissions)
        const userData = getUserFromToken(response.accessToken);
        if (userData) {
          setUser(userData);
        }
        // Redirect will be handled by the calling component
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Register a new user
   */
  const register = useCallback(async (userData: RegisterRequest) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(userData);

      if (response.success && response.data) {
        // Registration successful - user should verify email or login
        return response.data;
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout current session
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call success
      setAccessToken(null);
      setUser(null);
      setIsLoading(false);
      router.push('/login');
    }
  }, [router]);

  /**
   * Refresh access token
   */
  const refreshToken = useCallback(async () => {
    try {
      const response = await authApi.refreshAccessToken();
      if (response.success && response.data.accessToken) {
        setAccessToken(response.data.accessToken);
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // Logout on refresh failure
      setAccessToken(null);
      setUser(null);
      router.push('/login');
      throw error;
    }
  }, [router]);

  /**
   * Update access token (used by interceptors)
   */
  const updateAccessToken = useCallback((token: string) => {
    setAccessToken(token);
  }, []);

  const value: AuthContextType = useMemo(
    () => ({
      user,
      isAuthenticated: !!accessToken && !!user,
      isLoading,
      accessToken,
      login,
      register,
      logout,
      refreshToken,
      updateAccessToken,
    }),
    [user, accessToken, isLoading, login, register, logout, refreshToken, updateAccessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to get current user
 */
export function useUser() {
  const { user, isLoading } = useAuth();
  return { user, isLoading };
}

/**
 * Hook to check permissions
 */
export function usePermission() {
  const { user } = useAuth();

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!user || !user.permissions) return false;
      return user.permissions.includes(permission);
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      if (!user || !user.permissions) return false;
      return permissions.some((permission) => user.permissions.includes(permission));
    },
    [user]
  );

  const hasAllPermissions = useCallback(
    (permissions: Permission[]): boolean => {
      if (!user || !user.permissions) return false;
      return permissions.every((permission) => user.permissions.includes(permission));
    },
    [user]
  );

  const hasRole = useCallback(
    (role: string): boolean => {
      if (!user) return false;
      return user.role === role;
    },
    [user]
  );

  const hasAnyRole = useCallback(
    (roles: string[]): boolean => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
  };
}
