package com.ultrabms.service;

import com.ultrabms.entity.PasswordResetAttempt;
import com.ultrabms.entity.PasswordResetToken;
import com.ultrabms.entity.User;
import com.ultrabms.exception.RateLimitExceededException;
import com.ultrabms.repository.PasswordResetAttemptRepository;
import com.ultrabms.repository.PasswordResetTokenRepository;
import com.ultrabms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service for handling password reset operations.
 * Implements secure token generation, rate limiting, and email notifications.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordResetAttemptRepository passwordResetAttemptRepository;
    private final EmailService emailService;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final com.ultrabms.repository.AuditLogRepository auditLogRepository;

    private static final int TOKEN_EXPIRATION_MINUTES = 15;
    private static final int TOKEN_BYTES = 32; // 256 bits
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    /**
     * Initiates password reset process for the given email.
     * Implements rate limiting (3 requests per hour per email).
     * Always returns success for security (don't reveal account existence).
     *
     * @param email the user's email address
     * @param ipAddress the IP address of the requester (for audit logging)
     * @throws RateLimitExceededException if too many reset attempts in the last hour
     */
    @Transactional
    public void initiatePasswordReset(String email, String ipAddress) {
        log.info("Password reset requested for email: {} from IP: {}", email, ipAddress);

        // Check rate limiting
        checkRateLimit(email);

        // Find user by email (optional - don't fail if not exists for security)
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            log.info("Password reset requested for non-existent email: {}", email);
            // Still record attempt for rate limiting
            recordResetAttempt(email);
            // Return without error (security: don't reveal account existence)
            return;
        }

        User user = userOptional.get();

        // Check if user account is active
        if (Boolean.FALSE.equals(user.getActive())) {
            log.warn("Password reset requested for inactive user: {}", email);
            recordResetAttempt(email);
            return; // Don't reveal account status
        }

        // Invalidate all previous unused tokens for this user
        invalidatePreviousTokens(user);

        // Generate secure token
        String token = generateSecureToken();

        // Create and save password reset token
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setToken(token);
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(TOKEN_EXPIRATION_MINUTES));
        resetToken.setUsed(false);

        passwordResetTokenRepository.save(resetToken);

        log.info("Password reset token created for user ID: {}, expires at: {}",
                user.getId(), resetToken.getExpiresAt());

        // Send password reset email asynchronously
        emailService.sendPasswordResetEmail(user, token);

        // Record successful attempt for rate limiting
        recordResetAttempt(email);

        // Log password reset request to audit logs
        com.ultrabms.entity.AuditLog auditLog = new com.ultrabms.entity.AuditLog(
                user.getId(),
                "PASSWORD_RESET_REQUESTED",
                ipAddress,
                null, // User agent not available in this context
                java.util.Map.of("email", email)
        );
        auditLogRepository.save(auditLog);

        log.info("Password reset initiated for user: {} from IP: {}", email, ipAddress);
    }

    /**
     * Checks if rate limit has been exceeded for the given email.
     *
     * @param email the email to check
     * @throws RateLimitExceededException if too many attempts
     */
    private void checkRateLimit(String email) {
        Optional<PasswordResetAttempt> attemptOpt = passwordResetAttemptRepository.findByEmail(email);

        if (attemptOpt.isPresent()) {
            PasswordResetAttempt attempt = attemptOpt.get();

            // Check if rate limit window has expired
            if (attempt.isWindowExpired()) {
                // Window expired, will be reset when recording new attempt
                return;
            }

            // Check if limit exceeded
            if (attempt.isRateLimitExceeded()) {
                long minutesRemaining = attempt.getMinutesUntilReset();
                log.warn("Rate limit exceeded for email: {}, minutes remaining: {}", email, minutesRemaining);
                throw new RateLimitExceededException(
                        "Too many password reset attempts. Please try again in " + minutesRemaining + " minutes.");
            }
        }
    }

    /**
     * Records a password reset attempt for rate limiting.
     *
     * @param email the email to record attempt for
     */
    private void recordResetAttempt(String email) {
        Optional<PasswordResetAttempt> attemptOpt = passwordResetAttemptRepository.findByEmail(email);

        if (attemptOpt.isPresent()) {
            PasswordResetAttempt attempt = attemptOpt.get();

            // Check if window expired - reset counter
            if (attempt.isWindowExpired()) {
                attempt.setAttemptCount(1);
                attempt.setFirstAttemptAt(LocalDateTime.now());
            } else {
                // Increment attempt count
                attempt.setAttemptCount(attempt.getAttemptCount() + 1);
            }

            attempt.setLastAttemptAt(LocalDateTime.now());
            passwordResetAttemptRepository.save(attempt);
        } else {
            // Create new attempt record
            PasswordResetAttempt newAttempt = new PasswordResetAttempt();
            newAttempt.setEmail(email);
            newAttempt.setAttemptCount(1);
            newAttempt.setFirstAttemptAt(LocalDateTime.now());
            newAttempt.setLastAttemptAt(LocalDateTime.now());
            passwordResetAttemptRepository.save(newAttempt);
        }
    }

    /**
     * Invalidates all previous unused tokens for the user.
     *
     * @param user the user whose tokens to invalidate
     */
    private void invalidatePreviousTokens(User user) {
        var unusedTokens = passwordResetTokenRepository.findByUserIdAndUsedFalse(user.getId());

        if (!unusedTokens.isEmpty()) {
            unusedTokens.forEach(token -> token.setUsed(true));
            passwordResetTokenRepository.saveAll(unusedTokens);
            log.info("Invalidated {} unused tokens for user ID: {}", unusedTokens.size(), user.getId());
        }
    }

    /**
     * Generates a cryptographically secure random token.
     * Uses SecureRandom with 32 bytes (256 bits) entropy, hex-encoded to 64 characters.
     *
     * @return secure token string (64 hex characters)
     */
    private String generateSecureToken() {
        byte[] tokenBytes = new byte[TOKEN_BYTES];
        SECURE_RANDOM.nextBytes(tokenBytes);

        // Convert to hex string
        StringBuilder hexString = new StringBuilder();
        for (byte b : tokenBytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }

        return hexString.toString();
    }

    /**
     * Validates a password reset token.
     * Checks if token exists, is not used, and not expired.
     *
     * @param token the reset token to validate
     * @return TokenValidationResult with validity status and remaining time
     * @throws com.ultrabms.exception.InvalidTokenException if token is invalid, expired, or already used
     */
    public TokenValidationResult validateResetToken(String token) {
        log.info("Validating reset token: {}...", token.substring(0, Math.min(10, token.length())));

        // Find token in database
        Optional<PasswordResetToken> tokenOptional = passwordResetTokenRepository.findByToken(token);

        if (tokenOptional.isEmpty()) {
            log.warn("Token not found: {}...", token.substring(0, Math.min(10, token.length())));
            throw new com.ultrabms.exception.InvalidTokenException("Reset link is invalid or expired");
        }

        PasswordResetToken resetToken = tokenOptional.get();

        // Check if token has already been used
        if (Boolean.TRUE.equals(resetToken.getUsed())) {
            log.warn("Token already used: {}...", token.substring(0, Math.min(10, token.length())));
            throw new com.ultrabms.exception.InvalidTokenException("Reset link has already been used");
        }

        // Check if token is expired
        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.warn("Token expired: {}... (expired at: {})",
                    token.substring(0, Math.min(10, token.length())),
                    resetToken.getExpiresAt());
            throw new com.ultrabms.exception.InvalidTokenException("Reset link is expired");
        }

        // Calculate remaining minutes
        long remainingMinutes = java.time.Duration.between(
                LocalDateTime.now(),
                resetToken.getExpiresAt()
        ).toMinutes();

        log.info("Token valid: {} minutes remaining", remainingMinutes);

        return new TokenValidationResult(true, remainingMinutes);
    }

    /**
     * Result of token validation.
     * Contains validity status and remaining time until expiration.
     *
     * @param valid true if token is valid and can be used
     * @param remainingMinutes minutes remaining until token expires
     */
    public record TokenValidationResult(boolean valid, long remainingMinutes) { }

    /**
     * Completes password reset by validating token, updating password, and sending confirmation.
     * Invalidates all refresh tokens and marks reset token as used.
     *
     * @param token the reset token (64-character hex string)
     * @param newPassword the new password to set
     * @param ipAddress the IP address of the requester (for audit logging)
     * @throws com.ultrabms.exception.InvalidTokenException if token is invalid, expired, or already used
     * @throws com.ultrabms.exception.ValidationException if password doesn't meet strength requirements
     */
    @Transactional
    public void resetPassword(String token, String newPassword, String ipAddress) {
        log.info("Password reset completion requested from IP: {}", ipAddress);

        // Step 1: Validate token (throws InvalidTokenException if invalid)
        validateResetToken(token);

        // Step 2: Validate password strength
        com.ultrabms.util.PasswordValidator.ValidationResult validationResult =
                com.ultrabms.util.PasswordValidator.validate(newPassword);

        if (!validationResult.isValid()) {
            String errorMessage = validationResult.getErrorMessage();
            log.warn("Password reset failed - weak password: {}", errorMessage);
            throw new com.ultrabms.exception.ValidationException(errorMessage);
        }

        // Step 3: Find the password reset token entity
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new com.ultrabms.exception.InvalidTokenException("Reset link is invalid or expired"));

        User user = resetToken.getUser();

        // Step 4: Hash the new password with BCrypt
        String hashedPassword = passwordEncoder.encode(newPassword);

        // Step 5: Update user's password
        user.setPasswordHash(hashedPassword);
        userRepository.save(user);

        log.info("Password updated successfully for user ID: {}", user.getId());

        // Step 6: Mark token as used to prevent reuse
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        log.info("Reset token marked as used for user ID: {}", user.getId());

        // Step 7: Invalidate all refresh tokens for user
        // NOTE: The current architecture uses stateless JWT tokens without a refresh_tokens table.
        // Token invalidation on password reset would require implementing a refresh token tracking system
        // where active refresh tokens are stored in a database table and can be invalidated.
        // For now, users should re-login after password reset. Existing tokens will expire naturally.
        // Future enhancement: Implement RefreshToken entity/table for session tracking (Story 2.4+)
        log.info("Token invalidation not implemented - users should re-login after password reset");

        // Step 8: Log password reset completion to audit logs
        com.ultrabms.entity.AuditLog auditLog = new com.ultrabms.entity.AuditLog(
                user.getId(),
                "PASSWORD_RESET_COMPLETED",
                ipAddress,
                null, // User agent not available in this context
                java.util.Map.of("email", user.getEmail())
        );
        auditLogRepository.save(auditLog);

        // Step 9: Send password change confirmation email
        emailService.sendPasswordChangeConfirmation(user);

        log.info("Password reset completed successfully for user ID: {} from IP: {}", user.getId(), ipAddress);
    }
}
