package com.ultrabms.service;

import com.ultrabms.dto.dashboard.vendor.ExpiringDocumentDto;
import com.ultrabms.dto.dashboard.vendor.JobsBySpecializationDto;
import com.ultrabms.dto.dashboard.vendor.TopVendorDto;
import com.ultrabms.dto.dashboard.vendor.VendorDashboardDto;
import com.ultrabms.dto.dashboard.vendor.VendorKpiDto;
import com.ultrabms.dto.dashboard.vendor.VendorPerformanceSnapshotDto;
import com.ultrabms.repository.VendorDashboardRepository;
import com.ultrabms.service.impl.VendorDashboardServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

/**
 * Unit tests for VendorDashboardService.
 *
 * Story 8.5: Vendor Dashboard
 */
@ExtendWith(MockitoExtension.class)
class VendorDashboardServiceTest {

    @Mock
    private VendorDashboardRepository vendorDashboardRepository;

    @InjectMocks
    private VendorDashboardServiceImpl vendorDashboardService;

    private UUID vendorId;
    private UUID documentId;

    @BeforeEach
    void setUp() {
        vendorId = UUID.randomUUID();
        documentId = UUID.randomUUID();
    }

    // =================================================================
    // KPI TESTS (AC-1 to AC-4)
    // =================================================================

    @Nested
    @DisplayName("KPIs Tests")
    class KpisTests {

        @Test
        @DisplayName("AC-1: Should return active vendor count")
        void getKpis_shouldReturnActiveVendorCount() {
            // Arrange
            when(vendorDashboardRepository.countActiveVendors()).thenReturn(25L);
            when(vendorDashboardRepository.calculateAverageSlaCompliance()).thenReturn(85.5);
            when(vendorDashboardRepository.getTopPerformingVendor()).thenReturn(null);
            when(vendorDashboardRepository.countExpiringDocuments(30)).thenReturn(3L);
            when(vendorDashboardRepository.hasCriticalDocumentsExpiring(30)).thenReturn(false);

            // Act
            VendorKpiDto kpis = vendorDashboardService.getKpis();

            // Assert
            assertNotNull(kpis);
            assertEquals(25L, kpis.getTotalActiveVendors());
            verify(vendorDashboardRepository).countActiveVendors();
        }

        @Test
        @DisplayName("AC-2: Should calculate average SLA compliance")
        void getKpis_shouldCalculateAverageSlaCompliance() {
            // Arrange
            when(vendorDashboardRepository.countActiveVendors()).thenReturn(10L);
            when(vendorDashboardRepository.calculateAverageSlaCompliance()).thenReturn(87.65);
            when(vendorDashboardRepository.getTopPerformingVendor()).thenReturn(null);
            when(vendorDashboardRepository.countExpiringDocuments(30)).thenReturn(0L);
            when(vendorDashboardRepository.hasCriticalDocumentsExpiring(30)).thenReturn(false);

            // Act
            VendorKpiDto kpis = vendorDashboardService.getKpis();

            // Assert
            assertNotNull(kpis);
            assertEquals(new BigDecimal("87.7"), kpis.getAvgSlaCompliance());
            verify(vendorDashboardRepository).calculateAverageSlaCompliance();
        }

        @Test
        @DisplayName("AC-3: Should return top performing vendor")
        void getKpis_shouldReturnTopPerformingVendor() {
            // Arrange
            Object[] topVendorData = {vendorId, "Acme Plumbing", new BigDecimal("4.8"), 150};
            when(vendorDashboardRepository.countActiveVendors()).thenReturn(10L);
            when(vendorDashboardRepository.calculateAverageSlaCompliance()).thenReturn(85.0);
            when(vendorDashboardRepository.getTopPerformingVendor()).thenReturn(topVendorData);
            when(vendorDashboardRepository.countExpiringDocuments(30)).thenReturn(0L);
            when(vendorDashboardRepository.hasCriticalDocumentsExpiring(30)).thenReturn(false);

            // Act
            VendorKpiDto kpis = vendorDashboardService.getKpis();

            // Assert
            assertNotNull(kpis.getTopPerformingVendor());
            assertEquals(vendorId, kpis.getTopPerformingVendor().getVendorId());
            assertEquals("Acme Plumbing", kpis.getTopPerformingVendor().getVendorName());
            assertEquals(new BigDecimal("4.8"), kpis.getTopPerformingVendor().getRating());
            assertEquals(150, kpis.getTopPerformingVendor().getTotalJobsCompleted());
        }

