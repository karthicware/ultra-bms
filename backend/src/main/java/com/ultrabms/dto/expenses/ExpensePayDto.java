package com.ultrabms.dto.expenses;

import com.ultrabms.entity.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * DTO for marking an expense as paid.
 *
 * Story 6.2: Expense Management and Vendor Payments
 * AC #25: ExpenseResponseDto, ExpenseCreateDto, ExpenseUpdateDto, ExpensePayDto (Java records)
 */
public record ExpensePayDto(
        @NotNull(message = "Payment method is required")
        PaymentMethod paymentMethod,

        @NotNull(message = "Payment date is required")
        LocalDate paymentDate,

        @Size(max = 100, message = "Transaction reference must be less than 100 characters")
        String transactionReference
) {
    /**
     * Builder for ExpensePayDto
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private PaymentMethod paymentMethod;
        private LocalDate paymentDate;
        private String transactionReference;

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

        public ExpensePayDto build() {
            return new ExpensePayDto(paymentMethod, paymentDate, transactionReference);
        }
    }
}
