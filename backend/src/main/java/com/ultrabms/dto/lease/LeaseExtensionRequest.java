package com.ultrabms.dto.lease;

import com.ultrabms.entity.enums.RentAdjustmentType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request DTO for creating/submitting a lease extension
 *
 * Story 3.6: Tenant Lease Extension and Renewal
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaseExtensionRequest {

    /**
     * New lease end date (must be after current end date)
     */
    @NotNull(message = "New end date is required")
    @Future(message = "New end date must be in the future")
    private LocalDate newEndDate;

    /**
     * Type of rent adjustment
     */
    @NotNull(message = "Rent adjustment type is required")
    private RentAdjustmentType rentAdjustmentType;

    /**
     * Adjustment value (percentage or flat amount based on type)
     * For PERCENTAGE: 0-100
     * For FLAT: amount in AED
     * For CUSTOM: new rent amount
     */
    @DecimalMin(value = "0.0", message = "Adjustment value cannot be negative")
    private BigDecimal adjustmentValue;

    /**
     * New renewal type (optional - keeps current if not specified)
     */
    @Size(max = 20, message = "Renewal type must be less than 20 characters")
    private String renewalType;

    /**
     * Enable auto-renewal at end of term
     */
    private Boolean autoRenewal;

    /**
     * Special terms or conditions
     */
    @Size(max = 2000, message = "Special terms cannot exceed 2000 characters")
    private String specialTerms;

    /**
     * Updated payment due date (day of month)
     */
    @Min(value = 1, message = "Payment due date must be between 1 and 28")
    @Max(value = 28, message = "Payment due date must be between 1 and 28")
    private Integer paymentDueDate;
}
