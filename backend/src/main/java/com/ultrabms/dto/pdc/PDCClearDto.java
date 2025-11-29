package com.ultrabms.dto.pdc;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * DTO for marking a PDC as cleared.
 *
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #10: Mark PDC as Cleared (DEPOSITED → CLEARED)
 * AC #27: Action DTOs
 */
public record PDCClearDto(
        @NotNull(message = "Cleared date is required")
        LocalDate clearedDate
) {
    /**
     * Builder for PDCClearDto
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private LocalDate clearedDate;

        public Builder clearedDate(LocalDate clearedDate) {
            this.clearedDate = clearedDate;
            return this;
        }

        public PDCClearDto build() {
            return new PDCClearDto(clearedDate);
        }
    }
}
