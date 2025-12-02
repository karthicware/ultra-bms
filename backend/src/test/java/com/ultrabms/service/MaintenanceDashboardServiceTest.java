package com.ultrabms.service;

import com.ultrabms.dto.dashboard.maintenance.*;
import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.entity.enums.WorkOrderPriority;
import com.ultrabms.entity.enums.WorkOrderStatus;
import com.ultrabms.repository.MaintenanceDashboardRepository;
import com.ultrabms.service.impl.MaintenanceDashboardServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

/**
 * Unit tests for MaintenanceDashboardService
 * Story 8.4: Maintenance Dashboard
 */
@ExtendWith(MockitoExtension.class)
class MaintenanceDashboardServiceTest {

    @Mock
    private MaintenanceDashboardRepository repository;

    @InjectMocks
    private MaintenanceDashboardServiceImpl service;

    private UUID testPropertyId;
    private LocalDateTime testDate;

    @BeforeEach
    void setUp() {
        testPropertyId = UUID.randomUUID();
        testDate = LocalDateTime.now();
    }

    // =================================================================
    // KPI CALCULATION TESTS (AC-1, AC-2, AC-3, AC-4)
    // =================================================================

    @Nested
    @DisplayName("KPI Calculations")
    class KpiCalculationTests {

        @Test
        @DisplayName("AC-1: Should calculate active jobs count correctly")
        void shouldCalculateActiveJobsCount() {
            // Given
            when(repository.countActiveJobs(isNull())).thenReturn(25L);
            when(repository.countOverdueJobs(any(), isNull())).thenReturn(5L);
            when(repository.countPendingJobs(isNull())).thenReturn(10L);
            when(repository.countCompletedJobsInPeriod(any(), any(), isNull())).thenReturn(15L, 12L);
            when(repository.getJobsByStatus(isNull())).thenReturn(Collections.emptyList());
            when(repository.getJobsByPriority(isNull())).thenReturn(Collections.emptyList());
            when(repository.getJobsByCategory(isNull())).thenReturn(Collections.emptyList());
            when(repository.getHighPriorityAndOverdueJobs(any(), anyInt(), anyInt(), isNull(), isNull()))
                    .thenReturn(Collections.emptyList());
            when(repository.countHighPriorityAndOverdueJobs(any(), isNull(), isNull())).thenReturn(0L);
            when(repository.getRecentlyCompletedJobs(anyInt(), isNull())).thenReturn(Collections.emptyList());

            // When
            MaintenanceDashboardDto result = service.getMaintenanceDashboard(null);

            // Then
            assertThat(result.getKpis().getActiveJobs()).isEqualTo(25L);
        }

        @Test
        @DisplayName("AC-2: Should calculate overdue jobs count correctly")
        void shouldCalculateOverdueJobsCount() {
            // Given
            when(repository.countActiveJobs(isNull())).thenReturn(20L);
            when(repository.countOverdueJobs(any(), isNull())).thenReturn(8L);
            when(repository.countPendingJobs(isNull())).thenReturn(5L);
            when(repository.countCompletedJobsInPeriod(any(), any(), isNull())).thenReturn(10L, 8L);
            when(repository.getJobsByStatus(isNull())).thenReturn(Collections.emptyList());
            when(repository.getJobsByPriority(isNull())).thenReturn(Collections.emptyList());
            when(repository.getJobsByCategory(isNull())).thenReturn(Collections.emptyList());
            when(repository.getHighPriorityAndOverdueJobs(any(), anyInt(), anyInt(), isNull(), isNull()))
                    .thenReturn(Collections.emptyList());
            when(repository.countHighPriorityAndOverdueJobs(any(), isNull(), isNull())).thenReturn(0L);
            when(repository.getRecentlyCompletedJobs(anyInt(), isNull())).thenReturn(Collections.emptyList());

            // When
            MaintenanceDashboardDto result = service.getMaintenanceDashboard(null);

            // Then
            assertThat(result.getKpis().getOverdueJobs()).isEqualTo(8L);
        }

