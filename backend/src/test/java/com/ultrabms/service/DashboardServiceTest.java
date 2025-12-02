package com.ultrabms.service;

import com.ultrabms.dto.dashboard.*;
import com.ultrabms.dto.dashboard.KpiCardsDto.TrendDirection;
import com.ultrabms.dto.dashboard.PropertyComparisonDto.PerformanceRank;
import com.ultrabms.repository.DashboardRepository;
import com.ultrabms.service.impl.DashboardServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for DashboardService
 * Story 8.1: Executive Summary Dashboard
 * AC #21-24: Backend unit tests for DashboardService
 *
 * Tests KPI calculations, data aggregation, and caching behavior.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DashboardServiceTest {

    @Mock
    private DashboardRepository dashboardRepository;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    private UUID propertyId;
    private LocalDate startDate;
    private LocalDate endDate;

    @BeforeEach
    void setUp() {
        propertyId = UUID.randomUUID();
        startDate = LocalDate.now().minusMonths(6);
        endDate = LocalDate.now();
    }

    // ============================================================================
    // GET EXECUTIVE DASHBOARD
    // ============================================================================

    @Nested
    @DisplayName("getExecutiveDashboard")
    class GetExecutiveDashboard {

        @Test
        @DisplayName("should return complete dashboard data with all sections")
        void shouldReturnCompleteDashboard() {
            // Given - Mock all repository calls
            mockKpiRepositoryCalls();
            mockMaintenanceQueueCalls();
            mockPmJobsCalls();
            mockLeaseExpirationCalls();
            mockAlertsCalls();
            mockPropertyComparisonCalls();

            // When
            ExecutiveDashboardDto result = dashboardService.getExecutiveDashboard(propertyId, startDate, endDate);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getKpis()).isNotNull();
            assertThat(result.getPriorityMaintenanceQueue()).isNotNull();
            assertThat(result.getUpcomingPmJobs()).isNotNull();
            assertThat(result.getLeaseExpirations()).isNotNull();
            assertThat(result.getCriticalAlerts()).isNotNull();
            assertThat(result.getPropertyComparison()).isNotNull();
        }

        @Test
        @DisplayName("should return empty lists when no data exists")
        void shouldReturnEmptyListsWhenNoData() {
            // Given
            mockEmptyKpiRepositoryCalls();
            when(dashboardRepository.getHighPriorityMaintenanceQueue(anyInt(), any())).thenReturn(Collections.emptyList());
            when(dashboardRepository.getUpcomingPmJobsByCategory(anyInt(), any())).thenReturn(Collections.emptyList());
            when(dashboardRepository.getLeaseExpirationTimeline(anyInt(), any())).thenReturn(Collections.emptyList());
            when(dashboardRepository.getCriticalAlerts(any())).thenReturn(Collections.emptyList());
            when(dashboardRepository.getPropertyComparison(any(), any())).thenReturn(Collections.emptyList());

            // When
            ExecutiveDashboardDto result = dashboardService.getExecutiveDashboard(null, null, null);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getKpis()).isNotNull();
            assertThat(result.getPriorityMaintenanceQueue()).isEmpty();
            assertThat(result.getUpcomingPmJobs()).isEmpty();
            assertThat(result.getLeaseExpirations()).isEmpty();
            assertThat(result.getCriticalAlerts()).isEmpty();
            assertThat(result.getPropertyComparison()).isEmpty();
        }
    }

    // ============================================================================
    // GET KPI CARDS
    // ============================================================================

    @Nested
    @DisplayName("getKpiCards")
    class GetKpiCards {

        @Test
        @DisplayName("should calculate net profit/loss correctly - AC-1")
        void shouldCalculateNetProfitLoss() {
            // Given
            when(dashboardRepository.getTotalRevenueForPeriod(any(), any(), any()))
                    .thenReturn(BigDecimal.valueOf(200000));
            when(dashboardRepository.getTotalExpensesForPeriod(any(), any(), any()))
                    .thenReturn(BigDecimal.valueOf(50000));
            mockOccupancyStats();
            mockMaintenanceCount();
            mockReceivablesAging();

            // When
            KpiCardsDto result = dashboardService.getKpiCards(propertyId, startDate, endDate);

            // Then
            assertThat(result.getNetProfitLoss()).isNotNull();
            assertThat(result.getNetProfitLoss().getValue()).isEqualByComparingTo(BigDecimal.valueOf(150000));
        }

        @Test
        @DisplayName("should calculate occupancy rate correctly - AC-2")
        void shouldCalculateOccupancyRate() {
            // Given
            mockRevenueAndExpenses();
            when(dashboardRepository.getOccupancyStats(any()))
                    .thenReturn(new Object[]{100L, 92L}); // 92 of 100 units
            mockMaintenanceCount();
            mockReceivablesAging();

            // When
            KpiCardsDto result = dashboardService.getKpiCards(propertyId, startDate, endDate);

            // Then
            assertThat(result.getOccupancyRate()).isNotNull();
            assertThat(result.getOccupancyRate().getValue())
                    .isGreaterThanOrEqualTo(BigDecimal.valueOf(92));
        }

        @Test
        @DisplayName("should count overdue maintenance correctly - AC-3")
        void shouldCountOverdueMaintenance() {
            // Given
            mockRevenueAndExpenses();
            mockOccupancyStats();
            when(dashboardRepository.countOverdueMaintenanceJobs(any(LocalDateTime.class), any()))
                    .thenReturn(8L);
            mockReceivablesAging();

            // When
            KpiCardsDto result = dashboardService.getKpiCards(propertyId, startDate, endDate);

            // Then
            assertThat(result.getOverdueMaintenance()).isNotNull();
            assertThat(result.getOverdueMaintenance().getValue())
                    .isEqualByComparingTo(BigDecimal.valueOf(8));
        }

        @Test
        @DisplayName("should calculate receivables with aging breakdown - AC-4")
        void shouldCalculateReceivablesWithAging() {
            // Given
            mockRevenueAndExpenses();
            mockOccupancyStats();
            mockMaintenanceCount();
            when(dashboardRepository.getReceivablesAging(any(LocalDate.class), any()))
                    .thenReturn(new Object[]{
                            BigDecimal.valueOf(35000), // total
                            BigDecimal.valueOf(15000), // current
                            BigDecimal.valueOf(10000), // 30+
                            BigDecimal.valueOf(5000),  // 60+
                            BigDecimal.valueOf(5000)   // 90+
                    });

            // When
            KpiCardsDto result = dashboardService.getKpiCards(propertyId, startDate, endDate);

            // Then
            assertThat(result.getOutstandingReceivables()).isNotNull();
            assertThat(result.getOutstandingReceivables().getTotalAmount())
                    .isEqualByComparingTo(BigDecimal.valueOf(35000));
            assertThat(result.getOutstandingReceivables().getAging()).isNotNull();
            assertThat(result.getOutstandingReceivables().getAging().getCurrent())
                    .isEqualByComparingTo(BigDecimal.valueOf(15000));
        }

        @Test
        @DisplayName("should handle null property filter correctly")
        void shouldHandleNullPropertyFilter() {
            // Given
            mockKpiRepositoryCalls();

            // When
            KpiCardsDto result = dashboardService.getKpiCards(null, startDate, endDate);

            // Then
            assertThat(result).isNotNull();
            verify(dashboardRepository).getTotalRevenueForPeriod(eq(startDate), eq(endDate), isNull());
        }
    }

    // ============================================================================
    // GET PRIORITY MAINTENANCE QUEUE
    // ============================================================================

    @Nested
    @DisplayName("getPriorityMaintenanceQueue")
    class GetPriorityMaintenanceQueue {

        @Test
        @DisplayName("should return high priority work orders - AC-5")
        void shouldReturnHighPriorityWorkOrders() {
            // Given
            List<Object[]> mockData = Arrays.asList(
                    buildMaintenanceQueueRow("HVAC Repair", "Property A", "HIGH", false),
                    buildMaintenanceQueueRow("Plumbing Issue", "Property B", "HIGH", true)
            );
            when(dashboardRepository.getHighPriorityMaintenanceQueue(eq(10), any())).thenReturn(mockData);

            // When
            List<MaintenanceQueueItemDto> result = dashboardService.getPriorityMaintenanceQueue(propertyId, 10);

            // Then
            assertThat(result).hasSize(2);
            assertThat(result.get(0).getPriority()).isEqualTo("HIGH");
            verify(dashboardRepository).getHighPriorityMaintenanceQueue(10, propertyId);
        }

        @Test
        @DisplayName("should return empty list when no work orders")
        void shouldReturnEmptyListWhenNoWorkOrders() {
            // Given
            when(dashboardRepository.getHighPriorityMaintenanceQueue(anyInt(), any()))
                    .thenReturn(Collections.emptyList());

            // When
            List<MaintenanceQueueItemDto> result = dashboardService.getPriorityMaintenanceQueue(propertyId, 10);

            // Then
            assertThat(result).isEmpty();
        }
    }

    // ============================================================================
    // GET UPCOMING PM JOBS
    // ============================================================================

    @Nested
    @DisplayName("getUpcomingPmJobs")
    class GetUpcomingPmJobs {

        @Test
        @DisplayName("should return PM jobs grouped by category - AC-6")
        void shouldReturnPmJobsByCategory() {
            // Given
            List<Object[]> mockData = Arrays.asList(
                    new Object[]{"HVAC", 5, 2, 7},
                    new Object[]{"PLUMBING", 3, 1, 4},
                    new Object[]{"ELECTRICAL", 4, 0, 4}
            );
            when(dashboardRepository.getUpcomingPmJobsByCategory(eq(30), any())).thenReturn(mockData);

            // When
            List<PmJobChartDataDto> result = dashboardService.getUpcomingPmJobs(propertyId, 30);

            // Then
            assertThat(result).hasSize(3);
            assertThat(result).extracting(PmJobChartDataDto::getCategory)
                    .contains("HVAC", "PLUMBING", "ELECTRICAL");
        }

        @Test
        @DisplayName("should include scheduled and overdue counts")
        void shouldIncludeScheduledAndOverdueCounts() {
            // Given
            List<Object[]> mockData = new ArrayList<>();
            mockData.add(new Object[]{"HVAC", 5, 2, 7});
            when(dashboardRepository.getUpcomingPmJobsByCategory(anyInt(), any())).thenReturn(mockData);

            // When
            List<PmJobChartDataDto> result = dashboardService.getUpcomingPmJobs(propertyId, 30);

            // Then
            assertThat(result.get(0).getScheduledCount()).isEqualTo(5);
            assertThat(result.get(0).getOverdueCount()).isEqualTo(2);
            assertThat(result.get(0).getTotalCount()).isEqualTo(7);
        }
    }

    // ============================================================================
    // GET LEASE EXPIRATION TIMELINE
    // ============================================================================

    @Nested
    @DisplayName("getLeaseExpirationTimeline")
    class GetLeaseExpirationTimeline {

        @Test
        @DisplayName("should return lease expirations by month - AC-7")
        void shouldReturnLeaseExpirationsByMonth() {
            // Given
            List<Object[]> mockData = Arrays.asList(
                    new Object[]{2024, 1, 3},
                    new Object[]{2024, 2, 5},
                    new Object[]{2024, 3, 8}  // > 5 needs renewal planning
            );
            when(dashboardRepository.getLeaseExpirationTimeline(eq(12), any())).thenReturn(mockData);

            // When
            List<LeaseExpirationTimelineDto> result = dashboardService.getLeaseExpirationTimeline(propertyId, 12);

            // Then
            assertThat(result).hasSize(3);
            verify(dashboardRepository).getLeaseExpirationTimeline(12, propertyId);
        }

        @Test
        @DisplayName("should flag high volume months for renewal planning")
        void shouldFlagHighVolumeMonths() {
            // Given
            List<Object[]> mockData = Arrays.asList(
                    new Object[]{2024, 1, 3},   // <= 5 no planning needed
                    new Object[]{2024, 2, 8}    // > 5 needs renewal planning
            );
            when(dashboardRepository.getLeaseExpirationTimeline(anyInt(), any())).thenReturn(mockData);

            // When
            List<LeaseExpirationTimelineDto> result = dashboardService.getLeaseExpirationTimeline(propertyId, 12);

            // Then
            assertThat(result.get(0).getNeedsRenewalPlanning()).isFalse();
            assertThat(result.get(1).getNeedsRenewalPlanning()).isTrue();
        }
    }

    // ============================================================================
    // GET CRITICAL ALERTS
    // ============================================================================

    @Nested
    @DisplayName("getCriticalAlerts")
    class GetCriticalAlerts {

        @Test
        @DisplayName("should return color-coded alerts - AC-8")
        void shouldReturnColorCodedAlerts() {
            // Given
            List<Object[]> mockData = Arrays.asList(
                    new Object[]{"OVERDUE_COMPLIANCE", "URGENT", 5},
                    new Object[]{"DOCUMENTS_EXPIRING_SOON", "WARNING", 3},
                    new Object[]{"LOW_OCCUPANCY", "INFO", 2}
            );
            when(dashboardRepository.getCriticalAlerts(any())).thenReturn(mockData);

            // When
            List<AlertDto> result = dashboardService.getCriticalAlerts(propertyId);

            // Then
            assertThat(result).hasSize(3);
            assertThat(result).extracting(AlertDto::getSeverity)
                    .containsExactly(
                            AlertDto.AlertSeverity.URGENT,
                            AlertDto.AlertSeverity.WARNING,
                            AlertDto.AlertSeverity.INFO
                    );
        }

        @Test
        @DisplayName("should sort alerts by severity (urgent first)")
        void shouldSortAlertsBySeverity() {
            // Given - provide alerts in reverse order
            List<Object[]> mockData = Arrays.asList(
                    new Object[]{"LOW_OCCUPANCY", "INFO", 2},
                    new Object[]{"OVERDUE_COMPLIANCE", "URGENT", 5},
                    new Object[]{"DOCUMENTS_EXPIRING_SOON", "WARNING", 3}
            );
            when(dashboardRepository.getCriticalAlerts(any())).thenReturn(mockData);

            // When
            List<AlertDto> result = dashboardService.getCriticalAlerts(propertyId);

            // Then
            assertThat(result.get(0).getSeverity()).isEqualTo(AlertDto.AlertSeverity.URGENT);
            assertThat(result.get(1).getSeverity()).isEqualTo(AlertDto.AlertSeverity.WARNING);
            assertThat(result.get(2).getSeverity()).isEqualTo(AlertDto.AlertSeverity.INFO);
        }

        @Test
        @DisplayName("should filter out alerts with zero count")
        void shouldFilterOutZeroCountAlerts() {
            // Given
            List<Object[]> mockData = Arrays.asList(
                    new Object[]{"OVERDUE_COMPLIANCE", "URGENT", 5},
                    new Object[]{"BOUNCED_CHEQUES", "URGENT", 0} // zero count
            );
            when(dashboardRepository.getCriticalAlerts(any())).thenReturn(mockData);

            // When
            List<AlertDto> result = dashboardService.getCriticalAlerts(propertyId);

            // Then
            assertThat(result).hasSize(1);
        }
    }

    // ============================================================================
    // GET PROPERTY COMPARISON
    // ============================================================================

    @Nested
    @DisplayName("getPropertyComparison")
    class GetPropertyComparison {

        @Test
        @DisplayName("should return property comparison - AC-9")
        void shouldReturnPropertyComparison() {
            // Given
            UUID propAId = UUID.randomUUID();
            UUID propBId = UUID.randomUUID();
            List<Object[]> mockData = Arrays.asList(
                    new Object[]{propAId, "Property A", BigDecimal.valueOf(95), BigDecimal.valueOf(5000), BigDecimal.valueOf(50000), 3},
                    new Object[]{propBId, "Property B", BigDecimal.valueOf(75), BigDecimal.valueOf(12000), BigDecimal.valueOf(30000), 8}
            );
            when(dashboardRepository.getPropertyComparison(any(), any())).thenReturn(mockData);

            // When
            List<PropertyComparisonDto> result = dashboardService.getPropertyComparison(startDate, endDate);

            // Then
            assertThat(result).hasSize(2);
            assertThat(result).extracting(PropertyComparisonDto::getPropertyName)
                    .contains("Property A", "Property B");
        }

        @Test
        @DisplayName("should include performance rankings")
        void shouldIncludePerformanceRankings() {
            // Given - Property A has higher revenue, should be TOP
            UUID propAId = UUID.randomUUID();
            UUID propBId = UUID.randomUUID();
            List<Object[]> mockData = Arrays.asList(
                    new Object[]{propAId, "Property A", BigDecimal.valueOf(95), BigDecimal.valueOf(5000), BigDecimal.valueOf(50000), 3},
                    new Object[]{propBId, "Property B", BigDecimal.valueOf(75), BigDecimal.valueOf(12000), BigDecimal.valueOf(10000), 8}
            );
            when(dashboardRepository.getPropertyComparison(any(), any())).thenReturn(mockData);

            // When
            List<PropertyComparisonDto> result = dashboardService.getPropertyComparison(startDate, endDate);

            // Then
            // Find Property A and check it's TOP ranked (highest revenue)
            PropertyComparisonDto propA = result.stream()
                    .filter(p -> p.getPropertyName().equals("Property A"))
                    .findFirst().orElseThrow();
            assertThat(propA.getRank()).isEqualTo(PerformanceRank.TOP);
        }
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    private void mockKpiRepositoryCalls() {
        mockRevenueAndExpenses();
        mockOccupancyStats();
        mockMaintenanceCount();
        mockReceivablesAging();
    }

    private void mockEmptyKpiRepositoryCalls() {
        when(dashboardRepository.getTotalRevenueForPeriod(any(), any(), any()))
                .thenReturn(BigDecimal.ZERO);
        when(dashboardRepository.getTotalExpensesForPeriod(any(), any(), any()))
                .thenReturn(BigDecimal.ZERO);
        when(dashboardRepository.getOccupancyStats(any()))
                .thenReturn(new Object[]{0L, 0L});
        when(dashboardRepository.countOverdueMaintenanceJobs(any(LocalDateTime.class), any()))
                .thenReturn(0L);
        when(dashboardRepository.getReceivablesAging(any(LocalDate.class), any()))
                .thenReturn(new Object[]{
                        BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                        BigDecimal.ZERO, BigDecimal.ZERO
                });
    }

    private void mockRevenueAndExpenses() {
        when(dashboardRepository.getTotalRevenueForPeriod(any(), any(), any()))
                .thenReturn(BigDecimal.valueOf(200000));
        when(dashboardRepository.getTotalExpensesForPeriod(any(), any(), any()))
                .thenReturn(BigDecimal.valueOf(50000));
    }

    private void mockOccupancyStats() {
        when(dashboardRepository.getOccupancyStats(any()))
                .thenReturn(new Object[]{100L, 92L});
    }

    private void mockMaintenanceCount() {
        when(dashboardRepository.countOverdueMaintenanceJobs(any(LocalDateTime.class), any()))
                .thenReturn(8L);
    }

    private void mockReceivablesAging() {
        when(dashboardRepository.getReceivablesAging(any(LocalDate.class), any()))
                .thenReturn(new Object[]{
                        BigDecimal.valueOf(35000),
                        BigDecimal.valueOf(15000),
                        BigDecimal.valueOf(10000),
                        BigDecimal.valueOf(5000),
                        BigDecimal.valueOf(5000)
                });
    }

    private void mockMaintenanceQueueCalls() {
        List<Object[]> mockData = new ArrayList<>();
        mockData.add(buildMaintenanceQueueRow("HVAC Repair", "Property A", "HIGH", false));
        when(dashboardRepository.getHighPriorityMaintenanceQueue(anyInt(), any())).thenReturn(mockData);
    }

    private void mockPmJobsCalls() {
        List<Object[]> mockData = Arrays.asList(
                new Object[]{"HVAC", 5, 2, 7},
                new Object[]{"PLUMBING", 3, 1, 4}
        );
        when(dashboardRepository.getUpcomingPmJobsByCategory(anyInt(), any())).thenReturn(mockData);
    }

    private void mockLeaseExpirationCalls() {
        List<Object[]> mockData = Arrays.asList(
                new Object[]{2024, 1, 3},
                new Object[]{2024, 2, 5}
        );
        when(dashboardRepository.getLeaseExpirationTimeline(anyInt(), any())).thenReturn(mockData);
    }

    private void mockAlertsCalls() {
        List<Object[]> mockData = new ArrayList<>();
        mockData.add(new Object[]{"OVERDUE_COMPLIANCE", "URGENT", 5});
        when(dashboardRepository.getCriticalAlerts(any())).thenReturn(mockData);
    }

    private void mockPropertyComparisonCalls() {
        List<Object[]> mockData = new ArrayList<>();
        mockData.add(new Object[]{UUID.randomUUID(), "Property A", BigDecimal.valueOf(95), BigDecimal.valueOf(5000), BigDecimal.valueOf(50000), 3});
        when(dashboardRepository.getPropertyComparison(any(), any())).thenReturn(mockData);
    }

    private Object[] buildMaintenanceQueueRow(String title, String propertyName, String priority, boolean isOverdue) {
        return new Object[]{
                UUID.randomUUID(),              // id
                "WO-2024-001",                  // workOrderNumber
                propertyName,                   // propertyName
                "101",                          // unitNumber
                title,                          // title
                "Description for " + title,    // description
                priority,                       // priority
                "OPEN",                         // status
                isOverdue ? java.sql.Timestamp.valueOf(LocalDateTime.now().minusDays(5)) : null, // scheduledDate
                isOverdue ? 5 : 0,              // daysOverdue
                isOverdue                       // isOverdue
        };
    }
}
