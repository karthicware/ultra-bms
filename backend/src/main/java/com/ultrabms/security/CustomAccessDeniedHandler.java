package com.ultrabms.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ultrabms.exception.ErrorResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Custom access denied handler to handle 403 Forbidden errors.
 * Returns JSON error response when user lacks required permissions.
 */
@Component
@RequiredArgsConstructor
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    @Override
    public void handle(HttpServletRequest request,
                      HttpServletResponse response,
                      AccessDeniedException accessDeniedException) throws IOException, ServletException {

        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        String message = "Access denied: You do not have permission to access this resource";

        // Include the specific permission requirement if available
        if (accessDeniedException.getMessage() != null && !accessDeniedException.getMessage().isEmpty()) {
            message = "Access denied: " + accessDeniedException.getMessage();
        }

        ErrorResponse errorResponse = ErrorResponse.of(
            HttpStatus.FORBIDDEN.value(),
            HttpStatus.FORBIDDEN.getReasonPhrase(),
            message,
            request.getRequestURI(),
            null // requestId will be null for access denied failures
        );

        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }
}
