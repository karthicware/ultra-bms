package com.ultrabms.dto.tenant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Response DTO for tenant dashboard data
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    private UnitInfo currentUnit;
    private DashboardStats stats;
    private List<QuickAction> quickActions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UnitInfo {
        private String propertyName;
        private String address;
        private String unitNumber;
        private Integer floor;
        private Integer bedrooms;
        private Integer bathrooms;
        private LocalDate leaseStartDate;
        private LocalDate leaseEndDate;
        private Long daysRemaining;
        private String leaseStatus; // ACTIVE, EXPIRING_SOON, EXPIRED
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardStats {
        private BigDecimal outstandingBalance;
        private NextPaymentDue nextPaymentDue;
        private Long openRequestsCount;
        private Long upcomingBookingsCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NextPaymentDue {
        private LocalDate date;
        private BigDecimal amount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuickAction {
        private String name;
        private String url;
        private String icon;
    }
}
