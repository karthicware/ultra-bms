/**
 * Users Service
 * Handles API calls related to user management
 */

import { apiClient } from '@/lib/api';

const USERS_BASE_PATH = '/v1/users';

export interface PropertyManager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
}

export interface GetPropertyManagersResponse {
  content: PropertyManager[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/**
 * Get all property managers
 * Fetches users with PROPERTY_MANAGER role
 *
 * @returns List of property managers
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const managers = await getPropertyManagers();
 * console.log(managers.content); // Array of managers
 * ```
 */
export async function getPropertyManagers(): Promise<GetPropertyManagersResponse> {
  const response = await apiClient.get<GetPropertyManagersResponse>(
    `${USERS_BASE_PATH}?role=PROPERTY_MANAGER&page=0&size=100`
  );
  return response;
}
