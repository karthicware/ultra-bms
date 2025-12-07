package com.ultrabms.service;

import com.ultrabms.dto.tenant.CreateTenantRequest;
import com.ultrabms.dto.tenant.CreateTenantResponse;
import com.ultrabms.dto.tenant.TenantResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for Tenant business logic
 */
public interface TenantService {

    /**
     * Create a new tenant with user account creation and document uploads
     *
     * @param request Tenant creation request
     * @param emiratesIdFile Emirates ID file (required unless paths provided)
     * @param passportFile Passport file (required unless paths provided)
     * @param visaFile Visa file (optional)
     * @param signedLeaseFile Signed lease agreement (required)
     * @param mulkiyaFile Mulkiya document (optional)
     * @param additionalFiles Additional documents (optional)
     * @return Create tenant response with tenant ID and message
     */
    CreateTenantResponse createTenant(
            CreateTenantRequest request,
            MultipartFile emiratesIdFile,
            MultipartFile passportFile,
            MultipartFile visaFile,
            MultipartFile signedLeaseFile,
            MultipartFile mulkiyaFile,
            List<MultipartFile> additionalFiles
    );

    /**
     * Create a new tenant with user account creation and document uploads
     * SCP-2025-12-06: Overloaded method to support preloaded document paths from quotation
     *
     * @param request Tenant creation request
     * @param emiratesIdFile Emirates ID file (optional if paths provided)
     * @param passportFile Passport file (optional if paths provided)
     * @param visaFile Visa file (optional)
     * @param signedLeaseFile Signed lease agreement (required)
     * @param mulkiyaFile Mulkiya document (optional)
     * @param additionalFiles Additional documents (optional)
     * @param emiratesIdFrontPath S3 path to Emirates ID front (from quotation)
     * @param emiratesIdBackPath S3 path to Emirates ID back (from quotation)
     * @param passportFrontPath S3 path to passport front (from quotation)
     * @param passportBackPath S3 path to passport back (from quotation)
     * @return Create tenant response with tenant ID and message
     */
    CreateTenantResponse createTenant(
            CreateTenantRequest request,
            MultipartFile emiratesIdFile,
            MultipartFile passportFile,
            MultipartFile visaFile,
            MultipartFile signedLeaseFile,
            MultipartFile mulkiyaFile,
            List<MultipartFile> additionalFiles,
            String emiratesIdFrontPath,
            String emiratesIdBackPath,
            String passportFrontPath,
            String passportBackPath
    );

    /**
     * Get tenant by ID
     *
     * @param id Tenant UUID
     * @return Tenant response
     */
    TenantResponse getTenantById(UUID id);

    /**
     * Get all tenants with pagination
     *
     * @param pageable Pagination info
     * @return Page of tenants
     */
    Page<TenantResponse> getAllTenants(Pageable pageable);

    /**
     * Search tenants by name, email, or tenant number
     *
     * @param searchTerm Search term
     * @param pageable Pagination info
     * @return Page of matching tenants
     */
    Page<TenantResponse> searchTenants(String searchTerm, Pageable pageable);

    /**
     * Check if email is available (not already in use)
     *
     * @param email Email to check
     * @return True if available, false if exists
     */
    boolean isEmailAvailable(String email);

    /**
     * Get tenants by property ID
     *
     * @param propertyId Property UUID
     * @return List of tenant responses
     */
    List<TenantResponse> getTenantsByProperty(UUID propertyId);
}
