package com.ultrabms.repository;

import com.ultrabms.entity.Document;
import com.ultrabms.entity.enums.DocumentAccessLevel;
import com.ultrabms.entity.enums.DocumentEntityType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Document entity.
 * Provides CRUD operations and custom queries for document management.
 *
 * Story 7.2: Document Management System
 */
@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID>, JpaSpecificationExecutor<Document> {

    // =================================================================
    // FIND BY ID (EXCLUDING DELETED)
    // =================================================================

    /**
     * Find document by ID (excluding deleted)
     *
     * @param id Document UUID
     * @return Optional document
     */
    Optional<Document> findByIdAndIsDeletedFalse(UUID id);

    /**
     * Find document by document number (excluding deleted)
     *
     * @param documentNumber Document number (DOC-YYYY-NNNN)
     * @return Optional document
     */
    Optional<Document> findByDocumentNumberAndIsDeletedFalse(String documentNumber);

    // =================================================================
    // FIND ALL (PAGINATED)
    // =================================================================

    /**
     * Find all documents (excluding deleted), paginated
     *
     * @param pageable Pagination info
     * @return Page of documents
     */
    Page<Document> findByIsDeletedFalse(Pageable pageable);

    /**
     * Find documents by entity type (excluding deleted), paginated
     *
     * @param entityType Entity type
     * @param pageable   Pagination info
     * @return Page of documents
     */
    Page<Document> findByEntityTypeAndIsDeletedFalse(DocumentEntityType entityType, Pageable pageable);

    /**
     * Find documents by entity type and entity ID (excluding deleted), paginated
     *
     * @param entityType Entity type
     * @param entityId   Entity UUID
     * @param pageable   Pagination info
     * @return Page of documents
     */
    Page<Document> findByEntityTypeAndEntityIdAndIsDeletedFalse(
            DocumentEntityType entityType,
            UUID entityId,
            Pageable pageable);

    /**
     * Find documents by access level (excluding deleted), paginated
     *
     * @param accessLevel Access level
     * @param pageable    Pagination info
     * @return Page of documents
     */
    Page<Document> findByAccessLevelAndIsDeletedFalse(DocumentAccessLevel accessLevel, Pageable pageable);

    // =================================================================
    // ENTITY-SPECIFIC QUERIES
    // =================================================================

    /**
     * Find all documents for an entity (excluding deleted)
     *
     * @param entityType Entity type
     * @param entityId   Entity UUID
     * @return List of documents
     */
    List<Document> findByEntityTypeAndEntityIdAndIsDeletedFalseOrderByUploadedAtDesc(
            DocumentEntityType entityType,
            UUID entityId);

    /**
     * Find documents by entity and document type (excluding deleted)
     *
     * @param entityType   Entity type
     * @param entityId     Entity UUID
     * @param documentType Document type (string)
     * @return List of documents
     */
    List<Document> findByEntityTypeAndEntityIdAndDocumentTypeAndIsDeletedFalse(
            DocumentEntityType entityType,
            UUID entityId,
            String documentType);

    // =================================================================
    // EXPIRY TRACKING QUERIES
    // =================================================================

    /**
     * Find all documents expiring within specified date
     * Used for dashboard alerts and notifications
     *
     * @param expiryDate Expiry date threshold
     * @return List of expiring documents
     */
    @Query("SELECT d FROM Document d LEFT JOIN FETCH d.uploadedBy u " +
            "WHERE d.isDeleted = false " +
            "AND d.expiryDate IS NOT NULL AND d.expiryDate <= :expiryDate " +
            "AND d.expiryDate >= CURRENT_DATE " +
            "ORDER BY d.expiryDate ASC")
    List<Document> findExpiringDocuments(@Param("expiryDate") LocalDate expiryDate);

    /**
     * Find documents expiring within days range, paginated
     *
     * @param startDate Start of range (e.g., today)
     * @param endDate   End of range (e.g., today + 30 days)
     * @param pageable  Pagination info
     * @return Page of documents in expiry window
     */
    @Query("SELECT d FROM Document d " +
            "WHERE d.isDeleted = false " +
            "AND d.expiryDate IS NOT NULL " +
            "AND d.expiryDate >= :startDate AND d.expiryDate <= :endDate " +
            "ORDER BY d.expiryDate ASC")
    Page<Document> findDocumentsExpiringBetween(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable);

    /**
     * Find already expired documents (excluding deleted)
     *
     * @return List of expired documents
     */
    @Query("SELECT d FROM Document d " +
            "WHERE d.isDeleted = false " +
            "AND d.expiryDate IS NOT NULL AND d.expiryDate < CURRENT_DATE " +
            "ORDER BY d.expiryDate ASC")
    List<Document> findExpiredDocuments();

    // =================================================================
    // NOTIFICATION TRACKING QUERIES
    // =================================================================

    /**
     * Find documents due for expiry notification (not yet sent)
     * Documents expiring within 30 days that haven't been notified yet
     *
     * @param notificationDate Target date (typically today + 30 days)
     * @return List of documents pending notification
     */
    @Query("SELECT d FROM Document d LEFT JOIN FETCH d.uploadedBy u " +
            "WHERE d.isDeleted = false " +
            "AND d.expiryDate IS NOT NULL " +
            "AND d.expiryDate <= :notificationDate " +
            "AND d.expiryDate >= CURRENT_DATE " +
            "AND d.expiryNotificationSent = false")
    List<Document> findDocumentsPendingExpiryNotification(
            @Param("notificationDate") LocalDate notificationDate);

    // =================================================================
    // SEARCH QUERIES
    // =================================================================

    /**
     * Search documents by title or description (full-text search)
     *
     * @param searchTerm Search term
     * @param pageable   Pagination info
     * @return Page of matching documents
     */
    @Query("SELECT d FROM Document d " +
            "WHERE d.isDeleted = false " +
            "AND (LOWER(d.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(d.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(d.documentType) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(d.documentNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<Document> searchDocuments(@Param("searchTerm") String searchTerm, Pageable pageable);

    // =================================================================
    // COUNT QUERIES
    // =================================================================

    /**
     * Count all documents (excluding deleted)
     *
     * @return Document count
     */
    long countByIsDeletedFalse();

    /**
     * Count documents for an entity (excluding deleted)
     *
     * @param entityType Entity type
     * @param entityId   Entity UUID
     * @return Document count
     */
    long countByEntityTypeAndEntityIdAndIsDeletedFalse(DocumentEntityType entityType, UUID entityId);

    /**
     * Count documents by access level (excluding deleted)
     *
     * @param accessLevel Access level
     * @return Document count
     */
    long countByAccessLevelAndIsDeletedFalse(DocumentAccessLevel accessLevel);

    /**
     * Count expiring documents within days threshold
     *
     * @param expiryDate Expiry date threshold
     * @return Count of expiring documents
     */
    @Query("SELECT COUNT(d) FROM Document d " +
            "WHERE d.isDeleted = false " +
            "AND d.expiryDate IS NOT NULL AND d.expiryDate <= :expiryDate AND d.expiryDate >= CURRENT_DATE")
    long countExpiringDocuments(@Param("expiryDate") LocalDate expiryDate);

    // =================================================================
    // DOCUMENT NUMBER GENERATION
    // =================================================================

    /**
     * Get the next document number sequence value
     *
     * @return Next sequence value
     */
    @Query(value = "SELECT nextval('document_number_seq')", nativeQuery = true)
    Long getNextDocumentNumberSequence();

    /**
     * Get the current max document number for a year
     * Used when resetting sequence on year change
     *
     * @param yearPrefix Year prefix (e.g., "DOC-2025-")
     * @return Max document number or null
     */
    @Query("SELECT MAX(d.documentNumber) FROM Document d WHERE d.documentNumber LIKE :yearPrefix || '%'")
    String findMaxDocumentNumberForYear(@Param("yearPrefix") String yearPrefix);

    // =================================================================
    // EXISTENCE CHECKS
    // =================================================================

    /**
     * Check if document number exists
     *
     * @param documentNumber Document number
     * @return True if exists
     */
    boolean existsByDocumentNumber(String documentNumber);

    // =================================================================
    // BULK OPERATIONS
    // =================================================================

    /**
     * Mark expiry notifications as sent for given documents
     *
     * @param documentIds List of document IDs
     * @return Number of documents updated
     */
    @Modifying
    @Query("UPDATE Document d SET d.expiryNotificationSent = true WHERE d.id IN :documentIds")
    int markExpiryNotificationSent(@Param("documentIds") List<UUID> documentIds);

    /**
     * Reset expiry notification flag (e.g., when expiry date is changed)
     *
     * @param documentId Document ID
     * @return Number of documents updated
     */
    @Modifying
    @Query("UPDATE Document d SET d.expiryNotificationSent = false WHERE d.id = :documentId")
    int resetExpiryNotification(@Param("documentId") UUID documentId);
}
