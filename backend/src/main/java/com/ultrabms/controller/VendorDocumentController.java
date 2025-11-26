package com.ultrabms.controller;

import com.ultrabms.dto.vendordocuments.ExpiringDocumentDto;
import com.ultrabms.dto.vendordocuments.VendorDocumentDto;
import com.ultrabms.dto.vendordocuments.VendorDocumentListDto;
import com.ultrabms.dto.vendordocuments.VendorDocumentUploadDto;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.VendorDocumentType;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.VendorDocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Vendor Document Management
 * Handles document upload, retrieval, replacement, deletion, and expiry tracking.
 *
 * Story 5.2: Vendor Document and License Management
 */
@RestController
@RequestMapping("/api/v1/vendors")
@Tag(name = "Vendor Documents", description = "Vendor document management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class VendorDocumentController {

    private static final Logger LOGGER = LoggerFactory.getLogger(VendorDocumentController.class);

    private final VendorDocumentService documentService;
    private final UserRepository userRepository;

    public VendorDocumentController(
            VendorDocumentService documentService,
            UserRepository userRepository
    ) {
        this.documentService = documentService;
        this.userRepository = userRepository;
    }

    // =================================================================
    // DOCUMENT UPLOAD
    // =================================================================

    /**
     * Upload a new document for a vendor
     * POST /api/v1/vendors/{vendorId}/documents
     */
    @PostMapping(value = "/{vendorId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'SUPER_ADMIN')")
    @Operation(
            summary = "Upload vendor document",
            description = "Upload a new document for a vendor (PDF, JPG, PNG, max 10MB)"
    )
    public ResponseEntity<Map<String, Object>> uploadDocument(
            @PathVariable UUID vendorId,
            @RequestPart("file") MultipartFile file,
            @RequestParam("documentType") VendorDocumentType documentType,
            @RequestParam(value = "expiryDate", required = false) LocalDate expiryDate,
            @RequestParam(value = "notes", required = false) String notes,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        LOGGER.info("Uploading document for vendor: {} type: {} by user: {}",
                vendorId, documentType, userId);

        // Build upload DTO from request params
        VendorDocumentUploadDto uploadDto = VendorDocumentUploadDto.builder()
                .documentType(documentType)
                .expiryDate(expiryDate)
                .notes(notes)
                .build();

        VendorDocumentDto response = documentService.uploadDocument(vendorId, uploadDto, file, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Document uploaded successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    // =================================================================
    // GET VENDOR DOCUMENTS
    // =================================================================

    /**
     * Get all documents for a vendor
     * GET /api/v1/vendors/{vendorId}/documents
     */
    @GetMapping("/{vendorId}/documents")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR', 'SUPER_ADMIN')")
    @Operation(
            summary = "List vendor documents",
            description = "Get all documents for a vendor sorted by upload date descending"
    )
    public ResponseEntity<Map<String, Object>> getVendorDocuments(
            @PathVariable UUID vendorId
    ) {
        LOGGER.debug("Getting documents for vendor: {}", vendorId);

        List<VendorDocumentListDto> documents = documentService.getDocumentsByVendor(vendorId);

        Map<String, Object> responseBody = buildSuccessResponse(documents, "Documents retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // GET DOCUMENT BY ID
    // =================================================================

    /**
     * Get document by ID with presigned download URL
     * GET /api/v1/vendors/{vendorId}/documents/{documentId}
     */
    @GetMapping("/{vendorId}/documents/{documentId}")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR', 'SUPER_ADMIN')")
    @Operation(
            summary = "Get document details",
            description = "Get document details with presigned download URL (valid for 1 hour)"
    )
    public ResponseEntity<Map<String, Object>> getDocumentById(
            @PathVariable UUID vendorId,
            @PathVariable UUID documentId
    ) {
        LOGGER.debug("Getting document: {} for vendor: {}", documentId, vendorId);

        VendorDocumentDto response = documentService.getDocumentById(vendorId, documentId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Document retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // REPLACE DOCUMENT
    // =================================================================

    /**
     * Replace an existing document with a new file
     * PUT /api/v1/vendors/{vendorId}/documents/{documentId}
     */
    @PutMapping(value = "/{vendorId}/documents/{documentId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'SUPER_ADMIN')")
    @Operation(
            summary = "Replace vendor document",
            description = "Replace an existing document with a new file (previous version retained)"
    )
    public ResponseEntity<Map<String, Object>> replaceDocument(
            @PathVariable UUID vendorId,
            @PathVariable UUID documentId,
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "expiryDate", required = false) LocalDate expiryDate,
            @RequestParam(value = "notes", required = false) String notes,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        LOGGER.info("Replacing document: {} for vendor: {} by user: {}",
                documentId, vendorId, userId);

        // Build upload DTO from request params (documentType not needed for replacement)
        VendorDocumentUploadDto uploadDto = VendorDocumentUploadDto.builder()
                .expiryDate(expiryDate)
                .notes(notes)
                .build();

        VendorDocumentDto response = documentService.replaceDocument(vendorId, documentId, uploadDto, file, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Document replaced successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // DELETE DOCUMENT
    // =================================================================

    /**
     * Soft delete a document
     * DELETE /api/v1/vendors/{vendorId}/documents/{documentId}
     */
    @DeleteMapping("/{vendorId}/documents/{documentId}")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'SUPER_ADMIN')")
    @Operation(
            summary = "Delete vendor document",
            description = "Soft delete a document (file retained in S3 for audit)"
    )
    public ResponseEntity<Map<String, Object>> deleteDocument(
            @PathVariable UUID vendorId,
            @PathVariable UUID documentId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        LOGGER.info("Deleting document: {} for vendor: {} by user: {}",
                documentId, vendorId, userId);

        documentService.deleteDocument(vendorId, documentId, userId);

        Map<String, Object> responseBody = buildSuccessResponse(null, "Document deleted successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // EXPIRING DOCUMENTS
    // =================================================================

    /**
     * Get documents expiring within specified days
     * GET /api/v1/vendors/expiring-documents?days=30
     */
    @GetMapping("/expiring-documents")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'SUPER_ADMIN')")
    @Operation(
            summary = "Get expiring documents",
            description = "Get all vendor documents expiring within specified days (default 30)"
    )
    public ResponseEntity<Map<String, Object>> getExpiringDocuments(
            @RequestParam(defaultValue = "30") int days
    ) {
        LOGGER.debug("Getting documents expiring within {} days", days);

        List<ExpiringDocumentDto> documents = documentService.getExpiringDocuments(days);
        long count = documentService.countExpiringDocuments(days);

        Map<String, Object> data = new HashMap<>();
        data.put("documents", documents);
        data.put("count", count);
        data.put("daysThreshold", days);

        Map<String, Object> responseBody = buildSuccessResponse(data, "Expiring documents retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get count of expiring documents for dashboard
     * GET /api/v1/vendors/expiring-documents/count?days=30
     */
    @GetMapping("/expiring-documents/count")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'SUPER_ADMIN')")
    @Operation(
            summary = "Count expiring documents",
            description = "Get count of documents expiring within specified days"
    )
    public ResponseEntity<Map<String, Object>> countExpiringDocuments(
            @RequestParam(defaultValue = "30") int days
    ) {
        long count = documentService.countExpiringDocuments(days);

        Map<String, Object> data = new HashMap<>();
        data.put("count", count);
        data.put("daysThreshold", days);

        Map<String, Object> responseBody = buildSuccessResponse(data, "Expiring document count retrieved");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Check if vendor has valid critical documents
     * GET /api/v1/vendors/{vendorId}/documents/status
     */
    @GetMapping("/{vendorId}/documents/status")
    @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR', 'SUPER_ADMIN')")
    @Operation(
            summary = "Get vendor document status",
            description = "Check if vendor has valid critical documents (trade license, insurance)"
    )
    public ResponseEntity<Map<String, Object>> getDocumentStatus(
            @PathVariable UUID vendorId
    ) {
        LOGGER.debug("Getting document status for vendor: {}", vendorId);

        boolean hasValidCritical = documentService.hasValidCriticalDocuments(vendorId);
        boolean hasExpiredCritical = documentService.hasExpiredCriticalDocuments(vendorId);

        Map<String, Object> data = new HashMap<>();
        data.put("vendorId", vendorId);
        data.put("hasValidCriticalDocuments", hasValidCritical);
        data.put("hasExpiredCriticalDocuments", hasExpiredCritical);
        data.put("documentComplianceStatus", hasExpiredCritical ? "NON_COMPLIANT" : (hasValidCritical ? "COMPLIANT" : "INCOMPLETE"));

        Map<String, Object> responseBody = buildSuccessResponse(data, "Document status retrieved");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Get user ID from authentication principal
     */
    private UUID getUserId(UserDetails userDetails) {
        String email = userDetails.getUsername();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        return user.getId();
    }

    /**
     * Build success response map
     */
    private Map<String, Object> buildSuccessResponse(Object data, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        if (data != null) {
            response.put("data", data);
        }
        response.put("timestamp", LocalDateTime.now().toString());
        return response;
    }
}
