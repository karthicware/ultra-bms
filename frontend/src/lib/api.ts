import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies (for refresh token and CSRF)
});

// CSRF token management
let csrfToken: string | null = null;

export function setCSRFToken(token: string) {
  csrfToken = token;
}

export function getCSRFToken(): string | null {
  return csrfToken;
}

// Token refresh state
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// Function to get access token from auth context (will be set by context)
export let getAccessToken: (() => string | null) | null = null;
export let setAccessToken: ((token: string) => void) | null = null;
export let handleLogout: (() => void) | null = null;

export function setupAuthInterceptors(
  getToken: () => string | null,
  setToken: (token: string) => void,
  logout: () => void
) {
  getAccessToken = getToken;
  setAccessToken = setToken;
  handleLogout = logout;
}

// Request interceptor - Add Authorization and CSRF headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add Authorization header if token exists
    const token = getAccessToken?.();
    console.log('[API Interceptor] Request to:', config.url, 'Token:', token ? `${token.substring(0, 20)}...` : 'null');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token for state-changing operations (POST, PUT, DELETE, PATCH)
    const isStateChangingMethod =
      config.method && ['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase());
    if (isStateChangingMethod && csrfToken && config.headers) {
      config.headers['X-XSRF-TOKEN'] = csrfToken;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and CSRF token extraction
apiClient.interceptors.response.use(
  (response) => {
    // Extract CSRF token from response headers if present
    const csrfTokenFromHeader = response.headers['x-xsrf-token'];
    if (csrfTokenFromHeader) {
      setCSRFToken(csrfTokenFromHeader);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Check if error is 401 and token refresh hasn't been attempted
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for token refresh to complete
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh token endpoint (refresh token is in HTTP-only cookie)
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/v1/auth/refresh`,
          {
            method: 'POST',
            credentials: 'include', // Send cookies (refresh token)
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const data = await response.json();
        const newAccessToken = data.accessToken;

        // Update access token in auth context
        if (setAccessToken) {
          setAccessToken(newAccessToken);
        }

        // Retry all pending requests with new token
        onRefreshed(newAccessToken);
        isRefreshing = false;

        // Retry original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        isRefreshing = false;
        refreshSubscribers = [];

        if (handleLogout) {
          handleLogout();
        }

        return Promise.reject(refreshError);
      }
    }

    // Global error handling
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