        @Test
        @DisplayName("AC-4: Should count expiring documents with critical flag")
        void getKpis_shouldCountExpiringDocumentsWithCriticalFlag() {
            // Arrange
            when(vendorDashboardRepository.countActiveVendors()).thenReturn(10L);
            when(vendorDashboardRepository.calculateAverageSlaCompliance()).thenReturn(80.0);
            when(vendorDashboardRepository.getTopPerformingVendor()).thenReturn(null);
            when(vendorDashboardRepository.countExpiringDocuments(30)).thenReturn(5L);
            when(vendorDashboardRepository.hasCriticalDocumentsExpiring(30)).thenReturn(true);

            // Act
            VendorKpiDto kpis = vendorDashboardService.getKpis();

            // Assert
            assertNotNull(kpis.getExpiringDocuments());
            assertEquals(5L, kpis.getExpiringDocuments().getCount());
            assertTrue(kpis.getExpiringDocuments().getHasCriticalExpiring());
        }

        @Test
        @DisplayName("Should handle null SLA compliance")
        void getKpis_shouldHandleNullSlaCompliance() {
            // Arrange
            when(vendorDashboardRepository.countActiveVendors()).thenReturn(0L);
            when(vendorDashboardRepository.calculateAverageSlaCompliance()).thenReturn(null);
            when(vendorDashboardRepository.getTopPerformingVendor()).thenReturn(null);
            when(vendorDashboardRepository.countExpiringDocuments(30)).thenReturn(0L);
            when(vendorDashboardRepository.hasCriticalDocumentsExpiring(30)).thenReturn(false);

            // Act
            VendorKpiDto kpis = vendorDashboardService.getKpis();

            // Assert
            assertEquals(BigDecimal.ZERO, kpis.getAvgSlaCompliance());
        }
    }

    // =================================================================
    // JOBS BY SPECIALIZATION TESTS (AC-5)
    // =================================================================

    @Nested
    @DisplayName("Jobs By Specialization Tests")
    class JobsBySpecializationTests {

        @Test
        @DisplayName("AC-5: Should return jobs grouped by specialization")
        void getJobsBySpecialization_shouldReturnGroupedJobs() {
            // Arrange
            List<Object[]> mockData = Arrays.asList(
                    new Object[]{"PLUMBING", "Plumbing", 50L, 8L},
                    new Object[]{"ELECTRICAL", "Electrical", 35L, 5L},
                    new Object[]{"HVAC", "Hvac", 25L, 3L}
            );
            when(vendorDashboardRepository.getJobsBySpecialization()).thenReturn(mockData);

            // Act
            List<JobsBySpecializationDto> result = vendorDashboardService.getJobsBySpecialization();

            // Assert
            assertNotNull(result);
            assertEquals(3, result.size());
            assertEquals("PLUMBING", result.get(0).getSpecialization().name());
            assertEquals(50L, result.get(0).getJobCount());
            assertEquals(8L, result.get(0).getVendorCount());
        }

        @Test
        @DisplayName("Should handle empty results")
        void getJobsBySpecialization_shouldHandleEmptyResults() {
            // Arrange
            when(vendorDashboardRepository.getJobsBySpecialization()).thenReturn(Collections.emptyList());

            // Act
            List<JobsBySpecializationDto> result = vendorDashboardService.getJobsBySpecialization();

            // Assert
            assertNotNull(result);
            assertTrue(result.isEmpty());
        }
    }

    // =================================================================
    // PERFORMANCE SNAPSHOT TESTS (AC-6, AC-14, AC-15)
    // =================================================================

    @Nested
    @DisplayName("Performance Snapshot Tests")
    class PerformanceSnapshotTests {

