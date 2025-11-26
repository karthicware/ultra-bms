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
 * DTO for vendor document list item (summary view)
 * Used in GET /api/v1/vendors/{vendorId}/documents
 *
 * Story 5.2: Vendor Document and License Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorDocumentListDto {

    /**
     * Document UUID
     */
    private UUID id;

    /**
     * Document type
     */
    private VendorDocumentType documentType;

    /**
     * Original file name
     */
    private String fileName;

    /**
     * File size in bytes
     */
    private Long fileSize;

    /**
     * Document expiry date
     */
    private LocalDate expiryDate;

    /**
     * Calculated expiry status (VALID, EXPIRING_SOON, EXPIRED)
     */
    private ExpiryStatus expiryStatus;

    /**
     * Days until expiry (negative if expired, null if no expiry)
     */
    private Long daysUntilExpiry;

    /**
     * Timestamp when document was uploaded
     */
    private LocalDateTime uploadedAt;
}
