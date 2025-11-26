package com.ultrabms.dto.vendordocuments;

import com.ultrabms.entity.VendorDocument.ExpiryStatus;
import com.ultrabms.entity.enums.VendorDocumentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for vendor document response (full detail)
 * Used in POST/GET/PUT /api/v1/vendors/{vendorId}/documents/{id}
 *
 * Story 5.2: Vendor Document and License Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorDocumentDto {

    /**
     * Document UUID
     */
    private UUID id;

    /**
     * Vendor UUID this document belongs to
     */
    private UUID vendorId;

    /**
     * Document type
     */
    private VendorDocumentType documentType;

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
     * Document expiry date (null for documents without expiry)
     */
    private LocalDate expiryDate;

    /**
     * Calculated expiry status (VALID, EXPIRING_SOON, EXPIRED)
     */
    private ExpiryStatus expiryStatus;

    /**
     * Days until expiry (negative if expired, null if no expiry date)
     */
    private Long daysUntilExpiry;

    /**
     * Optional notes about the document
     */
    private String notes;

    /**
     * User ID who uploaded the document
     */
    private UUID uploadedBy;

    /**
     * Timestamp when document was uploaded
     */
    private LocalDateTime uploadedAt;

    /**
     * Presigned S3 URL for download (generated on request)
     */
    private String downloadUrl;
}
