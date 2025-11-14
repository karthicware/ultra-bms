package com.ultrabms.service;

import com.ultrabms.repository.UserSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Scheduled service for cleaning up expired sessions and inactive sessions.
 *
 * <p>Runs periodically to:</p>
 * <ul>
 *   <li>Delete sessions that have exceeded their absolute timeout (expires_at)</li>
 *   <li>Delete inactive sessions (is_active = false) older than 30 days</li>
 * </ul>
 *
 * <p>This prevents the user_sessions table from growing indefinitely and ensures
 * compliance with data retention policies.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SessionCleanupService {

    private final UserSessionRepository userSessionRepository;

    /**
     * Cleans up expired and old inactive sessions.
     *
     * <p>Scheduled to run every hour (3600000ms). Deletes:</p>
     * <ul>
     *   <li>Sessions past their absolute expiration time</li>
     *   <li>Inactive sessions older than 30 days</li>
     * </ul>
     */
    @Scheduled(fixedDelay = 3600000) // Run every hour
    @Transactional
    public void cleanupExpiredSessions() {
        log.debug("Starting session cleanup job");

        LocalDateTime now = LocalDateTime.now();

        // Delete expired sessions (past absolute timeout)
        int deletedExpired = userSessionRepository.deleteByExpiresAtBefore(now);

        // Delete old inactive sessions (inactive for 30+ days)
        LocalDateTime inactiveThreshold = now.minusDays(30);
        int deletedInactive = userSessionRepository.deleteInactiveSessionsBefore(inactiveThreshold);

        int totalDeleted = deletedExpired + deletedInactive;

        if (totalDeleted > 0) {
            log.info("Session cleanup completed: deleted {} expired sessions and {} old inactive sessions",
                    deletedExpired, deletedInactive);
        } else {
            log.debug("Session cleanup completed: no sessions to delete");
        }
    }
}
