package com.ultrabms.service;

import com.ultrabms.repository.PasswordResetAttemptRepository;
import com.ultrabms.repository.PasswordResetTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Scheduled service for cleaning up expired password reset tokens and rate limit attempts.
 * Runs hourly to prevent database bloat and maintain security hygiene.
 *
 * <p>Cleanup operations:
 * <ul>
 *   <li>Expired tokens: Deletes tokens where expiresAt < (now - 1 hour)</li>
 *   <li>Old used tokens: Deletes used tokens where createdAt < (now - 24 hours)</li>
 *   <li>Old reset attempts: Deletes attempt records > 7 days old</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetCleanupService {

    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordResetAttemptRepository attemptRepository;

    private static final int EXPIRED_TOKEN_RETENTION_HOURS = 1;
    private static final int USED_TOKEN_RETENTION_HOURS = 24;
    private static final int RESET_ATTEMPT_RETENTION_DAYS = 7;

    /**
     * Cleanup expired password reset tokens and old rate limit attempts.
     * Runs every hour at the start of the hour.
     *
     * <p>Cleanup criteria:
     * <ul>
     *   <li>Expired tokens: Delete tokens that expired more than 1 hour ago</li>
     *   <li>Used tokens: Delete used tokens created more than 24 hours ago</li>
     *   <li>Rate limit attempts: Delete attempts > 7 days old</li>
     * </ul>
     *
     * <p>Buffer times prevent race conditions and allow for minor clock skew.
     */
    @Scheduled(cron = "0 0 * * * *") // Every hour at :00 minutes
    @Transactional
    public void cleanupExpiredData() {
        log.info("Starting password reset cleanup job");

        try {
            // Calculate cutoff times
            LocalDateTime expiredTokenCutoff = LocalDateTime.now().minusHours(EXPIRED_TOKEN_RETENTION_HOURS);
            LocalDateTime usedTokenCutoff = LocalDateTime.now().minusHours(USED_TOKEN_RETENTION_HOURS);
            LocalDateTime attemptCutoff = LocalDateTime.now().minusDays(RESET_ATTEMPT_RETENTION_DAYS);

            // Delete expired tokens (older than 1 hour past expiration)
            int deletedExpiredTokens = tokenRepository.deleteByExpiresAtBefore(expiredTokenCutoff);
            log.info("Deleted {} expired password reset tokens (expiresAt < {})",
                    deletedExpiredTokens, expiredTokenCutoff);

            // Delete old used tokens (older than 24 hours)
            int deletedUsedTokens = tokenRepository.deleteByUsedTrueAndCreatedAtBefore(usedTokenCutoff);
            log.info("Deleted {} old used password reset tokens (createdAt < {})",
                    deletedUsedTokens, usedTokenCutoff);

            // Delete old rate limit attempts (older than 7 days)
            int deletedAttempts = attemptRepository.deleteByFirstAttemptAtBefore(attemptCutoff);
            log.info("Deleted {} old password reset rate limit attempts (firstAttemptAt < {})",
                    deletedAttempts, attemptCutoff);

            int totalDeleted = deletedExpiredTokens + deletedUsedTokens + deletedAttempts;
            log.info("Password reset cleanup job completed successfully. Total records deleted: {} " +
                    "(Expired tokens: {}, Used tokens: {}, Attempts: {})",
                    totalDeleted, deletedExpiredTokens, deletedUsedTokens, deletedAttempts);

        } catch (Exception e) {
            // Log error but don't throw - scheduled jobs should be resilient
            log.error("Error during password reset cleanup job", e);
        }
    }
}
