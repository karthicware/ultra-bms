package com.ultrabms.dto.checkout;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Request DTO for completing tenant checkout
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompleteCheckoutRequest {

    /**
     * Settlement type (FULL or PARTIAL)
     */
    @NotNull(message = "Settlement type is required")
    private String settlementType;

    /**
     * Settlement notes
     */
    @Size(max = 1000, message = "Settlement notes cannot exceed 1000 characters")
    private String settlementNotes;

    /**
     * Acknowledgment of finalization
     */
    @NotNull(message = "Must acknowledge checkout finalization")
    private Boolean acknowledgeFinalization;

    /**
     * Actions for outstanding invoices
     */
    private List<InvoiceActionDto> invoiceActions;

    /**
     * Invoice action DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InvoiceActionDto {
        private UUID invoiceId;
        private String action; // PAY, WRITE_OFF, DEDUCT_FROM_DEPOSIT
        private String writeOffReason;
    }
}
