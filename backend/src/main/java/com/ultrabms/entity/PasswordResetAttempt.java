package com.ultrabms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity for tracking password reset attempts per email for rate limiting.
 * Enforces maximum 3 password reset requests per hour per email address.
 * Attempts are counted within a rolling 1-hour window from first attempt.
 */
@Entity
@Table(name = "password_reset_attempts", indexes = {
    @Index(name = "idx_password_reset_attempts_email", columnList = "email"),
    @Index(name = "idx_password_reset_attempts_first_attempt_at", columnList = "first_attempt_at")
})
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetAttempt extends BaseEntity {

    /**
     * Email address attempting password reset
     * Unique constraint ensures one tracking record per email
     */
    @NotNull(message = "Email cannot be null")
    @Email(message = "Email must be valid")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    @Column(name = "email", unique = true, nullable = false, length = 255)
    private String email;

    /**
     * Number of reset attempts within current 1-hour window
     * Counter resets after 1 hour from first attempt
     */
    @NotNull(message = "Attempt count cannot be null")
    @Min(value = 1, message = "Attempt count must be at least 1")
    @Column(name = "attempt_count", nullable = false)
    private Integer attemptCount = 1;

    /**
     * Timestamp of first attempt in current window
     * Used to determine if 1-hour window has elapsed (rolling window)
     */
    @NotNull(message = "First attempt time cannot be null")
    @Column(name = "first_attempt_at", nullable = false)
    private LocalDateTime firstAttemptAt;

    /**
     * Timestamp of most recent attempt
     * Used for tracking and debugging rate limit violations
     */
    @NotNull(message = "Last attempt time cannot be null")
    @Column(name = "last_attempt_at", nullable = false)
    private LocalDateTime lastAttemptAt;

    /**
     * Check if the rate limit window (1 hour) has expired.
     * If expired, the counter should be reset.
     *
     * @return true if more than 1 hour has passed since first attempt
     */
    public boolean isWindowExpired() {
        return firstAttemptAt.plusHours(1).isBefore(LocalDateTime.now());
    }

    /**
     * Check if the rate limit has been exceeded.
     * Maximum 3 attempts allowed within 1-hour window.
     *
     * @return true if attempt count is 3 or more and window not expired
     */
    public boolean isRateLimitExceeded() {
        return attemptCount >= 3 && !isWindowExpired();
    }

    /**
     * Get the number of minutes remaining until the rate limit window resets.
     * Used to inform user how long to wait before trying again.
     *
     * @return minutes remaining until reset (0 if window already expired)
     */
    public long getMinutesUntilReset() {
        if (isWindowExpired()) {
            return 0;
        }
        LocalDateTime resetTime = firstAttemptAt.plusHours(1);
        long minutesRemaining = java.time.Duration.between(LocalDateTime.now(), resetTime).toMinutes();
        return Math.max(0, minutesRemaining);
    }
}
