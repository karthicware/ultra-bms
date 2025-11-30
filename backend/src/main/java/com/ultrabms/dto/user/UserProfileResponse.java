package com.ultrabms.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Response DTO for user profile data.
 * Includes profile fields plus presigned URL for avatar.
 *
 * Story 2.9: User Profile Customization
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    /**
     * User UUID
     */
    private UUID id;

    /**
     * User's email address (read-only)
     */
    private String email;

    /**
     * User's first name
     */
    private String firstName;

    /**
     * User's last name
     */
    private String lastName;

    /**
     * User's customizable display name (may be null)
     */
    private String displayName;

    /**
     * Presigned URL for avatar (valid for limited time, null if no avatar)
     */
    private String avatarUrl;

    /**
     * Optional personal contact phone
     */
    private String contactPhone;

    /**
     * User's role name (read-only)
     */
    private String role;
}
