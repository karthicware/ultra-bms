package com.ultrabms.dto.expenses;

import com.ultrabms.entity.enums.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * DTO for batch payment response.
 *
 * Story 6.2: Expense Management and Vendor Payments
 * AC #9: Batch payment processing for selected expenses
 */
public record BatchPaymentResponseDto(
        int totalProcessed,
        int successCount,
        int failedCount,
        BigDecimal totalAmount,
        PaymentMethod paymentMethod,
        LocalDate paymentDate,
        String transactionReference,
        List<UUID> successfulExpenseIds,
        List<FailedExpense> failedExpenses
) {
    /**
     * Failed expense details
     */
    public record FailedExpense(
            UUID expenseId,
            String expenseNumber,
            String errorMessage
    ) {}

    /**
     * Builder for BatchPaymentResponseDto
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private int totalProcessed;
        private int successCount;
        private int failedCount;
        private BigDecimal totalAmount;
        private PaymentMethod paymentMethod;
        private LocalDate paymentDate;
        private String transactionReference;
        private List<UUID> successfulExpenseIds;
        private List<FailedExpense> failedExpenses;

        public Builder totalProcessed(int totalProcessed) {
            this.totalProcessed = totalProcessed;
            return this;
        }

        public Builder successCount(int successCount) {
            this.successCount = successCount;
            return this;
        }

        public Builder failedCount(int failedCount) {
            this.failedCount = failedCount;
            return this;
        }

        public Builder totalAmount(BigDecimal totalAmount) {
            this.totalAmount = totalAmount;
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

        public Builder successfulExpenseIds(List<UUID> successfulExpenseIds) {
            this.successfulExpenseIds = successfulExpenseIds;
            return this;
        }

        public Builder failedExpenses(List<FailedExpense> failedExpenses) {
            this.failedExpenses = failedExpenses;
            return this;
        }

        public BatchPaymentResponseDto build() {
            return new BatchPaymentResponseDto(
                    totalProcessed, successCount, failedCount, totalAmount,
                    paymentMethod, paymentDate, transactionReference,
                    successfulExpenseIds, failedExpenses
            );
        }
    }
}
