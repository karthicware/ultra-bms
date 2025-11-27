package com.ultrabms.service;

import com.ultrabms.entity.AuditLog;
import com.ultrabms.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Service for managing audit logs.
 *
 * <p>
 * Handles the creation and storage of audit logs for security events
 * and user actions.
 * </p>
 */
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Logs an authorization failure event.
     *
     * @param userId    the user ID (can be null if unknown)
     * @param resource  the resource being accessed
     * @param action    the action attempted
     * @param ipAddress the IP address of the request
     * @param details   additional details
     */
    @Async
    @Transactional
    public void logAuthorizationFailure(UUID userId, String resource, String action, String ipAddress,
            Map<String, Object> details) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUserId(userId);
        auditLog.setAction("AUTHORIZATION_FAILED");
        auditLog.setIpAddress(ipAddress);
        auditLog.setCreatedAt(LocalDateTime.now());

        // Combine resource and action into details if not already present
        if (details != null) {
            auditLog.setDetails(details);
        } else {
            auditLog.setDetails(Map.of(
                    "resource", resource,
                    "attemptedAction", action));
        }

        auditLogRepository.save(auditLog);
    }

    /**
     * Logs a generic security event.
     *
     * @param userId    the user ID
     * @param action    the action performed
     * @param ipAddress the IP address
     * @param details   additional details
     */
    @Async
    @Transactional
    public void logSecurityEvent(UUID userId, String action, String ipAddress, Map<String, Object> details) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUserId(userId);
        auditLog.setAction(action);
        auditLog.setIpAddress(ipAddress);
        auditLog.setCreatedAt(LocalDateTime.now());
        auditLog.setDetails(details);

        auditLogRepository.save(auditLog);
    }
}
