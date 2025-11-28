package com.ultrabms.dto.lease;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for rejecting a renewal request
 *
 * Story 3.6: Tenant Lease Extension and Renewal
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RejectRenewalRequestDto {

    /**
     * Reason for rejection (required)
     */
    @NotBlank(message = "Rejection reason is required")
    @Size(min = 10, max = 500, message = "Rejection reason must be between 10 and 500 characters")
    private String reason;
}
