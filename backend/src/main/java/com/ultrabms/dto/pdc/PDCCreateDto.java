package com.ultrabms.dto.pdc;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for creating a single PDC.
 *
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #27: PDCCreateDto
 */
public record PDCCreateDto(
        @NotBlank(message = "Cheque number is required")
        @Size(min = 3, max = 50, message = "Cheque number must be between 3 and 50 characters")
        String chequeNumber,

        @NotBlank(message = "Bank name is required")
        @Size(max = 100, message = "Bank name must be less than 100 characters")
        String bankName,

        @NotNull(message = "Tenant ID is required")
        UUID tenantId,

        UUID invoiceId,

        UUID leaseId,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        BigDecimal amount,

        @NotNull(message = "Cheque date is required")
        LocalDate chequeDate,

        @Size(max = 500, message = "Notes must be less than 500 characters")
        String notes
) {
    /**
     * Builder for PDCCreateDto
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String chequeNumber;
        private String bankName;
        private UUID tenantId;
        private UUID invoiceId;
        private UUID leaseId;
        private BigDecimal amount;
        private LocalDate chequeDate;
        private String notes;

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

        public Builder invoiceId(UUID invoiceId) {
            this.invoiceId = invoiceId;
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

        public Builder chequeDate(LocalDate chequeDate) {
            this.chequeDate = chequeDate;
            return this;
        }

        public Builder notes(String notes) {
            this.notes = notes;
            return this;
        }

        public PDCCreateDto build() {
            return new PDCCreateDto(
                    chequeNumber, bankName, tenantId,
                    invoiceId, leaseId, amount, chequeDate, notes
            );
        }
    }
}
