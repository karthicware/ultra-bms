package com.ultrabms.service;

import com.ultrabms.dto.settings.AppearanceSettingsRequest;
import com.ultrabms.dto.settings.AppearanceSettingsResponse;

import java.util.UUID;

/**
 * Service interface for user settings management.
 * Story 2.7: Admin Theme Settings & System Theme Support
 */
public interface SettingsService {

    /**
     * Get the appearance settings for a user.
     *
     * @param userId the user's UUID
     * @return current appearance settings
     */
    AppearanceSettingsResponse getAppearanceSettings(UUID userId);

    /**
     * Update the appearance settings for a user.
     *
     * @param userId the user's UUID
     * @param request the new appearance settings
     * @return updated appearance settings
     */
    AppearanceSettingsResponse updateAppearanceSettings(UUID userId, AppearanceSettingsRequest request);
}
