package com.ultrabms.dto.expenses;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * DTO for vendor expense grouping (for pending payments page).
 *
 * Story 6.2: Expense Management and Vendor Payments
 * AC #8: Pending payments page grouped by vendor with accordion view
 */
public record VendorExpenseGroupDto(
        UUID vendorId,
        String vendorCompanyName,
        String vendorContactPerson,
        String vendorEmail,
        String vendorPhone,
        BigDecimal totalPendingAmount,
        int pendingExpenseCount,
        List<ExpenseListDto> expenses
) {
    /**
     * Builder for VendorExpenseGroupDto
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID vendorId;
        private String vendorCompanyName;
        private String vendorContactPerson;
        private String vendorEmail;
        private String vendorPhone;
        private BigDecimal totalPendingAmount = BigDecimal.ZERO;
        private int pendingExpenseCount = 0;
        private List<ExpenseListDto> expenses = List.of();

        public Builder vendorId(UUID vendorId) {
            this.vendorId = vendorId;
            return this;
        }

        public Builder vendorCompanyName(String vendorCompanyName) {
            this.vendorCompanyName = vendorCompanyName;
            return this;
        }

        public Builder vendorContactPerson(String vendorContactPerson) {
            this.vendorContactPerson = vendorContactPerson;
            return this;
        }

        public Builder vendorEmail(String vendorEmail) {
            this.vendorEmail = vendorEmail;
            return this;
        }

        public Builder vendorPhone(String vendorPhone) {
            this.vendorPhone = vendorPhone;
            return this;
        }

        public Builder totalPendingAmount(BigDecimal totalPendingAmount) {
            this.totalPendingAmount = totalPendingAmount;
            return this;
        }

        public Builder pendingExpenseCount(int pendingExpenseCount) {
            this.pendingExpenseCount = pendingExpenseCount;
            return this;
        }

        public Builder expenses(List<ExpenseListDto> expenses) {
            this.expenses = expenses;
            return this;
        }

        public VendorExpenseGroupDto build() {
            return new VendorExpenseGroupDto(
                    vendorId, vendorCompanyName, vendorContactPerson,
                    vendorEmail, vendorPhone, totalPendingAmount,
                    pendingExpenseCount, expenses
            );
        }
    }
}
