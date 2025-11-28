package com.ultrabms.dto.settings;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for company profile data.
 * Includes all profile fields plus presigned URL for logo.
 *
 * Story 2.8: Company Profile Settings
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyProfileResponse {

    /**
     * Profile UUID
     */
    private UUID id;

    /**
     * Legal company name as registered
     */
    private String legalCompanyName;

    /**
     * Company physical address
     */
    private String companyAddress;

    /**
     * City where company is located
     */
    private String city;

    /**
     * Country where company is registered
     */
    private String country;

    /**
     * UAE Tax Registration Number (TRN)
     */
    private String trn;

    /**
     * Official phone number
     */
    private String phoneNumber;

    /**
     * Official email address
     */
    private String emailAddress;

    /**
     * Presigned URL for company logo (valid for limited time)
     */
    private String logoUrl;

    /**
     * Name of user who last updated this profile
     */
    private String updatedByName;

    /**
     * Timestamp when the profile was last updated
     */
    private LocalDateTime updatedAt;
}
