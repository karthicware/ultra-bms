package com.ultrabms.dto.vendordocuments;

import com.ultrabms.entity.enums.VendorDocumentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for expiring document alerts
 * Used in GET /api/v1/vendors/expiring-documents
 * Includes vendor information for context
 *
 * Story 5.2: Vendor Document and License Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpiringDocumentDto {

    /**
     * Document UUID
     */
    private UUID id;

    /**
     * Vendor UUID
     */
    private UUID vendorId;

    /**
     * Vendor number (e.g., VND-2025-0001)
     */
    private String vendorNumber;

    /**
     * Vendor company name
     */
    private String companyName;

    /**
     * Document type
     */
    private VendorDocumentType documentType;

    /**
     * Original file name
     */
    private String fileName;

    /**
     * Document expiry date
     */
    private LocalDate expiryDate;

    /**
     * Days until expiry (negative if expired)
     */
    private Long daysUntilExpiry;

    /**
     * Whether this is a critical document (TRADE_LICENSE or INSURANCE)
     */
    private Boolean isCritical;
}
