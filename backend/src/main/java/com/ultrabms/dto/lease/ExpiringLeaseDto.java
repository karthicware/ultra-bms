package com.ultrabms.dto.lease;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for expiring lease information
 *
 * Story 3.6: Tenant Lease Extension and Renewal
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpiringLeaseDto {

    private UUID tenantId;
    private String tenantNumber;
    private String tenantName;
    private String email;
    private String phone;

    private UUID propertyId;
    private String propertyName;

    private UUID unitId;
    private String unitNumber;
    private Integer floor;

    private LocalDate leaseStartDate;
    private LocalDate leaseEndDate;
    private Integer daysRemaining;
    private String status;

    private BigDecimal currentRent;

    // Notification tracking
    private Boolean notifiedAt60Days;
    private Boolean notifiedAt30Days;
    private Boolean notifiedAt14Days;

    // Pending renewal request
    private Boolean hasPendingRenewalRequest;
    private UUID renewalRequestId;
}
