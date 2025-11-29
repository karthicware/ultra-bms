package com.ultrabms.dto.documents;

import com.ultrabms.entity.Document.ExpiryStatus;
import com.ultrabms.entity.enums.DocumentAccessLevel;
import com.ultrabms.entity.enums.DocumentEntityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for document response (full detail)
 * Used in POST/GET/PUT /api/v1/documents/{id}
 *
 * Story 7.2: Document Management System
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDto {

    /**
     * Document UUID
     */
    private UUID id;

    /**
     * Unique document number (DOC-YYYY-NNNN)
     */
    private String documentNumber;

    /**
     * Document type (free text)
     */
    private String documentType;

    /**
     * Document title
     */
    private String title;

    /**
     * Optional description
     */
    private String description;

    /**
     * Original file name as uploaded
     */
    private String fileName;

    /**
     * S3 file path (for internal use)
     */
    private String filePath;

    /**
     * File size in bytes
     */
    private Long fileSize;

    /**
     * MIME type of the file
     */
    private String fileType;

    /**
     * Entity type (PROPERTY, TENANT, VENDOR, ASSET, GENERAL)
     */
    private DocumentEntityType entityType;

    /**
     * Entity UUID (null for GENERAL documents)
     */
    private UUID entityId;

    /**
     * Entity name (resolved from entity)
     */
    private String entityName;

    /**
     * Document expiry date (null for documents without expiry)
     */
    private LocalDate expiryDate;

    /**
     * Calculated expiry status
     */
    private ExpiryStatus expiryStatus;

    /**
     * Days until expiry (negative if expired, null if no expiry date)
     */
    private Long daysUntilExpiry;

    /**
     * Tags for categorization
     */
    private List<String> tags;

    /**
     * Access level (PUBLIC, INTERNAL, RESTRICTED)
     */
    private DocumentAccessLevel accessLevel;

    /**
     * Current version number
     */
    private Integer versionNumber;

    /**
     * Total number of archived versions
     */
    private Integer versionCount;

    /**
     * User ID who uploaded the document
     */
    private UUID uploadedBy;

    /**
     * Uploader's display name
     */
    private String uploaderName;

    /**
     * Timestamp when document was uploaded
     */
    private LocalDateTime uploadedAt;

    /**
     * Timestamp when document was last updated
     */
    private LocalDateTime updatedAt;

    /**
     * Presigned S3 URL for download (generated on request)
     */
    private String downloadUrl;

    /**
     * Presigned S3 URL for preview (generated on request)
     */
    private String previewUrl;
}
