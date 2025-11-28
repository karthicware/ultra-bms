package com.ultrabms.dto.settings;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for company logo operations (upload/delete).
 *
 * Story 2.8: Company Profile Settings
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyProfileLogoResponse {

    /**
     * Presigned URL for company logo (valid for limited time)
     */
    private String logoUrl;

    /**
     * Message describing the operation result
     */
    private String message;
}
