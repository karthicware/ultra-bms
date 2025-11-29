package com.ultrabms.dto.compliance;

import com.ultrabms.entity.enums.FineStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for recording a new violation
 * Used in POST /api/v1/violations
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #21: POST /api/v1/violations
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateViolationDto {

    /**
     * Compliance schedule ID (required)
     */
    @NotNull(message = "Compliance schedule ID is required")
    private UUID complianceScheduleId;

    /**
     * Violation date (required)
     */
    @NotNull(message = "Violation date is required")
    private LocalDate violationDate;

    /**
     * Violation description (required)
     */
    @NotBlank(message = "Description is required")
    @Size(max = 1000, message = "Description must be less than 1000 characters")
    private String description;

    /**
     * Fine amount in AED (optional)
     */
    @DecimalMin(value = "0.00", message = "Fine amount must be 0 or greater")
    private BigDecimal fineAmount;

    /**
     * Fine status (defaults to PENDING)
     */
    private FineStatus fineStatus;

    /**
     * Whether to create a remediation work order
     */
    private Boolean createRemediationWorkOrder;
}
