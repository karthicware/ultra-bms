package com.ultrabms.exception;

/**
 * Exception thrown when attempting to create a resource that already exists.
 *
 * <p>This exception should be used when a unique constraint violation occurs,
 * such as attempting to create a user with an email address that already exists
 * in the database. The global exception handler will map this to HTTP 409 Conflict.</p>
 *
 * <p>Usage examples:</p>
 * <ul>
 *   <li>User with email already exists</li>
 *   <li>Property with name already exists</li>
 *   <li>Unit number already exists for a property</li>
 *   <li>Lease number already exists</li>
 * </ul>
 *
 * @see GlobalExceptionHandler
 */
public class DuplicateResourceException extends RuntimeException {

    private final String resourceType;
    private final String conflictField;
    private final Object conflictValue;

    /**
     * Constructs a new DuplicateResourceException with resource details.
     *
     * @param resourceType the type of resource (e.g., "User", "Property")
     * @param conflictField the field that caused the conflict (e.g., "email", "unitNumber")
     * @param conflictValue the value that caused the conflict
     */
    public DuplicateResourceException(String resourceType, String conflictField, Object conflictValue) {
        super(String.format("%s with %s '%s' already exists", resourceType, conflictField, conflictValue));
        this.resourceType = resourceType;
        this.conflictField = conflictField;
        this.conflictValue = conflictValue;
    }

    /**
     * Constructs a new DuplicateResourceException with a custom message.
     *
     * @param message the custom error message
     */
    public DuplicateResourceException(String message) {
        super(message);
        this.resourceType = null;
        this.conflictField = null;
        this.conflictValue = null;
    }

    /**
     * Gets the resource type.
     *
     * @return the resource type, or null if constructed with custom message
     */
    public String getResourceType() {
        return resourceType;
    }

    /**
     * Gets the conflict field name.
     *
     * @return the conflict field name, or null if constructed with custom message
     */
    public String getConflictField() {
        return conflictField;
    }

    /**
     * Gets the conflict value.
     *
     * @return the conflict value, or null if constructed with custom message
     */
    public Object getConflictValue() {
        return conflictValue;
    }
}
