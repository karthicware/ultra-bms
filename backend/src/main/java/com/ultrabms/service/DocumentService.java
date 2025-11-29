package com.ultrabms.service;

import com.ultrabms.dto.documents.DocumentDto;
import com.ultrabms.dto.documents.DocumentListDto;
import com.ultrabms.dto.documents.DocumentUpdateDto;
import com.ultrabms.dto.documents.DocumentUploadDto;
import com.ultrabms.dto.documents.DocumentVersionDto;
import com.ultrabms.dto.documents.ExpiringDocumentDto;
import com.ultrabms.entity.enums.DocumentAccessLevel;
import com.ultrabms.entity.enums.DocumentEntityType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Document Service Interface
 * Defines operations for document management.
 *
 * Story 7.2: Document Management System
 */
public interface DocumentService {

    // =================================================================
    // CRUD OPERATIONS
    // =================================================================

    /**
     * Upload a new document
     *
     * @param dto        Upload DTO with metadata
     * @param file       Uploaded file
     * @param uploadedBy User who uploaded
     * @return Created document DTO
     */
    DocumentDto uploadDocument(DocumentUploadDto dto, MultipartFile file, UUID uploadedBy);

    /**
     * Get document by ID
     *
     * @param documentId Document UUID
     * @return Document DTO with entity name and URLs
     */
    DocumentDto getDocument(UUID documentId);

    /**
     * Get document by document number
     *
     * @param documentNumber Document number (DOC-YYYY-NNNN)
     * @return Document DTO
     */
    DocumentDto getDocumentByNumber(String documentNumber);

    /**
     * Update document metadata
     *
     * @param documentId Document UUID
     * @param dto        Update DTO
     * @return Updated document DTO
     */
    DocumentDto updateDocument(UUID documentId, DocumentUpdateDto dto);

    /**
     * Replace document file (creates new version)
     *
     * @param documentId Document UUID
     * @param file       New file
     * @param notes      Optional version notes
     * @param uploadedBy User who uploaded
     * @return Updated document DTO with new version number
     */
    DocumentDto replaceDocument(UUID documentId, MultipartFile file, String notes, UUID uploadedBy);

    /**
     * Soft delete document
     *
     * @param documentId  Document UUID
     * @param deletedBy   User who deleted
     */
    void deleteDocument(UUID documentId, UUID deletedBy);

    // =================================================================
    // LIST AND SEARCH
    // =================================================================

    /**
     * Get all documents (paginated)
     *
     * @param pageable Pagination info
     * @return Page of document list DTOs
     */
    Page<DocumentListDto> getDocuments(Pageable pageable);

    /**
     * Get documents by entity type (paginated)
     *
     * @param entityType Entity type
     * @param pageable   Pagination info
     * @return Page of document list DTOs
     */
    Page<DocumentListDto> getDocumentsByEntityType(DocumentEntityType entityType, Pageable pageable);

    /**
     * Get documents by entity (paginated)
     *
     * @param entityType Entity type
     * @param entityId   Entity UUID
     * @param pageable   Pagination info
     * @return Page of document list DTOs
     */
    Page<DocumentListDto> getDocumentsByEntity(DocumentEntityType entityType, UUID entityId, Pageable pageable);

    /**
     * Search documents
     *
     * @param searchTerm Search term
     * @param pageable   Pagination info
     * @return Page of matching documents
     */
    Page<DocumentListDto> searchDocuments(String searchTerm, Pageable pageable);

    /**
     * Get documents with filters (paginated)
     *
     * @param entityType   Optional entity type filter
     * @param entityId     Optional entity ID filter
     * @param documentType Optional document type filter
     * @param accessLevel  Optional access level filter
     * @param expiryStatus Optional expiry status filter (expiring_soon, expired, valid)
     * @param searchTerm   Optional search term
     * @param pageable     Pagination info
     * @return Page of matching documents
     */
    Page<DocumentListDto> getDocumentsWithFilters(
            DocumentEntityType entityType,
            UUID entityId,
            String documentType,
            DocumentAccessLevel accessLevel,
            String expiryStatus,
            String searchTerm,
            Pageable pageable);

    // =================================================================
    // VERSION HISTORY
    // =================================================================

    /**
     * Get document version history
     *
     * @param documentId Document UUID
     * @return List of version DTOs (ordered by version DESC)
     */
    List<DocumentVersionDto> getVersionHistory(UUID documentId);

    /**
     * Get specific version
     *
     * @param documentId    Document UUID
     * @param versionNumber Version number
     * @return Version DTO
     */
    DocumentVersionDto getVersion(UUID documentId, int versionNumber);

    // =================================================================
    // DOWNLOAD AND PREVIEW
    // =================================================================

    /**
     * Get download URL for document
     *
     * @param documentId Document UUID
     * @return Presigned download URL
     */
    String getDownloadUrl(UUID documentId);

    /**
     * Get preview URL for document (inline disposition)
     *
     * @param documentId Document UUID
     * @return Presigned preview URL
     */
    String getPreviewUrl(UUID documentId);

    /**
     * Get download URL for specific version
     *
     * @param documentId Document UUID
     * @param versionId  Version UUID
     * @return Presigned download URL
     */
    String getVersionDownloadUrl(UUID documentId, UUID versionId);

    /**
     * Check if document can be previewed in browser
     *
     * @param documentId Document UUID
     * @return true if file type supports preview (PDF, images)
     */
    boolean canPreview(UUID documentId);

    // =================================================================
    // EXPIRY TRACKING
    // =================================================================

    /**
     * Get documents expiring within specified days
     *
     * @param days Days until expiry threshold
     * @return List of expiring documents
     */
    List<ExpiringDocumentDto> getExpiringDocuments(int days);

    /**
     * Get documents pending expiry notification
     *
     * @param notificationDays Days threshold for notification (e.g., 30)
     * @return List of documents pending notification
     */
    List<ExpiringDocumentDto> getDocumentsPendingExpiryNotification(int notificationDays);

    /**
     * Mark expiry notifications as sent
     *
     * @param documentIds List of document IDs
     */
    void markExpiryNotificationsSent(List<UUID> documentIds);

    // =================================================================
    // ENTITY NAME RESOLUTION
    // =================================================================

    /**
     * Resolve entity name by type and ID
     *
     * @param entityType Entity type
     * @param entityId   Entity UUID
     * @return Entity name (e.g., property name, tenant name)
     */
    String resolveEntityName(DocumentEntityType entityType, UUID entityId);

    // =================================================================
    // ACCESS CONTROL
    // =================================================================

    /**
     * Check if user has access to document
     *
     * @param documentId Document UUID
     * @param userId     User UUID
     * @param userRoles  User roles
     * @return true if user has access
     */
    boolean hasAccess(UUID documentId, UUID userId, List<String> userRoles);
}
