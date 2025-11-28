package com.ultrabms.dto.lease;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for tenant submitting a renewal request
 *
 * Story 3.6: Tenant Lease Extension and Renewal
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RenewalRequestDto {

    /**
     * Preferred renewal term (12_MONTHS, 24_MONTHS, OTHER)
     */
    @NotBlank(message = "Preferred term is required")
    @Size(max = 20, message = "Preferred term must be less than 20 characters")
    private String preferredTerm;

    /**
     * Optional comments from tenant
     */
    @Size(max = 500, message = "Comments cannot exceed 500 characters")
    private String comments;
}
