package com.ultrabms.dto.pdc;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for depositing a PDC to bank.
 *
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #9: Mark PDC as Deposited (DUE → DEPOSITED)
 * AC #27: Action DTOs
 */
public record PDCDepositDto(
        @NotNull(message = "Deposit date is required")
        LocalDate depositDate,

        UUID bankAccountId  // Optional until Story 6.5 is implemented
) {
    /**
     * Builder for PDCDepositDto
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private LocalDate depositDate;
        private UUID bankAccountId;

        public Builder depositDate(LocalDate depositDate) {
            this.depositDate = depositDate;
            return this;
        }

        public Builder bankAccountId(UUID bankAccountId) {
            this.bankAccountId = bankAccountId;
            return this;
        }

        public PDCDepositDto build() {
            return new PDCDepositDto(depositDate, bankAccountId);
        }
    }
}