        @Test
        @DisplayName("AC-3: Should calculate pending jobs count correctly")
        void shouldCalculatePendingJobsCount() {
            // Given
            when(repository.countActiveJobs(isNull())).thenReturn(15L);
            when(repository.countOverdueJobs(any(), isNull())).thenReturn(3L);
            when(repository.countPendingJobs(isNull())).thenReturn(7L);
            when(repository.countCompletedJobsInPeriod(any(), any(), isNull())).thenReturn(20L, 18L);
            when(repository.getJobsByStatus(isNull())).thenReturn(Collections.emptyList());
            when(repository.getJobsByPriority(isNull())).thenReturn(Collections.emptyList());
            when(repository.getJobsByCategory(isNull())).thenReturn(Collections.emptyList());
            when(repository.getHighPriorityAndOverdueJobs(any(), anyInt(), anyInt(), isNull(), isNull()))
                    .thenReturn(Collections.emptyList());
            when(repository.countHighPriorityAndOverdueJobs(any(), isNull(), isNull())).thenReturn(0L);
            when(repository.getRecentlyCompletedJobs(anyInt(), isNull())).thenReturn(Collections.emptyList());

            // When
            MaintenanceDashboardDto result = service.getMaintenanceDashboard(null);

            // Then
            assertThat(result.getKpis().getPendingJobs()).isEqualTo(7L);
        }

        @Test
        @DisplayName("AC-4: Should calculate completed jobs this month with comparison")
        void shouldCalculateCompletedJobsWithComparison() {
            // Given
            when(repository.countActiveJobs(isNull())).thenReturn(10L);
            when(repository.countOverdueJobs(any(), isNull())).thenReturn(2L);
            when(repository.countPendingJobs(isNull())).thenReturn(3L);
            when(repository.countCompletedJobsInPeriod(any(), any(), isNull())).thenReturn(30L, 20L); // This month, previous month
            when(repository.getJobsByStatus(isNull())).thenReturn(Collections.emptyList());
            when(repository.getJobsByPriority(isNull())).thenReturn(Collections.emptyList());
            when(repository.getJobsByCategory(isNull())).thenReturn(Collections.emptyList());
            when(repository.getHighPriorityAndOverdueJobs(any(), anyInt(), anyInt(), isNull(), isNull()))
                    .thenReturn(Collections.emptyList());
            when(repository.countHighPriorityAndOverdueJobs(any(), isNull(), isNull())).thenReturn(0L);
            when(repository.getRecentlyCompletedJobs(anyInt(), isNull())).thenReturn(Collections.emptyList());

            // When
            MaintenanceDashboardDto result = service.getMaintenanceDashboard(null);

            // Then
            assertThat(result.getKpis().getCompletedThisMonth()).isEqualTo(30L);
            assertThat(result.getKpis().getCompletedPreviousMonth()).isEqualTo(20L);
            assertThat(result.getKpis().getMonthOverMonthChange()).isEqualTo(50.0); // (30-20)/20 * 100 = 50%
        }

        @Test
        @DisplayName("Should handle zero previous month completed jobs")
        void shouldHandleZeroPreviousMonthCompleted() {
            // Given
            when(repository.countActiveJobs(isNull())).thenReturn(10L);
            when(repository.countOverdueJobs(any(), isNull())).thenReturn(2L);
            when(repository.countPendingJobs(isNull())).thenReturn(3L);
            when(repository.countCompletedJobsInPeriod(any(), any(), isNull())).thenReturn(15L, 0L); // This month, previous month = 0
            when(repository.getJobsByStatus(isNull())).thenReturn(Collections.emptyList());
            when(repository.getJobsByPriority(isNull())).thenReturn(Collections.emptyList());
            when(repository.getJobsByCategory(isNull())).thenReturn(Collections.emptyList());
            when(repository.getHighPriorityAndOverdueJobs(any(), anyInt(), anyInt(), isNull(), isNull()))
                    .thenReturn(Collections.emptyList());
            when(repository.countHighPriorityAndOverdueJobs(any(), isNull(), isNull())).thenReturn(0L);
            when(repository.getRecentlyCompletedJobs(anyInt(), isNull())).thenReturn(Collections.emptyList());

            // When
            MaintenanceDashboardDto result = service.getMaintenanceDashboard(null);

            // Then
            assertThat(result.getKpis().getMonthOverMonthChange()).isNull(); // Can't calculate percentage when previous = 0
        }
    }

