package com.ultrabms.dto.checkout;

import com.ultrabms.entity.enums.DeductionType;
import com.ultrabms.entity.enums.RefundMethod;
import com.ultrabms.entity.enums.RefundStatus;
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
 * Response DTO for deposit refund details
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepositRefundDto {

    private UUID id;
    private UUID checkoutId;

    // Amounts
    private BigDecimal originalDeposit;
    private List<DeductionDto> deductions;
    private BigDecimal totalDeductions;
    private BigDecimal netRefund;
    private BigDecimal amountOwedByTenant;

    // Refund method
    private RefundMethod refundMethod;
    private LocalDate refundDate;
    private String refundReference;

    // Bank transfer details (masked IBAN)
    private String bankName;
    private String accountHolderName;
    private String maskedIban;
    private String swiftCode;

    // Cheque details
    private String chequeNumber;
    private LocalDate chequeDate;

    // Status
    private RefundStatus refundStatus;
    private String approvedByName;
    private LocalDateTime approvedAt;
    private LocalDateTime processedAt;
    private String transactionId;
    private String notes;

    // Documents
    private Boolean hasReceipt;

    // Audit
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Deduction DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeductionDto {
        private DeductionType type;
        private String description;
        private BigDecimal amount;
        private String notes;
        private Boolean autoCalculated;
        private UUID invoiceId;
    }
}
