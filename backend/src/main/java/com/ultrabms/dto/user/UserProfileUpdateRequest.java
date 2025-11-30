package com.ultrabms.dto.user;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating user profile.
 * Only includes editable fields (displayName, contactPhone).
 *
 * Story 2.9: User Profile Customization
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileUpdateRequest {

    /**
     * User's customizable display name.
     * Max 100 characters. Null or empty to clear.
     */
    @Size(max = 100, message = "Display name must not exceed 100 characters")
    private String displayName;

    /**
     * Optional personal contact phone.
     * Max 30 characters. No format validation (international support).
     */
    @Size(max = 30, message = "Contact phone must not exceed 30 characters")
    private String contactPhone;
}
