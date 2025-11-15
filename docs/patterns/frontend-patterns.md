# Frontend Patterns - Ultra BMS

**Source:** Epic 2 (Authentication & User Management)
**Version:** 1.0
**Last Updated:** November 15, 2025
**Status:** ✅ Production-Ready Patterns

---

## Overview

This document captures proven patterns from Epic 2 that should be reused throughout the Ultra BMS frontend. These patterns have been battle-tested and follow React/Next.js best practices.

---

## Table of Contents

1. [Authentication Context Pattern](#1-authentication-context-pattern)
2. [Axios Interceptors for Token Refresh](#2-axios-interceptors-for-token-refresh)
3. [Zod Validation Schemas](#3-zod-validation-schemas)
4. [Dual-Layer Route Protection](#4-dual-layer-route-protection)
5. [Form Structure with React Hook Form](#5-form-structure-with-react-hook-form)
6. [Error Handling Pattern](#6-error-handling-pattern)
7. [API Client Structure](#7-api-client-structure)
8. [Custom Hooks Pattern](#8-custom-hooks-pattern)
9. [Protected Component Wrapper](#9-protected-component-wrapper)
10. [JWT Token Management](#10-jwt-token-management)

---

## 1. Authentication Context Pattern

**Purpose:** Centralized state management for authentication with custom hooks

**Location:** `frontend/src/contexts/AuthContext.tsx`

### Pattern Structure

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  async function initializeAuth() {
    try {
      setIsLoading(true);
      const userData = await apiClient.get('/auth/me');
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', { email, password });
    setUser(response.user);
  }

  async function logout() {
    await apiClient.post('/auth/logout');
    setUser(null);
  }

  async function refreshToken() {
    const response = await apiClient.post('/auth/refresh');
    setUser(response.user);
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Usage

```typescript
// In app layout
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

// In any component
import { useAuth } from '@/contexts/AuthContext';

export function Dashboard() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Key Benefits
- ✅ Single source of truth for auth state
- ✅ Automatic initialization on app load
- ✅ Type-safe with TypeScript
- ✅ Easy to test and mock

### When to Use This Pattern
- Any global state that needs to be accessed across multiple components
- User data, theme, language preferences, tenant context, etc.

---

## 2. Axios Interceptors for Token Refresh

**Purpose:** Automatically refresh expired tokens and retry failed requests

**Location:** `frontend/src/lib/api-client.ts`

### Pattern Structure

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  withCredentials: true, // Important for HTTP-only cookies
});

// Flag to prevent multiple concurrent refresh attempts
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

// Response interceptor for handling 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for token refresh to complete
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = response.data.accessToken;

        // Notify all waiting requests
        onRefreshed(newToken);

        // Retry original request
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Request interceptor for adding CSRF token
apiClient.interceptors.request.use((config) => {
  // Add CSRF token from cookie
  const csrfToken = getCookie('XSRF-TOKEN');
  if (csrfToken) {
    config.headers['X-XSRF-TOKEN'] = csrfToken;
  }
  return config;
});

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export default apiClient;
```

### Usage

```typescript
import apiClient from '@/lib/api-client';

// Use like regular axios
const data = await apiClient.get('/tenants');
const newTenant = await apiClient.post('/tenants', tenantData);
```

### Key Benefits
- ✅ Automatic token refresh on 401 errors
- ✅ Prevents multiple concurrent refresh requests
- ✅ Queues requests during refresh
- ✅ CSRF protection built-in
- ✅ Transparent to calling code

### When to Use This Pattern
- Any API client that needs authentication
- Services that require automatic token refresh
- Multi-step async operations that might encounter token expiry

---

## 3. Zod Validation Schemas

**Purpose:** Type-safe form validation with client-side error messages

**Location:** `frontend/src/lib/validations/*`

### Pattern Structure

```typescript
import { z } from 'zod';

// Define schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),

  rememberMe: z.boolean().optional(),
});

// Infer TypeScript type from schema
export type LoginFormData = z.infer<typeof loginSchema>;

// Reusable field schemas
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password is too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain uppercase, lowercase, and number'
  );

// Password confirmation schema
export const passwordConfirmSchema = (passwordField: string = 'password') =>
  z.object({
    [passwordField]: passwordSchema,
    confirmPassword: z.string(),
  }).refine((data) => data[passwordField] === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Complex tenant schema
export const tenantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: emailSchema,
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  propertyId: z.string().uuid('Invalid property ID'),
  leaseStart: z.date(),
  leaseEnd: z.date(),
  monthlyRent: z.number().positive('Rent must be positive'),
}).refine((data) => data.leaseEnd > data.leaseStart, {
  message: 'Lease end date must be after start date',
  path: ['leaseEnd'],
});

export type TenantFormData = z.infer<typeof tenantSchema>;
```

### Usage with React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';

export function LoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  async function onSubmit(data: LoginFormData) {
    try {
      await login(data);
    } catch (error) {
      form.setError('root', {
        message: 'Invalid credentials',
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input
        {...form.register('email')}
        data-testid="input-email"
      />
      {form.formState.errors.email && (
        <span data-testid="error-email">
          {form.formState.errors.email.message}
        </span>
      )}

      {/* ... other fields */}

      <button data-testid="btn-submit" type="submit">
        Login
      </button>
    </form>
  );
}
```

### Key Benefits
- ✅ Type-safe validation
- ✅ Reusable schemas
- ✅ Clear error messages
- ✅ Client-side validation before API call
- ✅ TypeScript types inferred from schema

### When to Use This Pattern
- **All forms** with user input
- API request/response validation
- URL parameter validation
- Environment variable validation

---

## 4. Dual-Layer Route Protection

**Purpose:** Defense in depth for securing routes

### Layer 1: Middleware (Server-Side)

**Location:** `frontend/src/middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken');
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/forgot-password', '/'];

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect unauthenticated users to login
  if (!accessToken && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (accessToken && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### Layer 2: Component Wrapper (Client-Side)

**Location:** `frontend/src/components/auth/ProtectedRoute.tsx`

```typescript
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
}

export function ProtectedRoute({
  children,
  requiredRoles = [],
  requiredPermissions = [],
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=${pathname}`);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Show loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Check role-based access
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some((role) =>
      user?.roles.includes(role)
    );

    if (!hasRequiredRole) {
      return <div>Access Denied: Insufficient permissions</div>;
    }
  }

  // Check permission-based access
  if (requiredPermissions.length > 0) {
    const hasRequiredPermission = requiredPermissions.every((permission) =>
      user?.permissions.includes(permission)
    );

    if (!hasRequiredPermission) {
      return <div>Access Denied: Insufficient permissions</div>;
    }
  }

  return <>{children}</>;
}
```

### Usage

```typescript
// In page component
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function TenantManagementPage() {
  return (
    <ProtectedRoute
      requiredRoles={['PROPERTY_MANAGER', 'ADMIN']}
      requiredPermissions={['VIEW_TENANTS']}
    >
      <TenantManagementContent />
    </ProtectedRoute>
  );
}
```

### Key Benefits
- ✅ **Defense in depth** - two layers of protection
- ✅ **Server-side protection** prevents unauthorized page loads
- ✅ **Client-side validation** provides better UX
- ✅ **Role and permission support** for fine-grained access control

---

## 5. Form Structure with React Hook Form

**Purpose:** Consistent form handling across the application

### Pattern Structure

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface FormProps {
  onSuccess?: () => void;
  defaultValues?: Partial<FormData>;
}

export function MyForm({ onSuccess, defaultValues }: FormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      name: '',
      email: '',
    },
  });

  async function onSubmit(data: FormData) {
    try {
      await apiClient.post('/endpoint', data);
      toast.success('Success!');
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast.error('An error occurred');
      form.setError('root', {
        message: error.message,
      });
    }
  }

  return (
    <form
      data-testid="form-my-form"
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
    >
      {/* Field with label and error */}
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          data-testid="input-name"
          {...form.register('name')}
          aria-invalid={!!form.formState.errors.name}
        />
        {form.formState.errors.name && (
          <p data-testid="error-name" className="text-sm text-red-600">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      {/* Root error (e.g., API error) */}
      {form.formState.errors.root && (
        <div data-testid="error-root" className="text-red-600">
          {form.formState.errors.root.message}
        </div>
      )}

      {/* Submit button with loading state */}
      <Button
        data-testid="btn-submit"
        type="submit"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  );
}
```

### Key Benefits
- ✅ Validation before submission
- ✅ Loading states handled automatically
- ✅ Error display pattern consistent
- ✅ Accessible form fields
- ✅ Test IDs for E2E testing

---

## 6. Error Handling Pattern

**Purpose:** Consistent error handling across the application

### Pattern Structure

```typescript
// Error types
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Error handler utility
export function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const statusCode = error.response?.status || 500;
    const message = error.response?.data?.message || 'An error occurred';
    const details = error.response?.data?.details;

    throw new ApiError(statusCode, message, details);
  }

  if (error instanceof Error) {
    throw new ApiError(500, error.message);
  }

  throw new ApiError(500, 'Unknown error occurred');
}

// Usage in components
async function handleSubmit(data: FormData) {
  try {
    await apiClient.post('/endpoint', data);
    toast.success('Success!');
  } catch (error) {
    const apiError = handleApiError(error);

    // Display user-friendly error
    if (apiError.statusCode === 400) {
      toast.error(apiError.message);
    } else if (apiError.statusCode === 401) {
      toast.error('Session expired. Please login again.');
      router.push('/login');
    } else {
      toast.error('An unexpected error occurred. Please try again.');
    }
  }
}
```

---

## 7. API Client Structure

**Purpose:** Type-safe API calls with consistent error handling

### Pattern Structure

```typescript
// services/auth.service.ts
import apiClient from '@/lib/api-client';
import { handleApiError } from '@/lib/errors';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/auth/me');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
```

---

## 8. Custom Hooks Pattern

**Purpose:** Reusable logic extraction

### Common Custom Hooks

```typescript
// hooks/usePermission.ts
import { useAuth } from '@/contexts/AuthContext';

export function usePermission(permission: string): boolean {
  const { user } = useAuth();
  return user?.permissions.includes(permission) ?? false;
}

// hooks/useRole.ts
export function useRole(role: string): boolean {
  const { user } = useAuth();
  return user?.roles.includes(role) ?? false;
}

// hooks/useUser.ts
export function useUser() {
  const { user, isLoading } = useAuth();
  return { user, isLoading };
}

// Usage
function TenantActions() {
  const canEditTenants = usePermission('EDIT_TENANT');
  const canDeleteTenants = usePermission('DELETE_TENANT');

  return (
    <div>
      {canEditTenants && <button>Edit</button>}
      {canDeleteTenants && <button>Delete</button>}
    </div>
  );
}
```

---

## Quick Reference

| Pattern | Use When | Location Example |
|---------|----------|------------------|
| Context + Hooks | Global state needed | `contexts/AuthContext.tsx` |
| Axios Interceptors | API needs auth | `lib/api-client.ts` |
| Zod Schemas | Form validation | `lib/validations/auth.ts` |
| Protected Route | Secure pages | `components/auth/ProtectedRoute.tsx` |
| React Hook Form | User input forms | All form components |
| API Service | Backend calls | `services/auth.service.ts` |
| Custom Hooks | Reusable logic | `hooks/usePermission.ts` |

---

**For Epic 3:** Apply these patterns to Tenant Management, adapting as needed!
