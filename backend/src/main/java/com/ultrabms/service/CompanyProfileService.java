package com.ultrabms.service;

import com.ultrabms.dto.settings.CompanyProfileLogoResponse;
import com.ultrabms.dto.settings.CompanyProfileRequest;
import com.ultrabms.dto.settings.CompanyProfileResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;
import java.util.UUID;

/**
 * Service interface for company profile management.
 * Single-record design - only one company profile allowed in the system.
 *
 * Story 2.8: Company Profile Settings
 */
public interface CompanyProfileService {

    /**
     * Get the company profile.
     *
     * @return Optional containing the company profile if exists, empty otherwise
     */
    Optional<CompanyProfileResponse> getCompanyProfile();

    /**
     * Create or update the company profile (upsert).
     * Creates if no profile exists, updates if profile exists.
     *
     * @param request the company profile data
     * @param userId the ID of the user making the change
     * @return the saved company profile
     */
    CompanyProfileResponse saveCompanyProfile(CompanyProfileRequest request, UUID userId);

    /**
     * Upload company logo.
     * Validates file type (PNG/JPG) and size (max 2MB).
     * Deletes existing logo if present.
     *
     * @param file the logo file to upload
     * @param userId the ID of the user making the change
     * @return response with the presigned URL for the uploaded logo
     */
    CompanyProfileLogoResponse uploadLogo(MultipartFile file, UUID userId);

    /**
     * Delete company logo from S3 and clear logoFilePath in profile.
     *
     * @param userId the ID of the user making the change
     */
    void deleteLogo(UUID userId);

    /**
     * Check if a company profile exists.
     *
     * @return true if profile exists, false otherwise
     */
    boolean profileExists();
}
