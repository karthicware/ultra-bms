package com.ultrabms.dto.checkout;

import com.ultrabms.entity.enums.CheckoutReason;
import com.ultrabms.entity.enums.CheckoutStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for tenant checkout
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutResponse {

    // Identification
    private UUID id;
    private String checkoutNumber;

    // Tenant info
    private UUID tenantId;
    private String tenantNumber;
    private String tenantName;
    private String tenantEmail;
    private String tenantPhone;

    // Property/Unit info
    private UUID propertyId;
    private String propertyName;
    private UUID unitId;
    private String unitNumber;
    private Integer floor;

    // Notice details
    private LocalDate noticeDate;
    private LocalDate expectedMoveOutDate;
    private LocalDate actualMoveOutDate;
    private CheckoutReason checkoutReason;
    private String reasonNotes;

    // Lease info
    private LocalDate leaseStartDate;
    private LocalDate leaseEndDate;
    private Boolean isEarlyTermination;
    private BigDecimal monthlyRent;
    private BigDecimal securityDeposit;

    // Inspection details
    private LocalDate inspectionDate;
    private String inspectionTime;
    private UUID inspectorId;
    private String inspectorName;
    private Integer overallCondition;
    private String inspectionNotes;
    private Boolean hasInspectionChecklist;
    private Integer photoCount;

    // Detailed inspection data (for PDF generation)
    private List<Object> inspectionChecklist;
    private List<Object> inspectionPhotos;

    // Checkout date alias for PDF
    public LocalDate getCheckoutDate() {
        return actualMoveOutDate != null ? actualMoveOutDate : expectedMoveOutDate;
    }

    // Deposit refund summary (if calculated)
    private UUID depositRefundId;
    private BigDecimal originalDeposit;
    private BigDecimal totalDeductions;
    private BigDecimal netRefund;
    private BigDecimal amountOwedByTenant;

    // Settlement
    private String settlementType;
    private String settlementNotes;

    // Status
    private CheckoutStatus status;
    private LocalDateTime completedAt;
    private String completedByName;

    // Documents
    private Boolean hasInspectionReport;
    private Boolean hasDepositStatement;
    private Boolean hasFinalSettlement;

    // Audit
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdByName;
}
