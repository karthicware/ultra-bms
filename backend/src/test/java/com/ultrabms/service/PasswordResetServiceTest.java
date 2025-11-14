package com.ultrabms.service;

import com.ultrabms.entity.PasswordResetAttempt;
import com.ultrabms.entity.PasswordResetToken;
import com.ultrabms.entity.User;
import com.ultrabms.exception.RateLimitExceededException;
import com.ultrabms.repository.PasswordResetAttemptRepository;
import com.ultrabms.repository.PasswordResetTokenRepository;
import com.ultrabms.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for PasswordResetService.
 * Tests token generation, rate limiting, and password reset initiation logic.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PasswordResetService Tests")
class PasswordResetServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PasswordResetAttemptRepository passwordResetAttemptRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Mock
    private com.ultrabms.repository.AuditLogRepository auditLogRepository;

    @InjectMocks
    private PasswordResetService passwordResetService;

    private User testUser;
    private String testEmail = "test@example.com";
    private String testIpAddress = "192.168.1.1";

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail(testEmail);
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setActive(Boolean.TRUE);
    }

    @Test
    @DisplayName("Should successfully initiate password reset for valid email")
    void testInitiatePasswordReset_Success() {
        // Arrange
        when(passwordResetAttemptRepository.findByEmail(testEmail))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmail(testEmail))
                .thenReturn(Optional.of(testUser));
        when(passwordResetTokenRepository.findByUserIdAndUsedFalse(testUser.getId()))
                .thenReturn(new ArrayList<>());
        when(passwordResetTokenRepository.save(any(PasswordResetToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(passwordResetAttemptRepository.save(any(PasswordResetAttempt.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        passwordResetService.initiatePasswordReset(testEmail, testIpAddress);

        // Assert
        verify(userRepository).findByEmail(testEmail);
        verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
        verify(emailService).sendPasswordResetEmail(eq(testUser), anyString());
        verify(passwordResetAttemptRepository).save(any(PasswordResetAttempt.class));
    }

    @Test
    @DisplayName("Should generate secure token with 64 hex characters")
    void testTokenGeneration() {
        // Arrange
        when(passwordResetAttemptRepository.findByEmail(testEmail))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmail(testEmail))
                .thenReturn(Optional.of(testUser));
        when(passwordResetTokenRepository.findByUserIdAndUsedFalse(testUser.getId()))
                .thenReturn(new ArrayList<>());
        when(passwordResetAttemptRepository.save(any(PasswordResetAttempt.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        when(passwordResetTokenRepository.save(tokenCaptor.capture()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        passwordResetService.initiatePasswordReset(testEmail, testIpAddress);

        // Assert
        PasswordResetToken savedToken = tokenCaptor.getValue();
        assertNotNull(savedToken.getToken(), "Token should not be null");
        assertEquals(64, savedToken.getToken().length(), "Token should be 64 characters (32 bytes hex-encoded)");
        assertTrue(savedToken.getToken().matches("[0-9a-f]{64}"), "Token should be valid hex string");
    }

    @Test
    @DisplayName("Should set token expiration to 15 minutes from now")
    void testTokenExpiration() {
        // Arrange
        when(passwordResetAttemptRepository.findByEmail(testEmail))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmail(testEmail))
                .thenReturn(Optional.of(testUser));
        when(passwordResetTokenRepository.findByUserIdAndUsedFalse(testUser.getId()))
                .thenReturn(new ArrayList<>());
        when(passwordResetAttemptRepository.save(any(PasswordResetAttempt.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        when(passwordResetTokenRepository.save(tokenCaptor.capture()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        LocalDateTime beforeCall = LocalDateTime.now();
        passwordResetService.initiatePasswordReset(testEmail, testIpAddress);
        LocalDateTime afterCall = LocalDateTime.now();

        // Assert
        PasswordResetToken savedToken = tokenCaptor.getValue();
        LocalDateTime expectedExpiry = beforeCall.plusMinutes(15);
        LocalDateTime maxExpectedExpiry = afterCall.plusMinutes(15);

        assertTrue(savedToken.getExpiresAt().isAfter(expectedExpiry.minusSeconds(1)),
                "Expiry should be approximately 15 minutes from now");
        assertTrue(savedToken.getExpiresAt().isBefore(maxExpectedExpiry.plusSeconds(1)),
                "Expiry should be approximately 15 minutes from now");
    }

    @Test
    @DisplayName("Should not reveal if email doesn't exist (security)")
    void testInitiatePasswordReset_NonExistentEmail() {
        // Arrange
        when(passwordResetAttemptRepository.findByEmail(testEmail))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmail(testEmail))
                .thenReturn(Optional.empty());
        when(passwordResetAttemptRepository.save(any(PasswordResetAttempt.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        passwordResetService.initiatePasswordReset(testEmail, testIpAddress);

        // Assert
        verify(userRepository).findByEmail(testEmail);
        verify(passwordResetTokenRepository, never()).save(any(PasswordResetToken.class));
        verify(emailService, never()).sendPasswordResetEmail(any(), any());
        verify(passwordResetAttemptRepository).save(any(PasswordResetAttempt.class)); // Still record attempt
    }

    @Test
    @DisplayName("Should not create token for inactive user")
    void testInitiatePasswordReset_InactiveUser() {
        // Arrange
        testUser.setActive(Boolean.FALSE);
        when(passwordResetAttemptRepository.findByEmail(testEmail))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmail(testEmail))
                .thenReturn(Optional.of(testUser));
        when(passwordResetAttemptRepository.save(any(PasswordResetAttempt.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        passwordResetService.initiatePasswordReset(testEmail, testIpAddress);

        // Assert
        verify(passwordResetTokenRepository, never()).save(any(PasswordResetToken.class));
        verify(emailService, never()).sendPasswordResetEmail(any(), any());
    }

    @Test
    @DisplayName("Should invalidate previous unused tokens when creating new one")
    void testInvalidatePreviousTokens() {
        // Arrange
        PasswordResetToken oldToken1 = new PasswordResetToken();
        oldToken1.setUsed(false);
        PasswordResetToken oldToken2 = new PasswordResetToken();
        oldToken2.setUsed(false);
        List<PasswordResetToken> oldTokens = List.of(oldToken1, oldToken2);

        when(passwordResetAttemptRepository.findByEmail(testEmail))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmail(testEmail))
                .thenReturn(Optional.of(testUser));
        when(passwordResetTokenRepository.findByUserIdAndUsedFalse(testUser.getId()))
                .thenReturn(oldTokens);
        when(passwordResetTokenRepository.save(any(PasswordResetToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(passwordResetAttemptRepository.save(any(PasswordResetAttempt.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        passwordResetService.initiatePasswordReset(testEmail, testIpAddress);

        // Assert
        verify(passwordResetTokenRepository).saveAll(oldTokens);
        assertTrue(oldToken1.getUsed(), "Old token 1 should be marked as used");
        assertTrue(oldToken2.getUsed(), "Old token 2 should be marked as used");
    }

    @Test
    @DisplayName("Should throw RateLimitExceededException after 3 attempts in 1 hour")
    void testRateLimitExceeded() {
        // Arrange
        PasswordResetAttempt existingAttempt = new PasswordResetAttempt();
        existingAttempt.setEmail(testEmail);
        existingAttempt.setAttemptCount(3);
        existingAttempt.setFirstAttemptAt(LocalDateTime.now().minusMinutes(30)); // Within 1-hour window
        existingAttempt.setLastAttemptAt(LocalDateTime.now().minusMinutes(5));

        when(passwordResetAttemptRepository.findByEmail(testEmail))
                .thenReturn(Optional.of(existingAttempt));

        // Act & Assert
        RateLimitExceededException exception = assertThrows(
                RateLimitExceededException.class,
                () -> passwordResetService.initiatePasswordReset(testEmail, testIpAddress),
                "Should throw RateLimitExceededException"
        );

        assertTrue(exception.getMessage().contains("Too many password reset attempts"),
                "Exception message should mention rate limit");
        verify(userRepository, never()).findByEmail(any());
        verify(passwordResetTokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should allow reset after 1-hour window expires")
    void testRateLimitReset() {
        // Arrange
        PasswordResetAttempt expiredAttempt = new PasswordResetAttempt();
        expiredAttempt.setEmail(testEmail);
        expiredAttempt.setAttemptCount(3);
        expiredAttempt.setFirstAttemptAt(LocalDateTime.now().minusHours(2)); // Window expired
        expiredAttempt.setLastAttemptAt(LocalDateTime.now().minusHours(1));

        when(passwordResetAttemptRepository.findByEmail(testEmail))
                .thenReturn(Optional.of(expiredAttempt));
        when(userRepository.findByEmail(testEmail))
                .thenReturn(Optional.of(testUser));
        when(passwordResetTokenRepository.findByUserIdAndUsedFalse(testUser.getId()))
                .thenReturn(new ArrayList<>());
        when(passwordResetAttemptRepository.save(any(PasswordResetAttempt.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(passwordResetTokenRepository.save(any(PasswordResetToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        passwordResetService.initiatePasswordReset(testEmail, testIpAddress);

        // Assert
        verify(userRepository).findByEmail(testEmail);
        verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
        verify(emailService).sendPasswordResetEmail(eq(testUser), anyString());
    }

    @Test
    @DisplayName("Should increment attempt count for subsequent requests")
    void testIncrementAttemptCount() {
        // Arrange
        PasswordResetAttempt existingAttempt = new PasswordResetAttempt();
        existingAttempt.setEmail(testEmail);
        existingAttempt.setAttemptCount(1);
        existingAttempt.setFirstAttemptAt(LocalDateTime.now().minusMinutes(10));
        existingAttempt.setLastAttemptAt(LocalDateTime.now().minusMinutes(10));

        when(passwordResetAttemptRepository.findByEmail(testEmail))
                .thenReturn(Optional.of(existingAttempt));
        when(userRepository.findByEmail(testEmail))
                .thenReturn(Optional.of(testUser));
        when(passwordResetTokenRepository.findByUserIdAndUsedFalse(testUser.getId()))
                .thenReturn(new ArrayList<>());
        when(passwordResetTokenRepository.save(any(PasswordResetToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ArgumentCaptor<PasswordResetAttempt> attemptCaptor = ArgumentCaptor.forClass(PasswordResetAttempt.class);
        when(passwordResetAttemptRepository.save(attemptCaptor.capture()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        passwordResetService.initiatePasswordReset(testEmail, testIpAddress);

        // Assert
        PasswordResetAttempt savedAttempt = attemptCaptor.getValue();
        assertEquals(2, savedAttempt.getAttemptCount(), "Attempt count should be incremented to 2");
    }

    @Test
    @DisplayName("Should create new attempt record for first request")
    void testCreateNewAttemptRecord() {
        // Arrange
        when(passwordResetAttemptRepository.findByEmail(testEmail))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmail(testEmail))
                .thenReturn(Optional.of(testUser));
        when(passwordResetTokenRepository.findByUserIdAndUsedFalse(testUser.getId()))
                .thenReturn(new ArrayList<>());
        when(passwordResetTokenRepository.save(any(PasswordResetToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ArgumentCaptor<PasswordResetAttempt> attemptCaptor = ArgumentCaptor.forClass(PasswordResetAttempt.class);
        when(passwordResetAttemptRepository.save(attemptCaptor.capture()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        passwordResetService.initiatePasswordReset(testEmail, testIpAddress);

        // Assert
        PasswordResetAttempt savedAttempt = attemptCaptor.getValue();
        assertEquals(testEmail, savedAttempt.getEmail(), "Email should match");
        assertEquals(1, savedAttempt.getAttemptCount(), "Attempt count should be 1 for new record");
        assertNotNull(savedAttempt.getFirstAttemptAt(), "First attempt timestamp should be set");
        assertNotNull(savedAttempt.getLastAttemptAt(), "Last attempt timestamp should be set");
    }

    @Test
    @DisplayName("Should generate unique tokens for multiple requests")
    void testUniqueTokenGeneration() {
        // Arrange
        when(passwordResetAttemptRepository.findByEmail(anyString()))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmail(anyString()))
                .thenReturn(Optional.of(testUser));
        when(passwordResetTokenRepository.findByUserIdAndUsedFalse(any()))
                .thenReturn(new ArrayList<>());
        when(passwordResetAttemptRepository.save(any(PasswordResetAttempt.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        List<String> tokens = new ArrayList<>();
        when(passwordResetTokenRepository.save(any(PasswordResetToken.class)))
                .thenAnswer(invocation -> {
                    PasswordResetToken token = invocation.getArgument(0);
                    tokens.add(token.getToken());
                    return token;
                });

        // Act - Generate 10 tokens
        for (int i = 0; i < 10; i++) {
            passwordResetService.initiatePasswordReset("user" + i + "@example.com", testIpAddress);
        }

        // Assert - All tokens should be unique
        assertEquals(10, tokens.size(), "Should have generated 10 tokens");
        long uniqueCount = tokens.stream().distinct().count();
        assertEquals(10, uniqueCount, "All 10 tokens should be unique");
    }

    // ==================== Token Validation Tests ====================

    @Test
    @DisplayName("Should successfully validate a valid token")
    void testValidateResetToken_ValidToken() {
        // Arrange
        String token = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUsed(false);
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(10)); // 10 minutes remaining

        when(passwordResetTokenRepository.findByToken(token))
                .thenReturn(Optional.of(resetToken));

        // Act
        var result = passwordResetService.validateResetToken(token);

        // Assert
        assertNotNull(result, "Result should not be null");
        assertTrue(result.valid(), "Token should be valid");
        assertTrue(result.remainingMinutes() >= 9 && result.remainingMinutes() <= 10,
                "Should have approximately 10 minutes remaining");
    }

    @Test
    @DisplayName("Should throw InvalidTokenException for non-existent token")
    void testValidateResetToken_TokenNotFound() {
        // Arrange
        String token = "nonexistenttoken1234567890abcdefghijklmnopqrstuvwxyz1234567890ab";

        when(passwordResetTokenRepository.findByToken(token))
                .thenReturn(Optional.empty());

        // Act & Assert
        com.ultrabms.exception.InvalidTokenException exception = assertThrows(
                com.ultrabms.exception.InvalidTokenException.class,
                () -> passwordResetService.validateResetToken(token),
                "Should throw InvalidTokenException"
        );

        assertTrue(exception.getMessage().contains("invalid or expired"),
                "Exception message should indicate token is invalid or expired");
    }

    @Test
    @DisplayName("Should throw InvalidTokenException for already used token")
    void testValidateResetToken_TokenAlreadyUsed() {
        // Arrange
        String token = "usedtoken1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefg";
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUsed(true); // Already used
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(10));

        when(passwordResetTokenRepository.findByToken(token))
                .thenReturn(Optional.of(resetToken));

        // Act & Assert
        com.ultrabms.exception.InvalidTokenException exception = assertThrows(
                com.ultrabms.exception.InvalidTokenException.class,
                () -> passwordResetService.validateResetToken(token),
                "Should throw InvalidTokenException"
        );

        assertTrue(exception.getMessage().contains("already been used"),
                "Exception message should indicate token was already used");
    }

    @Test
    @DisplayName("Should throw InvalidTokenException for expired token")
    void testValidateResetToken_TokenExpired() {
        // Arrange
        String token = "expiredtoken1234567890abcdefghijklmnopqrstuvwxyz1234567890abcd";
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUsed(false);
        resetToken.setExpiresAt(LocalDateTime.now().minusMinutes(5)); // Expired 5 minutes ago

        when(passwordResetTokenRepository.findByToken(token))
                .thenReturn(Optional.of(resetToken));

        // Act & Assert
        com.ultrabms.exception.InvalidTokenException exception = assertThrows(
                com.ultrabms.exception.InvalidTokenException.class,
                () -> passwordResetService.validateResetToken(token),
                "Should throw InvalidTokenException"
        );

        assertTrue(exception.getMessage().contains("expired"),
                "Exception message should indicate token is expired");
    }

    @Test
    @DisplayName("Should calculate correct remaining minutes for token expiring soon")
    void testValidateResetToken_TokenExpiringSoon() {
        // Arrange
        String token = "soontoexpire1234567890abcdefghijklmnopqrstuvwxyz1234567890abcde";
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUsed(false);
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(2)); // 2 minutes remaining

        when(passwordResetTokenRepository.findByToken(token))
                .thenReturn(Optional.of(resetToken));

        // Act
        var result = passwordResetService.validateResetToken(token);

        // Assert
        assertTrue(result.valid(), "Token should be valid");
        assertTrue(result.remainingMinutes() >= 1 && result.remainingMinutes() <= 2,
                "Should have 1-2 minutes remaining");
    }

    @Test
    @DisplayName("Should calculate correct remaining minutes for token expiring in seconds")
    void testValidateResetToken_LessThanOneMinuteRemaining() {
        // Arrange
        String token = "almostexpired1234567890abcdefghijklmnopqrstuvwxyz1234567890abcd";
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUsed(false);
        resetToken.setExpiresAt(LocalDateTime.now().plusSeconds(30)); // 30 seconds remaining

        when(passwordResetTokenRepository.findByToken(token))
                .thenReturn(Optional.of(resetToken));

        // Act
        var result = passwordResetService.validateResetToken(token);

        // Assert
        assertTrue(result.valid(), "Token should still be valid");
        assertEquals(0, result.remainingMinutes(),
                "Should have 0 minutes remaining (less than 1 minute)");
    }

    @Test
    @DisplayName("Should throw InvalidTokenException for token expiring exactly now")
    void testValidateResetToken_ExpiringExactlyNow() {
        // Arrange
        String token = "expiringnow1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdef";
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUsed(false);
        resetToken.setExpiresAt(LocalDateTime.now().minusSeconds(1)); // Just expired 1 second ago

        when(passwordResetTokenRepository.findByToken(token))
                .thenReturn(Optional.of(resetToken));

        // Act & Assert
        assertThrows(
                com.ultrabms.exception.InvalidTokenException.class,
                () -> passwordResetService.validateResetToken(token),
                "Should throw InvalidTokenException for token that just expired"
        );
    }

    // ==================== Password Reset Completion Tests ====================

    @Test
    @DisplayName("Should successfully reset password with valid token and strong password")
    void testResetPassword_Success() {
        // Arrange
        String token = "validtoken1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefg";
        String newPassword = "NewP@ssw0rd123";
        String hashedPassword = "$2a$12$hashed...";

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUsed(false);
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        resetToken.setUser(testUser);

        when(passwordResetTokenRepository.findByToken(token))
                .thenReturn(Optional.of(resetToken));
        when(passwordEncoder.encode(newPassword))
                .thenReturn(hashedPassword);
        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(passwordResetTokenRepository.save(any(PasswordResetToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        passwordResetService.resetPassword(token, newPassword, testIpAddress);

        // Assert
        verify(passwordEncoder).encode(newPassword);
        verify(userRepository).save(testUser);
        verify(passwordResetTokenRepository).save(resetToken);
        verify(emailService).sendPasswordChangeConfirmation(testUser);

        assertEquals(hashedPassword, testUser.getPasswordHash(), "Password should be updated with hashed value");
        assertTrue(resetToken.getUsed(), "Token should be marked as used");
    }

    @Test
    @DisplayName("Should throw ValidationException for weak password (too short)")
    void testResetPassword_WeakPassword_TooShort() {
        // Arrange
        String token = "validtoken1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefg";
        String weakPassword = "Short1!"; // Only 7 characters

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUsed(false);
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        resetToken.setUser(testUser);

        when(passwordResetTokenRepository.findByToken(token))
                .thenReturn(Optional.of(resetToken));

        // Act & Assert
        com.ultrabms.exception.ValidationException exception = assertThrows(
                com.ultrabms.exception.ValidationException.class,
                () -> passwordResetService.resetPassword(token, weakPassword, testIpAddress),
                "Should throw ValidationException for weak password"
        );

        assertTrue(exception.getMessage().contains("8 characters"),
                "Exception message should mention minimum length requirement");
        verify(passwordEncoder, never()).encode(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw ValidationException for weak password (missing uppercase)")
    void testResetPassword_WeakPassword_MissingUppercase() {
        // Arrange
        String token = "validtoken1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefg";
        String weakPassword = "password123!"; // No uppercase

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUsed(false);
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        resetToken.setUser(testUser);

        when(passwordResetTokenRepository.findByToken(token))
                .thenReturn(Optional.of(resetToken));

        // Act & Assert
        com.ultrabms.exception.ValidationException exception = assertThrows(
                com.ultrabms.exception.ValidationException.class,
                () -> passwordResetService.resetPassword(token, weakPassword, testIpAddress),
                "Should throw ValidationException"
        );

        assertTrue(exception.getMessage().contains("uppercase"),
                "Exception message should mention uppercase requirement");
    }

    @Test
    @DisplayName("Should throw InvalidTokenException for expired token")
    void testResetPassword_ExpiredToken() {
        // Arrange
        String token = "expiredtoken1234567890abcdefghijklmnopqrstuvwxyz1234567890abcd";
        String newPassword = "NewP@ssw0rd123";

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUsed(false);
        resetToken.setExpiresAt(LocalDateTime.now().minusMinutes(5)); // Expired

        when(passwordResetTokenRepository.findByToken(token))
                .thenReturn(Optional.of(resetToken));

        // Act & Assert
        assertThrows(
                com.ultrabms.exception.InvalidTokenException.class,
                () -> passwordResetService.resetPassword(token, newPassword, testIpAddress),
                "Should throw InvalidTokenException for expired token"
        );

        verify(passwordEncoder, never()).encode(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw InvalidTokenException for already used token")
    void testResetPassword_UsedToken() {
        // Arrange
        String token = "usedtoken1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefg";
        String newPassword = "NewP@ssw0rd123";

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUsed(true); // Already used
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(10));

        when(passwordResetTokenRepository.findByToken(token))
                .thenReturn(Optional.of(resetToken));

        // Act & Assert
        assertThrows(
                com.ultrabms.exception.InvalidTokenException.class,
                () -> passwordResetService.resetPassword(token, newPassword, testIpAddress),
                "Should throw InvalidTokenException for used token"
        );

        verify(passwordEncoder, never()).encode(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw InvalidTokenException for non-existent token")
    void testResetPassword_NonExistentToken() {
        // Arrange
        String token = "nonexistent1234567890abcdefghijklmnopqrstuvwxyz1234567890abcde";
        String newPassword = "NewP@ssw0rd123";

        when(passwordResetTokenRepository.findByToken(token))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(
                com.ultrabms.exception.InvalidTokenException.class,
                () -> passwordResetService.resetPassword(token, newPassword, testIpAddress),
                "Should throw InvalidTokenException for non-existent token"
        );

        verify(passwordEncoder, never()).encode(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should hash password using BCrypt before saving")
    void testResetPassword_PasswordHashing() {
        // Arrange
        String token = "validtoken1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefg";
        String newPassword = "MyNewP@ssw0rd2024";
        String hashedPassword = "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/WvUEZTLe6PbpX9cJm";

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUsed(false);
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        resetToken.setUser(testUser);

        when(passwordResetTokenRepository.findByToken(token))
                .thenReturn(Optional.of(resetToken));
        when(passwordEncoder.encode(newPassword))
                .thenReturn(hashedPassword);
        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(passwordResetTokenRepository.save(any(PasswordResetToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        passwordResetService.resetPassword(token, newPassword, testIpAddress);

        // Assert
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        User savedUser = userCaptor.getValue();
        assertEquals(hashedPassword, savedUser.getPasswordHash(),
                "Password should be hashed with BCrypt");
        assertNotEquals(newPassword, savedUser.getPasswordHash(),
                "Plain password should not be stored");
    }
}
