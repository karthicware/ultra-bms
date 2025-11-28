package com.ultrabms.dto.lease;

import com.ultrabms.entity.enums.RenewalRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for renewal request details
 *
 * Story 3.6: Tenant Lease Extension and Renewal
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RenewalRequestResponse {

    private UUID id;
    private String requestNumber;

    // Tenant info
    private UUID tenantId;
    private String tenantNumber;
    private String tenantName;
    private String tenantEmail;
    private String propertyName;
    private String unitNumber;

    // Request details
    private LocalDateTime requestedAt;
    private String preferredTerm;
    private String comments;

    // Workflow
    private RenewalRequestStatus status;
    private String rejectedReason;
    private LocalDateTime processedAt;
    private String processedByName;

    // Conversion tracking
    private UUID leaseExtensionId;
    private String leaseExtensionNumber;

    // Lease info for context
    private String leaseEndDate;
    private Integer daysUntilExpiry;

    // Audit
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
