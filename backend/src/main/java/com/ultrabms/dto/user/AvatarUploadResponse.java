package com.ultrabms.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for avatar upload operation.
 *
 * Story 2.9: User Profile Customization
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvatarUploadResponse {

    /**
     * Presigned URL for the uploaded avatar
     */
    private String avatarUrl;

    /**
     * Success message
     */
    private String message;
}
