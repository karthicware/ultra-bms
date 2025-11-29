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
import java.util.UUID;

/**
 * DTO for document list response (compact for tables)
 * Used in GET /api/v1/documents
 *
 * Story 7.2: Document Management System
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentListDto {

    /**
     * Document UUID
     */
    private UUID id;

    /**
     * Unique document number (DOC-YYYY-NNNN)
     */
    private String documentNumber;

    /**
     * Document title
     */
    private String title;

    /**
     * Document type (free text)
     */
    private String documentType;

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
     * Original file name
     */
    private String fileName;

    /**
     * File size in bytes
     */
    private Long fileSize;

    /**
     * MIME type of the file
     */
    private String fileType;

    /**
     * Document expiry date
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
     * Access level
     */
    private DocumentAccessLevel accessLevel;

    /**
     * Current version number
     */
    private Integer versionNumber;

    /**
     * Timestamp when document was uploaded
     */
    private LocalDateTime uploadedAt;
}
