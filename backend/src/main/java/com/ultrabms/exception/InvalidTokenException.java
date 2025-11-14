package com.ultrabms.exception;

/**
 * Exception thrown when password reset token is invalid, expired, or already used.
 * Results in 400 Bad Request response to client.
 */
public class InvalidTokenException extends RuntimeException {

    public InvalidTokenException(String message) {
        super(message);
    }

    public InvalidTokenException(String message, Throwable cause) {
        super(message, cause);
    }
}
