package com.ultrabms.dto.pdc;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

/**
 * DTO for bulk PDC registration (1-24 cheques per tenant).
 *
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #3: Atomic bulk PDC registration (all-or-nothing)
 * AC #4: Max 24 PDCs per submission
 * AC #27: PDCBulkCreateDto
 */
public record PDCBulkCreateDto(
        @NotNull(message = "Tenant ID is required")
        UUID tenantId,

        UUID leaseId,

        @Valid
        @NotNull(message = "At least one PDC entry is required")
        @Size(min = 1, max = 24, message = "Must provide between 1 and 24 PDC entries")
        List<PDCEntry> pdcEntries
) {
    /**
     * Individual PDC entry within bulk create
     */
    public record PDCEntry(
            @jakarta.validation.constraints.NotBlank(message = "Cheque number is required")
            @Size(min = 3, max = 50, message = "Cheque number must be between 3 and 50 characters")
            String chequeNumber,

            @jakarta.validation.constraints.NotBlank(message = "Bank name is required")
            @Size(max = 100, message = "Bank name must be less than 100 characters")
            String bankName,

            @NotNull(message = "Amount is required")
            @jakarta.validation.constraints.DecimalMin(value = "0.01", message = "Amount must be greater than 0")
            java.math.BigDecimal amount,

            @NotNull(message = "Cheque date is required")
            java.time.LocalDate chequeDate,

            UUID invoiceId,

            @Size(max = 500, message = "Notes must be less than 500 characters")
            String notes
    ) {
        /**
         * Builder for PDCEntry
         */
        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private String chequeNumber;
            private String bankName;
            private java.math.BigDecimal amount;
            private java.time.LocalDate chequeDate;
            private UUID invoiceId;
            private String notes;

            public Builder chequeNumber(String chequeNumber) {
                this.chequeNumber = chequeNumber;
                return this;
            }

            public Builder bankName(String bankName) {
                this.bankName = bankName;
                return this;
            }

            public Builder amount(java.math.BigDecimal amount) {
                this.amount = amount;
                return this;
            }

            public Builder chequeDate(java.time.LocalDate chequeDate) {
                this.chequeDate = chequeDate;
                return this;
            }

            public Builder invoiceId(UUID invoiceId) {
                this.invoiceId = invoiceId;
                return this;
            }

            public Builder notes(String notes) {
                this.notes = notes;
                return this;
            }

            public PDCEntry build() {
                return new PDCEntry(
                        chequeNumber, bankName, amount, chequeDate, invoiceId, notes
                );
            }
        }
    }

    /**
     * Builder for PDCBulkCreateDto
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID tenantId;
        private UUID leaseId;
        private List<PDCEntry> pdcEntries;

        public Builder tenantId(UUID tenantId) {
            this.tenantId = tenantId;
            return this;
        }

        public Builder leaseId(UUID leaseId) {
            this.leaseId = leaseId;
            return this;
        }

        public Builder pdcEntries(List<PDCEntry> pdcEntries) {
            this.pdcEntries = pdcEntries;
            return this;
        }

        public PDCBulkCreateDto build() {
            return new PDCBulkCreateDto(tenantId, leaseId, pdcEntries);
        }
    }
}
