package com.ultrabms.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;

/**
 * Health indicator for email service configuration.
 * Tests SMTP connection on startup and provides health status.
 *
 * Story 9.1: Email Notification System (AC 3)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmailHealthIndicator implements HealthIndicator {

    private final JavaMailSender mailSender;

    private boolean connectionTested = false;
    private boolean connectionHealthy = false;
    private String lastError = null;

    /**
     * Test email connection on application startup
     */
    @EventListener(ApplicationReadyEvent.class)
    public void testEmailConnectionOnStartup() {
        log.info("Testing email SMTP connection on startup...");

        try {
            if (mailSender instanceof JavaMailSenderImpl) {
                JavaMailSenderImpl mailSenderImpl = (JavaMailSenderImpl) mailSender;
                mailSenderImpl.testConnection();
                connectionHealthy = true;
                lastError = null;
                log.info("✓ Email SMTP connection successful - Host: {}, Port: {}",
                    mailSenderImpl.getHost(), mailSenderImpl.getPort());
            } else {
                // Non-standard mail sender, assume healthy
                connectionHealthy = true;
                log.info("✓ Email service configured (non-standard mail sender)");
            }
        } catch (Exception e) {
            connectionHealthy = false;
            lastError = e.getMessage();
            log.error("✗ Email SMTP connection failed: {}", e.getMessage());
            log.warn("Email notifications may not be delivered. Check SMTP configuration.");
        } finally {
            connectionTested = true;
        }
    }

    /**
     * Provides health status for /actuator/health endpoint
     */
    @Override
    public Health health() {
        if (!connectionTested) {
            return Health.unknown()
                .withDetail("status", "Not yet tested")
                .build();
        }

        if (connectionHealthy) {
            Health.Builder builder = Health.up()
                .withDetail("status", "SMTP connection healthy");

            if (mailSender instanceof JavaMailSenderImpl) {
                JavaMailSenderImpl impl = (JavaMailSenderImpl) mailSender;
                builder.withDetail("host", impl.getHost())
                    .withDetail("port", impl.getPort());
            }

            return builder.build();
        } else {
            return Health.down()
                .withDetail("status", "SMTP connection failed")
                .withDetail("error", lastError != null ? lastError : "Unknown error")
                .build();
        }
    }

    /**
     * Check if email service is healthy (for use by other services)
     */
    public boolean isHealthy() {
        return connectionHealthy;
    }

    /**
     * Re-test the connection (can be triggered manually if needed)
     */
    public void retestConnection() {
        connectionTested = false;
        testEmailConnectionOnStartup();
    }
}
