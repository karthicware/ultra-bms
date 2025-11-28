package com.ultrabms.dto.lease;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for current lease summary (read-only section in extension form)
 *
 * Story 3.6: Tenant Lease Extension and Renewal
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurrentLeaseSummaryDto {

    private UUID tenantId;
    private String tenantNumber;
    private String tenantName;
    private String email;

    // Property/Unit
    private String propertyName;
    private String unitNumber;
    private Integer floor;

    // Lease dates
    private LocalDate leaseStartDate;
    private LocalDate leaseEndDate;
    private Integer daysRemaining;
    private String leaseType;

    // Rent breakdown
    private BigDecimal baseRent;
    private BigDecimal serviceCharge;
    private BigDecimal parkingFee;
    private BigDecimal totalMonthlyRent;
    private BigDecimal securityDeposit;

    // Payment
    private String paymentFrequency;
    private Integer paymentDueDate;
}
