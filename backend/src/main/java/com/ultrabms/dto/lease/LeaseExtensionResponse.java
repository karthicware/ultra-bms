package com.ultrabms.dto.lease;

import com.ultrabms.entity.enums.LeaseExtensionStatus;
import com.ultrabms.entity.enums.RentAdjustmentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for lease extension details
 *
 * Story 3.6: Tenant Lease Extension and Renewal
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaseExtensionResponse {

    private UUID id;
    private String extensionNumber;

    // Tenant info
    private UUID tenantId;
    private String tenantNumber;
    private String tenantName;
    private String propertyName;
    private String unitNumber;

    // Date fields
    private LocalDate previousEndDate;
    private LocalDate newEndDate;
    private LocalDate effectiveDate;
    private Integer extensionMonths;

    // Rent fields
    private BigDecimal previousRent;
    private BigDecimal newRent;
    private RentAdjustmentType adjustmentType;
    private BigDecimal adjustmentValue;
    private BigDecimal adjustmentPercentage;

    // Terms
    private String renewalType;
    private Boolean autoRenewal;
    private String specialTerms;
    private Integer paymentDueDate;

    // Workflow
    private LeaseExtensionStatus status;
    private String approvedByName;
    private LocalDateTime approvedAt;
    private String rejectionReason;
    private LocalDateTime appliedAt;

    // Document
    private String amendmentDocumentPath;
    private String amendmentPdfUrl;

    // Audit
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String extendedByName;
}
