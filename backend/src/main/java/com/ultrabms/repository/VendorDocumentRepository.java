package com.ultrabms.repository;

import com.ultrabms.entity.VendorDocument;
import com.ultrabms.entity.enums.VendorDocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for VendorDocument entity.
 * Provides CRUD operations and custom queries for vendor document management.
 *
 * Story 5.2: Vendor Document and License Management
 */
@Repository
public interface VendorDocumentRepository extends JpaRepository<VendorDocument, UUID> {

    // =================================================================
    // FIND BY VENDOR
    // =================================================================

    /**
     * Find all documents for a vendor (excluding deleted)
     * Sorted by uploaded date descending (newest first)
     *
     * @param vendorId Vendor UUID
     * @return List of documents
     */
    List<VendorDocument> findByVendorIdAndIsDeletedFalseOrderByUploadedAtDesc(UUID vendorId);

    /**
     * Find all documents of a specific type for a vendor (excluding deleted)
     *
     * @param vendorId     Vendor UUID
     * @param documentType Document type
     * @return List of documents
     */
    List<VendorDocument> findByVendorIdAndDocumentTypeAndIsDeletedFalse(
            UUID vendorId,
            VendorDocumentType documentType);

    /**
     * Find document by ID and vendor ID (excluding deleted)
     * Used for security validation
     *
     * @param id       Document UUID
     * @param vendorId Vendor UUID
     * @return Optional document
     */
    Optional<VendorDocument> findByIdAndVendorIdAndIsDeletedFalse(UUID id, UUID vendorId);

    // =================================================================
    // EXPIRY TRACKING QUERIES
    // =================================================================

    /**
     * Find all documents expiring within specified days
     * Used for dashboard alerts and notifications
     *
     * @param expiryDate Expiry date threshold
     * @return List of expiring documents with vendor info
     */
    @Query("SELECT d FROM VendorDocument d JOIN FETCH d.vendor v " +
            "WHERE d.isDeleted = false AND v.isDeleted = false " +
            "AND d.expiryDate IS NOT NULL AND d.expiryDate <= :expiryDate " +
            "ORDER BY d.expiryDate ASC")
    List<VendorDocument> findExpiringDocuments(@Param("expiryDate") LocalDate expiryDate);

