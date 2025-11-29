package com.ultrabms.service;

import com.ultrabms.entity.EmailNotification;
import com.ultrabms.entity.enums.EmailNotificationStatus;
import com.ultrabms.entity.enums.NotificationType;
import com.ultrabms.repository.EmailNotificationRepository;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.context.IContext;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for EmailNotificationService
 * Story 9.1: Email Notification System (AC 40-42)
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EmailNotificationServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private SpringTemplateEngine templateEngine;

    @Mock
    private EmailNotificationRepository emailNotificationRepository;

    @Mock
    private MimeMessage mimeMessage;

    @InjectMocks
    private EmailNotificationService emailNotificationService;

    private UUID notificationId;
    private EmailNotification notification;

    @BeforeEach
    void setUp() {
        notificationId = UUID.randomUUID();

        // Set up default notification
        notification = EmailNotification.builder()
            .recipientEmail("test@example.com")
            .recipientName("Test User")
            .notificationType(NotificationType.PASSWORD_RESET_REQUESTED)
            .subject("Test Subject")
            .body("<html>Test Body</html>")
            .status(EmailNotificationStatus.PENDING)
            .retryCount(0)
            .build();

        // Mock common behaviors
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(anyString(), any(IContext.class))).thenReturn("<html>Rendered</html>");

        // Set config values
        ReflectionTestUtils.setField(emailNotificationService, "senderEmail", "noreply@ultrabms.com");
        ReflectionTestUtils.setField(emailNotificationService, "frontendUrl", "http://localhost:3000");
    }

    @Nested
    @DisplayName("queueEmail Tests")
    class QueueEmailTests {

        @Test
        @DisplayName("Should queue email notification with all fields")
        void shouldQueueEmailWithAllFields() {
            // Given
            Map<String, Object> variables = Map.of("key", "value");
            UUID entityId = UUID.randomUUID();

            ArgumentCaptor<EmailNotification> captor = ArgumentCaptor.forClass(EmailNotification.class);
            when(emailNotificationRepository.save(any(EmailNotification.class)))
                .thenAnswer(inv -> {
                    EmailNotification saved = inv.getArgument(0);
                    ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
                    return saved;
                });

            // When
            EmailNotification result = emailNotificationService.queueEmail(
                NotificationType.INVOICE_GENERATED,
                "tenant@example.com",
                "Tenant Name",
                "Invoice Generated",
                "invoice-sent",
                variables,
                "Invoice",
                entityId
            );

            // Then
            verify(emailNotificationRepository).save(captor.capture());
            EmailNotification saved = captor.getValue();

            assertThat(saved.getRecipientEmail()).isEqualTo("tenant@example.com");
            assertThat(saved.getRecipientName()).isEqualTo("Tenant Name");
            assertThat(saved.getNotificationType()).isEqualTo(NotificationType.INVOICE_GENERATED);
            assertThat(saved.getSubject()).isEqualTo("Invoice Generated");
            assertThat(saved.getStatus()).isEqualTo(EmailNotificationStatus.PENDING);
            assertThat(saved.getEntityType()).isEqualTo("Invoice");
            assertThat(saved.getEntityId()).isEqualTo(entityId);
            assertThat(saved.getRetryCount()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should render template with variables")
        void shouldRenderTemplateWithVariables() {
            // Given
            Map<String, Object> variables = Map.of(
                "tenantName", "John Doe",
                "invoiceNumber", "INV-2025-001"
            );

            when(emailNotificationRepository.save(any(EmailNotification.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            // When
            emailNotificationService.queueEmail(
                NotificationType.INVOICE_GENERATED,
                "test@example.com",
                "Test",
                "Subject",
                "invoice-sent",
                variables,
                null,
                null
            );

            // Then
            verify(templateEngine).process(eq("email/invoice-sent"), any(IContext.class));
        }
    }

    @Nested
    @DisplayName("sendNotification Tests")
    class SendNotificationTests {

        @Test
        @DisplayName("Should mark notification as SENT on success")
        void shouldMarkAsSentOnSuccess() throws Exception {
            // Given
            notification.setId(notificationId);
            when(emailNotificationRepository.save(any(EmailNotification.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            // When
            EmailNotification result = emailNotificationService.sendNotification(notification);

            // Then
            assertThat(result.getStatus()).isEqualTo(EmailNotificationStatus.SENT);
            assertThat(result.getSentAt()).isNotNull();
            assertThat(result.getFailedAt()).isNull();
            assertThat(result.getFailureReason()).isNull();
            verify(mailSender).send(any(MimeMessage.class));
        }

        @Test
        @DisplayName("Should mark notification as FAILED on send error")
        void shouldMarkAsFailedOnError() throws Exception {
            // Given
            notification.setId(notificationId);
            doThrow(new RuntimeException("SMTP error")).when(mailSender).send(any(MimeMessage.class));
            when(emailNotificationRepository.save(any(EmailNotification.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            // When
            EmailNotification result = emailNotificationService.sendNotification(notification);

            // Then
            assertThat(result.getStatus()).isEqualTo(EmailNotificationStatus.FAILED);
            assertThat(result.getFailedAt()).isNotNull();
            assertThat(result.getFailureReason()).contains("SMTP error");
            assertThat(result.getRetryCount()).isEqualTo(1);
        }

        @Test
        @DisplayName("Should calculate nextRetryAt with exponential backoff")
        void shouldCalculateExponentialBackoff() throws Exception {
            // Given
            notification.setId(notificationId);
            notification.setRetryCount(0);
            doThrow(new RuntimeException("Network error")).when(mailSender).send(any(MimeMessage.class));
            when(emailNotificationRepository.save(any(EmailNotification.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            // When
            EmailNotification result = emailNotificationService.sendNotification(notification);

            // Then - First retry should be 1 minute later (5^0 = 1)
            assertThat(result.getNextRetryAt()).isNotNull();
            assertThat(result.getRetryCount()).isEqualTo(1);
        }

        @Test
        @DisplayName("Should mark as QUEUED before sending")
        void shouldMarkAsQueuedBeforeSending() {
            // Given
            notification.setId(notificationId);
            // Track the status at each save call
            java.util.List<EmailNotificationStatus> capturedStatuses = new java.util.ArrayList<>();
            when(emailNotificationRepository.save(any(EmailNotification.class)))
                .thenAnswer(inv -> {
                    EmailNotification n = inv.getArgument(0);
                    capturedStatuses.add(n.getStatus());
                    return n;
                });

            // When
            emailNotificationService.sendNotification(notification);

            // Then - verify at least 2 saves occurred
            verify(emailNotificationRepository, atLeast(2)).save(any(EmailNotification.class));

            // First save should be QUEUED, second should be SENT
            assertThat(capturedStatuses).hasSizeGreaterThanOrEqualTo(2);
            assertThat(capturedStatuses.get(0)).isEqualTo(EmailNotificationStatus.QUEUED);
            assertThat(capturedStatuses.get(1)).isEqualTo(EmailNotificationStatus.SENT);
        }
    }

    @Nested
    @DisplayName("retryNotification Tests")
    class RetryNotificationTests {

        @Test
        @DisplayName("Should retry failed notification")
        void shouldRetryFailedNotification() {
            // Given
            notification.setId(notificationId);
            notification.setStatus(EmailNotificationStatus.FAILED);
            notification.setRetryCount(1);

            when(emailNotificationRepository.findById(notificationId)).thenReturn(Optional.of(notification));
            when(emailNotificationRepository.save(any(EmailNotification.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            // When
            EmailNotification result = emailNotificationService.retryNotification(notificationId);

            // Then
            verify(emailNotificationRepository).findById(notificationId);
            verify(mailSender).send(any(MimeMessage.class));
        }

        @Test
        @DisplayName("Should throw exception for non-failed notification")
        void shouldThrowExceptionForNonFailedNotification() {
            // Given
            notification.setId(notificationId);
            notification.setStatus(EmailNotificationStatus.SENT); // Already sent

            when(emailNotificationRepository.findById(notificationId)).thenReturn(Optional.of(notification));

            // When/Then
            assertThatThrownBy(() -> emailNotificationService.retryNotification(notificationId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Can only retry failed notifications");
        }

        @Test
        @DisplayName("Should throw exception for non-existent notification")
        void shouldThrowExceptionForNonExistentNotification() {
            // Given
            when(emailNotificationRepository.findById(notificationId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> emailNotificationService.retryNotification(notificationId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Notification not found");
        }
    }

    @Nested
    @DisplayName("Query Methods Tests")
    class QueryMethodTests {

        @Test
        @DisplayName("Should get notifications with filters")
        void shouldGetNotificationsWithFilters() {
            // Given
            Pageable pageable = PageRequest.of(0, 20);
            List<EmailNotification> notifications = List.of(notification);
            Page<EmailNotification> page = new PageImpl<>(notifications, pageable, 1);

            when(emailNotificationRepository.findWithFilters(
                any(), any(), any(), any(), any(), any()
            )).thenReturn(page);

            // When
            Page<EmailNotification> result = emailNotificationService.getNotifications(
                EmailNotificationStatus.SENT,
                NotificationType.INVOICE_GENERATED,
                "test@example.com",
                LocalDateTime.now().minusDays(7),
                LocalDateTime.now(),
                pageable
            );

            // Then
            assertThat(result.getContent()).hasSize(1);
            verify(emailNotificationRepository).findWithFilters(
                eq(EmailNotificationStatus.SENT),
                eq(NotificationType.INVOICE_GENERATED),
                eq("test@example.com"),
                any(),
                any(),
                eq(pageable)
            );
        }

        @Test
        @DisplayName("Should get notification by ID")
        void shouldGetNotificationById() {
            // Given
            notification.setId(notificationId);
            when(emailNotificationRepository.findById(notificationId)).thenReturn(Optional.of(notification));

            // When
            Optional<EmailNotification> result = emailNotificationService.getNotification(notificationId);

            // Then
            assertThat(result).isPresent();
            assertThat(result.get().getId()).isEqualTo(notificationId);
        }

        @Test
        @DisplayName("Should return statistics")
        void shouldReturnStatistics() {
            // Given
            LocalDateTime start = LocalDateTime.now().minusDays(30);
            LocalDateTime end = LocalDateTime.now();

            when(emailNotificationRepository.countByStatusAndCreatedAtBetween(
                EmailNotificationStatus.PENDING, start, end
            )).thenReturn(5L);
            when(emailNotificationRepository.countByStatusAndCreatedAtBetween(
                EmailNotificationStatus.SENT, start, end
            )).thenReturn(100L);
            when(emailNotificationRepository.countByStatusAndCreatedAtBetween(
                EmailNotificationStatus.FAILED, start, end
            )).thenReturn(3L);
            when(emailNotificationRepository.countByStatusAndCreatedAtBetween(
                EmailNotificationStatus.QUEUED, start, end
            )).thenReturn(2L);

            // When
            Map<String, Long> result = emailNotificationService.getStatistics(start, end);

            // Then
            assertThat(result.get("pending")).isEqualTo(5L);
            assertThat(result.get("sent")).isEqualTo(100L);
            assertThat(result.get("failed")).isEqualTo(3L);
            assertThat(result.get("queued")).isEqualTo(2L);
        }
    }

    @Nested
    @DisplayName("Convenience Method Tests")
    class ConvenienceMethodTests {

        @Test
        @DisplayName("Should send password reset notification with correct variables")
        void shouldSendPasswordResetNotification() {
            // Given
            when(emailNotificationRepository.save(any(EmailNotification.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            // When
            emailNotificationService.sendPasswordResetNotification(
                "user@example.com",
                "John",
                "test-reset-token-123"
            );

            // Then
            verify(templateEngine).process(eq("email/password-reset-email"), any(IContext.class));
            verify(emailNotificationRepository, atLeastOnce()).save(any(EmailNotification.class));
        }

        @Test
        @DisplayName("Should queue invoice notification with entity reference")
        void shouldQueueInvoiceNotification() {
            // Given
            UUID invoiceId = UUID.randomUUID();
            when(emailNotificationRepository.save(any(EmailNotification.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            // When
            emailNotificationService.sendInvoiceNotification(
                "tenant@example.com",
                "John Doe",
                "INV-2025-001",
                "2025-12-15",
                "5,000.00",
                invoiceId
            );

            // Then
            ArgumentCaptor<EmailNotification> captor = ArgumentCaptor.forClass(EmailNotification.class);
            verify(emailNotificationRepository).save(captor.capture());

            EmailNotification saved = captor.getValue();
            assertThat(saved.getEntityType()).isEqualTo("Invoice");
            assertThat(saved.getEntityId()).isEqualTo(invoiceId);
            assertThat(saved.getNotificationType()).isEqualTo(NotificationType.INVOICE_GENERATED);
        }

        @Test
        @DisplayName("Should queue payment received notification")
        void shouldQueuePaymentReceivedNotification() {
            // Given
            UUID paymentId = UUID.randomUUID();
            when(emailNotificationRepository.save(any(EmailNotification.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            // When
            emailNotificationService.sendPaymentReceivedNotification(
                "tenant@example.com",
                "Jane Doe",
                "2,500.00",
                "INV-2025-001",
                paymentId
            );

            // Then
            ArgumentCaptor<EmailNotification> captor = ArgumentCaptor.forClass(EmailNotification.class);
            verify(emailNotificationRepository).save(captor.capture());

            EmailNotification saved = captor.getValue();
            assertThat(saved.getEntityType()).isEqualTo("Payment");
            assertThat(saved.getEntityId()).isEqualTo(paymentId);
            assertThat(saved.getNotificationType()).isEqualTo(NotificationType.PAYMENT_RECEIVED);
        }
    }

    @Nested
    @DisplayName("Edge Cases")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should handle null variables gracefully")
        void shouldHandleNullVariables() {
            // Given
            when(emailNotificationRepository.save(any(EmailNotification.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            // When - pass null variables
            EmailNotification result = emailNotificationService.queueEmail(
                NotificationType.NEW_USER_CREATED,
                "test@example.com",
                "Test",
                "Welcome",
                "user-welcome-email",
                null, // null variables
                null,
                null
            );

            // Then - should not throw
            assertThat(result).isNotNull();
            verify(templateEngine).process(anyString(), any(IContext.class));
        }

        @Test
        @DisplayName("Should handle max retry count")
        void shouldHandleMaxRetryCount() throws Exception {
            // Given
            notification.setId(notificationId);
            notification.setRetryCount(2); // Already retried twice
            doThrow(new RuntimeException("SMTP error")).when(mailSender).send(any(MimeMessage.class));
            when(emailNotificationRepository.save(any(EmailNotification.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            // When
            EmailNotification result = emailNotificationService.sendNotification(notification);

            // Then - should not schedule another retry (max is 3)
            assertThat(result.getRetryCount()).isEqualTo(3);
            assertThat(result.canRetry()).isFalse();
        }
    }
}
