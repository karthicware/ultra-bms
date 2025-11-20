package com.ultrabms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Entity representing audit logs for tracking user actions and security events.
 *
 * <p>Captures authentication events (login, logout, registration) along with
 * contextual information like IP address and user agent for security monitoring
 * and compliance.</p>
 */
@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_logs_user_id", columnList = "user_id"),
    @Index(name = "idx_audit_logs_action", columnList = "action"),
    @Index(name = "idx_audit_logs_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    /**
     * Unique identifier for the audit log entry
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /**
     * ID of the user who performed the action (null for failed login attempts)
     */
    @Column(name = "user_id")
    private UUID userId;

    /**
     * Action performed (e.g., REGISTRATION, LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, TOKEN_REFRESH)
     */
    @NotNull(message = "Action cannot be null")
    @Column(name = "action", nullable = false, length = 100)
    private String action;

    /**
     * IP address from which the action was performed
     */
    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    /**
     * User agent string from the HTTP request
     */
    @Column(name = "user_agent", length = 500)
    private String userAgent;

    /**
     * When the action was performed
     */
    @NotNull(message = "Created date cannot be null")
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /**
     * Additional details in JSON format (e.g., failure reason, email for failed logins)
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "details", columnDefinition = "jsonb")
    private Map<String, Object> details;

    /**
     * Constructor for creating an audit log entry.
     *
     * @param userId ID of the user (null for failed attempts)
     * @param action action performed
     * @param ipAddress IP address
     * @param userAgent user agent string
     */
    public AuditLog(UUID userId, String action, String ipAddress, String userAgent) {
        this.userId = userId;
        this.action = action;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.createdAt = LocalDateTime.now();
    }

    /**
     * Constructor with details.
     *
     * @param userId ID of the user
     * @param action action performed
     * @param ipAddress IP address
     * @param userAgent user agent string
     * @param details additional details
     */
    public AuditLog(UUID userId, String action, String ipAddress, String userAgent, Map<String, Object> details) {
        this(userId, action, ipAddress, userAgent);
        this.details = details;
    }
}
