package com.ultrabms.service;

import com.ultrabms.entity.MaintenanceRequest;
import com.ultrabms.entity.Property;
import com.ultrabms.entity.Tenant;
import com.ultrabms.entity.Unit;
import com.ultrabms.entity.enums.MaintenanceCategory;
import com.ultrabms.entity.enums.MaintenancePriority;
import com.ultrabms.entity.enums.MaintenanceStatus;
import com.ultrabms.entity.enums.PreferredAccessTime;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for EmailService maintenance request notification methods.
 * Tests the three maintenance request email methods with mocked dependencies.
 *
 * Story 3.5: Tenant Portal - Maintenance Request Submission - Task 5
 */
@ExtendWith(MockitoExtension.class)
class EmailServiceMaintenanceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private SpringTemplateEngine templateEngine;

    @InjectMocks
    private EmailService emailService;

    private Tenant testTenant;
    private MaintenanceRequest testRequest;
    private Property testProperty;
    private Unit testUnit;
    private MimeMessage mimeMessage;

    @BeforeEach
    void setUp() {
        // Set required properties using reflection
        ReflectionTestUtils.setField(emailService, "frontendUrl", "http://localhost:3000");
        ReflectionTestUtils.setField(emailService, "supportEmail", "support@ultrabms.com");

        // Create test property
        testProperty = Property.builder()
                .name("Sunset Apartments")
                .build();
        ReflectionTestUtils.setField(testProperty, "id", UUID.randomUUID());

        // Create test unit
        testUnit = Unit.builder()
                .unitNumber("101")
                .property(testProperty)
                .build();
        ReflectionTestUtils.setField(testUnit, "id", UUID.randomUUID());

        // Create test tenant
        testTenant = Tenant.builder()
                .userId(UUID.randomUUID())
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .phone("+971-50-123-4567")
                .property(testProperty)
                .unit(testUnit)
                .build();
        ReflectionTestUtils.setField(testTenant, "id", UUID.randomUUID());

        // Create test maintenance request
        testRequest = MaintenanceRequest.builder()
                .requestNumber("MR-2025-0001")
                .tenantId(testTenant.getId())
                .unitId(testUnit.getId())
                .propertyId(testProperty.getId())
                .category(MaintenanceCategory.PLUMBING)
                .priority(MaintenancePriority.HIGH)
                .title("Leaking kitchen faucet")
                .description("Water is dripping from the kitchen faucet handle")
                .status(MaintenanceStatus.SUBMITTED)
                .preferredAccessTime(PreferredAccessTime.MORNING)
                .preferredAccessDate(LocalDate.of(2025, 11, 20))
                .submittedAt(LocalDateTime.now())
                .attachments(new ArrayList<>())
                .build();
        ReflectionTestUtils.setField(testRequest, "id", UUID.randomUUID());

        // Mock MimeMessage
        mimeMessage = new MimeMessage((Session) null);
    }

    @Test
    void testSendMaintenanceRequestConfirmation_Success() {
        // Arrange
        when(templateEngine.process(eq("email/maintenance-request-confirmation"), any(Context.class)))
                .thenReturn("<html>HTML Content</html>");
        when(templateEngine.process(eq("email/maintenance-request-confirmation.txt"), any(Context.class)))
                .thenReturn("Text Content");
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Act
        emailService.sendMaintenanceRequestConfirmation(testTenant, testRequest);

        // Wait for async execution
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Assert
        verify(templateEngine, times(1)).process(eq("email/maintenance-request-confirmation"), any(Context.class));
        verify(templateEngine, times(1)).process(eq("email/maintenance-request-confirmation.txt"), any(Context.class));
        verify(mailSender, times(1)).createMimeMessage();
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    void testSendMaintenanceRequestConfirmation_ContextVariables() {
        // Arrange
        ArgumentCaptor<Context> contextCaptor = ArgumentCaptor.forClass(Context.class);
        when(templateEngine.process(eq("email/maintenance-request-confirmation"), contextCaptor.capture()))
                .thenReturn("<html>HTML Content</html>");
        when(templateEngine.process(eq("email/maintenance-request-confirmation.txt"), any(Context.class)))
                .thenReturn("Text Content");
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Act
        emailService.sendMaintenanceRequestConfirmation(testTenant, testRequest);

        // Wait for async execution
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Assert
        Context capturedContext = contextCaptor.getValue();
        assertEquals("John Doe", capturedContext.getVariable("tenantName"));
        assertEquals("MR-2025-0001", capturedContext.getVariable("requestNumber"));
        assertEquals("Leaking kitchen faucet", capturedContext.getVariable("title"));
        assertEquals("HIGH", capturedContext.getVariable("priority"));
        assertEquals("Sunset Apartments", capturedContext.getVariable("propertyName"));
        assertEquals("101", capturedContext.getVariable("unitNumber"));
    }

    @Test
    void testSendMaintenanceRequestNotification_Success() {
        // Arrange
        when(templateEngine.process(eq("email/maintenance-request-new"), any(Context.class)))
                .thenReturn("<html>HTML Content</html>");
        when(templateEngine.process(eq("email/maintenance-request-new.txt"), any(Context.class)))
                .thenReturn("Text Content");
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Act
        emailService.sendMaintenanceRequestNotification(testTenant, testRequest);

        // Wait for async execution
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Assert
        verify(templateEngine, times(1)).process(eq("email/maintenance-request-new"), any(Context.class));
        verify(templateEngine, times(1)).process(eq("email/maintenance-request-new.txt"), any(Context.class));
        verify(mailSender, times(1)).createMimeMessage();
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    void testSendMaintenanceRequestNotification_ContextVariables() {
        // Arrange
        ArgumentCaptor<Context> contextCaptor = ArgumentCaptor.forClass(Context.class);
        when(templateEngine.process(eq("email/maintenance-request-new"), contextCaptor.capture()))
                .thenReturn("<html>HTML Content</html>");
        when(templateEngine.process(eq("email/maintenance-request-new.txt"), any(Context.class)))
                .thenReturn("Text Content");
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Act
        emailService.sendMaintenanceRequestNotification(testTenant, testRequest);

        // Wait for async execution
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Assert
        Context capturedContext = contextCaptor.getValue();
        assertEquals("John Doe", capturedContext.getVariable("tenantName"));
        assertEquals("john.doe@example.com", capturedContext.getVariable("tenantEmail"));
        assertEquals("+971-50-123-4567", capturedContext.getVariable("tenantPhone"));
        assertEquals("MR-2025-0001", capturedContext.getVariable("requestNumber"));
        assertEquals("HIGH", capturedContext.getVariable("priority"));
        assertEquals(0, capturedContext.getVariable("photoCount"));
    }

    @Test
    void testSendMaintenanceRequestStatusChange_Assigned() {
        // Arrange
        testRequest.setStatus(MaintenanceStatus.ASSIGNED);
        ArgumentCaptor<Context> contextCaptor = ArgumentCaptor.forClass(Context.class);
        when(templateEngine.process(eq("email/maintenance-request-status-change"), contextCaptor.capture()))
                .thenReturn("<html>HTML Content</html>");
        when(templateEngine.process(eq("email/maintenance-request-status-change.txt"), any(Context.class)))
                .thenReturn("Text Content");
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Act
        emailService.sendMaintenanceRequestStatusChange(testTenant, testRequest, "ABC Plumbing", "+971-50-999-8888");

        // Wait for async execution
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Assert
        verify(templateEngine, times(1)).process(eq("email/maintenance-request-status-change"), any(Context.class));
        verify(mailSender, times(1)).send(any(MimeMessage.class));

        Context capturedContext = contextCaptor.getValue();
        assertEquals("ASSIGNED", capturedContext.getVariable("status"));
        assertEquals("Assigned to Vendor", capturedContext.getVariable("statusLabel"));
        assertEquals("ABC Plumbing", capturedContext.getVariable("vendorName"));
        assertEquals("+971-50-999-8888", capturedContext.getVariable("vendorContact"));
    }

    @Test
    void testSendMaintenanceRequestStatusChange_InProgress() {
        // Arrange
        testRequest.setStatus(MaintenanceStatus.IN_PROGRESS);
        ArgumentCaptor<Context> contextCaptor = ArgumentCaptor.forClass(Context.class);
        when(templateEngine.process(eq("email/maintenance-request-status-change"), contextCaptor.capture()))
                .thenReturn("<html>HTML Content</html>");
        when(templateEngine.process(eq("email/maintenance-request-status-change.txt"), any(Context.class)))
                .thenReturn("Text Content");
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Act
        emailService.sendMaintenanceRequestStatusChange(testTenant, testRequest, null, null);

        // Wait for async execution
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Assert
        Context capturedContext = contextCaptor.getValue();
        assertEquals("IN_PROGRESS", capturedContext.getVariable("status"));
        assertEquals("Work in Progress", capturedContext.getVariable("statusLabel"));
        assertEquals("Work has started on your maintenance request.", capturedContext.getVariable("statusMessage"));
    }

    @Test
    void testSendMaintenanceRequestStatusChange_Completed() {
        // Arrange
        testRequest.setStatus(MaintenanceStatus.COMPLETED);
        testRequest.setWorkNotes("Replaced faucet cartridge and tested for leaks");
        ArgumentCaptor<Context> contextCaptor = ArgumentCaptor.forClass(Context.class);
        when(templateEngine.process(eq("email/maintenance-request-status-change"), contextCaptor.capture()))
                .thenReturn("<html>HTML Content</html>");
        when(templateEngine.process(eq("email/maintenance-request-status-change.txt"), any(Context.class)))
                .thenReturn("Text Content");
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Act
        emailService.sendMaintenanceRequestStatusChange(testTenant, testRequest, "ABC Plumbing", "+971-50-999-8888");

        // Wait for async execution
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Assert
        Context capturedContext = contextCaptor.getValue();
        assertEquals("COMPLETED", capturedContext.getVariable("status"));
        assertEquals("Work Completed", capturedContext.getVariable("statusLabel"));
        assertEquals("Replaced faucet cartridge and tested for leaks", capturedContext.getVariable("workNotes"));
    }

    @Test
    void testSendMaintenanceRequestStatusChange_Closed() {
        // Arrange
        testRequest.setStatus(MaintenanceStatus.CLOSED);
        ArgumentCaptor<Context> contextCaptor = ArgumentCaptor.forClass(Context.class);
        when(templateEngine.process(eq("email/maintenance-request-status-change"), contextCaptor.capture()))
                .thenReturn("<html>HTML Content</html>");
        when(templateEngine.process(eq("email/maintenance-request-status-change.txt"), any(Context.class)))
                .thenReturn("Text Content");
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Act
        emailService.sendMaintenanceRequestStatusChange(testTenant, testRequest, null, null);

        // Wait for async execution
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Assert
        Context capturedContext = contextCaptor.getValue();
        assertEquals("CLOSED", capturedContext.getVariable("status"));
        assertEquals("Request Closed", capturedContext.getVariable("statusLabel"));
    }

    @Test
    void testSendMaintenanceRequestConfirmation_FailsSilently() {
        // Arrange
        when(templateEngine.process(eq("email/maintenance-request-confirmation"), any(Context.class)))
                .thenThrow(new RuntimeException("Template processing failed"));

        // Act - should not throw exception
        assertDoesNotThrow(() -> {
            emailService.sendMaintenanceRequestConfirmation(testTenant, testRequest);
            Thread.sleep(100); // Wait for async
        });

        // Assert - verify template was attempted
        verify(templateEngine, times(1)).process(eq("email/maintenance-request-confirmation"), any(Context.class));
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void testSendMaintenanceRequestNotification_FailsSilently() {
        // Arrange
        when(templateEngine.process(eq("email/maintenance-request-new"), any(Context.class)))
                .thenThrow(new RuntimeException("Template processing failed"));

        // Act - should not throw exception
        assertDoesNotThrow(() -> {
            emailService.sendMaintenanceRequestNotification(testTenant, testRequest);
            Thread.sleep(100); // Wait for async
        });

        // Assert
        verify(templateEngine, times(1)).process(eq("email/maintenance-request-new"), any(Context.class));
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void testSendMaintenanceRequestStatusChange_WithEstimatedCompletionDate() {
        // Arrange
        testRequest.setStatus(MaintenanceStatus.ASSIGNED);
        testRequest.setEstimatedCompletionDate(LocalDate.of(2025, 11, 25));
        ArgumentCaptor<Context> contextCaptor = ArgumentCaptor.forClass(Context.class);
        when(templateEngine.process(eq("email/maintenance-request-status-change"), contextCaptor.capture()))
                .thenReturn("<html>HTML Content</html>");
        when(templateEngine.process(eq("email/maintenance-request-status-change.txt"), any(Context.class)))
                .thenReturn("Text Content");
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Act
        emailService.sendMaintenanceRequestStatusChange(testTenant, testRequest, "ABC Plumbing", null);

        // Wait for async execution
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Assert
        Context capturedContext = contextCaptor.getValue();
        assertNotNull(capturedContext.getVariable("estimatedCompletionDate"));
        assertEquals("Nov 25, 2025", capturedContext.getVariable("estimatedCompletionDate"));
    }
}
