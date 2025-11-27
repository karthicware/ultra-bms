/**
 * Authentication API Service
 * All authentication-related API calls
 */

import { apiClient } from './api';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  ValidateTokenResponse,
  ActiveSessionsResponse,
  RefreshTokenResponse,
  ApiResponse,
} from '@/types';

const AUTH_BASE_PATH = '/v1/auth';

/**
 * Login with email and password
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(`${AUTH_BASE_PATH}/login`, credentials);
  return response.data;
}

/**
 * Register a new user
 */
export async function register(userData: RegisterRequest): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>(`${AUTH_BASE_PATH}/register`, userData);
  return response.data;
}

/**
 * Request password reset
 */
export async function forgotPassword(
  data: ForgotPasswordRequest
): Promise<ApiResponse<{ message: string }>> {
  const response = await apiClient.post<ApiResponse<{ message: string }>>(
    `${AUTH_BASE_PATH}/forgot-password`,
    data
  );
  return response.data;
}

/**
 * Validate password reset token
 */
export async function validateResetToken(token: string): Promise<ValidateTokenResponse> {
  const response = await apiClient.get<ValidateTokenResponse>(
    `${AUTH_BASE_PATH}/reset-password/validate`,
    {
      params: { token },
    }
  );
  return response.data;
}

/**
 * Reset password with token
 */
export async function resetPassword(
  data: ResetPasswordRequest
): Promise<ApiResponse<{ message: string }>> {
  const response = await apiClient.post<ApiResponse<{ message: string }>>(
    `${AUTH_BASE_PATH}/reset-password`,
    data
  );
  return response.data;
}

/**
 * Change password (authenticated user)
 */
export async function changePassword(
  data: ChangePasswordRequest
): Promise<ApiResponse<{ message: string }>> {
  const response = await apiClient.post<ApiResponse<{ message: string }>>(
    `${AUTH_BASE_PATH}/change-password`,
    data
  );
  return response.data;
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(): Promise<RefreshTokenResponse> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}${AUTH_BASE_PATH}/refresh`,
    {
      method: 'POST',
      credentials: 'include', // Send refresh token cookie
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  // Backend returns TokenResponse directly { accessToken: string }
  // Wrap it in the expected RefreshTokenResponse format
  const tokenData = await response.json();
  return {
    success: true,
    data: {
      accessToken: tokenData.accessToken,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Logout current session
 */
export async function logout(): Promise<void> {
  await apiClient.post(`${AUTH_BASE_PATH}/logout`);
}

/**
 * Logout all sessions (all devices)
 */
export async function logoutAllDevices(): Promise<ApiResponse<{ message: string }>> {
  const response = await apiClient.post<ApiResponse<{ message: string }>>(
    `${AUTH_BASE_PATH}/logout-all`
  );
  return response.data;
}

const SESSIONS_BASE_PATH = '/v1/sessions';

/**
 * Get all active sessions for current user
 */
export async function getActiveSessions(): Promise<ActiveSessionsResponse> {
  const response = await apiClient.get<ActiveSessionsResponse>(SESSIONS_BASE_PATH);
  return response.data;
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: string): Promise<ApiResponse<{ message: string }>> {
  const response = await apiClient.delete<ApiResponse<{ message: string }>>(
    `${SESSIONS_BASE_PATH}/${sessionId}`
  );
  return response.data;
}
