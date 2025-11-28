package com.ultrabms.controller;

import com.ultrabms.dto.ForgotPasswordRequest;
import com.ultrabms.dto.LoginRequest;
import com.ultrabms.dto.LoginResponse;
import com.ultrabms.dto.RefreshTokenRequest;
import com.ultrabms.dto.RegisterRequest;
import com.ultrabms.dto.ResetPasswordRequest;
import com.ultrabms.dto.SuccessResponse;
import com.ultrabms.dto.TokenResponse;
import com.ultrabms.dto.UserDto;
import com.ultrabms.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for authentication endpoints.
 *
 * <p>
 * Provides endpoints for user registration, login, token refresh, and logout.
 * Implements JWT-based authentication with access and refresh tokens.
 * </p>
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Authentication and authorization endpoints")
public class AuthController {

    private static final String REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
    private static final int REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

    private final AuthService authService;
    private final com.ultrabms.service.PasswordResetService passwordResetService;
    private final com.ultrabms.service.SessionService sessionService;
    private final com.ultrabms.security.JwtTokenProvider jwtTokenProvider;
    private final com.ultrabms.repository.UserSessionRepository userSessionRepository;

    @Value("${cookie.secure:false}")
    private boolean cookieSecure;

    @Value("${cookie.same-site:None}")
    private String cookieSameSite;

    @Value("${cookie.http-only:true}")
    private boolean cookieHttpOnly;

    /**
     * Whether self-registration is enabled.
     * Story 2.6: Admin User Management - Admin creates all users, no self-registration.
     * Default is false (disabled).
     */
    @Value("${app.self-registration-enabled:false}")
    private boolean selfRegistrationEnabled;

