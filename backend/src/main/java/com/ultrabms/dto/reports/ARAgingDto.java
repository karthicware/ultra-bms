package com.ultrabms.dto.reports;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for Accounts Receivable Aging report data.
 *
 * Story 6.4: Financial Reporting and Analytics
 * AC #4, #5: AR Aging page with tenant drill-down at /finance/reports/receivables-aging
 * AC #12: Backend API for AR aging data
 */
public record ARAgingDto(
        LocalDate asOfDate,
        UUID propertyId,
        String propertyName,
        BigDecimal totalOutstanding,
        int totalInvoiceCount,
        BigDecimal averageDaysOutstanding,
        List<AgingBucketData> agingBuckets,
        List<TenantAgingDetail> tenantDetails,
        LocalDateTime generatedAt
) {
    /**
     * Aging bucket categories
     */
    public enum AgingBucket {
        CURRENT("Current", "Not Yet Due"),
        DAYS_1_30("1-30", "1-30 Days Overdue"),
        DAYS_31_60("31-60", "31-60 Days Overdue"),
        DAYS_61_90("61-90", "61-90 Days Overdue"),
        OVER_90("90+", "90+ Days Overdue");

        private final String code;
        private final String label;

        AgingBucket(String code, String label) {
            this.code = code;
            this.label = label;
        }

        public String getCode() { return code; }
        public String getLabel() { return label; }
    }

    /**
     * Single aging bucket data
     */
    public record AgingBucketData(
            AgingBucket bucket,
            BigDecimal amount,
            int count,
            BigDecimal percentage
    ) {
        public String getBucketLabel() {
            return bucket.getLabel();
        }
    }

    /**
     * Tenant-level aging detail for drill-down (AC #5)
     */
    public record TenantAgingDetail(
            UUID tenantId,
            String tenantName,
            BigDecimal totalOutstanding,
            BigDecimal currentAmount,
            BigDecimal days1to30,
            BigDecimal days31to60,
            BigDecimal days61to90,
            BigDecimal over90Days,
            int invoiceCount
    ) {}

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private LocalDate asOfDate = LocalDate.now();
        private UUID propertyId;
        private String propertyName;
        private BigDecimal totalOutstanding = BigDecimal.ZERO;
        private int totalInvoiceCount = 0;
        private BigDecimal averageDaysOutstanding = BigDecimal.ZERO;
        private List<AgingBucketData> agingBuckets = List.of();
        private List<TenantAgingDetail> tenantDetails = List.of();
        private LocalDateTime generatedAt = LocalDateTime.now();

        public Builder asOfDate(LocalDate val) { this.asOfDate = val; return this; }
        public Builder propertyId(UUID val) { this.propertyId = val; return this; }
        public Builder propertyName(String val) { this.propertyName = val; return this; }
        public Builder totalOutstanding(BigDecimal val) { this.totalOutstanding = val; return this; }
        public Builder totalInvoiceCount(int val) { this.totalInvoiceCount = val; return this; }
        public Builder averageDaysOutstanding(BigDecimal val) { this.averageDaysOutstanding = val; return this; }
        public Builder agingBuckets(List<AgingBucketData> val) { this.agingBuckets = val; return this; }
        public Builder tenantDetails(List<TenantAgingDetail> val) { this.tenantDetails = val; return this; }
        public Builder generatedAt(LocalDateTime val) { this.generatedAt = val; return this; }

        public ARAgingDto build() {
            return new ARAgingDto(asOfDate, propertyId, propertyName, totalOutstanding, totalInvoiceCount,
                    averageDaysOutstanding, agingBuckets, tenantDetails, generatedAt);
        }
    }
}