    /**
     * Find documents expiring within days range (for notifications)
     *
     * @param startDate Start of range (e.g., today)
     * @param endDate   End of range (e.g., today + 30 days)
     * @return List of documents in expiry window
     */
    @Query("SELECT d FROM VendorDocument d JOIN FETCH d.vendor v " +
            "WHERE d.isDeleted = false AND v.isDeleted = false " +
            "AND d.expiryDate IS NOT NULL " +
            "AND d.expiryDate >= :startDate AND d.expiryDate <= :endDate " +
            "ORDER BY d.expiryDate ASC")
    List<VendorDocument> findDocumentsExpiringBetween(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Find already expired documents (for auto-suspension)
     *
     * @return List of expired documents
     */
    @Query("SELECT d FROM VendorDocument d JOIN FETCH d.vendor v " +
            "WHERE d.isDeleted = false AND v.isDeleted = false " +
            "AND d.expiryDate IS NOT NULL AND d.expiryDate < CURRENT_DATE " +
            "ORDER BY d.expiryDate ASC")
    List<VendorDocument> findExpiredDocuments();

    /**
     * Find expired critical documents (TRADE_LICENSE, INSURANCE) for active vendors
     * Used for auto-suspension processing
     *
     * @return List of expired critical documents for active vendors
     */
    @Query("SELECT d FROM VendorDocument d JOIN FETCH d.vendor v " +
            "WHERE d.isDeleted = false AND v.isDeleted = false " +
            "AND v.status = 'ACTIVE' " +
            "AND d.documentType IN ('TRADE_LICENSE', 'INSURANCE') " +
            "AND d.expiryDate IS NOT NULL AND d.expiryDate < CURRENT_DATE")
    List<VendorDocument> findExpiredCriticalDocumentsForActiveVendors();

    // =================================================================
    // NOTIFICATION TRACKING QUERIES
    // =================================================================

    /**
     * Find documents due for 30-day expiry notification (to PM)
     * Documents expiring within 30 days that haven't been notified yet
     *
     * @param notificationDate Target date (typically today + 30 days)
     * @return List of documents pending notification
     */
    @Query("SELECT d FROM VendorDocument d JOIN FETCH d.vendor v " +
            "WHERE d.isDeleted = false AND v.isDeleted = false " +
            "AND d.expiryDate IS NOT NULL " +
            "AND d.expiryDate <= :notificationDate " +
            "AND d.expiryDate >= CURRENT_DATE " +
            "AND d.expiryNotification30Sent = false")
    List<VendorDocument> findDocumentsPending30DayNotification(
            @Param("notificationDate") LocalDate notificationDate);

    /**
     * Find documents due for 15-day expiry notification (to vendor)
     * Documents expiring within 15 days that haven't been notified yet
     *
     * @param notificationDate Target date (typically today + 15 days)
     * @return List of documents pending notification
     */
    @Query("SELECT d FROM VendorDocument d JOIN FETCH d.vendor v " +
            "WHERE d.isDeleted = false AND v.isDeleted = false " +
            "AND d.expiryDate IS NOT NULL " +
            "AND d.expiryDate <= :notificationDate " +
            "AND d.expiryDate >= CURRENT_DATE " +
            "AND d.expiryNotification15Sent = false")
    List<VendorDocument> findDocumentsPending15DayNotification(
            @Param("notificationDate") LocalDate notificationDate);

    // =================================================================
    // COUNT QUERIES
    // =================================================================

    /**
     * Count documents for a vendor (excluding deleted)
     *
     * @param vendorId Vendor UUID
     * @return Document count
     */
    long countByVendorIdAndIsDeletedFalse(UUID vendorId);

    /**
     * Count documents by type for a vendor (excluding deleted)
     *
     * @param vendorId     Vendor UUID
     * @param documentType Document type
     * @return Document count
     */
    long countByVendorIdAndDocumentTypeAndIsDeletedFalse(UUID vendorId, VendorDocumentType documentType);

    /**
     * Count expiring documents across all vendors within days threshold
     *
     * @param expiryDate Expiry date threshold
     * @return Count of expiring documents
     */
    @Query("SELECT COUNT(d) FROM VendorDocument d JOIN d.vendor v " +
            "WHERE d.isDeleted = false AND v.isDeleted = false " +
            "AND d.expiryDate IS NOT NULL AND d.expiryDate <= :expiryDate AND d.expiryDate >= CURRENT_DATE")
    long countExpiringDocuments(@Param("expiryDate") LocalDate expiryDate);

    // =================================================================
    // EXISTENCE CHECKS
    // =================================================================

    /**
     * Check if vendor has a valid (non-expired) document of type
     *
     * @param vendorId     Vendor UUID
     * @param documentType Document type
     * @return True if valid document exists
     */
    @Query("SELECT CASE WHEN COUNT(d) > 0 THEN true ELSE false END FROM VendorDocument d " +
            "WHERE d.vendor.id = :vendorId AND d.documentType = :documentType " +
            "AND d.isDeleted = false " +
            "AND (d.expiryDate IS NULL OR d.expiryDate >= CURRENT_DATE)")
    boolean hasValidDocumentOfType(
            @Param("vendorId") UUID vendorId,
            @Param("documentType") VendorDocumentType documentType);

    /**
     * Check if vendor has any expired critical documents
     *
     * @param vendorId Vendor UUID
     * @return True if any critical document has expired
     */
    @Query("SELECT CASE WHEN COUNT(d) > 0 THEN true ELSE false END FROM VendorDocument d " +
            "WHERE d.vendor.id = :vendorId " +
            "AND d.isDeleted = false " +
            "AND d.documentType IN ('TRADE_LICENSE', 'INSURANCE') " +
            "AND d.expiryDate IS NOT NULL AND d.expiryDate < CURRENT_DATE")
    boolean hasExpiredCriticalDocuments(@Param("vendorId") UUID vendorId);

    /**
     * Check if vendor has all required critical documents that are valid
     * Returns true if both TRADE_LICENSE and INSURANCE exist and are not expired
     *
     * @param vendorId Vendor UUID
     * @return True if vendor has valid critical documents
     */
    @Query("SELECT CASE WHEN COUNT(DISTINCT d.documentType) = 2 THEN true ELSE false END " +
            "FROM VendorDocument d " +
            "WHERE d.vendor.id = :vendorId " +
            "AND d.isDeleted = false " +
            "AND d.documentType IN ('TRADE_LICENSE', 'INSURANCE') " +
            "AND (d.expiryDate IS NULL OR d.expiryDate >= CURRENT_DATE)")
    boolean hasAllValidCriticalDocuments(@Param("vendorId") UUID vendorId);

    // =================================================================
    // BULK OPERATIONS
    // =================================================================

    /**
     * Mark all 30-day notifications as sent for given documents
     * Uses batch update for efficiency
     *
     * @param documentIds List of document IDs
     * @return Number of documents updated
     */
    @Modifying
    @Query("UPDATE VendorDocument d SET d.expiryNotification30Sent = true WHERE d.id IN :documentIds")
    int markNotification30Sent(@Param("documentIds") List<UUID> documentIds);

    /**
     * Mark all 15-day notifications as sent for given documents
     * Uses batch update for efficiency
     *
     * @param documentIds List of document IDs
     * @return Number of documents updated
     */
    @Modifying
    @Query("UPDATE VendorDocument d SET d.expiryNotification15Sent = true WHERE d.id IN :documentIds")
    int markNotification15Sent(@Param("documentIds") List<UUID> documentIds);
}
