'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setupAuthInterceptors } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => Promise<void>;
  updateAccessToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();

  // Setup API interceptors on mount
  useEffect(() => {
    setupAuthInterceptors(
      () => accessToken,
      (token: string) => setAccessToken(token),
      async () => {
        setAccessToken(null);
        setUser(null);
        router.push('/login');
      }
    );
  }, [accessToken, router]);

  const login = useCallback((token: string, refreshToken: string, userData: User) => {
    setAccessToken(token);
    setUser(userData);
    // Refresh token is stored in HTTP-only cookie by backend
  }, []);

  const logout = useCallback(async () => {
    try {
      // Call logout endpoint (will clear cookie)
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include', // Send cookies
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call success
      setAccessToken(null);
      setUser(null);
      router.push('/login');
    }
  }, [accessToken, router]);

  const updateAccessToken = useCallback((token: string) => {
    setAccessToken(token);
  }, []);

  const value: AuthContextType = {
    user,
    accessToken,
    isAuthenticated: !!accessToken && !!user,
    login,
    logout,
    updateAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
