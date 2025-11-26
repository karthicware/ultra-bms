package com.ultrabms.dto.vendors;

import com.ultrabms.entity.enums.VendorStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating vendor status
 * Used in PATCH /api/v1/vendors/{id}/status
 *
 * Story 5.1: Vendor Registration and Profile Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateVendorStatusDto {

    /**
     * New vendor status
     */
    @NotNull(message = "Status is required")
    private VendorStatus status;
}
