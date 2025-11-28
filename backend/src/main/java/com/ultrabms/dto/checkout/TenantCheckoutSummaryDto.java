package com.ultrabms.dto.checkout;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for tenant summary during checkout initiation
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantCheckoutSummaryDto {

    // Tenant info
    private UUID tenantId;
    private String tenantNumber;
    private String tenantName;
    private String email;
    private String phone;

    // Property/Unit info
    private UUID propertyId;
    private String propertyName;
    private UUID unitId;
    private String unitNumber;
    private Integer floor;

    // Lease info
    private LocalDate leaseStartDate;
    private LocalDate leaseEndDate;
    private Integer daysUntilLeaseEnd;
    private String leaseType;

    // Financial info
    private BigDecimal monthlyRent;
    private BigDecimal securityDeposit;
    private BigDecimal outstandingBalance;

    // Status
    private String status;
    private Boolean hasActiveCheckout;
}