    // =================================================================
    // CHART DATA TESTS (AC-5, AC-6, AC-7)
    // =================================================================

    @Nested
    @DisplayName("Jobs by Status Chart")
    class JobsByStatusTests {

        @Test
        @DisplayName("AC-5: Should return jobs grouped by status with percentages")
        void shouldReturnJobsByStatusWithPercentages() {
            // Given
            List<Object[]> mockData = Arrays.asList(
                    new Object[]{"OPEN", 10L},
                    new Object[]{"ASSIGNED", 5L},
                    new Object[]{"IN_PROGRESS", 8L},
                    new Object[]{"COMPLETED", 25L},
                    new Object[]{"CLOSED", 2L}
            );
            when(repository.getJobsByStatus(isNull())).thenReturn(mockData);

            // When
            List<JobsByStatusDto> result = service.getJobsByStatus(null);

            // Then
            assertThat(result).hasSize(5);

            // Verify OPEN status
            JobsByStatusDto openStatus = result.stream()
                    .filter(s -> s.getStatus() == WorkOrderStatus.OPEN)
                    .findFirst().orElseThrow();
            assertThat(openStatus.getCount()).isEqualTo(10L);
            assertThat(openStatus.getLabel()).isEqualTo("Open");
            assertThat(openStatus.getPercentage()).isEqualTo(20.0); // 10/50 * 100

            // Verify COMPLETED status
            JobsByStatusDto completedStatus = result.stream()
                    .filter(s -> s.getStatus() == WorkOrderStatus.COMPLETED)
                    .findFirst().orElseThrow();
            assertThat(completedStatus.getCount()).isEqualTo(25L);
            assertThat(completedStatus.getPercentage()).isEqualTo(50.0); // 25/50 * 100
        }

        @Test
        @DisplayName("AC-5: Should include color codes for each status")
        void shouldIncludeColorCodes() {
            // Given
            List<Object[]> mockData = Arrays.asList(
                    new Object[]{"OPEN", 5L},
                    new Object[]{"IN_PROGRESS", 3L}
            );
            when(repository.getJobsByStatus(isNull())).thenReturn(mockData);

            // When
            List<JobsByStatusDto> result = service.getJobsByStatus(null);

            // Then
            assertThat(result).allMatch(dto -> dto.getColor() != null && dto.getColor().startsWith("#"));
        }

