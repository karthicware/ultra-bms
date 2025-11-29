package com.ultrabms.dto.pdc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * DTO for tenant's PDC history and statistics.
 *
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #27: PDC DTOs
 */
public record TenantPDCHistoryDto(
        UUID tenantId,
        String tenantName,

        // Statistics
        long totalPDCs,
        long clearedPDCs,
        long bouncedPDCs,
        long pendingPDCs,
        double bounceRatePercent,

        // Financial summary
        BigDecimal totalAmountCleared,
        String formattedAmountCleared,
        BigDecimal totalAmountPending,
        String formattedAmountPending,

        // PDC list (paginated)
        List<PDCListDto> pdcs
) {
    /**
     * Builder for TenantPDCHistoryDto
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID tenantId;
        private String tenantName;
        private long totalPDCs;
        private long clearedPDCs;
        private long bouncedPDCs;
        private long pendingPDCs;
        private double bounceRatePercent;
        private BigDecimal totalAmountCleared = BigDecimal.ZERO;
        private String formattedAmountCleared;
        private BigDecimal totalAmountPending = BigDecimal.ZERO;
        private String formattedAmountPending;
        private List<PDCListDto> pdcs;

        public Builder tenantId(UUID tenantId) {
            this.tenantId = tenantId;
            return this;
        }

        public Builder tenantName(String tenantName) {
            this.tenantName = tenantName;
            return this;
        }

        public Builder totalPDCs(long totalPDCs) {
            this.totalPDCs = totalPDCs;
            return this;
        }

        public Builder clearedPDCs(long clearedPDCs) {
            this.clearedPDCs = clearedPDCs;
            return this;
        }

        public Builder bouncedPDCs(long bouncedPDCs) {
            this.bouncedPDCs = bouncedPDCs;
            return this;
        }

        public Builder pendingPDCs(long pendingPDCs) {
            this.pendingPDCs = pendingPDCs;
            return this;
        }

        public Builder bounceRatePercent(double bounceRatePercent) {
            this.bounceRatePercent = bounceRatePercent;
            return this;
        }

        public Builder totalAmountCleared(BigDecimal totalAmountCleared) {
            this.totalAmountCleared = totalAmountCleared;
            return this;
        }

        public Builder formattedAmountCleared(String formattedAmountCleared) {
            this.formattedAmountCleared = formattedAmountCleared;
            return this;
        }

        public Builder totalAmountPending(BigDecimal totalAmountPending) {
            this.totalAmountPending = totalAmountPending;
            return this;
        }

        public Builder formattedAmountPending(String formattedAmountPending) {
            this.formattedAmountPending = formattedAmountPending;
            return this;
        }

        public Builder pdcs(List<PDCListDto> pdcs) {
            this.pdcs = pdcs;
            return this;
        }

        public TenantPDCHistoryDto build() {
            return new TenantPDCHistoryDto(
                    tenantId, tenantName,
                    totalPDCs, clearedPDCs, bouncedPDCs, pendingPDCs,
                    bounceRatePercent,
                    totalAmountCleared, formattedAmountCleared,
                    totalAmountPending, formattedAmountPending,
                    pdcs
            );
        }
    }
}
