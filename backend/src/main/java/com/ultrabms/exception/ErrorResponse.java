package com.ultrabms.exception;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Standardized error response structure for all API errors.
 *
 * <p>This record provides a consistent error response format across the entire API,
 * including correlation IDs for request tracing and detailed error information.</p>
 *
 * <p>Fields:</p>
 * <ul>
 *   <li><strong>timestamp</strong>: When the error occurred (ISO-8601 format)</li>
 *   <li><strong>status</strong>: HTTP status code (e.g., 404, 400, 500)</li>
 *   <li><strong>error</strong>: HTTP status reason phrase (e.g., "Not Found", "Bad Request")</li>
 *   <li><strong>message</strong>: Human-readable error description</li>
 *   <li><strong>path</strong>: The requested URI path</li>
 *   <li><strong>requestId</strong>: UUID correlation ID for log tracing</li>
 *   <li><strong>errors</strong>: Optional list of field-level validation errors</li>
 * </ul>
 *
 * @param timestamp the timestamp when the error occurred
 * @param status the HTTP status code
 * @param error the HTTP status reason phrase
 * @param message the user-friendly error message
 * @param path the request path that caused the error
 * @param requestId the correlation UUID for request tracing
 * @param errors optional list of field-level validation errors (for 400 Bad Request)
 */
public record ErrorResponse(
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        String path,
        String requestId,
        List<FieldError> errors
) {

    /**
     * Creates an ErrorResponse without field-level errors.
     *
     * @param status the HTTP status code
     * @param error the HTTP status reason phrase
     * @param message the error message
     * @param path the request path
     * @param requestId the correlation ID
     * @return a new ErrorResponse instance
     */
    public static ErrorResponse of(int status, String error, String message, String path, String requestId) {
        return new ErrorResponse(
                LocalDateTime.now(),
                status,
                error,
                message,
                path,
                requestId,
                null
        );
    }

    /**
     * Creates an ErrorResponse with field-level validation errors.
     *
     * @param status the HTTP status code
     * @param error the HTTP status reason phrase
     * @param message the error message
     * @param path the request path
     * @param requestId the correlation ID
     * @param errors the list of field-level errors
     * @return a new ErrorResponse instance
     */
    public static ErrorResponse of(int status, String error, String message, String path, String requestId, List<FieldError> errors) {
        return new ErrorResponse(
                LocalDateTime.now(),
                status,
                error,
                message,
                path,
                requestId,
                errors
        );
    }

    /**
     * Represents a field-level validation error.
     *
     * @param field the field name that failed validation
     * @param error the validation error message
     * @param rejectedValue the value that was rejected (optional)
     */
    public record FieldError(
            String field,
            String error,
            Object rejectedValue
    ) {
        /**
         * Creates a FieldError without rejected value.
         *
         * @param field the field name
         * @param error the error message
         * @return a new FieldError instance
         */
        public static FieldError of(String field, String error) {
            return new FieldError(field, error, null);
        }
    }
}
