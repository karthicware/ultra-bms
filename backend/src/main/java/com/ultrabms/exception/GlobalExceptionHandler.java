package com.ultrabms.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Global exception handler for all REST API endpoints.
 *
 * <p>This class provides centralized exception handling using Spring's
 * {@code @RestControllerAdvice} annotation. It maps exceptions to appropriate
 * HTTP status codes and returns standardized error responses with correlation IDs.</p>
 *
 * <p>Handled exceptions:</p>
 * <ul>
 *   <li>{@link EntityNotFoundException} → 404 Not Found</li>
 *   <li>{@link DuplicateResourceException} → 409 Conflict</li>
 *   <li>{@link ValidationException} → 400 Bad Request</li>
 *   <li>{@link MethodArgumentNotValidException} → 400 Bad Request (with field errors)</li>
 *   <li>{@link ConstraintViolationException} → 400 Bad Request</li>
 *   <li>{@link UnauthorizedException} → 403 Forbidden</li>
 *   <li>{@link AccessDeniedException} → 403 Forbidden</li>
 *   <li>{@link AuthenticationException} → 401 Unauthorized</li>
 *   <li>{@link Exception} → 500 Internal Server Error</li>
 * </ul>
 *
 * @see ErrorResponse
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handles EntityNotFoundException (404 Not Found).
     *
     * @param ex the exception
     * @param request the HTTP request
     * @return 404 response with error details
     */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFoundException(
            EntityNotFoundException ex,
            HttpServletRequest request) {

        String requestId = generateRequestId();
        log.warn("Entity not found [requestId={}]: {}", requestId, ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.NOT_FOUND.value(),
                HttpStatus.NOT_FOUND.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI(),
                requestId
        );

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(errorResponse);
    }

    /**
     * Handles DuplicateResourceException (409 Conflict).
     *
     * @param ex the exception
     * @param request the HTTP request
     * @return 409 response with error details
     */
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResourceException(
            DuplicateResourceException ex,
            HttpServletRequest request) {

        String requestId = generateRequestId();
        log.warn("Duplicate resource [requestId={}]: {}", requestId, ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.CONFLICT.value(),
                HttpStatus.CONFLICT.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI(),
                requestId
        );

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(errorResponse);
    }

    /**
     * Handles ValidationException (400 Bad Request).
     *
     * @param ex the exception
     * @param request the HTTP request
     * @return 400 response with error details
     */
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            ValidationException ex,
            HttpServletRequest request) {

        String requestId = generateRequestId();
        log.warn("Validation failed [requestId={}]: {}", requestId, ex.getMessage());

        List<ErrorResponse.FieldError> fieldErrors = null;
        if (ex.getField() != null) {
            fieldErrors = List.of(ErrorResponse.FieldError.of(ex.getField(), ex.getMessage()));
        }

        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI(),
                requestId,
                fieldErrors
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(errorResponse);
    }

    /**
     * Handles MethodArgumentNotValidException (400 Bad Request with field-level errors).
     *
     * <p>This exception is thrown when {@code @Valid} annotation triggers validation failures
     * on request body objects.</p>
     *
     * @param ex the exception
     * @param request the HTTP request
     * @return 400 response with field-level validation errors
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        String requestId = generateRequestId();
        log.warn("Request validation failed [requestId={}]: {} validation errors",
                requestId, ex.getBindingResult().getErrorCount());

        List<ErrorResponse.FieldError> fieldErrors = ex.getBindingResult()
                .getAllErrors()
                .stream()
                .map(error -> {
                    String fieldName = ((FieldError) error).getField();
                    String errorMessage = error.getDefaultMessage();
                    Object rejectedValue = ((FieldError) error).getRejectedValue();
                    return new ErrorResponse.FieldError(fieldName, errorMessage, rejectedValue);
                })
                .collect(Collectors.toList());

        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "Validation failed for request body",
                request.getRequestURI(),
                requestId,
                fieldErrors
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(errorResponse);
    }

    /**
     * Handles ConstraintViolationException (400 Bad Request).
     *
     * <p>This exception is thrown when Bean Validation constraints are violated
     * on method parameters (e.g., {@code @PathVariable}, {@code @RequestParam}).</p>
     *
     * @param ex the exception
     * @param request the HTTP request
     * @return 400 response with validation errors
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolationException(
            ConstraintViolationException ex,
            HttpServletRequest request) {

        String requestId = generateRequestId();
        log.warn("Constraint violation [requestId={}]: {}", requestId, ex.getMessage());

        List<ErrorResponse.FieldError> fieldErrors = ex.getConstraintViolations()
                .stream()
                .map(violation -> ErrorResponse.FieldError.of(
                        violation.getPropertyPath().toString(),
                        violation.getMessage()
                ))
                .collect(Collectors.toList());

        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "Constraint violation on request parameters",
                request.getRequestURI(),
                requestId,
                fieldErrors
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(errorResponse);
    }

    /**
     * Handles UnauthorizedException (403 Forbidden).
     *
     * <p>This exception is thrown when a user attempts to access a resource
     * they don't have permission to access (e.g., tenant accessing another tenant's data).</p>
     *
     * @param ex the exception
     * @param request the HTTP request
     * @return 403 response with error details
     */
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorizedException(
            UnauthorizedException ex,
            HttpServletRequest request) {

        String requestId = generateRequestId();
        log.warn("Unauthorized access attempt [requestId={}]: {}", requestId, ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.FORBIDDEN.value(),
                HttpStatus.FORBIDDEN.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI(),
                requestId
        );

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(errorResponse);
    }

    /**
     * Handles AccessDeniedException (403 Forbidden).
     *
     * <p>This exception is thrown when a user attempts to access a resource
     * they don't have permission to access.</p>
     *
     * @param ex the exception
     * @param request the HTTP request
     * @return 403 response with error details
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(
            AccessDeniedException ex,
            HttpServletRequest request) {

        String requestId = generateRequestId();
        log.warn("Access denied [requestId={}]: {}", requestId, ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.FORBIDDEN.value(),
                HttpStatus.FORBIDDEN.getReasonPhrase(),
                "Access denied. You do not have permission to access this resource.",
                request.getRequestURI(),
                requestId
        );

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(errorResponse);
    }

    /**
     * Handles AuthenticationException (401 Unauthorized).
     *
     * <p>This exception is thrown when authentication credentials are invalid
     * or missing.</p>
     *
     * @param ex the exception
     * @param request the HTTP request
     * @return 401 response with error details
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(
            AuthenticationException ex,
            HttpServletRequest request) {

        String requestId = generateRequestId();
        log.warn("Authentication failed [requestId={}]: {}", requestId, ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.UNAUTHORIZED.value(),
                HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                "Authentication required. Please provide valid credentials.",
                request.getRequestURI(),
                requestId
        );

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(errorResponse);
    }

    /**
     * Handles AccountLockedException (423 Locked).
     *
     * <p>This exception is thrown when a user attempts to login with an account
     * that has been locked due to too many failed login attempts.</p>
     *
     * @param ex the exception
     * @param request the HTTP request
     * @return 423 response with error details
     */
    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<ErrorResponse> handleAccountLockedException(
            AccountLockedException ex,
            HttpServletRequest request) {

        String requestId = generateRequestId();
        log.warn("Account locked [requestId={}]: {}", requestId, ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.LOCKED.value(),
                HttpStatus.LOCKED.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI(),
                requestId
        );

        return ResponseEntity
                .status(HttpStatus.LOCKED)
                .body(errorResponse);
    }

    /**
     * Handles RateLimitExceededException (429 Too Many Requests).
     *
     * <p>This exception is thrown when rate limiting is exceeded for operations
     * such as password reset requests (max 3 per hour per email).</p>
     *
     * @param ex the exception
     * @param request the HTTP request
     * @return 429 response with error details and retry-after header
     */
    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ErrorResponse> handleRateLimitExceededException(
            RateLimitExceededException ex,
            HttpServletRequest request) {

        String requestId = generateRequestId();
        log.warn("Rate limit exceeded [requestId={}]: {}", requestId, ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.TOO_MANY_REQUESTS.value(),
                HttpStatus.TOO_MANY_REQUESTS.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI(),
                requestId
        );

        return ResponseEntity
                .status(HttpStatus.TOO_MANY_REQUESTS)
                .body(errorResponse);
    }

    /**
     * Handles InvalidTokenException (400 Bad Request).
     *
     * <p>This exception is thrown when a password reset token is invalid,
     * expired, or already used.</p>
     *
     * @param ex the exception
     * @param request the HTTP request
     * @return 400 response with error details
     */
    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<ErrorResponse> handleInvalidTokenException(
            InvalidTokenException ex,
            HttpServletRequest request) {

        String requestId = generateRequestId();
        log.warn("Invalid token [requestId={}]: {}", requestId, ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI(),
                requestId
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(errorResponse);
    }

    /**
     * Handles all unhandled exceptions (500 Internal Server Error).
     *
     * <p>This is the catch-all handler for unexpected errors. Stack traces are
     * logged but NOT exposed to clients to prevent information leakage.</p>
     *
     * @param ex the exception
     * @param request the HTTP request
     * @return 500 response with generic error message
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex,
            HttpServletRequest request) {

        String requestId = generateRequestId();
        log.error("Unhandled exception [requestId={}]: {}", requestId, ex.getMessage(), ex);

        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
                "An unexpected error occurred. Please contact support with request ID: " + requestId,
                request.getRequestURI(),
                requestId
        );

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorResponse);
    }

    /**
     * Generates a unique correlation ID for request tracing.
     *
     * <p>This UUID can be used to trace the request across logs and debugging tools.</p>
     *
     * @return a UUID string
     */
    private String generateRequestId() {
        return UUID.randomUUID().toString();
    }
}
