package com.ultrabms.dto.checkout;

import com.ultrabms.entity.enums.DeductionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Request DTO for saving deposit calculation
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveDepositCalculationRequest {

    /**
     * List of deductions
     */
    private List<DeductionDto> deductions;

    /**
     * Reason for manual adjustment (if any)
     */
    @Size(max = 500, message = "Adjustment reason cannot exceed 500 characters")
    private String adjustmentReason;

    /**
     * Individual deduction DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeductionDto {
        @NotNull(message = "Deduction type is required")
        private DeductionType type;

        @Size(max = 200, message = "Description cannot exceed 200 characters")
        private String description;

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.0", message = "Amount cannot be negative")
        private BigDecimal amount;

        @Size(max = 500, message = "Notes cannot exceed 500 characters")
        private String notes;

        private Boolean autoCalculated;

        private UUID invoiceId; // Reference to invoice if applicable
    }
}
