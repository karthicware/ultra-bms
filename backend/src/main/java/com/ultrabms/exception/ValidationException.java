package com.ultrabms.exception;

/**
 * Exception thrown when business validation rules are violated.
 *
 * <p>This exception should be used for business logic validation failures that
 * go beyond simple field validation. It represents situations where the request
 * is syntactically correct but violates business rules. The global exception
 * handler will map this to HTTP 400 Bad Request.</p>
 *
 * <p>Usage examples:</p>
 * <ul>
 *   <li>Lease end date is before start date</li>
 *   <li>Payment amount exceeds invoice total</li>
 *   <li>PDC deposit date is in the past</li>
 *   <li>Work order assignment to inactive vendor</li>
 *   <li>Unit status change not allowed (e.g., OCCUPIED to AVAILABLE with active lease)</li>
 * </ul>
 *
 * <p>Note: For simple field validation (e.g., @NotNull, @Email, @Size), use
 * Bean Validation annotations instead. Those will be caught by
 * MethodArgumentNotValidException handler.</p>
 *
 * @see GlobalExceptionHandler
 */
public class ValidationException extends RuntimeException {

    private final String field;
    private final Object rejectedValue;

    /**
     * Constructs a new ValidationException with field details.
     *
     * @param message the validation error message
     * @param field the field name that failed validation
     * @param rejectedValue the value that was rejected
     */
    public ValidationException(String message, String field, Object rejectedValue) {
        super(message);
        this.field = field;
        this.rejectedValue = rejectedValue;
    }

    /**
     * Constructs a new ValidationException with a simple message.
     *
     * @param message the validation error message
     */
    public ValidationException(String message) {
        super(message);
        this.field = null;
        this.rejectedValue = null;
    }

    /**
     * Gets the field that failed validation.
     *
     * @return the field name, or null if not specified
     */
    public String getField() {
        return field;
    }

    /**
     * Gets the rejected value.
     *
     * @return the rejected value, or null if not specified
     */
    public Object getRejectedValue() {
        return rejectedValue;
    }
}
