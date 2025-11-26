package com.ultrabms.dto.vendors;

import com.ultrabms.entity.enums.VendorStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO for vendor status update response
 * Used in PATCH /api/v1/vendors/{id}/status response
 *
 * Story 5.1: Vendor Registration and Profile Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorStatusResponseDto {

    /**
     * Vendor ID
     */
    private UUID id;

    /**
     * New vendor status
     */
    private VendorStatus status;

    /**
     * Previous vendor status
     */
    private VendorStatus previousStatus;
}
