package com.ultrabms.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

/**
 * Service for tracking failed login attempts and implementing rate limiting.
 *
 * <p>Tracks failed login attempts per email address using Ehcache (from Story 1.3).
 * After 5 failed attempts within a 15-minute window, the account is considered blocked.
 * The 15-minute TTL is managed by Ehcache configuration.</p>
 *
 * <p>Rate limiting rules:</p>
 * <ul>
 *   <li>Maximum 5 login attempts per 15 minutes per email</li>
 *   <li>Account locked for 30 minutes after 5 failed attempts (managed separately in User entity)</li>
 *   <li>Counter resets on successful login</li>
 *   <li>Cache entries automatically expire after 15 minutes (Ehcache TTL)</li>
 * </ul>
 */
@Service
@Slf4j
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final String CACHE_NAME = "loginAttemptsCache";

    // Self-injection to enable caching on internal method calls
    // @Lazy prevents circular dependency issues during initialization
    @Autowired
    @Lazy
    private LoginAttemptService self;

    /**
     * Records a failed login attempt for the given email.
     *
     * <p>Uses @CachePut to always execute the method and update the cache.
     * Increments the attempt counter or initializes to 1 if not present.</p>
     *
     * @param email user's email address
     */
    @CachePut(value = CACHE_NAME, key = "#email")
    public Integer recordFailedAttempt(String email) {
        // Use self-injection to ensure caching works on internal method call
        Integer attempts = self.getAttempts(email);
        int newAttempts = (attempts != null ? attempts : 0) + 1;

        log.warn("Failed login attempt for email: {} (attempt {}/{})", email, newAttempts, MAX_ATTEMPTS);

        return newAttempts;
    }

    /**
     * Checks if an email address is currently blocked due to too many failed attempts.
     *
     * <p>Blocked if attempt count >= MAX_ATTEMPTS. Cache TTL (15 minutes) automatically
     * expires entries, so no manual time checking is needed.</p>
     *
     * @param email user's email address
     * @return true if blocked, false otherwise
     */
    public boolean isBlocked(String email) {
        // Use self-injection to ensure caching works on internal method call
        Integer attempts = self.getAttempts(email);

        if (attempts == null) {
            return false;
        }

        boolean blocked = attempts >= MAX_ATTEMPTS;
        if (blocked) {
            log.warn("Login blocked for email: {} due to {} failed attempts", email, attempts);
        }

        return blocked;
    }

    /**
     * Resets the failed attempt counter for the given email (called on successful login).
     *
     * <p>Uses @CacheEvict to remove the entry from cache.</p>
     *
     * @param email user's email address
     */
    @CacheEvict(value = CACHE_NAME, key = "#email")
    public void resetAttempts(String email) {
        log.debug("Reset login attempts for email: {}", email);
    }

    /**
     * Gets the number of failed attempts for the given email from cache.
     *
     * <p>Uses @Cacheable to retrieve from cache. Returns null if no entry exists
     * (entry never created or TTL expired). The 'unless' condition prevents null
     * values from being cached to avoid ClassCastException with NullValue wrapper.</p>
     *
     * @param email user's email address
     * @return number of failed attempts, or null if no attempts recorded
     */
    @Cacheable(value = CACHE_NAME, key = "#email", unless = "#result == null")
    public Integer getAttempts(String email) {
        // This method is only called when cache miss occurs.
        // Null is returned but NOT cached (due to 'unless' condition).
        // Subsequent calls check cache, and if no value is found, call this method again.
        return null;
    }
}
