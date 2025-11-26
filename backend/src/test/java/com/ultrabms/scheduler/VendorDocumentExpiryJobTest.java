package com.ultrabms.scheduler;

import com.ultrabms.service.VendorDocumentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for VendorDocumentExpiryJob
 * Story 5.2: Vendor Document and License Management
 *
 * Tests scheduled job that processes:
 * - 30-day expiry notifications to PM (AC #19)
 * - 15-day expiry notifications to Vendors (AC #20)
 * - Auto-suspension of vendors (AC #21)
 */
@ExtendWith(MockitoExtension.class)
class VendorDocumentExpiryJobTest {

    @Mock
    private VendorDocumentService vendorDocumentService;

    @InjectMocks
    private VendorDocumentExpiryJob expiryJob;

    @BeforeEach
    void setUp() {
        // Setup is done via @InjectMocks
    }

    @Test
    @DisplayName("Should process all notification types successfully")
    void processDocumentExpiryNotifications_ShouldCallAllServiceMethods() {
        // Arrange
        when(vendorDocumentService.sendExpiryNotifications30Day()).thenReturn(5);
        when(vendorDocumentService.sendExpiryNotifications15Day()).thenReturn(3);
        when(vendorDocumentService.processAutoSuspension()).thenReturn(1);

        // Act
        expiryJob.processDocumentExpiryNotifications();

        // Assert
        verify(vendorDocumentService, times(1)).sendExpiryNotifications30Day();
        verify(vendorDocumentService, times(1)).sendExpiryNotifications15Day();
        verify(vendorDocumentService, times(1)).processAutoSuspension();
    }

    @Test
    @DisplayName("Should process all steps even when counts are zero")
    void processDocumentExpiryNotifications_WithZeroCounts_ShouldCompleteSuccessfully() {
        // Arrange
        when(vendorDocumentService.sendExpiryNotifications30Day()).thenReturn(0);
        when(vendorDocumentService.sendExpiryNotifications15Day()).thenReturn(0);
        when(vendorDocumentService.processAutoSuspension()).thenReturn(0);

        // Act
        expiryJob.processDocumentExpiryNotifications();

        // Assert
        verify(vendorDocumentService, times(1)).sendExpiryNotifications30Day();
        verify(vendorDocumentService, times(1)).sendExpiryNotifications15Day();
        verify(vendorDocumentService, times(1)).processAutoSuspension();
    }

    @Test
    @DisplayName("Should handle exception in 30-day notification gracefully")
    void processDocumentExpiryNotifications_When30DayFails_ShouldCatchException() {
        // Arrange
        when(vendorDocumentService.sendExpiryNotifications30Day())
                .thenThrow(new RuntimeException("30-day notification failed"));

        // Act - Should not throw exception
        expiryJob.processDocumentExpiryNotifications();

        // Assert - 30-day was called, but 15-day and suspension were NOT called due to exception
        verify(vendorDocumentService, times(1)).sendExpiryNotifications30Day();
        verify(vendorDocumentService, never()).sendExpiryNotifications15Day();
        verify(vendorDocumentService, never()).processAutoSuspension();
    }

    @Test
    @DisplayName("Should handle exception in 15-day notification gracefully")
    void processDocumentExpiryNotifications_When15DayFails_ShouldCatchException() {
        // Arrange
        when(vendorDocumentService.sendExpiryNotifications30Day()).thenReturn(5);
        when(vendorDocumentService.sendExpiryNotifications15Day())
                .thenThrow(new RuntimeException("15-day notification failed"));

        // Act - Should not throw exception
        expiryJob.processDocumentExpiryNotifications();

        // Assert - 30-day and 15-day were called, but suspension was NOT called due to exception
        verify(vendorDocumentService, times(1)).sendExpiryNotifications30Day();
        verify(vendorDocumentService, times(1)).sendExpiryNotifications15Day();
        verify(vendorDocumentService, never()).processAutoSuspension();
    }

    @Test
    @DisplayName("Should handle exception in auto-suspension gracefully")
    void processDocumentExpiryNotifications_WhenSuspensionFails_ShouldCatchException() {
        // Arrange
        when(vendorDocumentService.sendExpiryNotifications30Day()).thenReturn(5);
        when(vendorDocumentService.sendExpiryNotifications15Day()).thenReturn(3);
        when(vendorDocumentService.processAutoSuspension())
                .thenThrow(new RuntimeException("Auto-suspension failed"));

        // Act - Should not throw exception
        expiryJob.processDocumentExpiryNotifications();

        // Assert - All three methods were called
        verify(vendorDocumentService, times(1)).sendExpiryNotifications30Day();
        verify(vendorDocumentService, times(1)).sendExpiryNotifications15Day();
        verify(vendorDocumentService, times(1)).processAutoSuspension();
    }

    @Test
    @DisplayName("Should process high volume notifications")
    void processDocumentExpiryNotifications_WithHighVolume_ShouldCompleteSuccessfully() {
        // Arrange - Simulate high volume
        when(vendorDocumentService.sendExpiryNotifications30Day()).thenReturn(100);
        when(vendorDocumentService.sendExpiryNotifications15Day()).thenReturn(50);
        when(vendorDocumentService.processAutoSuspension()).thenReturn(10);

        // Act
        expiryJob.processDocumentExpiryNotifications();

        // Assert
        verify(vendorDocumentService, times(1)).sendExpiryNotifications30Day();
        verify(vendorDocumentService, times(1)).sendExpiryNotifications15Day();
        verify(vendorDocumentService, times(1)).processAutoSuspension();
    }
}
