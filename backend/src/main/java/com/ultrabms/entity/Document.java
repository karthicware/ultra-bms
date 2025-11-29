package com.ultrabms.entity;

import com.ultrabms.entity.enums.DocumentAccessLevel;
import com.ultrabms.entity.enums.DocumentEntityType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Document entity representing uploaded documents in the centralized document repository.
 * Supports association with multiple entity types (Property, Tenant, Vendor, Asset)
 * or can be a general document.
 *
 * Story 7.2: Document Management System
 *
 * Key features:
 * - Unique document number (DOC-YYYY-NNNN format)
 * - Version management with DocumentVersion for history
 * - Access control levels (PUBLIC, INTERNAL, RESTRICTED)
 * - Expiry tracking with notification support
 * - Soft delete pattern (file retained in S3 for audit)
 */
@Entity
@Table(
    name = "documents",
    indexes = {
        @Index(name = "idx_documents_document_number", columnList = "document_number", unique = true),
        @Index(name = "idx_documents_entity_type", columnList = "entity_type"),
        @Index(name = "idx_documents_entity_id", columnList = "entity_id"),
        @Index(name = "idx_documents_expiry_date", columnList = "expiry_date"),
        @Index(name = "idx_documents_access_level", columnList = "access_level"),
        @Index(name = "idx_documents_is_deleted", columnList = "is_deleted"),
        @Index(name = "idx_documents_uploaded_by", columnList = "uploaded_by")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Document extends BaseEntity {

    // =================================================================
    // DOCUMENT NUMBER
    // =================================================================

    /**
     * Unique document number with format: DOC-YYYY-NNNN
     * Example: DOC-2025-0001
     */
    @NotBlank(message = "Document number is required")
    @Size(max = 20, message = "Document number must be less than 20 characters")
    @Column(name = "document_number", nullable = false, unique = true, length = 20)
    private String documentNumber;

    // =================================================================
    // DOCUMENT TYPE AND TITLE
    // =================================================================

    /**
     * Document type (free text, e.g., "Lease Agreement", "Insurance Certificate")
     */
    @NotBlank(message = "Document type is required")
    @Size(max = 100, message = "Document type must be less than 100 characters")
    @Column(name = "document_type", nullable = false, length = 100)
    private String documentType;

    /**
     * Document title
     */
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be less than 200 characters")
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    /**
     * Optional description
     */
    @Size(max = 500, message = "Description must be less than 500 characters")
    @Column(name = "description", length = 500)
    private String description;

    // =================================================================
    // FILE METADATA
    // =================================================================

    /**
     * Original file name as uploaded by user
     */
    @NotBlank(message = "File name is required")
    @Size(max = 255, message = "File name must be less than 255 characters")
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    /**
     * S3 file path (full path in S3 bucket)
     * Format: /uploads/documents/{entityType}/{entityId}/{filename}
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
    // ENTITY ASSOCIATION
    // =================================================================

    /**
     * Entity type (PROPERTY, TENANT, VENDOR, ASSET, GENERAL)
     */
    @NotNull(message = "Entity type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 20)
    private DocumentEntityType entityType;

    /**
     * Entity ID (UUID of the associated property/tenant/vendor/asset)
     * Nullable for GENERAL documents
     */
    @Column(name = "entity_id")
    private UUID entityId;

    // =================================================================
    // EXPIRY INFORMATION
    // =================================================================

    /**
     * Document expiry date (optional)
     */
    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    // =================================================================
    // TAGS (JSON ARRAY)
    // =================================================================

    /**
     * Tags for categorization (stored as JSON array)
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tags", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    // =================================================================
    // ACCESS CONTROL
    // =================================================================

    /**
     * Access level (PUBLIC, INTERNAL, RESTRICTED)
     */
    @NotNull(message = "Access level is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "access_level", nullable = false, length = 20)
    @Builder.Default
    private DocumentAccessLevel accessLevel = DocumentAccessLevel.PUBLIC;

    // =================================================================
    // VERSION TRACKING
    // =================================================================

    /**
     * Current version number (starts at 1, increments on replace)
     */
    @Column(name = "version_number", nullable = false)
    @Builder.Default
    private Integer versionNumber = 1;

    /**
     * Version history (archived versions when document is replaced)
     */
    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DocumentVersion> versionHistory = new ArrayList<>();

    // =================================================================
    // AUDIT FIELDS
    // =================================================================

    /**
     * User who uploaded the document
     */
    @NotNull(message = "Uploaded by user is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

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
     * Flag indicating if expiry notification was sent
     */
    @Column(name = "expiry_notification_sent", nullable = false)
    @Builder.Default
    private Boolean expiryNotificationSent = false;

    // =================================================================
    // CALCULATED FIELDS (Not persisted)
    // =================================================================

    /**
     * Expiry status enum for API responses
     */
    public enum ExpiryStatus {
        VALID,
        EXPIRING_SOON,
        EXPIRED,
        NO_EXPIRY
    }

    /**
     * Calculate expiry status based on current date
     *
     * @return NO_EXPIRY if no expiry date,
     *         VALID if > 30 days until expiry,
     *         EXPIRING_SOON if <= 30 days until expiry,
     *         EXPIRED if past expiry date
     */
    @Transient
    public ExpiryStatus getExpiryStatus() {
        if (expiryDate == null) {
            return ExpiryStatus.NO_EXPIRY;
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
        Long days = getDaysUntilExpiry();
        return days != null && days >= 0 && days <= 30;
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
     * Mark expiry notification as sent
     */
    public void markExpiryNotificationSent() {
        this.expiryNotificationSent = true;
    }

    /**
     * Increment version number (called when document is replaced)
     */
    public void incrementVersion() {
        this.versionNumber = this.versionNumber + 1;
    }

    /**
     * Add a version to history
     *
     * @param version the version to add
     */
    public void addVersionToHistory(DocumentVersion version) {
        this.versionHistory.add(version);
        version.setDocument(this);
    }
}
