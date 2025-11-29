package com.ultrabms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Document version entity for tracking document version history.
 * When a document is replaced, the previous version is archived here.
 *
 * Story 7.2: Document Management System
 *
 * Key features:
 * - Stores file metadata of archived versions
 * - Links to parent Document
 * - Tracks upload user and timestamp
 * - Optional notes for version change reason
 */
@Entity
@Table(
    name = "document_versions",
    indexes = {
        @Index(name = "idx_document_versions_document_id", columnList = "document_id"),
        @Index(name = "idx_document_versions_version_number", columnList = "version_number"),
        @Index(name = "idx_document_versions_uploaded_at", columnList = "uploaded_at")
    }
)
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class DocumentVersion extends BaseEntity {

    // =================================================================
    // DOCUMENT RELATIONSHIP
    // =================================================================

    /**
     * Parent document this version belongs to
     */
    @NotNull(message = "Document cannot be null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    // =================================================================
    // VERSION INFORMATION
    // =================================================================

    /**
     * Version number (1, 2, 3, etc.)
     * This represents the version number at the time this archive was created
     */
    @NotNull(message = "Version number is required")
    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    // =================================================================
    // FILE METADATA
    // =================================================================

    /**
     * Original file name of this version
     */
    @NotBlank(message = "File name is required")
    @Size(max = 255, message = "File name must be less than 255 characters")
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    /**
     * S3 file path for this version
     * Format: /uploads/documents/{entityType}/{entityId}/versions/v{n}_{filename}
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

    // =================================================================
    // AUDIT FIELDS
    // =================================================================

    /**
     * User who uploaded this version
     */
    @NotNull(message = "Uploaded by user is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    /**
     * Timestamp when this version was uploaded
     */
    @NotNull(message = "Uploaded at timestamp is required")
    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    // =================================================================
    // VERSION NOTES
    // =================================================================

    /**
     * Optional notes explaining why this version was created/replaced
     */
    @Size(max = 500, message = "Notes must be less than 500 characters")
    @Column(name = "notes", length = 500)
    private String notes;
}
