package com.ultrabms.dto.compliance;

import com.ultrabms.entity.enums.ComplianceCategory;
import com.ultrabms.entity.enums.InspectionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO for compliance dashboard data
 * Used in GET /api/v1/compliance/dashboard
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #23: GET /api/v1/compliance/dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceDashboardDto {

    /**
     * Count of upcoming inspections (next 30 days)
     */
    private Long upcomingInspections;

    /**
     * Count of overdue compliance items
     */
    private Long overdueComplianceItems;

    /**
     * Count of recent violations (last 30 days)
     */
    private Long recentViolationsCount;

    /**
     * List of recent violations
     */
    private List<ViolationListDto> recentViolations;

    /**
     * Overall compliance rate percentage (completed / total * 100)
     */
    private Double complianceRatePercentage;

    /**
     * Inspections grouped by status
     */
    private Map<InspectionStatus, Long> inspectionsByStatus;

    /**
     * Schedules grouped by category
     */
    private Map<ComplianceCategory, Long> schedulesByCategory;
}
