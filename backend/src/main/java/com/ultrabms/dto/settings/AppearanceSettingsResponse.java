package com.ultrabms.dto.settings;

import com.ultrabms.entity.enums.ThemePreference;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for user appearance settings.
 * Story 2.7: Admin Theme Settings & System Theme Support
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppearanceSettingsResponse {

    private ThemePreference themePreference;
}
