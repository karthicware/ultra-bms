package com.ultrabms.controller;

import com.ultrabms.dto.tenant.ChangePasswordRequest;
import com.ultrabms.dto.tenant.DashboardResponse;
import com.ultrabms.dto.tenant.TenantProfileResponse;
import com.ultrabms.entity.TenantDocument;
import com.ultrabms.entity.User;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.TenantPortalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Tenant Portal
 * Handles dashboard, profile, and account management for authenticated tenants
 */
@RestController
@RequestMapping("/api/v1/tenant")
@Tag(name = "Tenant Portal", description = "Tenant dashboard and profile management")
@PreAuthorize("hasRole('TENANT')")
public class TenantPortalController {

    private static final Logger LOGGER = LoggerFactory.getLogger(TenantPortalController.class);

    private final TenantPortalService tenantPortalService;
    private final UserRepository userRepository;

    public TenantPortalController(TenantPortalService tenantPortalService, UserRepository userRepository) {
        this.tenantPortalService = tenantPortalService;
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
     * Get tenant dashboard data
     * GET /api/v1/tenant/dashboard
     */
    @GetMapping("/dashboard")
    @Operation(summary = "Get tenant dashboard", description = "Retrieve dashboard data with unit info, stats, and quick actions")
    public ResponseEntity<Map<String, Object>> getDashboard(@AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = getCurrentUserId(userDetails);
        LOGGER.info("Getting dashboard for user: {}", userId);

        DashboardResponse dashboard = tenantPortalService.getDashboardData(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", dashboard);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Get tenant profile
     * GET /api/v1/tenant/profile
     */
    @GetMapping("/profile")
    @Operation(summary = "Get tenant profile", description = "Retrieve complete profile with personal info, lease, parking, and documents")
    public ResponseEntity<Map<String, Object>> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = getCurrentUserId(userDetails);
        LOGGER.info("Getting profile for user: {}", userId);

        TenantProfileResponse profile = tenantPortalService.getTenantProfile(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", profile);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Change tenant account password
     * POST /api/v1/tenant/account/change-password
     */
    @PostMapping("/account/change-password")
    @Operation(summary = "Change password", description = "Change the tenant's account password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getCurrentUserId(userDetails);
        LOGGER.info("Changing password for user: {}", userId);

        tenantPortalService.changePassword(userId, request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Password changed successfully. Please log in again.");
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Download signed lease agreement
     * GET /api/v1/tenant/lease/download
     */
    @GetMapping("/lease/download")
    @Operation(summary = "Download lease agreement", description = "Download the signed lease agreement PDF")
    public ResponseEntity<Resource> downloadLease(@AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = getCurrentUserId(userDetails);
        LOGGER.info("Downloading lease for user: {}", userId);

        String filePath = tenantPortalService.getLeasePdfPath(userId);

        File file = new File(filePath);
        Resource resource = new FileSystemResource(file);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(resource);
    }

    /**
     * Upload a new document
     * POST /api/v1/tenant/documents
     */
    @PostMapping(value = "/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload document", description = "Upload a new document to tenant's repository")
    public ResponseEntity<Map<String, Object>> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", required = false) String documentType,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getCurrentUserId(userDetails);
        LOGGER.info("Uploading document for user: {}, type: {}", userId, documentType);

        TenantDocument document = tenantPortalService.uploadDocument(userId, file, documentType);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", document);
        response.put("message", "Document uploaded successfully");
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Download a document
     * GET /api/v1/tenant/documents/{id}/download
     */
    @GetMapping("/documents/{id}/download")
    @Operation(summary = "Download document", description = "Download a specific document from tenant's repository")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getCurrentUserId(userDetails);
        LOGGER.info("Downloading document {} for user: {}", id, userId);

        String filePath = tenantPortalService.getDocumentPath(userId, id);

        File file = new File(filePath);
        Resource resource = new FileSystemResource(file);

        // Determine content type from file extension
        String contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        try {
            contentType = Files.probeContentType(Paths.get(file.getAbsolutePath()));
            if (contentType == null) {
                contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            }
        } catch (Exception e) {
            LOGGER.warn("Could not determine file content type for: {}", filePath);
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    /**
     * Download Mulkiya document
     * GET /api/v1/tenant/parking/mulkiya/download
     */
    @GetMapping("/parking/mulkiya/download")
    @Operation(summary = "Download Mulkiya", description = "Download the Mulkiya parking document if available")
    public ResponseEntity<Resource> downloadMulkiya(@AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = getCurrentUserId(userDetails);
        LOGGER.info("Downloading Mulkiya for user: {}", userId);

        String filePath = tenantPortalService.getMulkiyaPath(userId);

        File file = new File(filePath);
        Resource resource = new FileSystemResource(file);

        // Determine content type
        String contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        try {
            contentType = Files.probeContentType(Paths.get(file.getAbsolutePath()));
            if (contentType == null) {
                contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            }
        } catch (Exception e) {
            LOGGER.warn("Could not determine file content type for Mulkiya: {}", filePath);
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    /**
     * Update language preference
     * PATCH /api/v1/tenant/preferences
     */
    @PatchMapping("/preferences")
    @Operation(summary = "Update preferences", description = "Update tenant's language preference")
    public ResponseEntity<Map<String, Object>> updatePreferences(
            @RequestBody Map<String, String> preferences,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getCurrentUserId(userDetails);
        LOGGER.info("Updating preferences for user: {}", userId);

        String language = preferences.get("language");

        if (language != null) {
            tenantPortalService.updateLanguagePreference(userId, language);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Preferences updated successfully");
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    // =================================================================
    // ANNOUNCEMENTS (Story 9.2)
    // =================================================================

    /**
     * Get active announcements for tenant
     * GET /api/v1/tenant/announcements
     * AC #59
     */
    @GetMapping("/announcements")
    @Operation(summary = "Get announcements", description = "Retrieve active announcements for tenant portal")
    public ResponseEntity<Map<String, Object>> getAnnouncements(@AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = getCurrentUserId(userDetails);
        LOGGER.info("Getting announcements for tenant user: {}", userId);

        var announcements = tenantPortalService.getActiveAnnouncements();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", announcements);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Get single announcement for tenant
     * GET /api/v1/tenant/announcements/{id}
     */
    @GetMapping("/announcements/{id}")
    @Operation(summary = "Get announcement", description = "Retrieve single announcement detail for tenant portal")
    public ResponseEntity<Map<String, Object>> getAnnouncement(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getCurrentUserId(userDetails);
        LOGGER.info("Getting announcement {} for tenant user: {}", id, userId);

        var announcement = tenantPortalService.getAnnouncementForTenant(id);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", announcement);
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Get presigned URL for downloading announcement attachment
     * GET /api/v1/tenant/announcements/{id}/attachment/download
     */
    @GetMapping("/announcements/{id}/attachment/download")
    @Operation(summary = "Download announcement attachment", description = "Get presigned URL for downloading announcement attachment")
    public ResponseEntity<Map<String, Object>> getAnnouncementAttachmentDownloadUrl(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getCurrentUserId(userDetails);
        LOGGER.info("Getting announcement attachment download URL for announcement {} by tenant: {}", id, userId);

        String downloadUrl = tenantPortalService.getAnnouncementAttachmentDownloadUrl(id);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", Map.of("downloadUrl", downloadUrl));
        response.put("message", "Download URL generated successfully");
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }
}
