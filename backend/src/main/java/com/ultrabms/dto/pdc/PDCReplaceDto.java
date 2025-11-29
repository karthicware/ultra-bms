package com.ultrabms.dto.pdc;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO for replacing a bounced PDC with a new cheque.
 *
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #12: Replace Bounced PDC (BOUNCED → REPLACED, creates new PDC in RECEIVED)
 * AC #27: Action DTOs
 */
public record PDCReplaceDto(
        @NotBlank(message = "New cheque number is required")
        @Size(min = 3, max = 50, message = "Cheque number must be between 3 and 50 characters")
        String newChequeNumber,

        @NotBlank(message = "Bank name is required")
        @Size(max = 100, message = "Bank name must be less than 100 characters")
        String bankName,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        BigDecimal amount,

        @NotNull(message = "Cheque date is required")
        LocalDate chequeDate,

        @Size(max = 500, message = "Notes must be less than 500 characters")
        String notes
) {
    /**
     * Builder for PDCReplaceDto
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String newChequeNumber;
        private String bankName;
        private BigDecimal amount;
        private LocalDate chequeDate;
        private String notes;

        public Builder newChequeNumber(String newChequeNumber) {
            this.newChequeNumber = newChequeNumber;
            return this;
        }

        public Builder bankName(String bankName) {
            this.bankName = bankName;
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

        public PDCReplaceDto build() {
            return new PDCReplaceDto(
                    newChequeNumber, bankName, amount, chequeDate, notes
            );
        }
    }
}
