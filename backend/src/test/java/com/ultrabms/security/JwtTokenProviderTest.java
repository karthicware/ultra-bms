package com.ultrabms.security;

import com.ultrabms.config.SecurityProperties;
import com.ultrabms.entity.Role;
import com.ultrabms.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Date;
import java.util.HashSet;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for JwtTokenProvider.
 *
 * Tests token generation, validation, claim extraction, and expiration handling.
 */
@DisplayName("JwtTokenProvider Tests")
class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private User testUser;

    @BeforeEach
    void setUp() {
        // Initialize JwtTokenProvider with test configuration
        String testSecret = "dGhpc0lzQVRlc3RTZWNyZXRLZXlGb3JUZXN0aW5nT25seU1pbmltdW0yNTZCaXRz"; // Base64 encoded 256-bit secret

        // Create mock SecurityProperties
        SecurityProperties securityProperties = new SecurityProperties();
        securityProperties.getJwt().setAccessTokenExpiration(3600); // 1 hour in seconds
        securityProperties.getJwt().setRefreshTokenExpiration(604800); // 7 days in seconds

        jwtTokenProvider = new JwtTokenProvider(testSecret, securityProperties);

        // Create test role
        Role testRole = new Role();
        testRole.setId(1L);
        testRole.setName("PROPERTY_MANAGER");
        testRole.setDescription("Property Manager Role");
        testRole.setPermissions(new HashSet<>());

        // Create test user
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@ultrabms.com");
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setRole(testRole);
    }

    @Test
    @DisplayName("Should generate valid access token")
    void shouldGenerateValidAccessToken() {
        // Act
        String token = jwtTokenProvider.generateAccessToken(testUser);

        // Assert
        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
        assertThat(token.split("\\.")).hasSize(3); // JWT has 3 parts: header.payload.signature
    }

    @Test
    @DisplayName("Should generate valid refresh token")
    void shouldGenerateValidRefreshToken() {
        // Act
        String token = jwtTokenProvider.generateRefreshToken(testUser);

        // Assert
        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    @DisplayName("Should validate valid token successfully")
    void shouldValidateValidToken() {
        // Arrange
        String token = jwtTokenProvider.generateAccessToken(testUser);

        // Act
        boolean isValid = jwtTokenProvider.validateToken(token);

        // Assert
        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("Should reject malformed token")
    void shouldRejectMalformedToken() {
        // Arrange
        String malformedToken = "invalid.token.format";

        // Act
        boolean isValid = jwtTokenProvider.validateToken(malformedToken);

        // Assert
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should reject null token")
    void shouldRejectNullToken() {
        // Act
        boolean isValid = jwtTokenProvider.validateToken(null);

        // Assert
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should reject empty token")
    void shouldRejectEmptyToken() {
        // Act
        boolean isValid = jwtTokenProvider.validateToken("");

        // Assert
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should extract user ID from token")
    void shouldExtractUserIdFromToken() {
        // Arrange
        String token = jwtTokenProvider.generateAccessToken(testUser);

        // Act
        UUID extractedUserId = jwtTokenProvider.getUserIdFromToken(token);

        // Assert
        assertThat(extractedUserId).isEqualTo(testUser.getId());
    }

    @Test
    @DisplayName("Should extract email from token")
    void shouldExtractEmailFromToken() {
        // Arrange
        String token = jwtTokenProvider.generateAccessToken(testUser);

        // Act
        String extractedEmail = jwtTokenProvider.getEmailFromToken(token);

        // Assert
        assertThat(extractedEmail).isEqualTo(testUser.getEmail());
    }

    @Test
    @DisplayName("Should extract role from token")
    void shouldExtractRoleFromToken() {
        // Arrange
        String token = jwtTokenProvider.generateAccessToken(testUser);

        // Act
        String extractedRole = jwtTokenProvider.getRoleFromToken(token);

        // Assert
        assertThat(extractedRole).isEqualTo(testUser.getRoleName());
    }

    @Test
    @DisplayName("Should identify refresh token correctly")
    void shouldIdentifyRefreshToken() {
        // Arrange
        String accessToken = jwtTokenProvider.generateAccessToken(testUser);
        String refreshToken = jwtTokenProvider.generateRefreshToken(testUser);

        // Act & Assert
        assertThat(jwtTokenProvider.isRefreshToken(accessToken)).isFalse();
        assertThat(jwtTokenProvider.isRefreshToken(refreshToken)).isTrue();
    }

    @Test
    @DisplayName("Should extract expiration date from token")
    void shouldExtractExpirationFromToken() {
        // Arrange
        String token = jwtTokenProvider.generateAccessToken(testUser);

        // Act
        Date expiration = jwtTokenProvider.getExpirationFromToken(token);

        // Assert
        assertThat(expiration).isNotNull();
        assertThat(expiration).isAfter(new Date()); // Token should not be expired yet
    }

    @Test
    @DisplayName("Should extract all claims from token")
    void shouldExtractAllClaimsFromToken() {
        // Arrange
        String token = jwtTokenProvider.generateAccessToken(testUser);

        // Act
        Claims claims = jwtTokenProvider.getClaims(token);

        // Assert
        assertThat(claims).isNotNull();
        assertThat(claims.getSubject()).isEqualTo(testUser.getId().toString());
        assertThat(claims.get("email", String.class)).isEqualTo(testUser.getEmail());
        assertThat(claims.get("role", String.class)).isEqualTo(testUser.getRoleName());
        assertThat(claims.getIssuedAt()).isNotNull();
        assertThat(claims.getExpiration()).isNotNull();
    }

    @Test
    @DisplayName("Should reject token with invalid signature")
    void shouldRejectTokenWithInvalidSignature() {
        // Arrange
        String token = jwtTokenProvider.generateAccessToken(testUser);

        // Create a second provider with different secret
        String differentSecret = "ZGlmZmVyZW50U2VjcmV0S2V5Rm9yVGVzdGluZ1B1cnBvc2VzT25seUJhc2U2NA==";
        SecurityProperties diffSecProps = new SecurityProperties();
        diffSecProps.getJwt().setAccessTokenExpiration(3600);
        diffSecProps.getJwt().setRefreshTokenExpiration(604800);
        JwtTokenProvider differentProvider = new JwtTokenProvider(differentSecret, diffSecProps);

        // Act - Try to validate with different secret
        boolean isValid = differentProvider.validateToken(token);

        // Assert
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should reject expired token")
    void shouldRejectExpiredToken() {
        // Arrange - Create provider with very short expiration (1 millisecond)
        String testSecret = "dGhpc0lzQVRlc3RTZWNyZXRLZXlGb3JUZXN0aW5nT25seU1pbmltdW0yNTZCaXRz";
        SecurityProperties shortProps = new SecurityProperties();
        shortProps.getJwt().setAccessTokenExpiration(0); // Expire immediately (< 1 second)
        shortProps.getJwt().setRefreshTokenExpiration(0);
        JwtTokenProvider shortExpiryProvider = new JwtTokenProvider(testSecret, shortProps);

        String token = shortExpiryProvider.generateAccessToken(testUser);

        // Act - Wait for token to expire
        try {
            Thread.sleep(10); // Wait 10ms to ensure expiration
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        boolean isValid = shortExpiryProvider.validateToken(token);

        // Assert
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should throw exception when extracting claims from invalid token")
    void shouldThrowExceptionWhenExtractingClaimsFromInvalidToken() {
        // Arrange
        String invalidToken = "invalid.jwt.token";

        // Act & Assert
        assertThatThrownBy(() -> jwtTokenProvider.getClaims(invalidToken))
                .isInstanceOf(JwtException.class);
    }

    @Test
    @DisplayName("Access token should have different expiration than refresh token")
    void accessTokenShouldHaveDifferentExpirationThanRefreshToken() {
        // Arrange
        String accessToken = jwtTokenProvider.generateAccessToken(testUser);
        String refreshToken = jwtTokenProvider.generateRefreshToken(testUser);

        // Act
        Date accessExpiration = jwtTokenProvider.getExpirationFromToken(accessToken);
        Date refreshExpiration = jwtTokenProvider.getExpirationFromToken(refreshToken);

        // Assert
        assertThat(accessExpiration).isBefore(refreshExpiration);

        // Access token should expire in ~1 hour, refresh token in ~7 days
        long accessDuration = accessExpiration.getTime() - new Date().getTime();
        long refreshDuration = refreshExpiration.getTime() - new Date().getTime();

        assertThat(accessDuration).isLessThan(3700000L); // Less than 1 hour + 1 minute
        assertThat(refreshDuration).isGreaterThan(604000000L); // More than 7 days - 1 hour
    }

    @Test
    @DisplayName("Should generate different tokens for same user")
    void shouldGenerateDifferentTokensForSameUser() throws InterruptedException {
        // Act
        String token1 = jwtTokenProvider.generateAccessToken(testUser);
        Thread.sleep(1000); // Ensure different timestamps (1 second to guarantee different iat claim)
        String token2 = jwtTokenProvider.generateAccessToken(testUser);

        // Assert - Tokens should be different due to different timestamps
        assertThat(token1).isNotEqualTo(token2);
    }

    @Test
    @DisplayName("Should handle all user roles correctly")
    void shouldHandleAllUserRolesCorrectly() {
        // Test each role
        String[] roleNames = {"SUPER_ADMIN", "PROPERTY_MANAGER", "MAINTENANCE_SUPERVISOR",
                              "FINANCE_MANAGER", "TENANT", "VENDOR"};

        for (String roleName : roleNames) {
            // Arrange
            Role role = new Role();
            role.setId(1L);
            role.setName(roleName);
            role.setDescription("Test role");
            role.setPermissions(new HashSet<>());
            testUser.setRole(role);

            // Act
            String token = jwtTokenProvider.generateAccessToken(testUser);
            String extractedRole = jwtTokenProvider.getRoleFromToken(token);

            // Assert
            assertThat(extractedRole).isEqualTo(roleName);
        }
    }
}
