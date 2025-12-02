package com.ultrabms.service;

import com.ultrabms.dto.dashboard.occupancy.*;
import com.ultrabms.dto.dashboard.occupancy.LeaseActivityDto.ActivityType;
import com.ultrabms.dto.dashboard.occupancy.OccupancyKpiDto.TrendDirection;
import com.ultrabms.repository.OccupancyDashboardRepository;
import com.ultrabms.service.impl.OccupancyDashboardServiceImpl;
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
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for OccupancyDashboardService
 * Story 8.3: Occupancy Dashboard
 *
 * Tests KPI calculations, chart data, lease expirations, and activity feed.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OccupancyDashboardServiceTest {

    @Mock
    private OccupancyDashboardRepository occupancyDashboardRepository;

    @InjectMocks
    private OccupancyDashboardServiceImpl occupancyDashboardService;

    private UUID propertyId;

    @BeforeEach
    void setUp() {
        propertyId = UUID.randomUUID();
        // Default mock for trend calculation - can be overridden in specific tests
        when(occupancyDashboardRepository.getActivityCountsForTrend(anyInt(), any()))
                .thenReturn(new Object[]{0L, 0L});
    }

    // ============================================================================
    // GET OCCUPANCY DASHBOARD
    // ============================================================================

    @Nested
    @DisplayName("getOccupancyDashboard - AC-9")
    class GetOccupancyDashboard {

        @Test
        @DisplayName("should return complete dashboard data with all sections")
        void shouldReturnCompleteDashboard() {
            // Given
            mockOccupancyBreakdown();
            mockAverageRentPerSqft();
            mockExpiringLeases();
            mockVacantUnits();
            mockLeaseExpirationsByMonth();
            mockUpcomingExpirations();
            mockRecentActivity();
            mockActivityCountsForTrend();

            // When
            OccupancyDashboardDto result = occupancyDashboardService.getOccupancyDashboard(propertyId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getKpis()).isNotNull();
            assertThat(result.getOccupancyChart()).isNotNull();
            assertThat(result.getLeaseExpirationChart()).isNotNull();
            assertThat(result.getUpcomingExpirations()).isNotNull();
            assertThat(result.getRecentActivity()).isNotNull();
            assertThat(result.getExpiryPeriodDays()).isEqualTo(100);
        }

        @Test
        @DisplayName("should return empty lists when no data exists")
        void shouldReturnEmptyListsWhenNoData() {
            // Given
            mockEmptyOccupancyBreakdown();
            mockEmptyAverageRentPerSqft();
            when(occupancyDashboardRepository.countExpiringLeases(anyInt(), any())).thenReturn(0L);
            when(occupancyDashboardRepository.countVacantUnits(any())).thenReturn(0L);
            when(occupancyDashboardRepository.getLeaseExpirationsByMonth(anyInt(), any())).thenReturn(Collections.emptyList());
            when(occupancyDashboardRepository.getUpcomingLeaseExpirations(anyInt(), anyInt(), anyInt(), any())).thenReturn(Collections.emptyList());
            when(occupancyDashboardRepository.getRecentLeaseActivity(anyInt(), any())).thenReturn(Collections.emptyList());
            when(occupancyDashboardRepository.getActivityCountsForTrend(anyInt(), any())).thenReturn(new Object[]{0L, 0L});

            // When
            OccupancyDashboardDto result = occupancyDashboardService.getOccupancyDashboard(null);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getUpcomingExpirations()).isEmpty();
            assertThat(result.getRecentActivity()).isEmpty();
        }
    }

    // ============================================================================
    // KPI CALCULATIONS
    // ============================================================================

    @Nested
    @DisplayName("KPI Calculations - AC-1 to AC-4")
    class KpiCalculations {

        @Test
        @DisplayName("AC-1: should calculate portfolio occupancy percentage correctly")
        void shouldCalculatePortfolioOccupancy() {
            // Given - 92 of 100 units occupied = 92%
            when(occupancyDashboardRepository.getOccupancyBreakdown(any()))
                    .thenReturn(new Object[]{100L, 92L, 5L, 2L, 1L});
            mockAverageRentPerSqft();
            mockExpiringLeases();
            mockVacantUnits();

            // When
            OccupancyDashboardDto result = occupancyDashboardService.getOccupancyDashboard(propertyId);

            // Then
            assertThat(result.getKpis().getPortfolioOccupancy()).isNotNull();
            assertThat(result.getKpis().getPortfolioOccupancy().getValue())
                    .isEqualByComparingTo(BigDecimal.valueOf(92.0));
            assertThat(result.getKpis().getPortfolioOccupancy().getUnit()).isEqualTo("%");
        }

        @Test
        @DisplayName("AC-2: should count vacant units correctly")
        void shouldCountVacantUnits() {
            // Given
            mockOccupancyBreakdown();
            mockAverageRentPerSqft();
            mockExpiringLeases();
            when(occupancyDashboardRepository.countVacantUnits(any())).thenReturn(8L);

            // When
            OccupancyDashboardDto result = occupancyDashboardService.getOccupancyDashboard(propertyId);

            // Then
            assertThat(result.getKpis().getVacantUnits()).isNotNull();
            assertThat(result.getKpis().getVacantUnits().getValue())
                    .isEqualByComparingTo(BigDecimal.valueOf(8));
            assertThat(result.getKpis().getVacantUnits().getUnit()).isEqualTo("count");
        }

        @Test
        @DisplayName("AC-3: should count leases expiring within configurable period")
        void shouldCountExpiringLeases() {
            // Given
            mockOccupancyBreakdown();
            mockAverageRentPerSqft();
            mockVacantUnits();
            when(occupancyDashboardRepository.countExpiringLeases(eq(100), any())).thenReturn(15L);

            // When
            OccupancyDashboardDto result = occupancyDashboardService.getOccupancyDashboard(propertyId);

            // Then
            assertThat(result.getKpis().getLeasesExpiring()).isNotNull();
            assertThat(result.getKpis().getLeasesExpiring().getValue())
                    .isEqualByComparingTo(BigDecimal.valueOf(15));
            verify(occupancyDashboardRepository).countExpiringLeases(100, propertyId);
        }

        @Test
        @DisplayName("AC-4: should calculate average rent per sqft correctly")
        void shouldCalculateAverageRentPerSqft() {
            // Given
            mockOccupancyBreakdown();
            mockExpiringLeases();
            mockVacantUnits();
            when(occupancyDashboardRepository.getAverageRentPerSqft(any()))
                    .thenReturn(new Object[]{
                            BigDecimal.valueOf(500000), // total rent
                            BigDecimal.valueOf(25000),  // total sqft
                            BigDecimal.valueOf(20)      // avg rent/sqft = 20 AED
                    });

            // When
            OccupancyDashboardDto result = occupancyDashboardService.getOccupancyDashboard(propertyId);

            // Then
            assertThat(result.getKpis().getAverageRentPerSqft()).isNotNull();
            assertThat(result.getKpis().getAverageRentPerSqft().getValue())
                    .isEqualByComparingTo(BigDecimal.valueOf(20));
            assertThat(result.getKpis().getAverageRentPerSqft().getUnit()).isEqualTo("AED/sqft");
        }

        @Test
        @DisplayName("should handle zero total units for occupancy calculation")
        void shouldHandleZeroTotalUnits() {
            // Given
            when(occupancyDashboardRepository.getOccupancyBreakdown(any()))
                    .thenReturn(new Object[]{0L, 0L, 0L, 0L, 0L});
            mockAverageRentPerSqft();
            mockExpiringLeases();
            mockVacantUnits();

            // When
            OccupancyDashboardDto result = occupancyDashboardService.getOccupancyDashboard(propertyId);

            // Then
            assertThat(result.getKpis().getPortfolioOccupancy().getValue())
                    .isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    // ============================================================================
    // OCCUPANCY DONUT CHART
    // ============================================================================

    @Nested
    @DisplayName("Occupancy Chart - AC-5")
    class OccupancyChart {

        @Test
        @DisplayName("should return chart segments for occupied, vacant, renovation, notice")
        void shouldReturnAllSegments() {
            // Given
            when(occupancyDashboardRepository.getOccupancyBreakdown(any()))
                    .thenReturn(new Object[]{100L, 80L, 10L, 5L, 5L});
            mockAverageRentPerSqft();
            mockExpiringLeases();
            mockVacantUnits();
            mockLeaseExpirationsByMonth();
            mockUpcomingExpirations();
            mockRecentActivity();

            // When
            OccupancyDashboardDto result = occupancyDashboardService.getOccupancyDashboard(propertyId);

            // Then
            PortfolioOccupancyChartDto chart = result.getOccupancyChart();
            assertThat(chart.getTotalUnits()).isEqualTo(100L);
            assertThat(chart.getSegments()).hasSize(4);
            assertThat(chart.getSegments()).extracting(PortfolioOccupancyChartDto.OccupancySegment::getStatus)
                    .containsExactlyInAnyOrder("Occupied", "Vacant", "Under Renovation", "Notice Period");
        }

        @Test
        @DisplayName("should calculate segment percentages correctly")
        void shouldCalculatePercentagesCorrectly() {
            // Given - 80 of 100 = 80%
            when(occupancyDashboardRepository.getOccupancyBreakdown(any()))
                    .thenReturn(new Object[]{100L, 80L, 10L, 5L, 5L});
            mockAverageRentPerSqft();
            mockExpiringLeases();
            mockVacantUnits();
            mockLeaseExpirationsByMonth();
            mockUpcomingExpirations();
            mockRecentActivity();

            // When
            OccupancyDashboardDto result = occupancyDashboardService.getOccupancyDashboard(propertyId);

            // Then
            PortfolioOccupancyChartDto.OccupancySegment occupied = result.getOccupancyChart().getSegments().stream()
                    .filter(s -> s.getStatus().equals("Occupied"))
                    .findFirst().orElseThrow();
            assertThat(occupied.getPercentage()).isEqualByComparingTo(BigDecimal.valueOf(80.0));
        }

        @Test
        @DisplayName("should include color codes for segments")
        void shouldIncludeColorCodes() {
            // Given
            when(occupancyDashboardRepository.getOccupancyBreakdown(any()))
                    .thenReturn(new Object[]{100L, 80L, 10L, 5L, 5L});
            mockAverageRentPerSqft();
            mockExpiringLeases();
            mockVacantUnits();
            mockLeaseExpirationsByMonth();
            mockUpcomingExpirations();
            mockRecentActivity();

            // When
            OccupancyDashboardDto result = occupancyDashboardService.getOccupancyDashboard(propertyId);

            // Then
            assertThat(result.getOccupancyChart().getSegments())
                    .allMatch(segment -> segment.getColor() != null && segment.getColor().startsWith("#"));
        }

        @Test
        @DisplayName("should exclude segments with zero count")
        void shouldExcludeZeroCountSegments() {
            // Given - no renovation or notice period units
            when(occupancyDashboardRepository.getOccupancyBreakdown(any()))
                    .thenReturn(new Object[]{100L, 90L, 10L, 0L, 0L});
            mockAverageRentPerSqft();
            mockExpiringLeases();
            mockVacantUnits();
            mockLeaseExpirationsByMonth();
            mockUpcomingExpirations();
            mockRecentActivity();

            // When
            OccupancyDashboardDto result = occupancyDashboardService.getOccupancyDashboard(propertyId);

            // Then
            assertThat(result.getOccupancyChart().getSegments()).hasSize(2);
            assertThat(result.getOccupancyChart().getSegments()).extracting(PortfolioOccupancyChartDto.OccupancySegment::getStatus)
                    .containsExactlyInAnyOrder("Occupied", "Vacant");
        }
    }

    // ============================================================================
    // LEASE EXPIRATIONS BAR CHART
    // ============================================================================

    @Nested
    @DisplayName("Lease Expirations Chart - AC-6")
    class LeaseExpirationsChart {

        @Test
        @DisplayName("should return 12 months of expiration data")
        void shouldReturn12MonthsOfData() {
            // Given
            mockOccupancyBreakdown();
            mockAverageRentPerSqft();
            mockExpiringLeases();
            mockVacantUnits();
            mockUpcomingExpirations();
            mockRecentActivity();

            List<Object[]> monthlyData = Arrays.asList(
                    new Object[]{2025, 1, "Jan 2025", "2025-01", 3L, 1L, 2L},
                    new Object[]{2025, 2, "Feb 2025", "2025-02", 5L, 2L, 3L},
                    new Object[]{2025, 3, "Mar 2025", "2025-03", 8L, 4L, 4L}
            );
            when(occupancyDashboardRepository.getLeaseExpirationsByMonth(eq(12), any())).thenReturn(monthlyData);

            // When
            OccupancyDashboardDto result = occupancyDashboardService.getOccupancyDashboard(propertyId);

            // Then
            assertThat(result.getLeaseExpirationChart().getMonthlyData()).hasSize(3);
            verify(occupancyDashboardRepository).getLeaseExpirationsByMonth(12, propertyId);
        }

        @Test
        @DisplayName("should include renewed and pending counts per month")
        void shouldIncludeRenewedAndPendingCounts() {
            // Given
            mockOccupancyBreakdown();
            mockAverageRentPerSqft();
            mockExpiringLeases();
            mockVacantUnits();
            mockUpcomingExpirations();
            mockRecentActivity();

            List<Object[]> monthlyData = new ArrayList<>();
            monthlyData.add(new Object[]{2025, 1, "Jan 2025", "2025-01", 10L, 3L, 7L});
            when(occupancyDashboardRepository.getLeaseExpirationsByMonth(anyInt(), any())).thenReturn(monthlyData);

            // When
            OccupancyDashboardDto result = occupancyDashboardService.getOccupancyDashboard(propertyId);

            // Then
            LeaseExpirationChartDto.MonthlyExpiration jan = result.getLeaseExpirationChart().getMonthlyData().get(0);
            assertThat(jan.getTotalCount()).isEqualTo(10L);
            assertThat(jan.getRenewedCount()).isEqualTo(3L);
            assertThat(jan.getPendingCount()).isEqualTo(7L);
        }
    }

    // ============================================================================
    // UPCOMING LEASE EXPIRATIONS LIST
    // ============================================================================

    @Nested
    @DisplayName("Lease Expirations List - AC-7, AC-10")
    class LeaseExpirationsList {

        @Test
        @DisplayName("should return paginated lease expirations")
        void shouldReturnPaginatedExpirations() {
            // Given
            List<Object[]> mockData = Arrays.asList(
                    buildLeaseExpirationRow("John Doe", "A101", "Property A", 30, false),
                    buildLeaseExpirationRow("Jane Smith", "B202", "Property B", 45, true)
            );
            when(occupancyDashboardRepository.getUpcomingLeaseExpirations(eq(100), eq(10), eq(0), any()))
                    .thenReturn(mockData);

            // When
            List<LeaseExpirationListDto> result = occupancyDashboardService.getLeaseExpirations(100, 0, 10, propertyId);

            // Then
            assertThat(result).hasSize(2);
            assertThat(result).extracting(LeaseExpirationListDto::getTenantName)
                    .containsExactly("John Doe", "Jane Smith");
        }

        @Test
        @DisplayName("should sort by expiry date ascending")
        void shouldSortByExpiryDate() {
            // Given
            List<Object[]> mockData = Arrays.asList(
                    buildLeaseExpirationRow("First", "A101", "Property A", 15, false),
                    buildLeaseExpirationRow("Second", "B202", "Property B", 30, false)
            );
            when(occupancyDashboardRepository.getUpcomingLeaseExpirations(anyInt(), anyInt(), anyInt(), any()))
                    .thenReturn(mockData);

            // When
            List<LeaseExpirationListDto> result = occupancyDashboardService.getLeaseExpirations(100, 0, 10, propertyId);

            // Then - First has fewer days remaining
            assertThat(result.get(0).getDaysRemaining()).isLessThan(result.get(1).getDaysRemaining());
        }

        @Test
        @DisplayName("should include renewal status")
        void shouldIncludeRenewalStatus() {
            // Given
            List<Object[]> mockData = Collections.singletonList(
                    buildLeaseExpirationRow("John Doe", "A101", "Property A", 30, true)
            );
            when(occupancyDashboardRepository.getUpcomingLeaseExpirations(anyInt(), anyInt(), anyInt(), any()))
                    .thenReturn(mockData);

            // When
            List<LeaseExpirationListDto> result = occupancyDashboardService.getLeaseExpirations(100, 0, 10, propertyId);

            // Then
            assertThat(result.get(0).getIsRenewed()).isTrue();
            assertThat(result.get(0).getRenewalStatus()).isEqualTo("Renewed");
        }

        @Test
        @DisplayName("should use configurable days parameter - AC-12")
        void shouldUseConfigurableDaysParameter() {
            // Given
            when(occupancyDashboardRepository.getUpcomingLeaseExpirations(eq(60), anyInt(), anyInt(), any()))
                    .thenReturn(Collections.emptyList());

            // When
            occupancyDashboardService.getLeaseExpirations(60, 0, 10, propertyId);

            // Then
            verify(occupancyDashboardRepository).getUpcomingLeaseExpirations(60, 10, 0, propertyId);
        }
    }

    // ============================================================================
    // RECENT ACTIVITY FEED
    // ============================================================================

    @Nested
    @DisplayName("Recent Activity - AC-8, AC-11")
    class RecentActivity {

        @Test
        @DisplayName("should return recent lease activities limited to specified count")
        void shouldReturnLimitedActivities() {
            // Given
            List<Object[]> mockData = Arrays.asList(
                    buildActivityRow(ActivityType.LEASE_CREATED, "John Doe", "A101"),
                    buildActivityRow(ActivityType.LEASE_RENEWED, "Jane Smith", "B202")
            );
            when(occupancyDashboardRepository.getRecentLeaseActivity(eq(10), any())).thenReturn(mockData);

            // When
            List<LeaseActivityDto> result = occupancyDashboardService.getRecentActivity(10, propertyId);

            // Then
            assertThat(result).hasSize(2);
            verify(occupancyDashboardRepository).getRecentLeaseActivity(10, propertyId);
        }

        @Test
        @DisplayName("should include all activity types")
        void shouldIncludeAllActivityTypes() {
            // Given
            List<Object[]> mockData = Arrays.asList(
                    buildActivityRow(ActivityType.LEASE_CREATED, "John", "A101"),
                    buildActivityRow(ActivityType.LEASE_RENEWED, "Jane", "B202"),
                    buildActivityRow(ActivityType.LEASE_TERMINATED, "Bob", "C303"),
                    buildActivityRow(ActivityType.NOTICE_GIVEN, "Alice", "D404")
            );
            when(occupancyDashboardRepository.getRecentLeaseActivity(anyInt(), any())).thenReturn(mockData);

            // When
            List<LeaseActivityDto> result = occupancyDashboardService.getRecentActivity(10, propertyId);

            // Then
            assertThat(result).extracting(LeaseActivityDto::getActivityType)
                    .containsExactly(
                            ActivityType.LEASE_CREATED,
                            ActivityType.LEASE_RENEWED,
                            ActivityType.LEASE_TERMINATED,
                            ActivityType.NOTICE_GIVEN
                    );
        }

        @Test
        @DisplayName("should include icons and colors for activity types")
        void shouldIncludeIconsAndColors() {
            // Given
            List<Object[]> mockData = Collections.singletonList(
                    buildActivityRow(ActivityType.LEASE_CREATED, "John", "A101")
            );
            when(occupancyDashboardRepository.getRecentLeaseActivity(anyInt(), any())).thenReturn(mockData);

            // When
            List<LeaseActivityDto> result = occupancyDashboardService.getRecentActivity(10, propertyId);

            // Then
            assertThat(result.get(0).getIcon()).isEqualTo("file-plus");
            assertThat(result.get(0).getColor()).isEqualTo("#22c55e");
        }

        @Test
        @DisplayName("should order activities by timestamp descending")
        void shouldOrderByTimestampDescending() {
            // Given - Mock returns in desc order (service should preserve this)
            List<Object[]> mockData = Arrays.asList(
                    buildActivityRow(ActivityType.LEASE_CREATED, "Recent", "A101"),
                    buildActivityRow(ActivityType.LEASE_RENEWED, "Older", "B202")
            );
            when(occupancyDashboardRepository.getRecentLeaseActivity(anyInt(), any())).thenReturn(mockData);

            // When
            List<LeaseActivityDto> result = occupancyDashboardService.getRecentActivity(10, propertyId);

            // Then
            assertThat(result.get(0).getTenantName()).isEqualTo("Recent");
        }
    }

    // ============================================================================
    // CONFIGURATION
    // ============================================================================

    @Nested
    @DisplayName("Configuration - AC-12")
    class Configuration {

        @Test
        @DisplayName("should return default expiry period of 100 days")
        void shouldReturnDefaultExpiryPeriod() {
            // When
            int result = occupancyDashboardService.getDefaultExpiryPeriodDays();

            // Then
            assertThat(result).isEqualTo(100);
        }
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    private void mockOccupancyBreakdown() {
        when(occupancyDashboardRepository.getOccupancyBreakdown(any()))
                .thenReturn(new Object[]{100L, 92L, 5L, 2L, 1L});
    }

    private void mockEmptyOccupancyBreakdown() {
        when(occupancyDashboardRepository.getOccupancyBreakdown(any()))
                .thenReturn(new Object[]{0L, 0L, 0L, 0L, 0L});
    }

    private void mockAverageRentPerSqft() {
        when(occupancyDashboardRepository.getAverageRentPerSqft(any()))
                .thenReturn(new Object[]{BigDecimal.valueOf(100000), BigDecimal.valueOf(5000), BigDecimal.valueOf(20)});
    }

    private void mockEmptyAverageRentPerSqft() {
        when(occupancyDashboardRepository.getAverageRentPerSqft(any()))
                .thenReturn(new Object[]{BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO});
    }

    private void mockExpiringLeases() {
        when(occupancyDashboardRepository.countExpiringLeases(anyInt(), any())).thenReturn(15L);
    }

    private void mockVacantUnits() {
        when(occupancyDashboardRepository.countVacantUnits(any())).thenReturn(5L);
    }

    private void mockLeaseExpirationsByMonth() {
        List<Object[]> monthlyData = Arrays.asList(
                new Object[]{2025, 1, "Jan 2025", "2025-01", 3L, 1L, 2L},
                new Object[]{2025, 2, "Feb 2025", "2025-02", 5L, 2L, 3L}
        );
        when(occupancyDashboardRepository.getLeaseExpirationsByMonth(anyInt(), any())).thenReturn(monthlyData);
    }

    private void mockUpcomingExpirations() {
        List<Object[]> mockData = Collections.singletonList(
                buildLeaseExpirationRow("John Doe", "A101", "Property A", 30, false)
        );
        when(occupancyDashboardRepository.getUpcomingLeaseExpirations(anyInt(), anyInt(), anyInt(), any()))
                .thenReturn(mockData);
    }

    private void mockRecentActivity() {
        List<Object[]> mockData = Collections.singletonList(
                buildActivityRow(ActivityType.LEASE_CREATED, "John Doe", "A101")
        );
        when(occupancyDashboardRepository.getRecentLeaseActivity(anyInt(), any())).thenReturn(mockData);
    }

    private void mockActivityCountsForTrend() {
        // Mock: 5 new leases, 2 checkouts in last 30 days
        when(occupancyDashboardRepository.getActivityCountsForTrend(anyInt(), any()))
                .thenReturn(new Object[]{5L, 2L});
    }

    private Object[] buildLeaseExpirationRow(String tenantName, String unitNumber, String propertyName,
                                              int daysRemaining, boolean isRenewed) {
        return new Object[]{
                UUID.randomUUID(),                              // tenant_id
                tenantName,                                     // tenant_name
                UUID.randomUUID(),                              // unit_id
                unitNumber,                                     // unit_number
                UUID.randomUUID(),                              // property_id
                propertyName,                                   // property_name
                Date.valueOf(LocalDate.now().plusDays(daysRemaining)), // expiry_date
                daysRemaining,                                  // days_remaining
                isRenewed,                                      // is_renewed
                isRenewed ? "Renewed" : "Pending"               // renewal_status
        };
    }

    private Object[] buildActivityRow(ActivityType activityType, String tenantName, String unitNumber) {
        return new Object[]{
                UUID.randomUUID(),                              // id
                activityType.name(),                            // activity_type
                UUID.randomUUID(),                              // tenant_id
                tenantName,                                     // tenant_name
                UUID.randomUUID(),                              // unit_id
                unitNumber,                                     // unit_number
                "Property A",                                   // property_name
                Timestamp.valueOf(LocalDateTime.now()),         // timestamp
                activityType.getLabel() + " for unit " + unitNumber // description
        };
    }
}
