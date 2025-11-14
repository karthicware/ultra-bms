package com.ultrabms.service;

import com.ultrabms.config.SecurityProperties;
import com.ultrabms.dto.SessionDto;
import com.ultrabms.entity.TokenBlacklist;
import com.ultrabms.entity.User;
import com.ultrabms.entity.UserSession;
import com.ultrabms.entity.enums.BlacklistReason;
import com.ultrabms.entity.enums.TokenType;
import com.ultrabms.repository.TokenBlacklistRepository;
import com.ultrabms.repository.UserSessionRepository;
import com.ultrabms.security.JwtTokenProvider;
import com.ultrabms.util.TokenHashUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing user sessions, including creation, activity tracking, and lifecycle management.
 *
 * <p>Key responsibilities:</p>
 * <ul>
 *   <li>Create sessions on login with concurrent session limit enforcement (max 3 per user)</li>
 *   <li>Track session activity and update last_activity_at timestamps</li>
 *   <li>Invalidate sessions on logout, timeout, or security events</li>
 *   <li>Blacklist tokens when sessions are terminated</li>
 *   <li>Provide session listing for Active Sessions Management UI</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {

    private final UserSessionRepository userSessionRepository;
    private final TokenBlacklistRepository tokenBlacklistRepository;
    private final SecurityProperties securityProperties;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Creates a new user session on login.
     *
     * <p>Enforces concurrent session limit by deleting the oldest session if limit is exceeded.
     * Hashes tokens before storage for security.</p>
     *
     * @param user         the authenticated user
     * @param accessToken  the generated access token (plain text)
     * @param refreshToken the generated refresh token (plain text)
     * @param request      the HTTP request for extracting IP and User-Agent
     * @return the generated session ID
     */
    @Transactional
    public String createSession(User user, String accessToken, String refreshToken, HttpServletRequest request) {
        // Check concurrent session limit
        long activeSessionCount = userSessionRepository.countByUserIdAndIsActiveTrue(user.getId());
        int maxSessions = securityProperties.getSession().getMaxConcurrentSessions();

        if (activeSessionCount >= maxSessions) {
            // Delete oldest session to make room
            List<UserSession> oldestSessions = userSessionRepository.findOldestActiveSessionByUserId(user.getId());
            if (!oldestSessions.isEmpty()) {
                UserSession oldestSession = oldestSessions.get(0);
                log.info("Max concurrent sessions ({}) reached for user {}. Deleting oldest session: {}",
                        maxSessions, user.getEmail(), oldestSession.getSessionId());
                invalidateSession(oldestSession.getSessionId(), BlacklistReason.SECURITY_VIOLATION);
            }
        }

        // Generate unique session ID
        String sessionId = UUID.randomUUID().toString();

        // Hash tokens for secure storage (SHA-256)
        String accessTokenHash = TokenHashUtil.hashToken(accessToken);
        String refreshTokenHash = TokenHashUtil.hashToken(refreshToken);

        // Extract request metadata
        String ipAddress = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");

        // Calculate session expiration (absolute timeout)
        LocalDateTime now = LocalDateTime.now();
        int absoluteTimeoutSeconds = securityProperties.getSession().getAbsoluteTimeout();
        LocalDateTime expiresAt = now.plusSeconds(absoluteTimeoutSeconds);

        // Create and save session
        UserSession session = new UserSession();
        session.setUser(user);
        session.setSessionId(sessionId);
        session.setAccessTokenHash(accessTokenHash);
        session.setRefreshTokenHash(refreshTokenHash);
        session.setLastActivityAt(now);
        session.setExpiresAt(expiresAt);
        session.setIpAddress(ipAddress);
        session.setUserAgent(userAgent);
        session.updateDeviceType(); // Parse device type from User-Agent
        session.setIsActive(true);

        userSessionRepository.save(session);

        log.info("Created session {} for user {} from IP {} (device: {})",
                sessionId, user.getEmail(), ipAddress, session.getDeviceType());

        return sessionId;
    }

    /**
     * Updates session activity timestamp and checks for timeouts.
     *
     * <p>Called by SessionActivityFilter on each authenticated request.
     * Invalidates session if idle or absolute timeout is exceeded.</p>
     *
     * @param accessToken the access token from Authorization header
     * @throws IllegalStateException if session is expired or not found
     */
    @Transactional
    public void updateSessionActivity(String accessToken) {
        // Hash token to find session
        String tokenHash = TokenHashUtil.hashToken(accessToken);
        UserSession session = userSessionRepository.findByAccessTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalStateException("Session not found for token"));

        LocalDateTime now = LocalDateTime.now();
        int idleTimeoutMinutes = securityProperties.getSession().getIdleTimeout() / 60; // Convert seconds to minutes

        // Check idle timeout
        if (session.isIdle(idleTimeoutMinutes)) {
            log.warn("Session {} idle timeout exceeded ({}min). Invalidating session.",
                    session.getSessionId(), idleTimeoutMinutes);
            invalidateSession(session.getSessionId(), BlacklistReason.IDLE_TIMEOUT);
            throw new IllegalStateException("Session expired due to inactivity");
        }

        // Check absolute timeout
        if (session.isExpired()) {
            log.warn("Session {} absolute timeout exceeded. Invalidating session.", session.getSessionId());
            invalidateSession(session.getSessionId(), BlacklistReason.ABSOLUTE_TIMEOUT);
            throw new IllegalStateException("Session expired (absolute timeout)");
        }

        // Update activity timestamp
        session.setLastActivityAt(now);
        userSessionRepository.save(session);

        log.debug("Updated session {} activity timestamp", session.getSessionId());
    }

    /**
     * Invalidates a session and blacklists its tokens.
     *
     * <p>Marks session inactive, adds access and refresh tokens to blacklist with reason.</p>
     *
     * @param sessionId the session ID to invalidate
     * @param reason    the blacklist reason (LOGOUT, IDLE_TIMEOUT, etc.)
     */
    @Transactional
    public void invalidateSession(String sessionId, BlacklistReason reason) {
        UserSession session = userSessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        // Mark session inactive
        session.setIsActive(false);
        userSessionRepository.save(session);

        // Blacklist access token
        if (session.getAccessTokenHash() != null) {
            LocalDateTime accessTokenExpiry = LocalDateTime.now()
                    .plusSeconds(jwtTokenProvider.getAccessTokenExpirationSeconds());
            TokenBlacklist accessBlacklist = new TokenBlacklist(
                    session.getAccessTokenHash(),
                    TokenType.ACCESS,
                    accessTokenExpiry,
                    reason
            );
            tokenBlacklistRepository.save(accessBlacklist);
        }

        // Blacklist refresh token
        if (session.getRefreshTokenHash() != null) {
            LocalDateTime refreshTokenExpiry = LocalDateTime.now()
                    .plusSeconds(jwtTokenProvider.getRefreshTokenExpirationSeconds());
            TokenBlacklist refreshBlacklist = new TokenBlacklist(
                    session.getRefreshTokenHash(),
                    TokenType.REFRESH,
                    refreshTokenExpiry,
                    reason
            );
            tokenBlacklistRepository.save(refreshBlacklist);
        }

        log.info("Invalidated session {} (reason: {})", sessionId, reason);
    }

    /**
     * Gets all active sessions for a user.
     *
     * <p>Used by Active Sessions Management UI to display user's sessions.</p>
     *
     * @param userId         the user's UUID
     * @param currentSessionId the current session ID to mark as "isCurrent"
     * @return list of SessionDto objects
     */
    @Transactional(readOnly = true)
    public List<SessionDto> getUserActiveSessions(UUID userId, String currentSessionId) {
        List<UserSession> sessions = userSessionRepository.findByUserIdAndIsActiveTrue(userId);

        return sessions.stream()
                .map(session -> new SessionDto(
                        session.getSessionId(),
                        session.getDeviceType(),
                        SessionDto.parseBrowser(session.getUserAgent()),
                        session.getIpAddress(),
                        null, // Location not implemented yet
                        session.getLastActivityAt(),
                        session.getCreatedAt(),
                        session.getSessionId().equals(currentSessionId)
                ))
                .collect(Collectors.toList());
    }

    /**
     * Revokes a specific user session.
     *
     * <p>Validates that the session belongs to the user before revoking.</p>
     *
     * @param userId    the user's UUID (for security check)
     * @param sessionId the session ID to revoke
     * @throws IllegalArgumentException if session not found or doesn't belong to user
     */
    @Transactional
    public void revokeSession(UUID userId, String sessionId) {
        UserSession session = userSessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        // Security check: verify session belongs to user
        if (!session.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Session does not belong to user");
        }

        invalidateSession(sessionId, BlacklistReason.LOGOUT);
        log.info("User {} revoked session {}", userId, sessionId);
    }

    /**
     * Revokes all active sessions for a user except the specified session.
     *
     * <p>Used for "Logout All Other Devices" functionality.</p>
     *
     * @param userId           the user's UUID
     * @param exceptSessionId  the session ID to preserve (current session)
     * @return number of sessions revoked
     */
    @Transactional
    public int revokeAllUserSessionsExcept(UUID userId, String exceptSessionId) {
        List<UserSession> sessions = userSessionRepository.findByUserIdAndIsActiveTrue(userId);

        int revokedCount = 0;
        for (UserSession session : sessions) {
            if (!session.getSessionId().equals(exceptSessionId)) {
                invalidateSession(session.getSessionId(), BlacklistReason.LOGOUT_ALL);
                revokedCount++;
            }
        }

        log.info("User {} revoked {} sessions (excluding current)", userId, revokedCount);
        return revokedCount;
    }

    /**
     * Revokes all active sessions for a user.
     *
     * <p>Used when user changes password or for complete logout.</p>
     *
     * @param userId the user's UUID
     * @return number of sessions revoked
     */
    @Transactional
    public int revokeAllUserSessions(UUID userId) {
        List<UserSession> sessions = userSessionRepository.findByUserIdAndIsActiveTrue(userId);

        for (UserSession session : sessions) {
            invalidateSession(session.getSessionId(), BlacklistReason.LOGOUT_ALL);
        }

        log.info("Revoked all {} sessions for user {}", sessions.size(), userId);
        return sessions.size();
    }
}
