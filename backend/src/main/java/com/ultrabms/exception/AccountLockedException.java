package com.ultrabms.exception;

/**
 * Exception thrown when a user attempts to login with a locked account.
 *
 * <p>Accounts are locked after 5 consecutive failed login attempts within 15 minutes
 * and remain locked for 30 minutes.</p>
 */
public class AccountLockedException extends RuntimeException {

    /**
     * Constructs a new AccountLockedException with the specified detail message.
     *
     * @param message the detail message
     */
    public AccountLockedException(String message) {
        super(message);
    }

    /**
     * Constructs a new AccountLockedException with the specified detail message and cause.
     *
     * @param message the detail message
     * @param cause the cause
     */
    public AccountLockedException(String message, Throwable cause) {
        super(message, cause);
    }
}
