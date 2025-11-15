package com.ultrabms.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing active user sessions with device tracking and timeout management.
 *
 * <p>Tracks user sessions with IP address, User-Agent, device type, and activity timestamps.
 * Supports idle timeout (30 minutes) and absolute timeout (12 hours) per security requirements.</p>
 *
 * <p>Enforces maximum 3 concurrent sessions per user via application logic in SessionService.</p>
 */
@Entity
@Table(name = "user_sessions", indexes = {
    @Index(name = "idx_user_sessions_session_id", columnList = "session_id", unique = true),
    @Index(name = "idx_user_sessions_user_id", columnList = "user_id"),
    @Index(name = "idx_user_sessions_expires_at", columnList = "expires_at"),
    @Index(name = "idx_user_sessions_last_activity", columnList = "last_activity_at")
})
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class UserSession extends BaseEntity {

    /**
     * User owning this session (cascades on delete)
     */
    @NotNull(message = "User cannot be null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_user_sessions_user"))
    private User user;

    /**
     * Unique session identifier (UUID) returned on login
     * Used to identify the session in subsequent requests
     */
    @NotNull(message = "Session ID cannot be null")
    @Column(name = "session_id", nullable = false, unique = true, length = 255)
    private String sessionId;

    /**
     * BCrypt hash of access token for security (not stored in plain text)
     * Used to validate token against blacklist
     */
    @Column(name = "access_token_hash", length = 255)
    private String accessTokenHash;

    /**
     * BCrypt hash of refresh token for security (not stored in plain text)
     * Used for token refresh operations
     */
    @Column(name = "refresh_token_hash", length = 255)
    private String refreshTokenHash;

    /**
     * Last authenticated request timestamp - used for idle timeout (30 minutes)
     * Updated on each authenticated request by SessionActivityFilter
     */
    @NotNull(message = "Last activity timestamp cannot be null")
    @Column(name = "last_activity_at", nullable = false)
    private LocalDateTime lastActivityAt;

    /**
     * Session expiration timestamp (created_at + 12 hours absolute timeout)
     * Sessions automatically invalidated when this time is exceeded
     */
    @NotNull(message = "Expiration timestamp cannot be null")
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * Client IP address for security tracking and anomaly detection
     * Captured from HttpServletRequest.getRemoteAddr()
     */
    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    /**
     * Client User-Agent header for device type detection and security
     * Used to parse browser and device information
     */
    @Column(name = "user_agent", length = 500)
    private String userAgent;

    /**
     * Detected device type (Desktop/Mobile/Tablet) parsed from User-Agent
     * Helps users identify sessions in active sessions management UI
     */
    @Column(name = "device_type", length = 50)
    private String deviceType;

    /**
     * Active session flag - false when logged out or expired
     * Used to filter active sessions and enforce concurrent session limits
     */
    @NotNull(message = "Active flag cannot be null")
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    /**
     * Checks if the session has expired based on absolute timeout.
     *
     * @return true if current time exceeds expires_at, false otherwise
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiresAt);
    }

    /**
     * Checks if the session is idle (no activity for specified minutes).
     *
     * @param minutes idle timeout threshold in minutes
     * @return true if session has been idle longer than threshold, false otherwise
     */
    public boolean isIdle(int minutes) {
        LocalDateTime idleThreshold = LocalDateTime.now().minusMinutes(minutes);
        return this.lastActivityAt.isBefore(idleThreshold);
    }

    /**
     * Detects device type from User-Agent string.
     * Parses common patterns to classify as Desktop, Mobile, or Tablet.
     *
     * @return device type classification (Desktop/Mobile/Tablet/Unknown)
     */
    public String detectDeviceType() {
        if (this.userAgent == null || this.userAgent.isEmpty()) {
            return "Unknown";
        }

        String ua = this.userAgent.toLowerCase();

        // Check for tablet first (tablets often contain mobile keywords)
        if (ua.contains("ipad") || ua.contains("tablet") || ua.contains("kindle")) {
            return "Tablet";
        }

        // Check for mobile devices
        if (ua.contains("mobile") || ua.contains("android") || ua.contains("iphone") ||
            ua.contains("ipod") || ua.contains("blackberry") || ua.contains("windows phone")) {
            return "Mobile";
        }

        // Default to desktop
        return "Desktop";
    }

    /**
     * Updates the device type field by parsing the User-Agent.
     * Should be called during session creation.
     */
    public void updateDeviceType() {
        this.deviceType = detectDeviceType();
    }
}
