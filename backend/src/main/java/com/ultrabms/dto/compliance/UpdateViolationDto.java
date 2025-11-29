package com.ultrabms.dto.compliance;

import com.ultrabms.entity.enums.FineStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for updating a violation
 * Used in PUT /api/v1/violations/{id}
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #22: PUT /api/v1/violations/{id}
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateViolationDto {

    /**
     * Violation description
     */
    @Size(max = 1000, message = "Description must be less than 1000 characters")
    private String description;

    /**
     * Fine amount in AED
     */
    @DecimalMin(value = "0.00", message = "Fine amount must be 0 or greater")
    private BigDecimal fineAmount;

    /**
     * Fine status
     */
    private FineStatus fineStatus;

    /**
     * Resolution date
     */
    private LocalDate resolutionDate;

    /**
     * Link to remediation work order
     */
    private UUID remediationWorkOrderId;
}
