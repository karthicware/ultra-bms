package com.ultrabms.entity;

import com.ultrabms.entity.enums.AssetDocumentType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * AssetDocument entity representing documents attached to assets.
 * Documents are stored in S3 with metadata in the database.
 *
 * Story 7.1: Asset Registry and Tracking
 * AC #5: AssetDocument entity with documentType enum
 */
@Entity
@Table(name = "asset_documents", indexes = {
    @Index(name = "idx_asset_documents_asset_id", columnList = "asset_id"),
    @Index(name = "idx_asset_documents_document_type", columnList = "document_type")
})
@Data
@Builder
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class AssetDocument extends BaseEntity {

    /**
     * Asset this document belongs to
     */
    @NotNull(message = "Asset ID cannot be null")
    @Column(name = "asset_id", nullable = false)
    private UUID assetId;

    /**
     * Asset entity reference (lazy loaded)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", insertable = false, updatable = false)
    private Asset asset;

    /**
     * Type of document
     */
    @NotNull(message = "Document type cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 30)
    private AssetDocumentType documentType;

    /**
     * Original file name
     */
    @NotNull(message = "File name cannot be null")
    @Size(min = 1, max = 255, message = "File name must be between 1 and 255 characters")
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    /**
     * S3 storage path (e.g., /uploads/assets/{assetId}/documents/{filename})
     */
    @NotNull(message = "File path cannot be null")
    @Size(min = 1, max = 500, message = "File path must be between 1 and 500 characters")
    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    /**
     * File size in bytes
     */
    @NotNull(message = "File size cannot be null")
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /**
     * Content type (MIME type)
     */
    @Size(max = 100, message = "Content type must be less than 100 characters")
    @Column(name = "content_type", length = 100)
    private String contentType;

    /**
     * User who uploaded this document
     */
    @NotNull(message = "Uploaded by cannot be null")
    @Column(name = "uploaded_by", nullable = false)
    private UUID uploadedBy;

    /**
     * Timestamp when document was uploaded
     */
    @NotNull(message = "Uploaded at cannot be null")
    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    /**
     * User entity reference for uploader (lazy loaded)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", insertable = false, updatable = false)
    private User uploader;
}
