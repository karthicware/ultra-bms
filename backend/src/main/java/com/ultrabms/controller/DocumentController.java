package com.ultrabms.controller;

import com.ultrabms.dto.documents.DocumentDto;
import com.ultrabms.dto.documents.DocumentListDto;
import com.ultrabms.dto.documents.DocumentUpdateDto;
import com.ultrabms.dto.documents.DocumentUploadDto;
import com.ultrabms.dto.documents.DocumentVersionDto;
import com.ultrabms.dto.documents.ExpiringDocumentDto;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.DocumentAccessLevel;
import com.ultrabms.entity.enums.DocumentEntityType;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.DocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
import org.springframework.web.bind.annotation.RequestBody;
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
 * REST Controller for Centralized Document Management
 * Handles document upload, retrieval, versioning, access control, and expiry tracking.
 *
 * Story 7.2: Document Management System
 */
@RestController
@RequestMapping("/api/v1/documents")
@Tag(name = "Documents", description = "Centralized document management APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class DocumentController {

    private static final Logger LOGGER = LoggerFactory.getLogger(DocumentController.class);

    private final DocumentService documentService;
    private final UserRepository userRepository;

    public DocumentController(
            DocumentService documentService,
            UserRepository userRepository
    ) {
        this.documentService = documentService;
        this.userRepository = userRepository;
    }

    // =================================================================
    // DOCUMENT UPLOAD
    // =================================================================

    /**
     * Upload a new document
     * POST /api/v1/documents
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Upload document",
            description = "Upload a new document with metadata (PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, max 10MB)"
    )
    public ResponseEntity<Map<String, Object>> uploadDocument(
            @RequestPart("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("documentType") String documentType,
            @RequestParam("entityType") DocumentEntityType entityType,
            @RequestParam(value = "entityId", required = false) UUID entityId,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "expiryDate", required = false) LocalDate expiryDate,
            @RequestParam(value = "accessLevel", required = false, defaultValue = "INTERNAL") DocumentAccessLevel accessLevel,
            @RequestParam(value = "tags", required = false) List<String> tags,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        LOGGER.info("Uploading document '{}' for entityType: {} entityId: {} by user: {}",
                title, entityType, entityId, userId);

        // Build upload DTO from request params
        DocumentUploadDto uploadDto = DocumentUploadDto.builder()
                .title(title)
                .documentType(documentType)
                .description(description)
                .entityType(entityType)
                .entityId(entityId)
                .expiryDate(expiryDate)
                .accessLevel(accessLevel)
                .tags(tags)
                .build();

        DocumentDto response = documentService.uploadDocument(uploadDto, file, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Document uploaded successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    // =================================================================
    // GET DOCUMENTS (LIST)
    // =================================================================

    /**
     * Get all documents with optional filters (paginated)
     * GET /api/v1/documents
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "List documents",
            description = "Get all documents with optional filters and pagination"
    )
    public ResponseEntity<Map<String, Object>> getDocuments(
            @RequestParam(required = false) DocumentEntityType entityType,
            @RequestParam(required = false) UUID entityId,
            @RequestParam(required = false) String documentType,
            @RequestParam(required = false) DocumentAccessLevel accessLevel,
            @RequestParam(required = false) @Parameter(description = "Filter by expiry status: expiring_soon, expired, valid") String expiryStatus,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "uploadedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection
    ) {
        LOGGER.debug("Getting documents with filters - entityType: {}, entityId: {}, docType: {}, accessLevel: {}, expiryStatus: {}, search: {}",
                entityType, entityId, documentType, accessLevel, expiryStatus, search);

        Sort sort = Sort.by(
                sortDirection.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC,
                sortBy
        );
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<DocumentListDto> documents = documentService.getDocumentsWithFilters(
                entityType, entityId, documentType, accessLevel, expiryStatus, search, pageable);

        Map<String, Object> data = buildPagedResponse(documents);
        Map<String, Object> responseBody = buildSuccessResponse(data, "Documents retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get documents by entity
     * GET /api/v1/documents/entity/{entityType}/{entityId}
     */
    @GetMapping("/entity/{entityType}/{entityId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get documents by entity",
            description = "Get all documents for a specific entity (property, tenant, vendor, asset)"
    )
    public ResponseEntity<Map<String, Object>> getDocumentsByEntity(
            @PathVariable DocumentEntityType entityType,
            @PathVariable UUID entityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        LOGGER.debug("Getting documents for entity: {} id: {}", entityType, entityId);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "uploadedAt"));
        Page<DocumentListDto> documents = documentService.getDocumentsByEntity(entityType, entityId, pageable);

        Map<String, Object> data = buildPagedResponse(documents);
        Map<String, Object> responseBody = buildSuccessResponse(data, "Documents retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Search documents
     * GET /api/v1/documents/search?q=term
     */
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Search documents",
            description = "Search documents by title, description, tags, or document number"
    )
    public ResponseEntity<Map<String, Object>> searchDocuments(
            @RequestParam("q") String searchTerm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        LOGGER.debug("Searching documents with term: {}", searchTerm);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "uploadedAt"));
        Page<DocumentListDto> documents = documentService.searchDocuments(searchTerm, pageable);

        Map<String, Object> data = buildPagedResponse(documents);
        Map<String, Object> responseBody = buildSuccessResponse(data, "Search results retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // GET DOCUMENT BY ID
    // =================================================================

    /**
     * Get document by ID with presigned download URL
     * GET /api/v1/documents/{documentId}
     */
    @GetMapping("/{documentId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get document details",
            description = "Get document details with presigned download and preview URLs (valid for 1 hour)"
    )
    public ResponseEntity<Map<String, Object>> getDocumentById(
            @PathVariable UUID documentId
    ) {
        LOGGER.debug("Getting document: {}", documentId);

        DocumentDto response = documentService.getDocument(documentId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Document retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get document by document number
     * GET /api/v1/documents/number/{documentNumber}
     */
    @GetMapping("/number/{documentNumber}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get document by number",
            description = "Get document details by document number (DOC-YYYY-NNNN)"
    )
    public ResponseEntity<Map<String, Object>> getDocumentByNumber(
            @PathVariable String documentNumber
    ) {
        LOGGER.debug("Getting document by number: {}", documentNumber);

        DocumentDto response = documentService.getDocumentByNumber(documentNumber);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Document retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // UPDATE DOCUMENT
    // =================================================================

    /**
     * Update document metadata
     * PUT /api/v1/documents/{documentId}
     */
    @PutMapping("/{documentId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Update document metadata",
            description = "Update document title, description, tags, expiry date, or access level"
    )
    public ResponseEntity<Map<String, Object>> updateDocument(
            @PathVariable UUID documentId,
            @RequestBody DocumentUpdateDto updateDto
    ) {
        LOGGER.info("Updating document metadata: {}", documentId);

        DocumentDto response = documentService.updateDocument(documentId, updateDto);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Document updated successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // REPLACE DOCUMENT (NEW VERSION)
    // =================================================================

    /**
     * Replace document file (creates new version)
     * POST /api/v1/documents/{documentId}/replace
     */
    @PostMapping(value = "/{documentId}/replace", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Replace document file",
            description = "Upload a new file for an existing document (creates new version, retains history)"
    )
    public ResponseEntity<Map<String, Object>> replaceDocument(
            @PathVariable UUID documentId,
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "notes", required = false) String notes,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        LOGGER.info("Replacing document: {} by user: {}", documentId, userId);

        DocumentDto response = documentService.replaceDocument(documentId, file, notes, userId);

        Map<String, Object> responseBody = buildSuccessResponse(response, "Document replaced successfully (version " + response.getVersionNumber() + ")");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // DELETE DOCUMENT
    // =================================================================

    /**
     * Soft delete a document
     * DELETE /api/v1/documents/{documentId}
     */
    @DeleteMapping("/{documentId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Delete document",
            description = "Soft delete a document (file retained in S3 for audit)"
    )
    public ResponseEntity<Map<String, Object>> deleteDocument(
            @PathVariable UUID documentId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        LOGGER.info("Deleting document: {} by user: {}", documentId, userId);

        documentService.deleteDocument(documentId, userId);

        Map<String, Object> responseBody = buildSuccessResponse(null, "Document deleted successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // VERSION HISTORY
    // =================================================================

    /**
     * Get document version history
     * GET /api/v1/documents/{documentId}/versions
     */
    @GetMapping("/{documentId}/versions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get version history",
            description = "Get all versions of a document (ordered by version number descending)"
    )
    public ResponseEntity<Map<String, Object>> getVersionHistory(
            @PathVariable UUID documentId
    ) {
        LOGGER.debug("Getting version history for document: {}", documentId);

        List<DocumentVersionDto> versions = documentService.getVersionHistory(documentId);

        Map<String, Object> data = new HashMap<>();
        data.put("documentId", documentId);
        data.put("versions", versions);
        data.put("totalVersions", versions.size());

        Map<String, Object> responseBody = buildSuccessResponse(data, "Version history retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get specific version
     * GET /api/v1/documents/{documentId}/versions/{versionNumber}
     */
    @GetMapping("/{documentId}/versions/{versionNumber}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get specific version",
            description = "Get a specific version of a document with download URL"
    )
    public ResponseEntity<Map<String, Object>> getVersion(
            @PathVariable UUID documentId,
            @PathVariable int versionNumber
    ) {
        LOGGER.debug("Getting version {} for document: {}", versionNumber, documentId);

        DocumentVersionDto version = documentService.getVersion(documentId, versionNumber);

        Map<String, Object> responseBody = buildSuccessResponse(version, "Version retrieved successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // DOWNLOAD AND PREVIEW
    // =================================================================

    /**
     * Get download URL for document
     * GET /api/v1/documents/{documentId}/download
     */
    @GetMapping("/{documentId}/download")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR', 'MAINTENANCE_TECHNICIAN')")
    @Operation(
            summary = "Get download URL",
            description = "Get presigned download URL for document (valid for 1 hour)"
    )
    public ResponseEntity<Map<String, Object>> getDownloadUrl(
            @PathVariable UUID documentId
    ) {
        LOGGER.debug("Getting download URL for document: {}", documentId);

        String downloadUrl = documentService.getDownloadUrl(documentId);

        Map<String, Object> data = new HashMap<>();
        data.put("documentId", documentId);
        data.put("downloadUrl", downloadUrl);
        data.put("validFor", "1 hour");

        Map<String, Object> responseBody = buildSuccessResponse(data, "Download URL generated successfully");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get preview URL for document
     * GET /api/v1/documents/{documentId}/preview
     */
    @GetMapping("/{documentId}/preview")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR', 'MAINTENANCE_TECHNICIAN')")
    @Operation(
            summary = "Get preview URL",
            description = "Get presigned preview URL for document (valid for 1 hour, for supported file types)"
    )
    public ResponseEntity<Map<String, Object>> getPreviewUrl(
            @PathVariable UUID documentId
    ) {
        LOGGER.debug("Getting preview URL for document: {}", documentId);

        boolean canPreview = documentService.canPreview(documentId);
        String previewUrl = canPreview ? documentService.getPreviewUrl(documentId) : null;

        Map<String, Object> data = new HashMap<>();
        data.put("documentId", documentId);
        data.put("canPreview", canPreview);
        data.put("previewUrl", previewUrl);
        data.put("validFor", canPreview ? "1 hour" : null);

        Map<String, Object> responseBody = buildSuccessResponse(data, canPreview ?
                "Preview URL generated successfully" : "Document type does not support preview");
        return ResponseEntity.ok(responseBody);
    }

    /**
     * Get download URL for specific version
     * GET /api/v1/documents/{documentId}/versions/{versionId}/download
     */
    @GetMapping("/{documentId}/versions/{versionId}/download")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')")
    @Operation(
            summary = "Get version download URL",
            description = "Get presigned download URL for a specific document version"
    )
    public ResponseEntity<Map<String, Object>> getVersionDownloadUrl(
            @PathVariable UUID documentId,
            @PathVariable UUID versionId
    ) {
        LOGGER.debug("Getting download URL for document: {} version: {}", documentId, versionId);

        String downloadUrl = documentService.getVersionDownloadUrl(documentId, versionId);

        Map<String, Object> data = new HashMap<>();
        data.put("documentId", documentId);
        data.put("versionId", versionId);
        data.put("downloadUrl", downloadUrl);
        data.put("validFor", "1 hour");

        Map<String, Object> responseBody = buildSuccessResponse(data, "Version download URL generated successfully");
        return ResponseEntity.ok(responseBody);
    }

    // =================================================================
    // EXPIRING DOCUMENTS
    // =================================================================

    /**
     * Get documents expiring within specified days
     * GET /api/v1/documents/expiring?days=30
     */
    @GetMapping("/expiring")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER')")
    @Operation(
            summary = "Get expiring documents",
            description = "Get all documents expiring within specified days (default 30)"
    )
    public ResponseEntity<Map<String, Object>> getExpiringDocuments(
            @RequestParam(defaultValue = "30") int days
    ) {
        LOGGER.debug("Getting documents expiring within {} days", days);

        List<ExpiringDocumentDto> documents = documentService.getExpiringDocuments(days);

        Map<String, Object> data = new HashMap<>();
        data.put("documents", documents);
        data.put("count", documents.size());
        data.put("daysThreshold", days);

        Map<String, Object> responseBody = buildSuccessResponse(data, "Expiring documents retrieved successfully");
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

    /**
     * Build paginated response map
     */
    private Map<String, Object> buildPagedResponse(Page<?> page) {
        Map<String, Object> data = new HashMap<>();
        data.put("content", page.getContent());
        data.put("page", page.getNumber());
        data.put("size", page.getSize());
        data.put("totalElements", page.getTotalElements());
        data.put("totalPages", page.getTotalPages());
        data.put("first", page.isFirst());
        data.put("last", page.isLast());
        return data;
    }
}
