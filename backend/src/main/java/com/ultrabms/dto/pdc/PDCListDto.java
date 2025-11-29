package com.ultrabms.dto.pdc;

import com.ultrabms.entity.enums.PDCStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * PDC DTO for list/table view (summary).
 *
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #27: PDC DTOs
 */
public record PDCListDto(
        UUID id,
        String chequeNumber,
        String bankName,

        // Tenant summary
        UUID tenantId,
        String tenantName,

        // Unit/Property summary
        String unitNumber,
        String propertyName,

        // Amount
        BigDecimal amount,
        String formattedAmount,

        // Dates
        LocalDate chequeDate,
        LocalDate depositDate,

        // Status
        PDCStatus status,
        String statusDisplayName,

        // Flags
        boolean isOverdue,
        boolean isDueThisWeek,

        // Quick actions availability
        boolean canDeposit,
        boolean canWithdraw
) {
    /**
     * Builder for PDCListDto
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID id;
        private String chequeNumber;
        private String bankName;
        private UUID tenantId;
        private String tenantName;
        private String unitNumber;
        private String propertyName;
        private BigDecimal amount;
        private String formattedAmount;
        private LocalDate chequeDate;
        private LocalDate depositDate;
        private PDCStatus status;
        private String statusDisplayName;
        private boolean isOverdue;
        private boolean isDueThisWeek;
        private boolean canDeposit;
        private boolean canWithdraw;

        public Builder id(UUID id) {
            this.id = id;
            return this;
        }

        public Builder chequeNumber(String chequeNumber) {
            this.chequeNumber = chequeNumber;
            return this;
        }

        public Builder bankName(String bankName) {
            this.bankName = bankName;
            return this;
        }

        public Builder tenantId(UUID tenantId) {
            this.tenantId = tenantId;
            return this;
        }

        public Builder tenantName(String tenantName) {
            this.tenantName = tenantName;
            return this;
        }

        public Builder unitNumber(String unitNumber) {
            this.unitNumber = unitNumber;
            return this;
        }

        public Builder propertyName(String propertyName) {
            this.propertyName = propertyName;
            return this;
        }

        public Builder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public Builder formattedAmount(String formattedAmount) {
            this.formattedAmount = formattedAmount;
            return this;
        }

        public Builder chequeDate(LocalDate chequeDate) {
            this.chequeDate = chequeDate;
            return this;
        }

        public Builder depositDate(LocalDate depositDate) {
            this.depositDate = depositDate;
            return this;
        }

        public Builder status(PDCStatus status) {
            this.status = status;
            return this;
        }

        public Builder statusDisplayName(String statusDisplayName) {
            this.statusDisplayName = statusDisplayName;
            return this;
        }

        public Builder isOverdue(boolean isOverdue) {
            this.isOverdue = isOverdue;
            return this;
        }

        public Builder isDueThisWeek(boolean isDueThisWeek) {
            this.isDueThisWeek = isDueThisWeek;
            return this;
        }

        public Builder canDeposit(boolean canDeposit) {
            this.canDeposit = canDeposit;
            return this;
        }

        public Builder canWithdraw(boolean canWithdraw) {
            this.canWithdraw = canWithdraw;
            return this;
        }

        public PDCListDto build() {
            return new PDCListDto(
                    id, chequeNumber, bankName,
                    tenantId, tenantName, unitNumber, propertyName,
                    amount, formattedAmount, chequeDate, depositDate,
                    status, statusDisplayName,
                    isOverdue, isDueThisWeek, canDeposit, canWithdraw
            );
        }
    }
}
