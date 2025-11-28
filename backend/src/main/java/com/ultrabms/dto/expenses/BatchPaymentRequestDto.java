package com.ultrabms.dto.expenses;

import com.ultrabms.entity.enums.PaymentMethod;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * DTO for batch payment request (paying multiple expenses at once).
 *
 * Story 6.2: Expense Management and Vendor Payments
 * AC #9: Batch payment processing for selected expenses
 */
public record BatchPaymentRequestDto(
        @NotEmpty(message = "At least one expense ID is required")
        List<UUID> expenseIds,

        @NotNull(message = "Payment method is required")
        PaymentMethod paymentMethod,

        @NotNull(message = "Payment date is required")
        LocalDate paymentDate,

        @Size(max = 100, message = "Transaction reference must be less than 100 characters")
        String transactionReference
) {
    /**
     * Builder for BatchPaymentRequestDto
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private List<UUID> expenseIds;
        private PaymentMethod paymentMethod;
        private LocalDate paymentDate;
        private String transactionReference;

        public Builder expenseIds(List<UUID> expenseIds) {
            this.expenseIds = expenseIds;
            return this;
        }

        public Builder paymentMethod(PaymentMethod paymentMethod) {
            this.paymentMethod = paymentMethod;
            return this;
        }

        public Builder paymentDate(LocalDate paymentDate) {
            this.paymentDate = paymentDate;
            return this;
        }

        public Builder transactionReference(String transactionReference) {
            this.transactionReference = transactionReference;
            return this;
        }

        public BatchPaymentRequestDto build() {
            return new BatchPaymentRequestDto(
                    expenseIds, paymentMethod, paymentDate, transactionReference
            );
        }
    }
}
