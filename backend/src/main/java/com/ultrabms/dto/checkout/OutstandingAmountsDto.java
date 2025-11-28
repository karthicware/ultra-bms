package com.ultrabms.dto.checkout;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * DTO for tenant outstanding amounts breakdown
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutstandingAmountsDto {

    private UUID tenantId;
    private String tenantName;

    // Invoice breakdown
    private List<OutstandingInvoiceDto> outstandingInvoices;
    private BigDecimal totalOutstandingRent;
    private BigDecimal totalLateFees;

    // Damage charges (from inspection if available)
    private BigDecimal damageCharges;

    // Early termination fee (if applicable)
    private BigDecimal earlyTerminationFee;

    // Summary
    private BigDecimal grandTotal;

    /**
     * Individual outstanding invoice
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OutstandingInvoiceDto {
        private UUID id;
        private String invoiceNumber;
        private LocalDate dueDate;
        private BigDecimal amount;
        private BigDecimal amountPaid;
        private BigDecimal balance;
        private String description;
        private String status;
    }
}
