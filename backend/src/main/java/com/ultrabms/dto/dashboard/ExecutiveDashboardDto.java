package com.ultrabms.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for GET /api/v1/dashboard/executive
 * Contains all executive dashboard data in a single response (AC-11)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutiveDashboardDto {

    private KpiCardsDto kpis;
    private List<MaintenanceQueueItemDto> priorityMaintenanceQueue;
    private List<PmJobChartDataDto> upcomingPmJobs;
    private List<LeaseExpirationTimelineDto> leaseExpirations;
    private List<AlertDto> criticalAlerts;
    private List<PropertyComparisonDto> propertyComparison;
}
