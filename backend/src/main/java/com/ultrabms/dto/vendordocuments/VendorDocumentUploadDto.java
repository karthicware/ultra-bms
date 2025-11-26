package com.ultrabms.dto.vendordocuments;

import com.ultrabms.entity.enums.VendorDocumentType;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for uploading a vendor document
 * Used in POST /api/v1/vendors/{vendorId}/documents
 *
 * File is handled separately as multipart/form-data
 *
 * Story 5.2: Vendor Document and License Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorDocumentUploadDto {

    /**
     * Document type (required)
     * TRADE_LICENSE, INSURANCE, CERTIFICATION, ID_COPY
     */
    @NotNull(message = "Document type is required")
    private VendorDocumentType documentType;

    /**
     * Document expiry date (required for TRADE_LICENSE and INSURANCE)
     * Must be a future date for new uploads
     */
    @Future(message = "Expiry date must be in the future")
    private LocalDate expiryDate;

    /**
     * Optional notes about the document (max 200 chars)
     */
    @Size(max = 200, message = "Notes must be less than 200 characters")
    private String notes;
}
