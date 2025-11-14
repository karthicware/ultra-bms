/**
 * Authentication and User Types
 * Defines all types related to user authentication, authorization, and session management
 */

// ===========================
// User and Profile Types
// ===========================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  createdAt: string;
  phone?: string;
}

export interface UserProfile extends User {
  lastLogin?: string;
  isActive: boolean;
}

// ===========================
// Authentication State
// ===========================

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateAccessToken: (token: string) => void;
}

// ===========================
// API Request Types
// ===========================

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  termsAccepted: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ===========================
// API Response Types
// ===========================

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
    sessionId: string;
  };
  timestamp: string;
}

export interface RegisterResponse {
  success: boolean;
  data: {
    user: Omit<User, 'permissions'>;
    message: string;
  };
  timestamp: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    accessToken: string;
  };
  timestamp: string;
}

export interface ValidateTokenResponse {
  success: boolean;
  data: {
    valid: boolean;
    message?: string;
  };
  timestamp: string;
}

// ===========================
// Session Management Types
// ===========================

export interface SessionDto {
  sessionId: string;
  deviceType: string;
  browser: string;
  ipAddress: string;
  location?: string;
  lastActivityAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface ActiveSessionsResponse {
  success: boolean;
  data: {
    sessions: SessionDto[];
  };
  timestamp: string;
}

// ===========================
// Error Types
// ===========================

export interface AuthError {
  success: false;
  error: {
    code: string;
    message: string;
    field?: string;
  };
  timestamp: string;
}

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_ALREADY_EXISTS'
  | 'ACCOUNT_LOCKED'
  | 'EMAIL_NOT_VERIFIED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'ACCESS_TOKEN_EXPIRED'
  | 'REFRESH_TOKEN_EXPIRED'
  | 'SESSION_EXPIRED_IDLE'
  | 'SESSION_EXPIRED_ABSOLUTE'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'PASSWORD_TOO_WEAK'
  | 'PASSWORD_MISMATCH';

// ===========================
// Permission Types
// ===========================

export type Permission = string;

export interface PermissionCheck {
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
}

// ===========================
// Password Strength Types
// ===========================

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4; // weak, fair, good, strong, very strong
  feedback: {
    warning?: string;
    suggestions?: string[];
  };
  crackTimeDisplay: string;
}

export interface PasswordRequirement {
  id: string;
  label: string;
  regex: RegExp;
  met: boolean;
}

// ===========================
// Form State Types
// ===========================

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  termsAccepted: boolean;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
