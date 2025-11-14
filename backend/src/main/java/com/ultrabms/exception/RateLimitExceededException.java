package com.ultrabms.exception;

/**
 * Exception thrown when rate limit for password reset requests is exceeded.
 * Typically results in HTTP 429 Too Many Requests response.
 */
public class RateLimitExceededException extends RuntimeException {

    public RateLimitExceededException(String message) {
        super(message);
    }

    public RateLimitExceededException(String message, Throwable cause) {
        super(message, cause);
    }
}
