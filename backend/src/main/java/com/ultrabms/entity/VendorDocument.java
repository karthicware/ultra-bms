package com.ultrabms.entity;

import com.ultrabms.entity.enums.VendorDocumentType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Vendor document entity representing uploaded documents for vendors.
 * Stores metadata about compliance documents (trade license, insurance, certifications)
 * uploaded to S3 storage.
 *
 * Story 5.2: Vendor Document and License Management
 *
 * Key features:
 * - Tracks document type, file metadata, and expiry information
 * - Supports soft delete pattern (file retained in S3 for audit)
 * - Calculates expiry status dynamically (valid, expiring_soon, expired)
 * - Critical documents (TRADE_LICENSE, INSURANCE) affect vendor status when expired
 */
@Entity
@Table(
    name = "vendor_documents",
    indexes = {
        @Index(name = "idx_vendor_documents_vendor_id", columnList = "vendor_id"),
        @Index(name = "idx_vendor_documents_document_type", columnList = "document_type"),
        @Index(name = "idx_vendor_documents_expiry_date", columnList = "expiry_date"),
        @Index(name = "idx_vendor_documents_is_deleted", columnList = "is_deleted")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class VendorDocument extends BaseEntity {

    // =================================================================
    // VENDOR RELATIONSHIP
    // =================================================================

    /**
     * Vendor this document belongs to
     */
    @NotNull(message = "Vendor cannot be null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    // =================================================================
    // DOCUMENT TYPE AND METADATA
    // =================================================================

    /**
     * Document type (TRADE_LICENSE, INSURANCE, CERTIFICATION, ID_COPY)
     */
    @NotNull(message = "Document type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 20)
    private VendorDocumentType documentType;

    /**
     * Original file name as uploaded by user
     */
    @NotBlank(message = "File name is required")
    @Size(max = 255, message = "File name must be less than 255 characters")
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    /**
     * S3 file path (full path in S3 bucket)
     * Format: /vendors/{vendorId}/documents/{uuid}-{fileName}
     */
    @NotBlank(message = "File path is required")
    @Size(max = 500, message = "File path must be less than 500 characters")
    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    /**
     * File size in bytes
     */
    @NotNull(message = "File size is required")
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /**
     * MIME type of the file (application/pdf, image/jpeg, etc.)
     */
    @NotBlank(message = "File type is required")
    @Size(max = 100, message = "File type must be less than 100 characters")
    @Column(name = "file_type", nullable = false, length = 100)
    private String fileType;

    // =================================================================
    // EXPIRY INFORMATION
    // =================================================================

    /**
     * Document expiry date (required for TRADE_LICENSE and INSURANCE)
     * Optional for CERTIFICATION and ID_COPY
     */
    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    /**
     * Optional notes about the document (max 200 chars)
     */
    @Size(max = 200, message = "Notes must be less than 200 characters")
    @Column(name = "notes", length = 200)
    private String notes;

    // =================================================================
    // AUDIT FIELDS
    // =================================================================

    /**
     * User ID who uploaded this document
     */
    @NotNull(message = "Uploaded by user is required")
    @Column(name = "uploaded_by", nullable = false)
    private UUID uploadedBy;

    /**
     * Timestamp when document was uploaded
     */
    @NotNull(message = "Uploaded at timestamp is required")
    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    // =================================================================
    // SOFT DELETE FIELDS
    // =================================================================

    /**
     * Soft delete flag (file retained in S3 for audit)
     */
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    /**
     * Timestamp when the document was soft deleted
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /**
     * User ID who performed the soft delete
     */
    @Column(name = "deleted_by")
    private UUID deletedBy;

    // =================================================================
    // EXPIRY NOTIFICATION TRACKING
    // =================================================================

    /**
     * Flag indicating if 30-day expiry notification was sent to PM
     */
    @Column(name = "expiry_notification_30_sent", nullable = false)
    @Builder.Default
    private Boolean expiryNotification30Sent = false;

    /**
     * Flag indicating if 15-day expiry notification was sent to vendor
     */
    @Column(name = "expiry_notification_15_sent", nullable = false)
    @Builder.Default
    private Boolean expiryNotification15Sent = false;

    // =================================================================
    // CALCULATED FIELDS (Not persisted)
    // =================================================================

    /**
     * Expiry status enum for API responses
     */
    public enum ExpiryStatus {
        VALID,
        EXPIRING_SOON,
        EXPIRED
    }

    /**
     * Calculate expiry status based on current date
     *
     * @return VALID if > 30 days until expiry or no expiry,
     *         EXPIRING_SOON if <= 30 days until expiry,
     *         EXPIRED if past expiry date
     */
    @Transient
    public ExpiryStatus getExpiryStatus() {
        if (expiryDate == null) {
            return ExpiryStatus.VALID;
        }

        LocalDate today = LocalDate.now();
        long daysUntilExpiry = ChronoUnit.DAYS.between(today, expiryDate);

        if (daysUntilExpiry < 0) {
            return ExpiryStatus.EXPIRED;
        } else if (daysUntilExpiry <= 30) {
            return ExpiryStatus.EXPIRING_SOON;
        }
        return ExpiryStatus.VALID;
    }

    /**
     * Calculate days until expiry
     *
     * @return number of days until expiry (negative if expired), null if no expiry date
     */
    @Transient
    public Long getDaysUntilExpiry() {
        if (expiryDate == null) {
            return null;
        }
        return ChronoUnit.DAYS.between(LocalDate.now(), expiryDate);
    }

    /**
     * Check if document has expired
     *
     * @return true if document has an expiry date and it's in the past
     */
    @Transient
    public boolean isExpired() {
        return expiryDate != null && expiryDate.isBefore(LocalDate.now());
    }

    /**
     * Check if document is expiring soon (within 30 days)
     *
     * @return true if document expires within 30 days
     */
    @Transient
    public boolean isExpiringSoon() {
        if (expiryDate == null) {
            return false;
        }
        long days = getDaysUntilExpiry();
        return days >= 0 && days <= 30;
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    /**
     * Perform soft delete
     *
     * @param deletedByUserId the user performing the deletion
     */
    public void softDelete(UUID deletedByUserId) {
        this.isDeleted = true;
        this.deletedAt = LocalDateTime.now();
        this.deletedBy = deletedByUserId;
    }

    /**
     * Check if this is a critical document type that affects vendor status
     *
     * @return true if document type is TRADE_LICENSE or INSURANCE
     */
    @Transient
    public boolean isCriticalDocument() {
        return documentType != null && documentType.isCritical();
    }

    /**
     * Mark 30-day notification as sent
     */
    public void mark30DayNotificationSent() {
        this.expiryNotification30Sent = true;
    }

    /**
     * Mark 15-day notification as sent
     */
    public void mark15DayNotificationSent() {
        this.expiryNotification15Sent = true;
    }
}
