package com.ultrabms.controller;

import com.ultrabms.dto.user.AvatarUploadResponse;
import com.ultrabms.dto.user.UserProfileResponse;
import com.ultrabms.dto.user.UserProfileUpdateRequest;
import com.ultrabms.entity.User;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.UserProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for user profile management.
 * Allows authenticated users to view and customize their own profile.
 *
 * All endpoints operate on the current authenticated user's profile only.
 * Users cannot access or modify other users' profiles via these endpoints.
 *
 * RBAC: All authenticated staff users (not TENANT) can access these endpoints.
 *
 * Story 2.9: User Profile Customization
 */
@RestController
@RequestMapping("/api/v1/users/me")
@Tag(name = "User Profile", description = "User profile management (current user only)")
public class UserProfileController {

    private static final Logger LOGGER = LoggerFactory.getLogger(UserProfileController.class);

    private final UserProfileService userProfileService;
    private final UserRepository userRepository;

    public UserProfileController(UserProfileService userProfileService, UserRepository userRepository) {
        this.userProfileService = userProfileService;
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
     * Get current user's profile.
     * GET /api/v1/users/me/profile
     *
     * Access: All authenticated staff users (SUPER_ADMIN, ADMIN, PROPERTY_MANAGER, FINANCE_MANAGER, MAINTENANCE_SUPERVISOR)
     *
     * @param userDetails the authenticated user details
     * @return user profile data with presigned avatar URL
     */
    @GetMapping("/profile")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'FINANCE_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
        summary = "Get current user profile",
        description = "Retrieve the authenticated user's profile including display name, avatar URL, and contact info."
    )
    public ResponseEntity<Map<String, Object>> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = getCurrentUserId(userDetails);
        LOGGER.debug("Getting profile for user: {}", userId);

        UserProfileResponse profile = userProfileService.getProfile(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", profile);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Update current user's profile.
     * PUT /api/v1/users/me/profile
     *
     * Access: All authenticated staff users (SUPER_ADMIN, ADMIN, PROPERTY_MANAGER, FINANCE_MANAGER, MAINTENANCE_SUPERVISOR)
     *
     * @param request the profile update data (displayName, contactPhone)
     * @param userDetails the authenticated user details
     * @return updated user profile
     */
    @PutMapping("/profile")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'FINANCE_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
        summary = "Update current user profile",
        description = "Update display name and/or contact phone for the authenticated user."
    )
    public ResponseEntity<Map<String, Object>> updateProfile(
            @Valid @RequestBody UserProfileUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getCurrentUserId(userDetails);
        LOGGER.debug("Updating profile for user: {}", userId);

        UserProfileResponse profile = userProfileService.updateProfile(userId, request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", profile);
        response.put("message", "Profile updated successfully");
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Upload avatar for current user.
     * POST /api/v1/users/me/avatar
     *
     * Access: All authenticated staff users (SUPER_ADMIN, ADMIN, PROPERTY_MANAGER, FINANCE_MANAGER, MAINTENANCE_SUPERVISOR)
     *
     * @param file the avatar file (PNG/JPG, max 2MB)
     * @param userDetails the authenticated user details
     * @return presigned URL for the uploaded avatar
     */
    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'FINANCE_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
        summary = "Upload user avatar",
        description = "Upload a new profile photo. Accepts PNG/JPG, max 2MB. Deletes existing avatar if present."
    )
    public ResponseEntity<Map<String, Object>> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getCurrentUserId(userDetails);
        LOGGER.debug("Uploading avatar for user: {}", userId);

        AvatarUploadResponse avatarResponse = userProfileService.uploadAvatar(userId, file);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", avatarResponse);
        response.put("message", "Avatar uploaded successfully");
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Delete avatar for current user.
     * DELETE /api/v1/users/me/avatar
     *
     * Access: All authenticated staff users (SUPER_ADMIN, ADMIN, PROPERTY_MANAGER, FINANCE_MANAGER, MAINTENANCE_SUPERVISOR)
     *
     * @param userDetails the authenticated user details
     * @return 204 No Content on success
     */
    @DeleteMapping("/avatar")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'FINANCE_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
        summary = "Delete user avatar",
        description = "Remove avatar from S3 and clear avatar path. UI will show initials fallback."
    )
    public ResponseEntity<Void> deleteAvatar(@AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = getCurrentUserId(userDetails);
        LOGGER.debug("Deleting avatar for user: {}", userId);

        userProfileService.deleteAvatar(userId);

        return ResponseEntity.noContent().build();
    }
}