        @Test
        @DisplayName("AC-6: Should return vendor performance snapshot")
        void getPerformanceSnapshot_shouldReturnVendorPerformance() {
            // Arrange
            List<Object[]> mockData = Arrays.asList(
                    new Object[]{vendorId, "Top Plumber", 92.5, new BigDecimal("4.5"), 100},
                    new Object[]{UUID.randomUUID(), "Good HVAC", 75.0, new BigDecimal("3.8"), 50}
            );
            when(vendorDashboardRepository.getVendorPerformanceSnapshot()).thenReturn(mockData);

            // Act
            List<VendorPerformanceSnapshotDto> result = vendorDashboardService.getPerformanceSnapshot();

            // Assert
            assertNotNull(result);
            assertEquals(2, result.size());
            assertEquals(vendorId, result.get(0).getVendorId());
            assertEquals("Top Plumber", result.get(0).getVendorName());
        }

        @Test
        @DisplayName("Should calculate GREEN performance tier correctly")
        void getPerformanceSnapshot_shouldCalculateGreenTier() {
            // Arrange - rating >= 4 AND SLA >= 80%
            List<Object[]> mockData = new ArrayList<>();
            mockData.add(new Object[]{vendorId, "Top Vendor", 85.0, new BigDecimal("4.2"), 100});
            when(vendorDashboardRepository.getVendorPerformanceSnapshot()).thenReturn(mockData);

            // Act
            List<VendorPerformanceSnapshotDto> result = vendorDashboardService.getPerformanceSnapshot();

            // Assert
            assertEquals(VendorPerformanceSnapshotDto.PerformanceTier.GREEN, result.get(0).getPerformanceTier());
        }

        @Test
        @DisplayName("Should calculate YELLOW performance tier correctly")
        void getPerformanceSnapshot_shouldCalculateYellowTier() {
            // Arrange - rating >= 3 OR SLA >= 60%
            List<Object[]> mockData = new ArrayList<>();
            mockData.add(new Object[]{vendorId, "Average Vendor", 65.0, new BigDecimal("3.5"), 50});
            when(vendorDashboardRepository.getVendorPerformanceSnapshot()).thenReturn(mockData);

            // Act
            List<VendorPerformanceSnapshotDto> result = vendorDashboardService.getPerformanceSnapshot();

            // Assert
            assertEquals(VendorPerformanceSnapshotDto.PerformanceTier.YELLOW, result.get(0).getPerformanceTier());
        }

        @Test
        @DisplayName("Should calculate RED performance tier correctly")
        void getPerformanceSnapshot_shouldCalculateRedTier() {
            // Arrange - below all thresholds
            List<Object[]> mockData = new ArrayList<>();
            mockData.add(new Object[]{vendorId, "Poor Vendor", 40.0, new BigDecimal("2.5"), 10});
            when(vendorDashboardRepository.getVendorPerformanceSnapshot()).thenReturn(mockData);

            // Act
            List<VendorPerformanceSnapshotDto> result = vendorDashboardService.getPerformanceSnapshot();

            // Assert
            assertEquals(VendorPerformanceSnapshotDto.PerformanceTier.RED, result.get(0).getPerformanceTier());
        }
    }

    // =================================================================
    // EXPIRING DOCUMENTS TESTS (AC-7)
    // =================================================================

    @Nested
    @DisplayName("Expiring Documents Tests")
    class ExpiringDocumentsTests {

        @Test
        @DisplayName("AC-7: Should return expiring documents sorted by date")
        void getExpiringDocuments_shouldReturnSortedDocuments() {
            // Arrange
            LocalDate today = LocalDate.now();
            LocalDate expiry1 = today.plusDays(5);
            LocalDate expiry2 = today.plusDays(15);

            List<Object[]> mockData = Arrays.asList(
                    new Object[]{documentId, vendorId, "Vendor A", "TRADE_LICENSE", Date.valueOf(expiry1)},
                    new Object[]{UUID.randomUUID(), UUID.randomUUID(), "Vendor B", "INSURANCE", Date.valueOf(expiry2)}
            );
            when(vendorDashboardRepository.getVendorsWithExpiringDocuments(30, 10)).thenReturn(mockData);

            // Act
            List<ExpiringDocumentDto> result = vendorDashboardService.getExpiringDocuments(30, 10);

            // Assert
            assertNotNull(result);
            assertEquals(2, result.size());
            assertEquals("Trade License", result.get(0).getDocumentTypeName());
            assertTrue(result.get(0).getIsCritical());
            assertEquals(5L, result.get(0).getDaysUntilExpiry());
        }

