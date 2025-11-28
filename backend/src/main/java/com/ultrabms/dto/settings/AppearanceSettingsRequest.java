package com.ultrabms.dto.settings;

import com.ultrabms.entity.enums.ThemePreference;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating user appearance settings.
 * Story 2.7: Admin Theme Settings & System Theme Support
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppearanceSettingsRequest {

    @NotNull(message = "Theme preference is required")
    private ThemePreference themePreference;
}
