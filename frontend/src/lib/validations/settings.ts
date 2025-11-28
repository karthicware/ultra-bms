/**
 * Settings Validation Schemas
 * Zod schemas for settings forms
 * Story 2.7: Admin Theme Settings & System Theme Support
 */

import { z } from 'zod';
import { ThemePreference } from '@/types/settings';

/**
 * Valid theme preference values
 */
const themePreferenceValues = ['SYSTEM', 'LIGHT', 'DARK'] as const;

/**
 * Appearance settings validation schema
 */
export const appearanceSettingsSchema = z.object({
  themePreference: z.enum(themePreferenceValues, {
    message: 'Invalid theme preference. Must be SYSTEM, LIGHT, or DARK.',
  }),
});

export type AppearanceSettingsFormData = z.infer<typeof appearanceSettingsSchema>;

/**
 * Convert form data to API request format
 */
export function toAppearanceSettingsRequest(data: AppearanceSettingsFormData) {
  return {
    themePreference: data.themePreference as ThemePreference,
  };
}
