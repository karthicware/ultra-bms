package com.ultrabms.controller;

import com.ultrabms.dto.settings.AppearanceSettingsRequest;
import com.ultrabms.dto.settings.AppearanceSettingsResponse;
import com.ultrabms.entity.User;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.SettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for user settings management.
 * Story 2.7: Admin Theme Settings & System Theme Support
 *
 * All endpoints require authentication but no specific role -
 * any authenticated user can manage their own settings.
 */
@RestController
@RequestMapping("/api/v1/settings")
@Tag(name = "Settings", description = "User settings management")
@PreAuthorize("isAuthenticated()")
public class SettingsController {

    private static final Logger LOGGER = LoggerFactory.getLogger(SettingsController.class);

    private final SettingsService settingsService;
    private final UserRepository userRepository;

    public SettingsController(SettingsService settingsService, UserRepository userRepository) {
        this.settingsService = settingsService;
        this.userRepository = userRepository;
    }

    /**
     * Get current user's UUID from UserDetails.
     */
    private UUID getCurrentUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found in database"));
    }

    /**
     * Get the current user's appearance settings.
     * GET /api/v1/settings/appearance
     *
     * @param userDetails the authenticated user details
     * @return current appearance settings
     */
    @GetMapping("/appearance")
    @Operation(
        summary = "Get appearance settings",
        description = "Retrieve the current user's appearance settings including theme preference"
    )
    public ResponseEntity<Map<String, Object>> getAppearanceSettings(@AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = getCurrentUserId(userDetails);
        LOGGER.debug("Getting appearance settings for user: {}", userId);

        AppearanceSettingsResponse settings = settingsService.getAppearanceSettings(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", settings);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Update the current user's appearance settings.
     * PUT /api/v1/settings/appearance
     *
     * @param request the new appearance settings
     * @param userDetails the authenticated user details
     * @return updated appearance settings
     */
    @PutMapping("/appearance")
    @Operation(
        summary = "Update appearance settings",
        description = "Update the current user's appearance settings including theme preference"
    )
    public ResponseEntity<Map<String, Object>> updateAppearanceSettings(
            @Valid @RequestBody AppearanceSettingsRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getCurrentUserId(userDetails);
        LOGGER.debug("Updating appearance settings for user: {}", userId);

        AppearanceSettingsResponse settings = settingsService.updateAppearanceSettings(userId, request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", settings);
        response.put("message", "Appearance settings updated successfully");
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }
}
