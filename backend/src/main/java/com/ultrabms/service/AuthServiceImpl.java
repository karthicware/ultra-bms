package com.ultrabms.service;

import com.ultrabms.dto.*;
import com.ultrabms.entity.AuditLog;
import com.ultrabms.entity.TokenBlacklist;
import com.ultrabms.entity.User;
import com.ultrabms.exception.AccountLockedException;
import com.ultrabms.exception.DuplicateResourceException;
import com.ultrabms.repository.AuditLogRepository;
import com.ultrabms.repository.TokenBlacklistRepository;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.Map;

/**
 * Implementation of AuthService for handling authentication operations.
 *
 * <p>Provides user registration, login with JWT token generation, token refresh,
 * and logout with token blacklisting. Includes rate limiting and account lockout
 * for security.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final TokenBlacklistRepository tokenBlacklistRepository;
    private final AuditLogRepository auditLogRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final LoginAttemptService loginAttemptService;
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UserDto register(RegisterRequest request, String ipAddress, String userAgent) {
        log.info("Registering new user with email: {}", request.email());

        // Check if email already exists
        if (userRepository.findByEmail(request.email()).isPresent()) {
            log.warn("Registration failed: Email already exists: {}", request.email());
            throw new DuplicateResourceException("Email address already exists: " + request.email());
        }

        // Create new user entity
        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setRole(request.role());
        user.setPhone(request.phone());
        user.setActive(true);
        user.setMfaEnabled(false);
        user.setAccountLocked(false);
        user.setFailedLoginAttempts(0);

        User savedUser = userRepository.save(user);
        log.info("User registered successfully: {} (ID: {})", savedUser.getEmail(), savedUser.getId());

        // Log registration event for audit trail
        logAuditEvent(savedUser.getId(), "REGISTRATION", ipAddress, userAgent,
                Map.of("email", savedUser.getEmail(), "role", savedUser.getRole().name()));

        return mapToUserDto(savedUser);
    }

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request, String ipAddress, String userAgent) {
        log.info("Login attempt for email: {}", request.email());

        // Check if email is rate-limited
        if (loginAttemptService.isBlocked(request.email())) {
            logAuditEvent(null, "LOGIN_FAILED", ipAddress, userAgent,
                    Map.of("email", request.email(), "reason", "Rate limited"));
            throw new AccountLockedException("Too many failed login attempts. Please try again later.");
        }

        // Find user by email
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> {
                    loginAttemptService.recordFailedAttempt(request.email());
                    logAuditEvent(null, "LOGIN_FAILED", ipAddress, userAgent,
                            Map.of("email", request.email(), "reason", "User not found"));
                    return new BadCredentialsException("Invalid email or password");
                });

        // Check if account is locked
        if (Boolean.TRUE.equals(user.getAccountLocked()) &&
                user.getLockedUntil() != null &&
                user.getLockedUntil().isAfter(LocalDateTime.now())) {
            log.warn("Login attempt for locked account: {}", user.getEmail());
            logAuditEvent(user.getId(), "LOGIN_FAILED", ipAddress, userAgent,
                    Map.of("reason", "Account locked", "lockedUntil", user.getLockedUntil().toString()));
            throw new AccountLockedException("Account is locked until " + user.getLockedUntil());
        }

        // Unlock account if lock period has expired
        if (Boolean.TRUE.equals(user.getAccountLocked()) &&
                user.getLockedUntil() != null &&
                user.getLockedUntil().isBefore(LocalDateTime.now())) {
            user.setAccountLocked(false);
            user.setLockedUntil(null);
            user.setFailedLoginAttempts(0);
            userRepository.save(user);
            log.info("Account automatically unlocked after lock period expired: {}", user.getEmail());
        }

        // Verify password
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            log.warn("Invalid password for user: {}", user.getEmail());

            // Increment failed attempts
            user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);

            // Lock account if 5 failures reached
            if (user.getFailedLoginAttempts() >= 5) {
                user.setAccountLocked(true);
                user.setLockedUntil(LocalDateTime.now().plusMinutes(30));
                log.warn("Account locked due to 5 failed attempts: {}", user.getEmail());
            }

            userRepository.save(user);
            loginAttemptService.recordFailedAttempt(request.email());

            logAuditEvent(user.getId(), "LOGIN_FAILED", ipAddress, userAgent,
                    Map.of("reason", "Invalid password", "failedAttempts", user.getFailedLoginAttempts()));

            throw new BadCredentialsException("Invalid email or password");
        }

        // Reset failed attempts on successful login
        user.setFailedLoginAttempts(0);
        user.setAccountLocked(false);
        user.setLockedUntil(null);
        userRepository.save(user);
        loginAttemptService.resetAttempts(request.email());

        // Generate JWT tokens
        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user);

        // Log successful login
        logAuditEvent(user.getId(), "LOGIN_SUCCESS", ipAddress, userAgent, null);

        log.info("User logged in successfully: {} (ID: {})", user.getEmail(), user.getId());

        return new LoginResponse(
                accessToken,
                refreshToken,
                3600L, // 1 hour in seconds
                mapToUserDto(user)
        );
    }

    @Override
    @Transactional
    public TokenResponse refreshAccessToken(String refreshToken, String ipAddress, String userAgent) {
        log.debug("Refreshing access token");

        // Validate refresh token
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            log.warn("Invalid or expired refresh token");
            throw new JwtException("Invalid or expired refresh token");
        }

        // Check if token is a refresh token
        if (!jwtTokenProvider.isRefreshToken(refreshToken)) {
            log.warn("Token is not a refresh token");
            throw new JwtException("Provided token is not a refresh token");
        }

        // Check if token is blacklisted
        String tokenHash = hashToken(refreshToken);
        if (tokenBlacklistRepository.existsByTokenHash(tokenHash)) {
            log.warn("Attempted to use blacklisted refresh token");
            throw new JwtException("Token has been revoked");
        }

        // Extract user ID and get user
        var userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new JwtException("User not found"));

        // Generate new access token
        String newAccessToken = jwtTokenProvider.generateAccessToken(user);

        // Log token refresh event for audit trail
        logAuditEvent(user.getId(), "TOKEN_REFRESH", ipAddress, userAgent,
                Map.of("email", user.getEmail()));

        log.debug("Access token refreshed for user: {}", user.getEmail());

        return new TokenResponse(newAccessToken, 3600L);
    }

    @Override
    @Transactional
    public void logout(String accessToken, String refreshToken) {
        log.info("Logout requested");

        try {
            // Blacklist access token
            if (accessToken != null && !accessToken.isBlank()) {
                blacklistToken(accessToken);
            }

            // Blacklist refresh token
            if (refreshToken != null && !refreshToken.isBlank()) {
                blacklistToken(refreshToken);
            }

            log.info("User logged out successfully");
        } catch (Exception e) {
            log.error("Error during logout", e);
            throw new RuntimeException("Logout failed", e);
        }
    }

    /**
     * Adds a token to the blacklist.
     *
     * @param token JWT token to blacklist
     */
    private void blacklistToken(String token) {
        try {
            // Extract expiration from token
            Date expiration = jwtTokenProvider.getExpirationFromToken(token);
            LocalDateTime expiresAt = expiration.toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDateTime();

            // Hash the token for storage
            String tokenHash = hashToken(token);

            // Check if already blacklisted
            if (!tokenBlacklistRepository.existsByTokenHash(tokenHash)) {
                TokenBlacklist blacklistEntry = new TokenBlacklist(tokenHash, expiresAt);
                tokenBlacklistRepository.save(blacklistEntry);
                log.debug("Token added to blacklist");
            }
        } catch (Exception e) {
            log.error("Failed to blacklist token", e);
        }
    }

    /**
     * Hashes a token using SHA-256.
     *
     * @param token token to hash
     * @return hashed token as hex string
     */
    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * Logs an authentication event to the audit log.
     *
     * @param userId user ID (null for failed attempts where user not found)
     * @param action action performed
     * @param ipAddress client IP address
     * @param userAgent client user agent
     * @param details additional details
     */
    private void logAuditEvent(java.util.UUID userId, String action, String ipAddress,
                                String userAgent, Map<String, Object> details) {
        try {
            AuditLog auditLog = new AuditLog(userId, action, ipAddress, userAgent, details);
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to log audit event", e);
        }
    }

    /**
     * Maps User entity to UserDto.
     *
     * @param user user entity
     * @return user DTO
     */
    private UserDto mapToUserDto(User user) {
        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                user.getActive(),
                user.getMfaEnabled(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
