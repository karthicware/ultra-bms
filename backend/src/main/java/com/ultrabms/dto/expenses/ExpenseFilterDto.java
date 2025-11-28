package com.ultrabms.dto.expenses;

import com.ultrabms.entity.enums.ExpenseCategory;
import com.ultrabms.entity.enums.ExpensePaymentStatus;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for expense filter parameters.
 *
 * Story 6.2: Expense Management and Vendor Payments
 * AC #6: Expense list page with filters and search
 */
public record ExpenseFilterDto(
        String searchTerm,
        ExpenseCategory category,
        ExpensePaymentStatus paymentStatus,
        UUID propertyId,
        UUID vendorId,
        UUID workOrderId,
        LocalDate fromDate,
        LocalDate toDate,
        int page,
        int size,
        String sortBy,
        String sortDirection
) {
    /**
     * Default filter with pagination defaults
     */
    public ExpenseFilterDto {
        if (page < 0) page = 0;
        if (size <= 0 || size > 100) size = 20;
        if (sortBy == null || sortBy.isBlank()) sortBy = "expenseDate";
        if (sortDirection == null || sortDirection.isBlank()) sortDirection = "DESC";
    }

    /**
     * Builder for ExpenseFilterDto
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String searchTerm;
        private ExpenseCategory category;
        private ExpensePaymentStatus paymentStatus;
        private UUID propertyId;
        private UUID vendorId;
        private UUID workOrderId;
        private LocalDate fromDate;
        private LocalDate toDate;
        private int page = 0;
        private int size = 20;
        private String sortBy = "expenseDate";
        private String sortDirection = "DESC";

        public Builder searchTerm(String searchTerm) {
            this.searchTerm = searchTerm;
            return this;
        }

        public Builder category(ExpenseCategory category) {
            this.category = category;
            return this;
        }

        public Builder paymentStatus(ExpensePaymentStatus paymentStatus) {
            this.paymentStatus = paymentStatus;
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

        public Builder workOrderId(UUID workOrderId) {
            this.workOrderId = workOrderId;
            return this;
        }

        public Builder fromDate(LocalDate fromDate) {
            this.fromDate = fromDate;
            return this;
        }

        public Builder toDate(LocalDate toDate) {
            this.toDate = toDate;
            return this;
        }

        public Builder page(int page) {
            this.page = page;
            return this;
        }

        public Builder size(int size) {
            this.size = size;
            return this;
        }

        public Builder sortBy(String sortBy) {
            this.sortBy = sortBy;
            return this;
        }

        public Builder sortDirection(String sortDirection) {
            this.sortDirection = sortDirection;
            return this;
        }

        public ExpenseFilterDto build() {
            return new ExpenseFilterDto(
                    searchTerm, category, paymentStatus, propertyId, vendorId,
                    workOrderId, fromDate, toDate, page, size, sortBy, sortDirection
            );
        }
    }
}
