package com.ultrabms.controller;

import com.ultrabms.dto.*;
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
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for authentication endpoints.
 *
 * <p>Provides endpoints for user registration, login, token refresh, and logout.
 * Implements JWT-based authentication with access and refresh tokens.</p>
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

    @Value("${cookie.secure:false}")
    private boolean cookieSecure;

    /**
     * Registers a new user in the system.
     *
     * @param request registration request with user details
     * @return 201 Created with user DTO
     */
    @PostMapping("/register")
    @Operation(summary = "Register new user", description = "Creates a new user account with email and password")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "User registered successfully",
                    content = @Content(schema = @Schema(implementation = UserDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input or validation error"),
            @ApiResponse(responseCode = "409", description = "Email already exists")
    })
    public ResponseEntity<UserDto> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
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
     * @param request login request with email and password
     * @param httpRequest HTTP servlet request for extracting IP and user agent
     * @param httpResponse HTTP servlet response for setting refresh token cookie
     * @return 200 OK with login response containing tokens and user profile
     */
    @PostMapping("/login")
    @Operation(summary = "Login user", description = "Authenticates user and returns JWT access and refresh tokens")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login successful",
                    content = @Content(schema = @Schema(implementation = LoginResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid credentials"),
            @ApiResponse(responseCode = "423", description = "Account locked due to too many failed attempts")
    })
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        log.info("Login request received for email: {}", request.email());

        // Extract IP address and user agent
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        LoginResponse response = authService.login(request, ipAddress, userAgent);

        // Set refresh token as HTTP-only cookie
        setRefreshTokenCookie(httpResponse, response.refreshToken());

        log.info("Login successful for email: {}", request.email());
        return ResponseEntity.ok(response);
    }

    /**
     * Refreshes an access token using a valid refresh token.
     *
     * @param request refresh token request (can be from body or cookie)
     * @param httpRequest HTTP servlet request for extracting refresh token from cookie
     * @return 200 OK with new access token
     */
    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token", description = "Generates a new access token using a valid refresh token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Token refreshed successfully",
                    content = @Content(schema = @Schema(implementation = TokenResponse.class))),
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
     * @param httpRequest HTTP servlet request for extracting tokens
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
     * @param response HTTP servlet response
     * @param refreshToken refresh token value
     */
    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure); // Environment-specific: false for dev, true for prod
        cookie.setPath("/api/v1/auth");
        cookie.setMaxAge(REFRESH_TOKEN_MAX_AGE);
        cookie.setAttribute("SameSite", "Strict");
        response.addCookie(cookie);
    }

    /**
     * Clears the refresh token cookie.
     *
     * @param response HTTP servlet response
     */
    private void clearRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure); // Environment-specific: false for dev, true for prod
        cookie.setPath("/api/v1/auth");
        cookie.setMaxAge(0); // Expire immediately
        response.addCookie(cookie);
    }
}
