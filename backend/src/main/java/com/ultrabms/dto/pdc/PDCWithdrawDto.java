package com.ultrabms.dto.pdc;

import com.ultrabms.entity.enums.NewPaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * DTO for withdrawing a PDC (return to tenant).
 *
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #13: Withdraw PDC (RECEIVED/DUE → WITHDRAWN)
 * AC #14: Record alternative payment method when withdrawn
 * AC #27: Action DTOs
 */
public record PDCWithdrawDto(
        @NotNull(message = "Withdrawal date is required")
        LocalDate withdrawalDate,

        @NotBlank(message = "Withdrawal reason is required")
        @Size(max = 255, message = "Withdrawal reason must be less than 255 characters")
        String withdrawalReason,

        NewPaymentMethod newPaymentMethod,  // Optional

        @Size(max = 100, message = "Transaction ID must be less than 100 characters")
        String transactionId  // Optional, for bank transfer
) {
    /**
     * Builder for PDCWithdrawDto
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private LocalDate withdrawalDate;
        private String withdrawalReason;
        private NewPaymentMethod newPaymentMethod;
        private String transactionId;

        public Builder withdrawalDate(LocalDate withdrawalDate) {
            this.withdrawalDate = withdrawalDate;
            return this;
        }

        public Builder withdrawalReason(String withdrawalReason) {
            this.withdrawalReason = withdrawalReason;
            return this;
        }

        public Builder newPaymentMethod(NewPaymentMethod newPaymentMethod) {
            this.newPaymentMethod = newPaymentMethod;
            return this;
        }

        public Builder transactionId(String transactionId) {
            this.transactionId = transactionId;
            return this;
        }

        public PDCWithdrawDto build() {
            return new PDCWithdrawDto(
                    withdrawalDate, withdrawalReason, newPaymentMethod, transactionId
            );
        }
    }
}
