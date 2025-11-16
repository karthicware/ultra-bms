package com.ultrabms.exception;

/**
 * Exception thrown when a user attempts to access a resource they don't have permission to access.
 *
 * <p>This exception should be used when a user is authenticated but lacks the necessary
 * authorization to perform an action or access a resource (e.g., a tenant trying to view
 * another tenant's maintenance requests). The global exception handler will map this to
 * HTTP 403 Forbidden.</p>
 *
 * <p>Usage examples:</p>
 * <ul>
 *   <li>Tenant accessing another tenant's maintenance request</li>
 *   <li>User accessing resources outside their organization</li>
 *   <li>User performing actions beyond their role permissions</li>
 * </ul>
 *
 * @see GlobalExceptionHandler
 */
public class UnauthorizedException extends RuntimeException {

    /**
     * Constructs a new UnauthorizedException with the specified detail message.
     *
     * @param message the detail message explaining why authorization failed
     */
    public UnauthorizedException(String message) {
        super(message);
    }

    /**
     * Constructs a new UnauthorizedException with the specified detail message and cause.
     *
     * @param message the detail message explaining why authorization failed
     * @param cause the underlying cause of the exception
     */
    public UnauthorizedException(String message, Throwable cause) {
        super(message, cause);
    }
}
