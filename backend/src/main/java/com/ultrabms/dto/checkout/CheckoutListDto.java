package com.ultrabms.dto.checkout;

import com.ultrabms.entity.enums.CheckoutReason;
import com.ultrabms.entity.enums.CheckoutStatus;
import com.ultrabms.entity.enums.RefundStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for checkout list view (minimal data)
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutListDto {

    private UUID id;
    private String checkoutNumber;

    // Tenant
    private UUID tenantId;
    private String tenantNumber;
    private String tenantName;

    // Property/Unit
    private String propertyName;
    private String unitNumber;

    // Dates
    private LocalDate expectedMoveOutDate;
    private CheckoutReason checkoutReason;

    // Financial
    private BigDecimal securityDeposit;
    private BigDecimal netRefund;
    private RefundStatus refundStatus;

    // Status
    private CheckoutStatus status;
    private LocalDateTime createdAt;
}
