package com.ultrabms.service;

import com.ultrabms.dto.tenant.ChangePasswordRequest;
import com.ultrabms.dto.tenant.DashboardResponse;
import com.ultrabms.dto.tenant.TenantProfileResponse;
import com.ultrabms.entity.TenantDocument;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * Service interface for Tenant Portal operations
 * Handles dashboard data, profile management, and document operations for logged-in tenants
 */
public interface TenantPortalService {

    /**
     * Get dashboard data for the authenticated tenant user
     *
     * @param userId The authenticated user's UUID
     * @return Dashboard data with unit info, stats, and quick actions
     */
    DashboardResponse getDashboardData(UUID userId);

    /**
     * Get complete profile data for the authenticated tenant user
     *
     * @param userId The authenticated user's UUID
     * @return Profile data with personal info, lease details, parking, and documents
     */
    TenantProfileResponse getTenantProfile(UUID userId);

    /**
     * Change the tenant user's account password
     *
     * @param userId The authenticated user's UUID
     * @param request Password change request with current and new password
     */
    void changePassword(UUID userId, ChangePasswordRequest request);

    /**
     * Download the tenant's signed lease agreement PDF
     *
     * @param userId The authenticated user's UUID
     * @return File path to the lease document
     */
    String getLeasePdfPath(UUID userId);

    /**
     * Upload a new document to the tenant's repository
     *
     * @param userId The authenticated user's UUID
     * @param file The file to upload
     * @param documentType Optional document type classification
     * @return Created tenant document entity
     */
    TenantDocument uploadDocument(UUID userId, MultipartFile file, String documentType);

    /**
     * Get document file path for download
     *
     * @param userId The authenticated user's UUID
     * @param documentId The document UUID to download
     * @return File path to the document
     */
    String getDocumentPath(UUID userId, UUID documentId);

    /**
     * Get Mulkiya document path if available
     *
     * @param userId The authenticated user's UUID
     * @return File path to Mulkiya document or null if not available
     */
    String getMulkiyaPath(UUID userId);

    /**
     * Update language preference for the tenant
     *
     * @param userId The authenticated user's UUID
     * @param language Language code ('en' or 'ar')
     */
    void updateLanguagePreference(UUID userId, String language);
}
