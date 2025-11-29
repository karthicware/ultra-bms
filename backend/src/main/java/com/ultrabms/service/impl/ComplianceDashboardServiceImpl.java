package com.ultrabms.service.impl;

import com.ultrabms.dto.compliance.ComplianceDashboardDto;
import com.ultrabms.dto.compliance.ViolationListDto;
import com.ultrabms.entity.enums.ComplianceCategory;
import com.ultrabms.entity.enums.ComplianceScheduleStatus;
import com.ultrabms.entity.enums.InspectionStatus;
import com.ultrabms.repository.ComplianceScheduleRepository;
import com.ultrabms.repository.InspectionRepository;
import com.ultrabms.repository.ViolationRepository;
import com.ultrabms.service.ComplianceDashboardService;
import com.ultrabms.service.ViolationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Compliance Dashboard Service Implementation
 * Provides KPIs and summary data for compliance tracking
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #23: Dashboard endpoint
 */
@Service
public class ComplianceDashboardServiceImpl implements ComplianceDashboardService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ComplianceDashboardServiceImpl.class);

    private final ComplianceScheduleRepository scheduleRepository;
    private final InspectionRepository inspectionRepository;
    private final ViolationRepository violationRepository;
    private final ViolationService violationService;

    public ComplianceDashboardServiceImpl(
            ComplianceScheduleRepository scheduleRepository,
            InspectionRepository inspectionRepository,
            ViolationRepository violationRepository,
            ViolationService violationService
    ) {
        this.scheduleRepository = scheduleRepository;
        this.inspectionRepository = inspectionRepository;
        this.violationRepository = violationRepository;
        this.violationService = violationService;
    }

    @Override
    @Transactional(readOnly = true)
    public ComplianceDashboardDto getDashboardData() {
        LOGGER.debug("Building compliance dashboard data");

        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysFromNow = today.plusDays(30);
        LocalDate thirtyDaysAgo = today.minusDays(30);

        // Upcoming inspections (next 30 days)
        Long upcomingInspections = inspectionRepository.countUpcomingInspections(today, thirtyDaysFromNow);

        // Overdue compliance items
        Long overdueComplianceItems = scheduleRepository.countByStatusAndIsDeletedFalse(
                ComplianceScheduleStatus.OVERDUE);

        // Recent violations (last 30 days)
        List<ViolationListDto> recentViolations = violationService.getRecentViolations(30);
        Long recentViolationsCount = (long) recentViolations.size();

        // Compliance rate percentage
        Double complianceRatePercentage = calculateComplianceRate();

        // Inspections by status
        Map<InspectionStatus, Long> inspectionsByStatus = getInspectionsByStatus();

        // Schedules by category
        Map<ComplianceCategory, Long> schedulesByCategory = getSchedulesByCategory();

        return ComplianceDashboardDto.builder()
                .upcomingInspections(upcomingInspections)
                .overdueComplianceItems(overdueComplianceItems)
                .recentViolationsCount(recentViolationsCount)
                .recentViolations(recentViolations)
                .complianceRatePercentage(complianceRatePercentage)
                .inspectionsByStatus(inspectionsByStatus)
                .schedulesByCategory(schedulesByCategory)
                .build();
    }

    /**
     * Calculate overall compliance rate
     * Formula: (completed schedules / total schedules) * 100
     */
    private Double calculateComplianceRate() {
        Long totalSchedules = scheduleRepository.countByIsDeletedFalse();
        Long completedSchedules = scheduleRepository.countByStatusAndIsDeletedFalse(
                ComplianceScheduleStatus.COMPLETED);

        if (totalSchedules == 0) {
            return 100.0; // No schedules = 100% compliant
        }

        return (completedSchedules.doubleValue() / totalSchedules.doubleValue()) * 100;
    }

    /**
     * Get inspection counts grouped by status
     */
    private Map<InspectionStatus, Long> getInspectionsByStatus() {
        Map<InspectionStatus, Long> result = new HashMap<>();
        for (InspectionStatus status : InspectionStatus.values()) {
            Long count = inspectionRepository.countByStatusAndIsDeletedFalse(status);
            result.put(status, count);
        }
        return result;
    }

    /**
     * Get schedule counts grouped by category
     */
    private Map<ComplianceCategory, Long> getSchedulesByCategory() {
        Map<ComplianceCategory, Long> result = new HashMap<>();
        for (ComplianceCategory category : ComplianceCategory.values()) {
            Long count = scheduleRepository.countByCategoryAndIsDeletedFalse(category);
            result.put(category, count);
        }
        return result;
    }
}