        @Test
        @DisplayName("Should mark critical documents correctly")
        void getExpiringDocuments_shouldMarkCriticalDocuments() {
            // Arrange
            LocalDate expiry = LocalDate.now().plusDays(10);
            List<Object[]> mockData = Arrays.asList(
                    new Object[]{documentId, vendorId, "Vendor A", "TRADE_LICENSE", Date.valueOf(expiry)},
                    new Object[]{UUID.randomUUID(), UUID.randomUUID(), "Vendor B", "CERTIFICATION", Date.valueOf(expiry)}
            );
            when(vendorDashboardRepository.getVendorsWithExpiringDocuments(anyInt(), anyInt())).thenReturn(mockData);

            // Act
            List<ExpiringDocumentDto> result = vendorDashboardService.getExpiringDocuments(30, 10);

            // Assert
            assertTrue(result.get(0).getIsCritical()); // TRADE_LICENSE is critical
            assertFalse(result.get(1).getIsCritical()); // CERTIFICATION is not critical
        }
    }

    // =================================================================
    // TOP VENDORS TESTS (AC-8)
    // =================================================================

    @Nested
    @DisplayName("Top Vendors Tests")
    class TopVendorsTests {

        @Test
        @DisplayName("AC-8: Should return top vendors with ranking")
        void getTopVendors_shouldReturnRankedVendors() {
            // Arrange
            List<Object[]> mockData = Arrays.asList(
                    new Object[]{vendorId, "Top Vendor", 25L, new BigDecimal("4.8"), 200},
                    new Object[]{UUID.randomUUID(), "Second Vendor", 20L, new BigDecimal("4.5"), 150}
            );
            when(vendorDashboardRepository.getTopVendorsByJobsThisMonth(5)).thenReturn(mockData);

            // Act
            List<TopVendorDto> result = vendorDashboardService.getTopVendors(5);

            // Assert
            assertNotNull(result);
            assertEquals(2, result.size());
            assertEquals(1, result.get(0).getRank());
            assertEquals("Top Vendor", result.get(0).getVendorName());
            assertEquals(25, result.get(0).getJobsCompletedThisMonth());
            assertEquals(2, result.get(1).getRank());
        }

        @Test
        @DisplayName("Should respect limit parameter")
        void getTopVendors_shouldRespectLimit() {
            // Arrange
            when(vendorDashboardRepository.getTopVendorsByJobsThisMonth(3)).thenReturn(Collections.emptyList());

            // Act
            vendorDashboardService.getTopVendors(3);

            // Assert
            verify(vendorDashboardRepository).getTopVendorsByJobsThisMonth(3);
        }
    }

    // =================================================================
    // COMPLETE DASHBOARD TESTS (AC-9)
    // =================================================================

    @Nested
    @DisplayName("Complete Dashboard Tests")
    class CompleteDashboardTests {

        @Test
        @DisplayName("AC-9: Should return complete dashboard with all sections")
        void getVendorDashboard_shouldReturnAllSections() {
            // Arrange
            when(vendorDashboardRepository.countActiveVendors()).thenReturn(20L);
            when(vendorDashboardRepository.calculateAverageSlaCompliance()).thenReturn(80.0);
            when(vendorDashboardRepository.getTopPerformingVendor()).thenReturn(null);
            when(vendorDashboardRepository.countExpiringDocuments(30)).thenReturn(2L);
            when(vendorDashboardRepository.hasCriticalDocumentsExpiring(30)).thenReturn(false);
            when(vendorDashboardRepository.getJobsBySpecialization()).thenReturn(Collections.emptyList());
            when(vendorDashboardRepository.getVendorPerformanceSnapshot()).thenReturn(Collections.emptyList());
            when(vendorDashboardRepository.getVendorsWithExpiringDocuments(30, 10)).thenReturn(Collections.emptyList());
            when(vendorDashboardRepository.getTopVendorsByJobsThisMonth(5)).thenReturn(Collections.emptyList());

            // Act
            VendorDashboardDto dashboard = vendorDashboardService.getVendorDashboard();

            // Assert
            assertNotNull(dashboard);
            assertNotNull(dashboard.getKpis());
            assertNotNull(dashboard.getJobsBySpecialization());
            assertNotNull(dashboard.getPerformanceSnapshot());
            assertNotNull(dashboard.getExpiringDocuments());
            assertNotNull(dashboard.getTopVendors());
        }
    }
}
