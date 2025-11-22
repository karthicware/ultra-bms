package com.ultrabms.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.retry.annotation.EnableRetry;

/**
 * Spring Retry Configuration.
 *
 * <p>Enables @Retryable annotations throughout the application.
 * Used for handling transient failures like optimistic locking conflicts.</p>
 *
 * <p>Key features:</p>
 * <ul>
 *   <li>Automatic retry on OptimisticLockingFailureException in SessionService</li>
 *   <li>Exponential backoff to reduce database contention</li>
 *   <li>Configurable max attempts and delay per method</li>
 * </ul>
 *
 * <p>Example usage:</p>
 * <pre>
 * {@code
 * @Retryable(
 *     value = {ObjectOptimisticLockingFailureException.class},
 *     maxAttempts = 3,
 *     backoff = @Backoff(delay = 100, multiplier = 2)
 * )
 * public void updateSessionActivity(String accessToken) {
 *     // Method implementation
 * }
 * }
 * </pre>
 *
 * @see org.springframework.retry.annotation.Retryable
 * @see com.ultrabms.service.SessionService#updateSessionActivity
 */
@Configuration
@EnableRetry
public class RetryConfig {
    // Enables @Retryable annotations
    // No additional configuration needed for basic retry support
}
