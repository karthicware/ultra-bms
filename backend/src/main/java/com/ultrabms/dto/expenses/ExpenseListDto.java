package com.ultrabms.dto.expenses;

import com.ultrabms.entity.enums.ExpenseCategory;
import com.ultrabms.entity.enums.ExpensePaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Expense list item DTO for table view (minimal fields for performance).
 *
 * Story 6.2: Expense Management and Vendor Payments
 * AC #25: ExpenseResponseDto, ExpenseCreateDto, ExpenseUpdateDto, ExpensePayDto (Java records)
 */
public record ExpenseListDto(
        UUID id,
        String expenseNumber,
        ExpenseCategory category,
        String categoryDisplayName,
        String propertyName,
        String vendorCompanyName,
        BigDecimal amount,
        LocalDate expenseDate,
        ExpensePaymentStatus paymentStatus,
        String paymentStatusDisplayName,
        LocalDate paymentDate,
        String description,
        boolean hasReceipt
) {
    /**
     * Builder for ExpenseListDto
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID id;
        private String expenseNumber;
        private ExpenseCategory category;
        private String categoryDisplayName;
        private String propertyName;
        private String vendorCompanyName;
        private BigDecimal amount;
        private LocalDate expenseDate;
        private ExpensePaymentStatus paymentStatus;
        private String paymentStatusDisplayName;
        private LocalDate paymentDate;
        private String description;
        private boolean hasReceipt;

        public Builder id(UUID id) {
            this.id = id;
            return this;
        }

        public Builder expenseNumber(String expenseNumber) {
            this.expenseNumber = expenseNumber;
            return this;
        }

        public Builder category(ExpenseCategory category) {
            this.category = category;
            return this;
        }

        public Builder categoryDisplayName(String categoryDisplayName) {
            this.categoryDisplayName = categoryDisplayName;
            return this;
        }

        public Builder propertyName(String propertyName) {
            this.propertyName = propertyName;
            return this;
        }

        public Builder vendorCompanyName(String vendorCompanyName) {
            this.vendorCompanyName = vendorCompanyName;
            return this;
        }

        public Builder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public Builder expenseDate(LocalDate expenseDate) {
            this.expenseDate = expenseDate;
            return this;
        }

        public Builder paymentStatus(ExpensePaymentStatus paymentStatus) {
            this.paymentStatus = paymentStatus;
            return this;
        }

        public Builder paymentStatusDisplayName(String paymentStatusDisplayName) {
            this.paymentStatusDisplayName = paymentStatusDisplayName;
            return this;
        }

        public Builder paymentDate(LocalDate paymentDate) {
            this.paymentDate = paymentDate;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder hasReceipt(boolean hasReceipt) {
            this.hasReceipt = hasReceipt;
            return this;
        }

        public ExpenseListDto build() {
            return new ExpenseListDto(
                    id, expenseNumber, category, categoryDisplayName,
                    propertyName, vendorCompanyName, amount, expenseDate,
                    paymentStatus, paymentStatusDisplayName, paymentDate,
                    description, hasReceipt
            );
        }
    }
}
