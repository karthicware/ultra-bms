package com.ultrabms.dto.documents;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for document version response
 * Used in GET /api/v1/documents/{id}/versions
 *
 * Story 7.2: Document Management System
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentVersionDto {

    /**
     * Version UUID
     */
    private UUID id;

    /**
     * Parent document UUID
     */
    private UUID documentId;

    /**
     * Version number (1, 2, 3, etc.)
     */
    private Integer versionNumber;

    /**
     * Original file name of this version
     */
    private String fileName;

    /**
     * S3 file path for this version
     */
    private String filePath;

    /**
     * File size in bytes
     */
    private Long fileSize;

    /**
     * User ID who uploaded this version
     */
    private UUID uploadedBy;

    /**
     * Uploader's display name
     */
    private String uploaderName;

    /**
     * Timestamp when this version was uploaded
     */
    private LocalDateTime uploadedAt;

    /**
     * Optional notes explaining the version change
     */
    private String notes;

    /**
     * Presigned S3 URL for download (generated on request)
     */
    private String downloadUrl;
}
