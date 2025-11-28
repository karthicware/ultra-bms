/**
 * Settings API Service
 * Story 2.7: Admin Theme Settings & System Theme Support
 *
 * All settings management API calls with comprehensive JSDoc documentation
 */

import { apiClient } from '@/lib/api';
import type {
  AppearanceSettingsResponse,
  AppearanceSettingsRequest,
  AppearanceSettingsApiResponse,
} from '@/types/settings';

const SETTINGS_BASE_PATH = '/v1/settings';

// ============================================================================
// GET APPEARANCE SETTINGS
// ============================================================================

/**
 * Get the current user's appearance settings
 *
 * @returns Promise that resolves to AppearanceSettingsResponse
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const settings = await getAppearanceSettings();
 * console.log(settings.themePreference); // "SYSTEM"
 * ```
 */
export async function getAppearanceSettings(): Promise<AppearanceSettingsResponse> {
  const response = await apiClient.get<AppearanceSettingsApiResponse>(
    `${SETTINGS_BASE_PATH}/appearance`
  );
  return response.data.data;
}

// ============================================================================
// UPDATE APPEARANCE SETTINGS
// ============================================================================

/**
 * Update the current user's appearance settings
 *
 * @param request - The new appearance settings
 *
 * @returns Promise that resolves to updated AppearanceSettingsResponse
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ValidationException} When request body fails validation (400)
 *
 * @example
 * ```typescript
 * const updated = await updateAppearanceSettings({
 *   themePreference: ThemePreference.DARK
 * });
 * console.log(updated.themePreference); // "DARK"
 * ```
 */
export async function updateAppearanceSettings(
  request: AppearanceSettingsRequest
): Promise<AppearanceSettingsResponse> {
  const response = await apiClient.put<AppearanceSettingsApiResponse>(
    `${SETTINGS_BASE_PATH}/appearance`,
    request
  );
  return response.data.data;
}