    /**
     * Registers a new user in the system.
     * NOTE: This endpoint is disabled by default per Story 2.6 (Admin User Management).
     * Admin creates all users via /api/v1/admin/users endpoint.
     *
     * @param request registration request with user details
     * @return 201 Created with user DTO, or 403 Forbidden if self-registration is disabled
     */
    @PostMapping("/register")
    @Operation(summary = "Register new user", description = "Creates a new user account with email and password. Disabled by default - admin creates all users.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "User registered successfully", content = @Content(schema = @Schema(implementation = UserDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input or validation error"),
            @ApiResponse(responseCode = "403", description = "Self-registration is disabled"),
            @ApiResponse(responseCode = "409", description = "Email already exists")
    })
    public ResponseEntity<UserDto> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {

        // Check if self-registration is enabled (Story 2.6)
        if (!selfRegistrationEnabled) {
            log.warn("Self-registration attempt rejected (disabled): {}", request.email());
            throw new org.springframework.security.access.AccessDeniedException(
                    "Self-registration is disabled. Please contact an administrator to create your account.");
        }

        log.info("Registration request received for email: {}", request.email());

        // Extract IP address and user agent for audit logging
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        UserDto userDto = authService.register(request, ipAddress, userAgent);
        return ResponseEntity.status(HttpStatus.CREATED).body(userDto);
    }

    /**
     * Authenticates a user and issues JWT tokens.
     *
     * @param request      login request with email and password
     * @param httpRequest  HTTP servlet request for extracting IP and user agent
     * @param httpResponse HTTP servlet response for setting refresh token cookie
     * @return 200 OK with login response containing tokens and user profile
     */
    @PostMapping("/login")
    @Operation(summary = "Login user", description = "Authenticates user and returns JWT access and refresh tokens")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login successful", content = @Content(schema = @Schema(implementation = LoginResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid credentials"),
            @ApiResponse(responseCode = "423", description = "Account locked due to too many failed attempts")
    })
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        log.info("Login request received for email: {}", request.email());

        // Pass HTTP request to service for session creation
        LoginResponse response = authService.login(request, httpRequest);

        // Set refresh token as HTTP-only cookie
        setRefreshTokenCookie(httpResponse, response.refreshToken());

        log.info("Login successful for email: {}", request.email());
        return ResponseEntity.ok(response);
    }

    /**
     * Refreshes an access token using a valid refresh token.
     *
     * @param request     refresh token request (can be from body or cookie)
     * @param httpRequest HTTP servlet request for extracting refresh token from
     *                    cookie
     * @return 200 OK with new access token
     */
    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token", description = "Generates a new access token using a valid refresh token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Token refreshed successfully", content = @Content(schema = @Schema(implementation = TokenResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid or expired refresh token")
    })
    public ResponseEntity<TokenResponse> refreshToken(
            @RequestBody(required = false) RefreshTokenRequest request,
            HttpServletRequest httpRequest) {

        log.debug("Token refresh request received");

        // Get refresh token from request body or cookie
        String refreshToken = null;
        if (request != null && request.refreshToken() != null) {
            refreshToken = request.refreshToken();
        } else {
            refreshToken = getRefreshTokenFromCookie(httpRequest);
        }

        if (refreshToken == null || refreshToken.isBlank()) {
            log.warn("Refresh token not provided");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Extract IP address and user agent for audit logging
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        TokenResponse response = authService.refreshAccessToken(refreshToken, ipAddress, userAgent);
        return ResponseEntity.ok(response);
    }

    /**
     * Logs out a user by blacklisting their tokens.
     *
     * @param httpRequest  HTTP servlet request for extracting tokens
     * @param httpResponse HTTP servlet response for clearing refresh token cookie
     * @return 204 No Content
     */
    @PostMapping("/logout")
    @Operation(summary = "Logout user", description = "Invalidates user's tokens and logs them out")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Logout successful"),
            @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<Void> logout(
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        log.info("Logout request received");

        // Extract access token from Authorization header
        String accessToken = extractAccessToken(httpRequest);

        // Extract refresh token from cookie
        String refreshToken = getRefreshTokenFromCookie(httpRequest);

        // Perform logout
        authService.logout(accessToken, refreshToken);

        // Clear refresh token cookie
        clearRefreshTokenCookie(httpResponse);

        log.info("Logout successful");
        return ResponseEntity.noContent().build();
    }

    /**
     * Logs out user from all devices except the current one.
     * Invalidates all active sessions except the current session.
     *
     * @param httpRequest HTTP servlet request for extracting current access token
     * @return 200 OK with number of sessions revoked
     */
    @PostMapping("/logout-all")
    @Operation(summary = "Logout from all devices", description = "Invalidates all user sessions except the current one")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully logged out from all other devices"),
            @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<java.util.Map<String, Object>> logoutAllDevices(HttpServletRequest httpRequest) {
        log.info("Logout all devices request received");

        // Extract access token
        String accessToken = extractAccessToken(httpRequest);
        if (accessToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Get user ID from token
        java.util.UUID userId = jwtTokenProvider.getUserIdFromToken(accessToken);

        // Find current session ID
        String tokenHash = com.ultrabms.util.TokenHashUtil.hashToken(accessToken);
        String currentSessionId = userSessionRepository.findByAccessTokenHash(tokenHash)
                .map(com.ultrabms.entity.UserSession::getSessionId)
                .orElse(null);

        if (currentSessionId == null) {
            log.warn("Current session not found for logout-all request");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Revoke all sessions except current
        int revokedCount = sessionService.revokeAllUserSessionsExcept(userId, currentSessionId);

        log.info("Revoked {} sessions for user {}", revokedCount, userId);

        return ResponseEntity.ok(java.util.Map.of(
                "success", true,
                "message", String.format("Logged out from %d other device(s)", revokedCount),
                "revokedSessions", revokedCount));
    }

    /**
     * Initiates password reset workflow by sending reset email.
     * Always returns 200 OK for security (doesn't reveal if email exists).
     *
     * @param request     forgot password request with email address
     * @param httpRequest HTTP servlet request for extracting IP address
     * @return 200 OK with success message
     */
    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset", description = "Sends password reset email if account exists")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Reset link sent (if account exists)"),
            @ApiResponse(responseCode = "400", description = "Invalid email format"),
            @ApiResponse(responseCode = "429", description = "Too many reset attempts - rate limit exceeded")
    })
    public ResponseEntity<SuccessResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {

        log.info("Password reset requested for email: {}", request.email());

        String ipAddress = getClientIpAddress(httpRequest);

        passwordResetService.initiatePasswordReset(request.email(), ipAddress);

        // Always return success message (security: don't reveal if email exists)
        return ResponseEntity.ok(
                new SuccessResponse(
                        true,
                        "If your email is registered, you'll receive password reset instructions shortly."));
    }

    /**
     * Validates a password reset token.
     * Checks if token is valid, not expired, and not used.
     *
     * @param token The reset token to validate
     * @return 200 OK with validation result including remaining time
     */
    @GetMapping("/reset-password/validate")
    @Operation(summary = "Validate reset token", description = "Checks if password reset token is valid and returns remaining time")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Token is valid"),
            @ApiResponse(responseCode = "400", description = "Token is invalid, expired, or already used")
    })
    public ResponseEntity<com.ultrabms.service.PasswordResetService.TokenValidationResult> validateResetToken(
            @RequestParam("token") String token) {

        log.info("Token validation requested for token: {}...", token.substring(0, Math.min(10, token.length())));

        var result = passwordResetService.validateResetToken(token);

        log.info("Token validation successful: {} minutes remaining", result.remainingMinutes());
        return ResponseEntity.ok(result);
    }

    /**
     * Completes password reset by setting new password.
     * Validates token and password, updates password, invalidates tokens, sends
     * confirmation.
     *
     * @param request     Reset password request with token and new password
     * @param httpRequest HTTP servlet request for extracting IP address
     * @return 200 OK with success message
     */
    @PostMapping("/reset-password")
    @Operation(summary = "Reset password", description = "Completes password reset with new password")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Password reset successful"),
            @ApiResponse(responseCode = "400", description = "Invalid token or weak password")
    })
    public ResponseEntity<SuccessResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletRequest httpRequest) {

        log.info("Password reset completion requested");

        String ipAddress = getClientIpAddress(httpRequest);

        passwordResetService.resetPassword(request.token(), request.newPassword(), ipAddress);

        return ResponseEntity.ok(
                new SuccessResponse(
                        true,
                        "Password reset successful. You can now log in with your new password."));
    }

    /**
     * Extracts the client's IP address from the HTTP request.
     *
     * @param request HTTP servlet request
     * @return client's IP address
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Extracts the access token from the Authorization header.
     *
     * @param request HTTP servlet request
     * @return access token or null if not present
     */
    private String extractAccessToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }

    /**
     * Gets the refresh token from the HTTP-only cookie.
     *
     * @param request HTTP servlet request
     * @return refresh token or null if not present
     */
    private String getRefreshTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (REFRESH_TOKEN_COOKIE_NAME.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    /**
     * Sets the refresh token as an HTTP-only secure cookie.
     *
     * @param response     HTTP servlet response
     * @param refreshToken refresh token value
     */
    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken);
        cookie.setHttpOnly(cookieHttpOnly); // Environment-specific: false for dev/E2E tests, true for prod
        cookie.setSecure(cookieSecure); // Environment-specific: false for dev, true for prod
        cookie.setPath("/"); // Set path to root so cookie is sent with all API requests
        cookie.setDomain("localhost"); // Set domain to localhost (without port) to share across ports in development
        cookie.setMaxAge(REFRESH_TOKEN_MAX_AGE);
        cookie.setAttribute("SameSite", cookieSameSite); // Environment-specific: None for dev (cross-origin), Strict
                                                         // for prod
        response.addCookie(cookie);
    }

    /**
     * Clears the refresh token cookie.
     *
     * @param response HTTP servlet response
     */
    private void clearRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE_NAME, "");
        cookie.setHttpOnly(cookieHttpOnly);
        cookie.setSecure(cookieSecure); // Environment-specific: false for dev, true for prod
        cookie.setPath("/"); // Must match the path used when setting the cookie
        cookie.setDomain("localhost"); // Must match the domain used when setting the cookie
        cookie.setMaxAge(0); // Expire immediately
        cookie.setAttribute("SameSite", cookieSameSite); // Must match SameSite used when setting the cookie
        response.addCookie(cookie);
    }
}
