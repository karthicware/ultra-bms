package com.ultrabms.dto.expenses;

import com.ultrabms.entity.enums.ExpenseCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for creating a new expense.
 *
 * Story 6.2: Expense Management and Vendor Payments
 * AC #25: ExpenseResponseDto, ExpenseCreateDto, ExpenseUpdateDto, ExpensePayDto (Java records)
 */
public record ExpenseCreateDto(
        @NotNull(message = "Category is required")
        ExpenseCategory category,

        UUID propertyId,

        UUID vendorId,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        BigDecimal amount,

        @NotNull(message = "Expense date is required")
        LocalDate expenseDate,

        @NotBlank(message = "Description is required")
        @Size(min = 3, max = 500, message = "Description must be between 3 and 500 characters")
        String description
) {
    /**
     * Builder for ExpenseCreateDto
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private ExpenseCategory category;
        private UUID propertyId;
        private UUID vendorId;
        private BigDecimal amount;
        private LocalDate expenseDate;
        private String description;

        public Builder category(ExpenseCategory category) {
            this.category = category;
            return this;
        }

        public Builder propertyId(UUID propertyId) {
            this.propertyId = propertyId;
            return this;
        }

        public Builder vendorId(UUID vendorId) {
            this.vendorId = vendorId;
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

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public ExpenseCreateDto build() {
            return new ExpenseCreateDto(
                    category, propertyId, vendorId, amount, expenseDate, description
            );
        }
    }
}
