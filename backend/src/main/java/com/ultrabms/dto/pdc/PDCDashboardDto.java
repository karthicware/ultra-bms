package com.ultrabms.dto.pdc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * DTO for PDC Dashboard data.
 *
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #1: PDC Dashboard with KPIs
 * AC #27: PDC DTOs
 */
public record PDCDashboardDto(
        // KPI Summary
        Summary summary,

        // Upcoming PDCs due this week
        List<UpcomingPDC> upcomingPDCsThisWeek,

        // Recently deposited PDCs
        List<RecentlyDepositedPDC> recentlyDeposited,

        // PDC Holder information (from company profile)
        String pdcHolderName
) {
    /**
     * Summary KPIs
     */
    public record Summary(
            long totalPDCsReceived,
            long pdcsDueThisWeek,
            BigDecimal totalValueDueThisWeek,
            String formattedValueDueThisWeek,
            long pdcsDepositedThisMonth,
            BigDecimal totalValueDepositedThisMonth,
            String formattedValueDepositedThisMonth,
            BigDecimal totalOutstandingValue,
            String formattedOutstandingValue,
            long bouncedPDCsLast30Days,
            double bounceRatePercent
    ) {
        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private long totalPDCsReceived;
            private long pdcsDueThisWeek;
            private BigDecimal totalValueDueThisWeek = BigDecimal.ZERO;
            private String formattedValueDueThisWeek;
            private long pdcsDepositedThisMonth;
            private BigDecimal totalValueDepositedThisMonth = BigDecimal.ZERO;
            private String formattedValueDepositedThisMonth;
            private BigDecimal totalOutstandingValue = BigDecimal.ZERO;
            private String formattedOutstandingValue;
            private long bouncedPDCsLast30Days;
            private double bounceRatePercent;

            public Builder totalPDCsReceived(long totalPDCsReceived) {
                this.totalPDCsReceived = totalPDCsReceived;
                return this;
            }

            public Builder pdcsDueThisWeek(long pdcsDueThisWeek) {
                this.pdcsDueThisWeek = pdcsDueThisWeek;
                return this;
            }

            public Builder totalValueDueThisWeek(BigDecimal totalValueDueThisWeek) {
                this.totalValueDueThisWeek = totalValueDueThisWeek;
                return this;
            }

            public Builder formattedValueDueThisWeek(String formattedValueDueThisWeek) {
                this.formattedValueDueThisWeek = formattedValueDueThisWeek;
                return this;
            }

            public Builder pdcsDepositedThisMonth(long pdcsDepositedThisMonth) {
                this.pdcsDepositedThisMonth = pdcsDepositedThisMonth;
                return this;
            }

            public Builder totalValueDepositedThisMonth(BigDecimal totalValueDepositedThisMonth) {
                this.totalValueDepositedThisMonth = totalValueDepositedThisMonth;
                return this;
            }

            public Builder formattedValueDepositedThisMonth(String formattedValueDepositedThisMonth) {
                this.formattedValueDepositedThisMonth = formattedValueDepositedThisMonth;
                return this;
            }

            public Builder totalOutstandingValue(BigDecimal totalOutstandingValue) {
                this.totalOutstandingValue = totalOutstandingValue;
                return this;
            }

            public Builder formattedOutstandingValue(String formattedOutstandingValue) {
                this.formattedOutstandingValue = formattedOutstandingValue;
                return this;
            }

            public Builder bouncedPDCsLast30Days(long bouncedPDCsLast30Days) {
                this.bouncedPDCsLast30Days = bouncedPDCsLast30Days;
                return this;
            }

            public Builder bounceRatePercent(double bounceRatePercent) {
                this.bounceRatePercent = bounceRatePercent;
                return this;
            }

            public Summary build() {
                return new Summary(
                        totalPDCsReceived, pdcsDueThisWeek,
                        totalValueDueThisWeek, formattedValueDueThisWeek,
                        pdcsDepositedThisMonth, totalValueDepositedThisMonth,
                        formattedValueDepositedThisMonth,
                        totalOutstandingValue, formattedOutstandingValue,
                        bouncedPDCsLast30Days, bounceRatePercent
                );
            }
        }
    }

    /**
     * Upcoming PDC entry for dashboard
     */
    public record UpcomingPDC(
            UUID id,
            String chequeNumber,
            String tenantName,
            BigDecimal amount,
            String formattedAmount,
            LocalDate chequeDate,
            int daysUntilDue
    ) {
        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private UUID id;
            private String chequeNumber;
            private String tenantName;
            private BigDecimal amount;
            private String formattedAmount;
            private LocalDate chequeDate;
            private int daysUntilDue;

            public Builder id(UUID id) {
                this.id = id;
                return this;
            }

            public Builder chequeNumber(String chequeNumber) {
                this.chequeNumber = chequeNumber;
                return this;
            }

            public Builder tenantName(String tenantName) {
                this.tenantName = tenantName;
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

            public Builder daysUntilDue(int daysUntilDue) {
                this.daysUntilDue = daysUntilDue;
                return this;
            }

            public UpcomingPDC build() {
                return new UpcomingPDC(
                        id, chequeNumber, tenantName,
                        amount, formattedAmount, chequeDate, daysUntilDue
                );
            }
        }
    }

    /**
     * Recently deposited PDC entry for dashboard
     */
    public record RecentlyDepositedPDC(
            UUID id,
            String chequeNumber,
            String tenantName,
            BigDecimal amount,
            String formattedAmount,
            LocalDate depositDate
    ) {
        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private UUID id;
            private String chequeNumber;
            private String tenantName;
            private BigDecimal amount;
            private String formattedAmount;
            private LocalDate depositDate;

            public Builder id(UUID id) {
                this.id = id;
                return this;
            }

            public Builder chequeNumber(String chequeNumber) {
                this.chequeNumber = chequeNumber;
                return this;
            }

            public Builder tenantName(String tenantName) {
                this.tenantName = tenantName;
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

            public Builder depositDate(LocalDate depositDate) {
                this.depositDate = depositDate;
                return this;
            }

            public RecentlyDepositedPDC build() {
                return new RecentlyDepositedPDC(
                        id, chequeNumber, tenantName,
                        amount, formattedAmount, depositDate
                );
            }
        }
    }

    /**
     * Builder for PDCDashboardDto
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Summary summary;
        private List<UpcomingPDC> upcomingPDCsThisWeek;
        private List<RecentlyDepositedPDC> recentlyDeposited;
        private String pdcHolderName;

        public Builder summary(Summary summary) {
            this.summary = summary;
            return this;
        }

        public Builder upcomingPDCsThisWeek(List<UpcomingPDC> upcomingPDCsThisWeek) {
            this.upcomingPDCsThisWeek = upcomingPDCsThisWeek;
            return this;
        }

        public Builder recentlyDeposited(List<RecentlyDepositedPDC> recentlyDeposited) {
            this.recentlyDeposited = recentlyDeposited;
            return this;
        }

        public Builder pdcHolderName(String pdcHolderName) {
            this.pdcHolderName = pdcHolderName;
            return this;
        }

        public PDCDashboardDto build() {
            return new PDCDashboardDto(
                    summary, upcomingPDCsThisWeek, recentlyDeposited, pdcHolderName
            );
        }
    }
}
