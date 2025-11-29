package com.ultrabms.dto.pdc;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * DTO for marking a PDC as bounced.
 *
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #11: Mark PDC as Bounced (DEPOSITED → BOUNCED)
 * AC #27: Action DTOs
 */
public record PDCBounceDto(
        @NotNull(message = "Bounced date is required")
        LocalDate bouncedDate,

        @NotBlank(message = "Bounce reason is required")
        @Size(max = 255, message = "Bounce reason must be less than 255 characters")
        String bounceReason
) {
    /**
     * Builder for PDCBounceDto
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private LocalDate bouncedDate;
        private String bounceReason;

        public Builder bouncedDate(LocalDate bouncedDate) {
            this.bouncedDate = bouncedDate;
            return this;
        }

        public Builder bounceReason(String bounceReason) {
            this.bounceReason = bounceReason;
            return this;
        }

        public PDCBounceDto build() {
            return new PDCBounceDto(bouncedDate, bounceReason);
        }
    }
}
