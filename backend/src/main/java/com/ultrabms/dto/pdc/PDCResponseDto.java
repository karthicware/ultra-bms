package com.ultrabms.dto.pdc;

import com.ultrabms.entity.enums.NewPaymentMethod;
import com.ultrabms.entity.enums.PDCStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Full PDC response DTO for detail view.
 *
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #27: PDC DTOs (PDCCreateDto, PDCBulkCreateDto, PDCResponseDto, action DTOs)
 */
public record PDCResponseDto(
        UUID id,
        String chequeNumber,
        String bankName,

        // Tenant info
        UUID tenantId,
        String tenantName,
        String tenantEmail,
        String tenantPhone,

        // Unit info (from lease if available)
        UUID unitId,
        String unitNumber,

        // Property info
        UUID propertyId,
        String propertyName,

        // Invoice info (optional)
        UUID invoiceId,
        String invoiceNumber,

        // Lease reference
        UUID leaseId,

        // Amount
        BigDecimal amount,
        String formattedAmount,

        // Dates
        LocalDate chequeDate,
        LocalDate depositDate,
        LocalDate clearedDate,
        LocalDate bouncedDate,
        LocalDate withdrawalDate,

        // Status
        PDCStatus status,
        String statusDisplayName,

        // Bounce handling
        String bounceReason,

        // Withdrawal handling
        String withdrawalReason,
        NewPaymentMethod newPaymentMethod,
        String newPaymentMethodDisplayName,
        String transactionId,

        // Replacement chain
        UUID replacementPdcId,
        String replacementChequeNumber,
        UUID originalPdcId,
        String originalChequeNumber,

        // Bank account
        UUID bankAccountId,
        String bankAccountName,

        // Notes
        String notes,

        // Audit fields
        UUID createdBy,
        String createdByName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,

        // Action flags
        boolean canDeposit,
        boolean canClear,
        boolean canBounce,
        boolean canReplace,
        boolean canWithdraw,
        boolean canCancel,
        boolean isInFinalState
) {
    /**
     * Builder for PDCResponseDto
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
        private String tenantEmail;
        private String tenantPhone;
        private UUID unitId;
        private String unitNumber;
        private UUID propertyId;
        private String propertyName;
        private UUID invoiceId;
        private String invoiceNumber;
        private UUID leaseId;
        private BigDecimal amount;
        private String formattedAmount;
        private LocalDate chequeDate;
        private LocalDate depositDate;
        private LocalDate clearedDate;
        private LocalDate bouncedDate;
        private LocalDate withdrawalDate;
        private PDCStatus status;
        private String statusDisplayName;
        private String bounceReason;
        private String withdrawalReason;
        private NewPaymentMethod newPaymentMethod;
        private String newPaymentMethodDisplayName;
        private String transactionId;
        private UUID replacementPdcId;
        private String replacementChequeNumber;
        private UUID originalPdcId;
        private String originalChequeNumber;
        private UUID bankAccountId;
        private String bankAccountName;
        private String notes;
        private UUID createdBy;
        private String createdByName;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private boolean canDeposit;
        private boolean canClear;
        private boolean canBounce;
        private boolean canReplace;
        private boolean canWithdraw;
        private boolean canCancel;
        private boolean isInFinalState;

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

        public Builder tenantEmail(String tenantEmail) {
            this.tenantEmail = tenantEmail;
            return this;
        }

        public Builder tenantPhone(String tenantPhone) {
            this.tenantPhone = tenantPhone;
            return this;
        }

        public Builder unitId(UUID unitId) {
            this.unitId = unitId;
            return this;
        }

        public Builder unitNumber(String unitNumber) {
            this.unitNumber = unitNumber;
            return this;
        }

        public Builder propertyId(UUID propertyId) {
            this.propertyId = propertyId;
            return this;
        }

        public Builder propertyName(String propertyName) {
            this.propertyName = propertyName;
            return this;
        }

        public Builder invoiceId(UUID invoiceId) {
            this.invoiceId = invoiceId;
            return this;
        }

        public Builder invoiceNumber(String invoiceNumber) {
            this.invoiceNumber = invoiceNumber;
            return this;
        }

        public Builder leaseId(UUID leaseId) {
            this.leaseId = leaseId;
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

        public Builder clearedDate(LocalDate clearedDate) {
            this.clearedDate = clearedDate;
            return this;
        }

        public Builder bouncedDate(LocalDate bouncedDate) {
            this.bouncedDate = bouncedDate;
            return this;
        }

        public Builder withdrawalDate(LocalDate withdrawalDate) {
            this.withdrawalDate = withdrawalDate;
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

        public Builder bounceReason(String bounceReason) {
            this.bounceReason = bounceReason;
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

        public Builder newPaymentMethodDisplayName(String newPaymentMethodDisplayName) {
            this.newPaymentMethodDisplayName = newPaymentMethodDisplayName;
            return this;
        }

        public Builder transactionId(String transactionId) {
            this.transactionId = transactionId;
            return this;
        }

        public Builder replacementPdcId(UUID replacementPdcId) {
            this.replacementPdcId = replacementPdcId;
            return this;
        }

        public Builder replacementChequeNumber(String replacementChequeNumber) {
            this.replacementChequeNumber = replacementChequeNumber;
            return this;
        }

        public Builder originalPdcId(UUID originalPdcId) {
            this.originalPdcId = originalPdcId;
            return this;
        }

        public Builder originalChequeNumber(String originalChequeNumber) {
            this.originalChequeNumber = originalChequeNumber;
            return this;
        }

        public Builder bankAccountId(UUID bankAccountId) {
            this.bankAccountId = bankAccountId;
            return this;
        }

        public Builder bankAccountName(String bankAccountName) {
            this.bankAccountName = bankAccountName;
            return this;
        }

        public Builder notes(String notes) {
            this.notes = notes;
            return this;
        }

        public Builder createdBy(UUID createdBy) {
            this.createdBy = createdBy;
            return this;
        }

        public Builder createdByName(String createdByName) {
            this.createdByName = createdByName;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public Builder canDeposit(boolean canDeposit) {
            this.canDeposit = canDeposit;
            return this;
        }

        public Builder canClear(boolean canClear) {
            this.canClear = canClear;
            return this;
        }

        public Builder canBounce(boolean canBounce) {
            this.canBounce = canBounce;
            return this;
        }

        public Builder canReplace(boolean canReplace) {
            this.canReplace = canReplace;
            return this;
        }

        public Builder canWithdraw(boolean canWithdraw) {
            this.canWithdraw = canWithdraw;
            return this;
        }

        public Builder canCancel(boolean canCancel) {
            this.canCancel = canCancel;
            return this;
        }

        public Builder isInFinalState(boolean isInFinalState) {
            this.isInFinalState = isInFinalState;
            return this;
        }

        public PDCResponseDto build() {
            return new PDCResponseDto(
                    id, chequeNumber, bankName,
                    tenantId, tenantName, tenantEmail, tenantPhone,
                    unitId, unitNumber, propertyId, propertyName,
                    invoiceId, invoiceNumber, leaseId,
                    amount, formattedAmount, chequeDate,
                    depositDate, clearedDate, bouncedDate, withdrawalDate,
                    status, statusDisplayName,
                    bounceReason, withdrawalReason, newPaymentMethod,
                    newPaymentMethodDisplayName, transactionId,
                    replacementPdcId, replacementChequeNumber,
                    originalPdcId, originalChequeNumber,
                    bankAccountId, bankAccountName, notes,
                    createdBy, createdByName, createdAt, updatedAt,
                    canDeposit, canClear, canBounce, canReplace,
                    canWithdraw, canCancel, isInFinalState
            );
        }
    }
}
