package com.ultrabms.service;

import com.ultrabms.repository.TokenBlacklistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Service for cleaning up expired tokens from the blacklist.
 *
 * <p>Runs a scheduled job daily at midnight to delete tokens that have expired,
 * preventing database growth and maintaining performance.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TokenBlacklistCleanupService {

    private final TokenBlacklistRepository tokenBlacklistRepository;

    /**
     * Scheduled job that runs daily at midnight (00:00) to clean up expired blacklisted tokens.
     *
     * <p>Deletes all tokens where expiresAt < current time.</p>
     */
    @Scheduled(cron = "0 0 0 * * *") // Run at midnight every day
    @Transactional
    public void cleanupExpiredTokens() {
        log.info("Starting token blacklist cleanup job");

        try {
            LocalDateTime now = LocalDateTime.now();
            int deletedCount = tokenBlacklistRepository.deleteByExpiresAtBefore(now);

            log.info("Token blacklist cleanup completed. Deleted {} expired tokens", deletedCount);
        } catch (Exception e) {
            log.error("Error during token blacklist cleanup", e);
        }
    }
}