        @Test
        @DisplayName("Should handle empty results")
        void shouldHandleEmptyResults() {
            // Given
            when(repository.getJobsByStatus(isNull())).thenReturn(Collections.emptyList());

            // When
            List<JobsByStatusDto> result = service.getJobsByStatus(null);

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("Jobs by Priority Chart")
    class JobsByPriorityTests {

        @Test
        @DisplayName("AC-6: Should return jobs grouped by priority with color gradient")
        void shouldReturnJobsByPriorityWithColors() {
            // Given
            List<Object[]> mockData = Arrays.asList(
                    new Object[]{"LOW", 20L},
                    new Object[]{"MEDIUM", 15L},
                    new Object[]{"HIGH", 8L},
                    new Object[]{"URGENT", 3L}
            );
            when(repository.getJobsByPriority(isNull())).thenReturn(mockData);

            // When
            List<JobsByPriorityDto> result = service.getJobsByPriority(null);

            // Then
            assertThat(result).hasSize(4);

            // Verify colors follow green to red gradient
            JobsByPriorityDto low = result.stream()
                    .filter(p -> p.getPriority() == WorkOrderPriority.LOW)
                    .findFirst().orElseThrow();
            assertThat(low.getColor()).isEqualTo("#22c55e"); // Green

            JobsByPriorityDto urgent = result.stream()
                    .filter(p -> p.getPriority() == WorkOrderPriority.URGENT)
                    .findFirst().orElseThrow();
            assertThat(urgent.getColor()).isEqualTo("#ef4444"); // Red
        }

        @Test
        @DisplayName("AC-6: Should include proper labels")
        void shouldIncludeProperLabels() {
            // Given
            List<Object[]> mockData = Collections.singletonList(
                    new Object[]{"HIGH", 5L}
            );
            when(repository.getJobsByPriority(isNull())).thenReturn(mockData);

            // When
            List<JobsByPriorityDto> result = service.getJobsByPriority(null);

            // Then
            assertThat(result.get(0).getLabel()).isEqualTo("High");
        }
    }

    @Nested
    @DisplayName("Jobs by Category Chart")
    class JobsByCategoryTests {

        @Test
        @DisplayName("AC-7: Should return jobs grouped by category sorted by count")
        void shouldReturnJobsByCategorySortedByCount() {
            // Given - data comes sorted from repository
            List<Object[]> mockData = Arrays.asList(
                    new Object[]{"PLUMBING", 25L},
                    new Object[]{"ELECTRICAL", 18L},
                    new Object[]{"HVAC", 12L},
                    new Object[]{"OTHER", 5L}
            );
            when(repository.getJobsByCategory(isNull())).thenReturn(mockData);

            // When
            List<JobsByCategoryDto> result = service.getJobsByCategory(null);

            // Then
            assertThat(result).hasSize(4);
            assertThat(result.get(0).getCount()).isEqualTo(25L);
            assertThat(result.get(0).getCategory()).isEqualTo(WorkOrderCategory.PLUMBING);
        }

        @Test
        @DisplayName("AC-7: Should include category labels and colors")
        void shouldIncludeCategoryLabelsAndColors() {
            // Given
            List<Object[]> mockData = Arrays.asList(
                    new Object[]{"HVAC", 10L},
                    new Object[]{"PEST_CONTROL", 5L}
            );
            when(repository.getJobsByCategory(isNull())).thenReturn(mockData);

            // When
            List<JobsByCategoryDto> result = service.getJobsByCategory(null);

            // Then
            JobsByCategoryDto hvac = result.stream()
                    .filter(c -> c.getCategory() == WorkOrderCategory.HVAC)
                    .findFirst().orElseThrow();
            assertThat(hvac.getLabel()).isEqualTo("HVAC");
            assertThat(hvac.getColor()).isNotNull();

            JobsByCategoryDto pestControl = result.stream()
                    .filter(c -> c.getCategory() == WorkOrderCategory.PEST_CONTROL)
                    .findFirst().orElseThrow();
            assertThat(pestControl.getLabel()).isEqualTo("Pest Control");
        }
    }

    // =================================================================
    // LIST DATA TESTS (AC-8, AC-9)
    // =================================================================

    @Nested
    @DisplayName("High Priority and Overdue Jobs")
    class HighPriorityOverdueJobsTests {

        @Test
        @DisplayName("AC-8: Should return paginated high priority and overdue jobs")
        void shouldReturnPaginatedHighPriorityJobs() {
            // Given
            UUID jobId = UUID.randomUUID();
            Timestamp scheduledDate = Timestamp.valueOf(LocalDateTime.now().minusDays(3));
            List<Object[]> mockData = Collections.singletonList(
                    new Object[]{jobId, "WO-2025-0001", "Test Property", "101", "Fix leak",
                            "HIGH", "OPEN", "John Vendor", scheduledDate, 3, true}
            );
            when(repository.getHighPriorityAndOverdueJobs(any(), eq(0), eq(10), isNull(), isNull()))
                    .thenReturn(mockData);
            when(repository.countHighPriorityAndOverdueJobs(any(), isNull(), isNull()))
                    .thenReturn(1L);

            Pageable pageable = PageRequest.of(0, 10);

            // When
            Page<HighPriorityJobDto> result = service.getHighPriorityAndOverdueJobs(null, null, pageable);

            // Then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getTotalElements()).isEqualTo(1);

            HighPriorityJobDto job = result.getContent().get(0);
            assertThat(job.getWorkOrderNumber()).isEqualTo("WO-2025-0001");
            assertThat(job.getPriority()).isEqualTo(WorkOrderPriority.HIGH);
            assertThat(job.getIsOverdue()).isTrue();
            assertThat(job.getDaysOverdue()).isEqualTo(3);
        }

        @Test
        @DisplayName("AC-8: Should support status filter for click-to-filter")
        void shouldSupportStatusFilter() {
            // Given
            when(repository.getHighPriorityAndOverdueJobs(any(), anyInt(), anyInt(), isNull(), eq("OPEN")))
                    .thenReturn(Collections.emptyList());
            when(repository.countHighPriorityAndOverdueJobs(any(), isNull(), eq("OPEN")))
                    .thenReturn(0L);

            Pageable pageable = PageRequest.of(0, 10);

            // When
            Page<HighPriorityJobDto> result = service.getHighPriorityAndOverdueJobs(null, "OPEN", pageable);

            // Then
            assertThat(result.getContent()).isEmpty();
        }

        @Test
        @DisplayName("AC-8: Should support property filter")
        void shouldSupportPropertyFilter() {
            // Given
            when(repository.getHighPriorityAndOverdueJobs(any(), anyInt(), anyInt(), eq(testPropertyId), isNull()))
                    .thenReturn(Collections.emptyList());
            when(repository.countHighPriorityAndOverdueJobs(any(), eq(testPropertyId), isNull()))
                    .thenReturn(0L);

            Pageable pageable = PageRequest.of(0, 10);

            // When
            Page<HighPriorityJobDto> result = service.getHighPriorityAndOverdueJobs(testPropertyId, null, pageable);

            // Then
            assertThat(result).isNotNull();
        }
    }

    @Nested
    @DisplayName("Recently Completed Jobs")
    class RecentlyCompletedJobsTests {

        @Test
        @DisplayName("AC-9: Should return recently completed jobs with limit")
        void shouldReturnRecentlyCompletedJobs() {
            // Given
            UUID jobId = UUID.randomUUID();
            Timestamp completedAt = Timestamp.valueOf(LocalDateTime.now().minusHours(2));
            List<Object[]> mockData = Collections.singletonList(
                    new Object[]{jobId, "WO-2025-0100", "Replace filter", "Building A", completedAt, "Jane Technician"}
            );
            when(repository.getRecentlyCompletedJobs(5, null)).thenReturn(mockData);

            // When
            List<RecentlyCompletedJobDto> result = service.getRecentlyCompletedJobs(null, 5);

            // Then
            assertThat(result).hasSize(1);
            RecentlyCompletedJobDto job = result.get(0);
            assertThat(job.getWorkOrderNumber()).isEqualTo("WO-2025-0100");
            assertThat(job.getTitle()).isEqualTo("Replace filter");
            assertThat(job.getPropertyName()).isEqualTo("Building A");
            assertThat(job.getCompletedByName()).isEqualTo("Jane Technician");
        }

        @Test
        @DisplayName("AC-9: Should respect limit parameter")
        void shouldRespectLimitParameter() {
            // Given
            when(repository.getRecentlyCompletedJobs(3, null)).thenReturn(Collections.emptyList());

            // When
            List<RecentlyCompletedJobDto> result = service.getRecentlyCompletedJobs(null, 3);

            // Then
            assertThat(result).isEmpty();
        }
    }

    // =================================================================
    // COMPLETE DASHBOARD TESTS (AC-10)
    // =================================================================

    @Nested
    @DisplayName("Complete Dashboard")
    class CompleteDashboardTests {

        @Test
        @DisplayName("AC-10: Should return complete dashboard data in single call")
        void shouldReturnCompleteDashboard() {
            // Given - Setup all repository mocks
            when(repository.countActiveJobs(isNull())).thenReturn(50L);
            when(repository.countOverdueJobs(any(), isNull())).thenReturn(10L);
            when(repository.countPendingJobs(isNull())).thenReturn(15L);
            when(repository.countCompletedJobsInPeriod(any(), any(), isNull())).thenReturn(45L, 40L);

            List<Object[]> statusData = Arrays.asList(
                    new Object[]{"OPEN", 15L},
                    new Object[]{"IN_PROGRESS", 20L}
            );
            when(repository.getJobsByStatus(isNull())).thenReturn(statusData);

            List<Object[]> priorityData = Arrays.asList(
                    new Object[]{"HIGH", 10L},
                    new Object[]{"MEDIUM", 25L}
            );
            when(repository.getJobsByPriority(isNull())).thenReturn(priorityData);

            List<Object[]> categoryData = Collections.singletonList(
                    new Object[]{"PLUMBING", 30L}
            );
            when(repository.getJobsByCategory(isNull())).thenReturn(categoryData);

            when(repository.getHighPriorityAndOverdueJobs(any(), anyInt(), anyInt(), isNull(), isNull()))
                    .thenReturn(Collections.emptyList());
            when(repository.countHighPriorityAndOverdueJobs(any(), isNull(), isNull())).thenReturn(5L);
            when(repository.getRecentlyCompletedJobs(anyInt(), isNull())).thenReturn(Collections.emptyList());

            // When
            MaintenanceDashboardDto result = service.getMaintenanceDashboard(null);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getKpis()).isNotNull();
            assertThat(result.getKpis().getActiveJobs()).isEqualTo(50L);
            assertThat(result.getJobsByStatus()).hasSize(2);
            assertThat(result.getJobsByPriority()).hasSize(2);
            assertThat(result.getJobsByCategory()).hasSize(1);
            assertThat(result.getHighPriorityOverdueTotal()).isEqualTo(5L);
        }

        @Test
        @DisplayName("Should filter by property ID when provided")
        void shouldFilterByPropertyId() {
            // Given
            when(repository.countActiveJobs(testPropertyId)).thenReturn(10L);
            when(repository.countOverdueJobs(any(), eq(testPropertyId))).thenReturn(2L);
            when(repository.countPendingJobs(testPropertyId)).thenReturn(3L);
            when(repository.countCompletedJobsInPeriod(any(), any(), eq(testPropertyId))).thenReturn(8L, 6L);
            when(repository.getJobsByStatus(testPropertyId)).thenReturn(Collections.emptyList());
            when(repository.getJobsByPriority(testPropertyId)).thenReturn(Collections.emptyList());
            when(repository.getJobsByCategory(testPropertyId)).thenReturn(Collections.emptyList());
            when(repository.getHighPriorityAndOverdueJobs(any(), anyInt(), anyInt(), eq(testPropertyId), isNull()))
                    .thenReturn(Collections.emptyList());
            when(repository.countHighPriorityAndOverdueJobs(any(), eq(testPropertyId), isNull())).thenReturn(0L);
            when(repository.getRecentlyCompletedJobs(anyInt(), eq(testPropertyId))).thenReturn(Collections.emptyList());

            // When
            MaintenanceDashboardDto result = service.getMaintenanceDashboard(testPropertyId);

            // Then
            assertThat(result.getKpis().getActiveJobs()).isEqualTo(10L);
        }
    }
}
