/**
 * JWT Token Utilities
 * Functions for working with JWT tokens
 */

import { jwtDecode } from 'jwt-decode';
import type { User } from '@/types/auth';

interface JWTPayload {
  sub: string; // userId
  email: string;
  role: string;
  permissions: string[];
  firstName?: string;
  lastName?: string;
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
}

/**
 * Decode JWT token and extract payload
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwtDecode<JWTPayload>(token);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Extract user information from JWT token
 */
export function getUserFromToken(token: string): User | null {
  const payload = decodeToken(token);
  if (!payload) return null;

  return {
    id: payload.sub,
    email: payload.email,
    firstName: payload.firstName || '',
    lastName: payload.lastName || '',
    role: payload.role,
    permissions: payload.permissions || [],
    createdAt: new Date(payload.iat * 1000).toISOString(),
  };
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;

  // Check if token expires in the next 5 seconds (buffer for network delay)
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  const bufferTime = 5000; // 5 seconds

  return currentTime + bufferTime >= expirationTime;
}

/**
 * Get time until token expiration in milliseconds
 */
export function getTimeUntilExpiration(token: string): number {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return 0;

  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();

  return Math.max(0, expirationTime - currentTime);
}

/**
 * Get formatted expiration time
 */
export function getExpirationDisplay(token: string): string {
  const timeRemaining = getTimeUntilExpiration(token);
  if (timeRemaining === 0) return 'Expired';

  const minutes = Math.floor(timeRemaining / 60000);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
}
