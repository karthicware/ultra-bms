package com.ultrabms.exception;

import java.util.UUID;

/**
 * Exception thrown when a requested entity cannot be found in the database.
 *
 * <p>This exception should be used when a user requests a specific resource by ID
 * (e.g., GET /api/v1/users/{id}) and the resource does not exist. The global
 * exception handler will map this to HTTP 404 Not Found.</p>
 *
 * <p>Usage examples:</p>
 * <ul>
 *   <li>User not found by ID</li>
 *   <li>Property not found by ID</li>
 *   <li>Tenant not found by ID</li>
 * </ul>
 *
 * @see GlobalExceptionHandler
 */
public class EntityNotFoundException extends RuntimeException {

    private final String entityName;
    private final Object entityId;

    /**
     * Constructs a new EntityNotFoundException with entity name and ID.
     *
     * @param entityName the name of the entity type (e.g., "User", "Property")
     * @param entityId the ID of the entity that was not found (UUID or Long)
     */
    public EntityNotFoundException(String entityName, Object entityId) {
        super(String.format("%s with id %s not found", entityName, entityId));
        this.entityName = entityName;
        this.entityId = entityId;
    }

    /**
     * Constructs a new EntityNotFoundException with a custom message.
     *
     * @param message the custom error message
     */
    public EntityNotFoundException(String message) {
        super(message);
        this.entityName = null;
        this.entityId = null;
    }

    /**
     * Gets the entity name.
     *
     * @return the entity name, or null if constructed with custom message
     */
    public String getEntityName() {
        return entityName;
    }

    /**
     * Gets the entity ID.
     *
     * @return the entity ID, or null if constructed with custom message
     */
    public Object getEntityId() {
        return entityId;
    }
}
