package com.ultrabms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Standard API response wrapper
 * Provides consistent response format across all API endpoints
 *
 * @param <T> Type of data being returned
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

    /**
     * Indicates if the request was successful
     */
    private boolean success;

    /**
     * Response data (null if error)
     */
    private T data;

    /**
     * Message describing the result
     */
    private String message;

    /**
     * Timestamp of the response
     */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    /**
     * Create a successful response with data and message
     *
     * @param data Response data
     * @param message Success message
     * @param <T> Type of data
     * @return ApiResponse with success=true
     */
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Create a successful response with data only
     *
     * @param data Response data
     * @param <T> Type of data
     * @return ApiResponse with success=true
     */
    public static <T> ApiResponse<T> success(T data) {
        return success(data, "Success");
    }

    /**
     * Create an error response with message
     *
     * @param message Error message
     * @param <T> Type of data
     * @return ApiResponse with success=false
     */
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .data(null)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
