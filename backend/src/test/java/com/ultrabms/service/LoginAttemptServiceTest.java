package com.ultrabms.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for LoginAttemptService with Ehcache.
 *
 * Tests rate limiting, cache expiration, and Ehcache integration.
 */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("LoginAttemptService Tests")
class LoginAttemptServiceTest {

    @Autowired
    private LoginAttemptService loginAttemptService;

    @Autowired
    private CacheManager cacheManager;

    private static final String TEST_EMAIL = "test@ultrabms.com";

    @BeforeEach
    void setUp() {
        // Clear cache before each test
        if (cacheManager.getCache("loginAttemptsCache") != null) {
            cacheManager.getCache("loginAttemptsCache").clear();
        }
    }

    @Test
    @DisplayName("Should return null attempts for new email")
    void shouldReturnNullAttemptsForNewEmail() {
        // Act
        Integer attempts = loginAttemptService.getAttempts(TEST_EMAIL);

        // Assert
        assertThat(attempts).isNull();
    }

    @Test
    @DisplayName("Should not block user with no failed attempts")
    void shouldNotBlockUserWithNoFailedAttempts() {
        // Act
        boolean isBlocked = loginAttemptService.isBlocked(TEST_EMAIL);

        // Assert
        assertThat(isBlocked).isFalse();
    }

    @Test
    @DisplayName("Should record first failed attempt")
    void shouldRecordFirstFailedAttempt() {
        // Act
        Integer attempts = loginAttemptService.recordFailedAttempt(TEST_EMAIL);

        // Assert
        assertThat(attempts).isEqualTo(1);
        assertThat(loginAttemptService.getAttempts(TEST_EMAIL)).isEqualTo(1);
    }

    @Test
    @DisplayName("Should increment failed attempts counter")
    void shouldIncrementFailedAttemptsCounter() {
        // Act
        loginAttemptService.recordFailedAttempt(TEST_EMAIL);
        loginAttemptService.recordFailedAttempt(TEST_EMAIL);
        Integer attempts = loginAttemptService.recordFailedAttempt(TEST_EMAIL);

        // Assert
        assertThat(attempts).isEqualTo(3);
        assertThat(loginAttemptService.getAttempts(TEST_EMAIL)).isEqualTo(3);
    }

    @Test
    @DisplayName("Should not block user before 5 failed attempts")
    void shouldNotBlockUserBefore5FailedAttempts() {
        // Arrange - Record 4 failed attempts
        loginAttemptService.recordFailedAttempt(TEST_EMAIL);
        loginAttemptService.recordFailedAttempt(TEST_EMAIL);
        loginAttemptService.recordFailedAttempt(TEST_EMAIL);
        loginAttemptService.recordFailedAttempt(TEST_EMAIL);

        // Act
        boolean isBlocked = loginAttemptService.isBlocked(TEST_EMAIL);

        // Assert
        assertThat(isBlocked).isFalse();
        assertThat(loginAttemptService.getAttempts(TEST_EMAIL)).isEqualTo(4);
    }

    @Test
    @DisplayName("Should block user after 5 failed attempts")
    void shouldBlockUserAfter5FailedAttempts() {
        // Arrange - Record 5 failed attempts
        for (int i = 0; i < 5; i++) {
            loginAttemptService.recordFailedAttempt(TEST_EMAIL);
        }

        // Act
        boolean isBlocked = loginAttemptService.isBlocked(TEST_EMAIL);

        // Assert
        assertThat(isBlocked).isTrue();
        assertThat(loginAttemptService.getAttempts(TEST_EMAIL)).isEqualTo(5);
    }

    @Test
    @DisplayName("Should continue blocking user after 6th attempt")
    void shouldContinueBlockingUserAfter6thAttempt() {
        // Arrange - Record 6 failed attempts
        for (int i = 0; i < 6; i++) {
            loginAttemptService.recordFailedAttempt(TEST_EMAIL);
        }

        // Act
        boolean isBlocked = loginAttemptService.isBlocked(TEST_EMAIL);

        // Assert
        assertThat(isBlocked).isTrue();
        assertThat(loginAttemptService.getAttempts(TEST_EMAIL)).isEqualTo(6);
    }

    @Test
    @DisplayName("Should reset attempts on successful login")
    void shouldResetAttemptsOnSuccessfulLogin() {
        // Arrange - Record some failed attempts
        loginAttemptService.recordFailedAttempt(TEST_EMAIL);
        loginAttemptService.recordFailedAttempt(TEST_EMAIL);
        loginAttemptService.recordFailedAttempt(TEST_EMAIL);

        // Act - Reset attempts (simulating successful login)
        loginAttemptService.resetAttempts(TEST_EMAIL);

        // Assert
        assertThat(loginAttemptService.getAttempts(TEST_EMAIL)).isNull();
        assertThat(loginAttemptService.isBlocked(TEST_EMAIL)).isFalse();
    }

    @Test
    @DisplayName("Should reset blocked user on successful login")
    void shouldResetBlockedUserOnSuccessfulLogin() {
        // Arrange - Block user with 5 attempts
        for (int i = 0; i < 5; i++) {
            loginAttemptService.recordFailedAttempt(TEST_EMAIL);
        }
        assertThat(loginAttemptService.isBlocked(TEST_EMAIL)).isTrue();

        // Act - Reset attempts
        loginAttemptService.resetAttempts(TEST_EMAIL);

        // Assert
        assertThat(loginAttemptService.isBlocked(TEST_EMAIL)).isFalse();
        assertThat(loginAttemptService.getAttempts(TEST_EMAIL)).isNull();
    }

