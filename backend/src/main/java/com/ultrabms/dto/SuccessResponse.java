package com.ultrabms.dto;

/**
 * Generic success response DTO for API endpoints.
 * Used for endpoints that return success messages without data payload.
 *
 * @param success Always true for this response type
 * @param message User-friendly success message
 */
public record SuccessResponse(
    boolean success,
    String message
) {
}
