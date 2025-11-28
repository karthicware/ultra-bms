/**
 * Settings Types and Interfaces
 * Story 2.7: Admin Theme Settings & System Theme Support
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Theme preference enum
 * Maps to backend ThemePreference enum
 */
export enum ThemePreference {
  SYSTEM = 'SYSTEM',
  LIGHT = 'LIGHT',
  DARK = 'DARK',
}

// ============================================================================
// API INTERFACES
// ============================================================================

/**
 * Appearance settings response from API
 * GET /api/v1/settings/appearance
 */
export interface AppearanceSettingsResponse {
  themePreference: ThemePreference;
}

/**
 * Appearance settings update request
 * PUT /api/v1/settings/appearance
 */
export interface AppearanceSettingsRequest {
  themePreference: ThemePreference;
}

/**
 * API response wrapper
 */
export interface AppearanceSettingsApiResponse {
  success: boolean;
  data: AppearanceSettingsResponse;
  message?: string;
  timestamp: string;
}

// ============================================================================
// UI CONSTANTS
// ============================================================================

/**
 * Theme preference display info
 */
export const THEME_OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  description: string;
  icon: 'Monitor' | 'Sun' | 'Moon';
}> = [
  {
    value: ThemePreference.SYSTEM,
    label: 'System',
    description: 'Follows your operating system preference',
    icon: 'Monitor',
  },
  {
    value: ThemePreference.LIGHT,
    label: 'Light',
    description: 'Always use light theme',
    icon: 'Sun',
  },
  {
    value: ThemePreference.DARK,
    label: 'Dark',
    description: 'Always use dark theme',
    icon: 'Moon',
  },
];

/**
 * Map backend theme preference to next-themes theme value
 */
export function themePreferenceToNextTheme(preference: ThemePreference): string {
  switch (preference) {
    case ThemePreference.LIGHT:
      return 'light';
    case ThemePreference.DARK:
      return 'dark';
    case ThemePreference.SYSTEM:
    default:
      return 'system';
  }
}

/**
 * Map next-themes theme value to backend theme preference
 */
export function nextThemeToThemePreference(theme: string | undefined): ThemePreference {
  switch (theme) {
    case 'light':
      return ThemePreference.LIGHT;
    case 'dark':
      return ThemePreference.DARK;
    case 'system':
    default:
      return ThemePreference.SYSTEM;
  }
}
