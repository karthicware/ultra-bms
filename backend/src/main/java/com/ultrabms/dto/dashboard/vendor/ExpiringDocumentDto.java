package com.ultrabms.dto.dashboard.vendor;

import com.ultrabms.entity.enums.VendorDocumentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for Vendors with Expiring Documents table (AC-7)
 *
 * Story 8.5: Vendor Dashboard
 *
 * Table columns: Vendor Name, Document Type, Expiry Date, Days Until Expiry
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpiringDocumentDto {

    /**
     * Document ID
     */
    private UUID documentId;

    /**
     * Vendor ID for navigation
     */
    private UUID vendorId;

    /**
     * Vendor company name
     */
    private String vendorName;

    /**
     * Type of document expiring
     */
    private VendorDocumentType documentType;

    /**
     * Display name for the document type
     */
    private String documentTypeName;

    /**
     * Document expiry date
     */
    private LocalDate expiryDate;

    /**
     * Days until expiry (can be negative if already expired)
     */
    private Long daysUntilExpiry;

    /**
     * Whether this is a critical document (TRADE_LICENSE, INSURANCE)
     */
    private Boolean isCritical;
}
