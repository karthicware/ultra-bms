package com.ultrabms.exception;

/**
 * Exception thrown when a requested resource is not found
 * Alias for EntityNotFoundException for backward compatibility
 */
public class ResourceNotFoundException extends EntityNotFoundException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String entityName, Object entityId) {
        super(entityName, entityId);
    }
}