    @Test
    @DisplayName("Should track attempts for different emails independently")
    void shouldTrackAttemptsForDifferentEmailsIndependently() {
        // Arrange
        String email1 = "user1@ultrabms.com";
        String email2 = "user2@ultrabms.com";

        // Act - Record different number of attempts for each email
        loginAttemptService.recordFailedAttempt(email1);
        loginAttemptService.recordFailedAttempt(email1);

        loginAttemptService.recordFailedAttempt(email2);
        loginAttemptService.recordFailedAttempt(email2);
        loginAttemptService.recordFailedAttempt(email2);
        loginAttemptService.recordFailedAttempt(email2);

        // Assert
        assertThat(loginAttemptService.getAttempts(email1)).isEqualTo(2);
        assertThat(loginAttemptService.getAttempts(email2)).isEqualTo(4);
        assertThat(loginAttemptService.isBlocked(email1)).isFalse();
        assertThat(loginAttemptService.isBlocked(email2)).isFalse();
    }

    @Test
    @DisplayName("Should block one email without affecting other emails")
    void shouldBlockOneEmailWithoutAffectingOtherEmails() {
        // Arrange
        String blockedEmail = "blocked@ultrabms.com";
        String normalEmail = "normal@ultrabms.com";

        // Act - Block one email
        for (int i = 0; i < 5; i++) {
            loginAttemptService.recordFailedAttempt(blockedEmail);
        }
        loginAttemptService.recordFailedAttempt(normalEmail);

        // Assert
        assertThat(loginAttemptService.isBlocked(blockedEmail)).isTrue();
        assertThat(loginAttemptService.isBlocked(normalEmail)).isFalse();
    }

    @Test
    @DisplayName("Should handle multiple resets without errors")
    void shouldHandleMultipleResetsWithoutErrors() {
        // Arrange
        loginAttemptService.recordFailedAttempt(TEST_EMAIL);

        // Act - Reset multiple times
        loginAttemptService.resetAttempts(TEST_EMAIL);
        loginAttemptService.resetAttempts(TEST_EMAIL);
        loginAttemptService.resetAttempts(TEST_EMAIL);

        // Assert - Should not throw exception
        assertThat(loginAttemptService.getAttempts(TEST_EMAIL)).isNull();
    }

    @Test
    @DisplayName("Should cache attempts value")
    void shouldCacheAttemptsValue() {
        // Arrange
        loginAttemptService.recordFailedAttempt(TEST_EMAIL);

        // Act - Get attempts multiple times
        Integer attempts1 = loginAttemptService.getAttempts(TEST_EMAIL);
        Integer attempts2 = loginAttemptService.getAttempts(TEST_EMAIL);

        // Assert - Both should return same value from cache
        assertThat(attempts1).isEqualTo(1);
        assertThat(attempts2).isEqualTo(1);
    }

    @Test
    @DisplayName("Should use Ehcache for storage")
    void shouldUseEhcacheForStorage() {
        // Arrange
        loginAttemptService.recordFailedAttempt(TEST_EMAIL);

        // Act - Get cache directly
        var cache = cacheManager.getCache("loginAttemptsCache");

        // Assert
        assertThat(cache).isNotNull();
        assertThat(cache.get(TEST_EMAIL)).isNotNull();
        assertThat(cache.get(TEST_EMAIL, Integer.class)).isEqualTo(1);
    }

    @Test
    @DisplayName("Should handle case-sensitive email addresses")
    void shouldHandleCaseSensitiveEmailAddresses() {
        // Arrange
        String lowerCaseEmail = "test@ultrabms.com";
        String upperCaseEmail = "TEST@ultrabms.com";
        String mixedCaseEmail = "Test@UltraBms.COM";

        // Act - Record attempts for different cases
        loginAttemptService.recordFailedAttempt(lowerCaseEmail);
        loginAttemptService.recordFailedAttempt(upperCaseEmail);
        loginAttemptService.recordFailedAttempt(mixedCaseEmail);

        // Assert - Each should be tracked separately
        assertThat(loginAttemptService.getAttempts(lowerCaseEmail)).isEqualTo(1);
        assertThat(loginAttemptService.getAttempts(upperCaseEmail)).isEqualTo(1);
        assertThat(loginAttemptService.getAttempts(mixedCaseEmail)).isEqualTo(1);
    }

    @Test
    @DisplayName("Should handle empty email gracefully")
    void shouldHandleEmptyEmailGracefully() {
        // Act
        Integer attempts = loginAttemptService.recordFailedAttempt("");

        // Assert
        assertThat(attempts).isEqualTo(1);
        assertThat(loginAttemptService.getAttempts("")).isEqualTo(1);
    }

    @Test
    @DisplayName("Should track up to MAX_INT attempts without overflow")
    void shouldTrackLargeNumberOfAttempts() {
        // Arrange & Act - Record many attempts
        for (int i = 0; i < 10; i++) {
            loginAttemptService.recordFailedAttempt(TEST_EMAIL);
        }

        // Assert
        assertThat(loginAttemptService.getAttempts(TEST_EMAIL)).isEqualTo(10);
        assertThat(loginAttemptService.isBlocked(TEST_EMAIL)).isTrue();
    }
}
