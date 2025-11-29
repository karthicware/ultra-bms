package com.ultrabms.controller;

import com.ultrabms.dto.settings.CompanyProfileLogoResponse;
import com.ultrabms.dto.settings.CompanyProfileRequest;
import com.ultrabms.dto.settings.CompanyProfileResponse;
import com.ultrabms.service.CompanyProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import com.ultrabms.security.CurrentUser;
import com.ultrabms.security.UserPrincipal;
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
import java.util.Optional;
import java.util.UUID;

/**
 * REST Controller for company profile management.
 * Single-record design - only one company profile allowed in the system.
 *
 * RBAC:
 * - ADMIN/SUPER_ADMIN: Full create/update/delete access
 * - FINANCE_MANAGER/PROPERTY_MANAGER: Read-only access (for document generation)
 * - Other roles: No access (403 Forbidden)
 *
 * Story 2.8: Company Profile Settings
 */
@RestController
@RequestMapping("/api/v1/company-profile")
@Tag(name = "Company Profile", description = "Company profile management")
public class CompanyProfileController {

    private static final Logger LOGGER = LoggerFactory.getLogger(CompanyProfileController.class);

    private final CompanyProfileService companyProfileService;

    public CompanyProfileController(CompanyProfileService companyProfileService) {
        this.companyProfileService = companyProfileService;
    }

    /**
     * Get the company profile.
     * GET /api/v1/company-profile
     *
     * Access: ADMIN, SUPER_ADMIN, FINANCE_MANAGER, PROPERTY_MANAGER
     *
     * @return company profile or 404 if not exists
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER', 'PROPERTY_MANAGER')")
    @Operation(
        summary = "Get company profile",
        description = "Retrieve the company profile. Returns 404 if profile not yet created."
    )
    public ResponseEntity<Map<String, Object>> getCompanyProfile() {
        LOGGER.debug("Getting company profile");

        Optional<CompanyProfileResponse> profile = companyProfileService.getCompanyProfile();

        if (profile.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Company profile not found");
            response.put("timestamp", LocalDateTime.now());
            return ResponseEntity.status(404).body(response);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", profile.get());
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Create or update the company profile (upsert).
     * PUT /api/v1/company-profile
     *
     * Access: ADMIN, SUPER_ADMIN only
     *
     * @param request the company profile data
     * @param authentication Spring Security authentication object
     * @return created/updated company profile
     */
    @PutMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
        summary = "Create or update company profile",
        description = "Create a new company profile or update existing one (upsert). Only ADMIN/SUPER_ADMIN can write."
    )
    public ResponseEntity<Map<String, Object>> saveCompanyProfile(
            @Valid @RequestBody CompanyProfileRequest request,
            @CurrentUser UserPrincipal currentUser
    ) {
        LOGGER.debug("Saving company profile by user: {}", currentUser.getId());

        UUID userId = currentUser.getId();
        CompanyProfileResponse profile = companyProfileService.saveCompanyProfile(request, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", profile);
        response.put("message", "Company profile saved successfully");
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Upload company logo.
     * POST /api/v1/company-profile/logo
     *
     * Access: ADMIN, SUPER_ADMIN only
     *
     * @param file the logo file (PNG/JPG, max 2MB)
     * @param authentication Spring Security authentication object
     * @return presigned URL for the uploaded logo
     */
    @PostMapping(value = "/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
        summary = "Upload company logo",
        description = "Upload a new company logo. Accepts PNG/JPG, max 2MB. Deletes existing logo if present."
    )
    public ResponseEntity<Map<String, Object>> uploadLogo(
            @RequestParam("file") MultipartFile file,
            @CurrentUser UserPrincipal currentUser
    ) {
        LOGGER.debug("Uploading company logo by user: {}", currentUser.getId());

        UUID userId = currentUser.getId();
        CompanyProfileLogoResponse logoResponse = companyProfileService.uploadLogo(file, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", logoResponse);
        response.put("message", "Logo uploaded successfully");
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Delete company logo.
     * DELETE /api/v1/company-profile/logo
     *
     * Access: ADMIN, SUPER_ADMIN only
     *
     * @param authentication Spring Security authentication object
     * @return 204 No Content
     */
    @DeleteMapping("/logo")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
        summary = "Delete company logo",
        description = "Remove company logo from S3 and clear logo path in profile."
    )
    public ResponseEntity<Map<String, Object>> deleteLogo(@CurrentUser UserPrincipal currentUser) {
        LOGGER.debug("Deleting company logo by user: {}", currentUser.getId());

        UUID userId = currentUser.getId();
        companyProfileService.deleteLogo(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Logo deleted successfully");
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Check if company profile exists.
     * GET /api/v1/company-profile/exists
     *
     * Access: ADMIN, SUPER_ADMIN, FINANCE_MANAGER, PROPERTY_MANAGER
     *
     * @return boolean indicating if profile exists
     */
    @GetMapping("/exists")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER', 'PROPERTY_MANAGER')")
    @Operation(
        summary = "Check if company profile exists",
        description = "Returns true if a company profile has been created, false otherwise."
    )
    public ResponseEntity<Map<String, Object>> profileExists() {
        boolean exists = companyProfileService.profileExists();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", exists);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }
}
