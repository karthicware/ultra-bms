package com.ultrabms.service;

import com.ultrabms.dto.LoginRequest;
import com.ultrabms.dto.LoginResponse;
import com.ultrabms.dto.RegisterRequest;
import com.ultrabms.dto.TokenResponse;
import com.ultrabms.dto.UserDto;

/**
 * Service interface for authentication operations.
 *
 * <p>Provides methods for user registration, login, token refresh, and logout.</p>
 */
public interface AuthService {

    /**
     * Registers a new user in the system.
     *
     * <p>Validates password strength, checks for duplicate email, hashes password with BCrypt,
     * creates the user account, and logs the registration event.</p>
     *
     * @param request registration request with user details
     * @param ipAddress client's IP address for audit logging
     * @param userAgent client's user agent for audit logging
     * @return user DTO (excluding password)
     * @throws com.ultrabms.exception.DuplicateResourceException if email already exists
     * @throws com.ultrabms.exception.ValidationException if password validation fails
     */
    UserDto register(RegisterRequest request, String ipAddress, String userAgent);

    /**
     * Authenticates a user and issues JWT tokens.
     *
     * <p>Verifies credentials, checks account lockout status, generates tokens,
     * creates a session, and logs the authentication event.</p>
     *
     * @param request login request with email and password
     * @param httpRequest HTTP servlet request for extracting IP, user agent, and session metadata
     * @return login response with access token, refresh token, and user profile
     * @throws org.springframework.security.core.AuthenticationException if credentials are invalid
     * @throws com.ultrabms.exception.AccountLockedException if account is locked
     */
    LoginResponse login(LoginRequest request, jakarta.servlet.http.HttpServletRequest httpRequest);

    /**
     * Refreshes an access token using a valid refresh token.
     *
     * <p>Validates the refresh token, checks if it's blacklisted, generates a new access token,
     * and logs the token refresh event.</p>
     *
     * @param refreshToken JWT refresh token
     * @param ipAddress client's IP address for audit logging
     * @param userAgent client's user agent for audit logging
     * @return token response with new access token
     * @throws io.jsonwebtoken.JwtException if token is invalid or expired
     */
    TokenResponse refreshAccessToken(String refreshToken, String ipAddress, String userAgent);

    /**
     * Logs out a user by blacklisting their tokens.
     *
     * <p>Adds both access and refresh tokens to the blacklist to prevent reuse.</p>
     *
     * @param accessToken JWT access token
     * @param refreshToken JWT refresh token
     */
    void logout(String accessToken, String refreshToken);
}
