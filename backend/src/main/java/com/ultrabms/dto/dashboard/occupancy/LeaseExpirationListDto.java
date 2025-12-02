package com.ultrabms.dto.dashboard.occupancy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for Upcoming Lease Expirations Table (AC-7)
 * Individual lease expiration record with tenant/unit details
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaseExpirationListDto {

    /**
     * Tenant ID for navigation
     */
    private UUID tenantId;

    /**
     * Tenant full name
     */
    private String tenantName;

    /**
     * Unit ID for navigation
     */
    private UUID unitId;

    /**
     * Unit number/identifier
     */
    private String unitNumber;

    /**
     * Property ID for navigation
     */
    private UUID propertyId;

    /**
     * Property name
     */
    private String propertyName;

    /**
     * Lease expiry date
     */
    private LocalDate expiryDate;

    /**
     * Days remaining until expiry (negative if past due)
     */
    private Long daysRemaining;

    /**
     * Whether this lease has been renewed
     */
    private Boolean isRenewed;

    /**
     * Renewal status label (e.g., "Pending", "Renewed", "Expired")
     */
    private String renewalStatus;
}
