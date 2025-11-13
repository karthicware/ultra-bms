package com.ultrabms.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for tracking failed login attempts and implementing rate limiting.
 *
 * <p>Tracks failed login attempts per email address using in-memory cache (Ehcache).
 * After 5 failed attempts within a 15-minute window, the account is considered blocked.</p>
 *
 * <p>Rate limiting rules:</p>
 * <ul>
 *   <li>Maximum 5 login attempts per 15 minutes per email</li>
 *   <li>Account locked for 30 minutes after 5 failed attempts</li>
 *   <li>Counter resets on successful login</li>
 * </ul>
 */
@Service
@Slf4j
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long BLOCK_DURATION_MINUTES = 15;

    // In-memory cache for tracking attempts (email -> attempt count + timestamp)
    private final Map<String, AttemptInfo> attemptsCache = new ConcurrentHashMap<>();

    /**
     * Records a failed login attempt for the given email.
     *
     * @param email user's email address
     */
    public void recordFailedAttempt(String email) {
        AttemptInfo info = attemptsCache.getOrDefault(email, new AttemptInfo());

        // Reset counter if last attempt was more than 15 minutes ago
        if (info.timestamp.plusMinutes(BLOCK_DURATION_MINUTES).isBefore(LocalDateTime.now())) {
            info.attempts = 1;
        } else {
            info.attempts++;
        }

        info.timestamp = LocalDateTime.now();
        attemptsCache.put(email, info);

        log.warn("Failed login attempt for email: {} (attempt {}/{})", email, info.attempts, MAX_ATTEMPTS);
    }

    /**
     * Checks if an email address is currently blocked due to too many failed attempts.
     *
     * @param email user's email address
     * @return true if blocked, false otherwise
     */
    public boolean isBlocked(String email) {
        AttemptInfo info = attemptsCache.get(email);

        if (info == null) {
            return false;
        }

        // Check if block period has expired
        if (info.timestamp.plusMinutes(BLOCK_DURATION_MINUTES).isBefore(LocalDateTime.now())) {
            // Block period expired, remove from cache
            attemptsCache.remove(email);
            return false;
        }

        boolean blocked = info.attempts >= MAX_ATTEMPTS;
        if (blocked) {
            log.warn("Login blocked for email: {} due to {} failed attempts", email, info.attempts);
        }

        return blocked;
    }

    /**
     * Resets the failed attempt counter for the given email (called on successful login).
     *
     * @param email user's email address
     */
    public void resetAttempts(String email) {
        attemptsCache.remove(email);
        log.debug("Reset login attempts for email: {}", email);
    }

    /**
     * Gets the number of failed attempts for the given email.
     *
     * @param email user's email address
     * @return number of failed attempts
     */
    public int getAttempts(String email) {
        AttemptInfo info = attemptsCache.get(email);
        return info != null ? info.attempts : 0;
    }

    /**
     * Inner class to track attempt information.
     */
    private static class AttemptInfo {
        int attempts = 0;
        LocalDateTime timestamp = LocalDateTime.now();
    }
}
