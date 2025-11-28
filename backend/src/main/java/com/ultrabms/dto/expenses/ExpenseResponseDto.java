package com.ultrabms.dto.expenses;

import com.ultrabms.entity.enums.ExpenseCategory;
import com.ultrabms.entity.enums.ExpensePaymentStatus;
import com.ultrabms.entity.enums.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Full expense response DTO for detail view.
 *
 * Story 6.2: Expense Management and Vendor Payments
 * AC #25: ExpenseResponseDto, ExpenseCreateDto, ExpenseUpdateDto, ExpensePayDto (Java records)
 */
public record ExpenseResponseDto(
        UUID id,
        String expenseNumber,
        ExpenseCategory category,
        String categoryDisplayName,

        // Related entities (optional)
        UUID propertyId,
        String propertyName,
        UUID vendorId,
        String vendorCompanyName,
        UUID workOrderId,
        String workOrderNumber,

        // Amount and dates
        BigDecimal amount,
        LocalDate expenseDate,

        // Payment information
        ExpensePaymentStatus paymentStatus,
        String paymentStatusDisplayName,
        PaymentMethod paymentMethod,
        String paymentMethodDisplayName,
        LocalDate paymentDate,
        String transactionReference,

        // Description and receipt
        String description,
        String receiptFilePath,
        String receiptFileName,

        // Audit fields
        UUID recordedBy,
        String recordedByName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,

        // Helper flags
        boolean editable,
        boolean canBePaid,
        boolean canBeDeleted
) {
    /**
     * Builder for ExpenseResponseDto
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID id;
        private String expenseNumber;
        private ExpenseCategory category;
        private String categoryDisplayName;
        private UUID propertyId;
        private String propertyName;
        private UUID vendorId;
        private String vendorCompanyName;
        private UUID workOrderId;
        private String workOrderNumber;
        private BigDecimal amount;
        private LocalDate expenseDate;
        private ExpensePaymentStatus paymentStatus;
        private String paymentStatusDisplayName;
        private PaymentMethod paymentMethod;
        private String paymentMethodDisplayName;
        private LocalDate paymentDate;
        private String transactionReference;
        private String description;
        private String receiptFilePath;
        private String receiptFileName;
        private UUID recordedBy;
        private String recordedByName;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private boolean editable;
        private boolean canBePaid;
        private boolean canBeDeleted;

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

        public Builder propertyId(UUID propertyId) {
            this.propertyId = propertyId;
            return this;
        }

        public Builder propertyName(String propertyName) {
            this.propertyName = propertyName;
            return this;
        }

        public Builder vendorId(UUID vendorId) {
            this.vendorId = vendorId;
            return this;
        }

        public Builder vendorCompanyName(String vendorCompanyName) {
            this.vendorCompanyName = vendorCompanyName;
            return this;
        }

        public Builder workOrderId(UUID workOrderId) {
            this.workOrderId = workOrderId;
            return this;
        }

        public Builder workOrderNumber(String workOrderNumber) {
            this.workOrderNumber = workOrderNumber;
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

        public Builder paymentMethod(PaymentMethod paymentMethod) {
            this.paymentMethod = paymentMethod;
            return this;
        }

        public Builder paymentMethodDisplayName(String paymentMethodDisplayName) {
            this.paymentMethodDisplayName = paymentMethodDisplayName;
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

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder receiptFilePath(String receiptFilePath) {
            this.receiptFilePath = receiptFilePath;
            return this;
        }

        public Builder receiptFileName(String receiptFileName) {
            this.receiptFileName = receiptFileName;
            return this;
        }

        public Builder recordedBy(UUID recordedBy) {
            this.recordedBy = recordedBy;
            return this;
        }

        public Builder recordedByName(String recordedByName) {
            this.recordedByName = recordedByName;
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

        public Builder editable(boolean editable) {
            this.editable = editable;
            return this;
        }

        public Builder canBePaid(boolean canBePaid) {
            this.canBePaid = canBePaid;
            return this;
        }

        public Builder canBeDeleted(boolean canBeDeleted) {
            this.canBeDeleted = canBeDeleted;
            return this;
        }

        public ExpenseResponseDto build() {
            return new ExpenseResponseDto(
                    id, expenseNumber, category, categoryDisplayName,
                    propertyId, propertyName, vendorId, vendorCompanyName,
                    workOrderId, workOrderNumber, amount, expenseDate,
                    paymentStatus, paymentStatusDisplayName, paymentMethod,
                    paymentMethodDisplayName, paymentDate, transactionReference,
                    description, receiptFilePath, receiptFileName,
                    recordedBy, recordedByName, createdAt, updatedAt,
                    editable, canBePaid, canBeDeleted
            );
        }
    }
}
