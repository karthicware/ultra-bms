import { apiClient } from './api';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  remainingMinutes: number;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Request password reset email for given email address
 */
export const requestPasswordReset = async (
  email: string
): Promise<ForgotPasswordResponse> => {
  const response = await apiClient.post<ForgotPasswordResponse>(
    '/v1/auth/forgot-password',
    { email }
  );
  return response.data;
};

/**
 * Validate password reset token
 */
export const validateResetToken = async (
  token: string
): Promise<ValidateTokenResponse> => {
  const response = await apiClient.get<ValidateTokenResponse>(
    `/v1/auth/reset-password/validate`,
    { params: { token } }
  );
  return response.data;
};

/**
 * Complete password reset with new password
 */
export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<ResetPasswordResponse> => {
  const response = await apiClient.post<ResetPasswordResponse>(
    '/v1/auth/reset-password',
    { token, newPassword }
  );
  return response.data;
};
