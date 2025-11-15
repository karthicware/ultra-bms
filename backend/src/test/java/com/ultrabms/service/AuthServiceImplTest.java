package com.ultrabms.service;

import com.ultrabms.dto.*;
import com.ultrabms.entity.AuditLog;
import com.ultrabms.entity.Role;
import com.ultrabms.entity.User;
import com.ultrabms.exception.AccountLockedException;
import com.ultrabms.exception.DuplicateResourceException;
import com.ultrabms.repository.AuditLogRepository;
import com.ultrabms.repository.TokenBlacklistRepository;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.security.JwtTokenProvider;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AuthServiceImpl.
 *
 * Tests user registration, login, token refresh, logout, rate limiting, and audit logging.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthServiceImpl Tests")
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TokenBlacklistRepository tokenBlacklistRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private LoginAttemptService loginAttemptService;

    @Mock
    private com.ultrabms.repository.RoleRepository roleRepository;

    @Mock
    private com.ultrabms.repository.UserSessionRepository userSessionRepository;

    @Mock
    private SessionService sessionService;

    @Mock
    private HttpServletRequest httpRequest;

    @Spy
    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);

    @InjectMocks
    private AuthServiceImpl authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private User testUser;
    private static final String TEST_IP = "192.168.1.1";
    private static final String TEST_USER_AGENT = "Mozilla/5.0";

    private Role testRole;

    @BeforeEach
    void setUp() {
        // Create test register request
        registerRequest = new RegisterRequest(
                "test@ultrabms.com",
                "P@ssw0rd123",
                "Test",
                "User",
                "PROPERTY_MANAGER",
                "+971501234567"
        );

        // Create test login request
        loginRequest = new LoginRequest("test@ultrabms.com", "P@ssw0rd123");

        // Create test role
        testRole = new Role();
        testRole.setId(1L);
        testRole.setName("PROPERTY_MANAGER");
        testRole.setDescription("Property Manager Role");
        testRole.setPermissions(new HashSet<>());

        // Create test user
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@ultrabms.com");
        testUser.setPasswordHash(passwordEncoder.encode("P@ssw0rd123"));
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setRole(testRole);
        testUser.setPhone("+971501234567");
        testUser.setActive(true);
        testUser.setMfaEnabled(false);
        testUser.setAccountLocked(false);
        testUser.setFailedLoginAttempts(0);

        // Configure mock HttpServletRequest
        lenient().when(httpRequest.getRemoteAddr()).thenReturn(TEST_IP);
        lenient().when(httpRequest.getHeader("User-Agent")).thenReturn(TEST_USER_AGENT);
        lenient().when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(null); // No forwarded IP by default

        // Configure mock SessionService to return a test session ID
        lenient().when(sessionService.createSession(any(User.class), anyString(), anyString(), any(HttpServletRequest.class)))
                .thenReturn("test-session-id-123");
    }

    // ==================== REGISTRATION TESTS ====================

    @Test
    @DisplayName("Should successfully register new user")
    void shouldSuccessfullyRegisterNewUser() {
        // Arrange
        when(userRepository.findByEmail(registerRequest.email())).thenReturn(Optional.empty());
        when(roleRepository.findByName(registerRequest.roleName())).thenReturn(Optional.of(testRole));
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(new AuditLog());

        // Act
        UserDto result = authService.register(registerRequest, TEST_IP, TEST_USER_AGENT);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.email()).isEqualTo(registerRequest.email());
        assertThat(result.firstName()).isEqualTo(registerRequest.firstName());
        assertThat(result.lastName()).isEqualTo(registerRequest.lastName());
        assertThat(result.roleName()).isEqualTo(registerRequest.roleName());

        verify(userRepository).findByEmail(registerRequest.email());
        verify(userRepository).save(any(User.class));
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Should hash password with BCrypt during registration")
    void shouldHashPasswordWithBCryptDuringRegistration() {
        // Arrange
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(roleRepository.findByName(registerRequest.roleName())).thenReturn(Optional.of(testRole));

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        when(userRepository.save(userCaptor.capture())).thenReturn(testUser);

        // Act
        authService.register(registerRequest, TEST_IP, TEST_USER_AGENT);

        // Assert
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getPasswordHash()).isNotEqualTo(registerRequest.password()); // Hashed
        assertThat(passwordEncoder.matches(registerRequest.password(), savedUser.getPasswordHash())).isTrue();
    }

    @Test
    @DisplayName("Should throw exception when registering with existing email")
    void shouldThrowExceptionWhenRegisteringWithExistingEmail() {
        // Arrange
        when(userRepository.findByEmail(registerRequest.email())).thenReturn(Optional.of(testUser));

        // Act & Assert
        assertThatThrownBy(() -> authService.register(registerRequest, TEST_IP, TEST_USER_AGENT))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Email address already exists");

        verify(userRepository).findByEmail(registerRequest.email());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should log REGISTRATION audit event")
    void shouldLogRegistrationAuditEvent() {
        // Arrange
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(roleRepository.findByName(registerRequest.roleName())).thenReturn(Optional.of(testRole));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        ArgumentCaptor<AuditLog> auditLogCaptor = ArgumentCaptor.forClass(AuditLog.class);
        when(auditLogRepository.save(auditLogCaptor.capture())).thenReturn(new AuditLog());

        // Act
        authService.register(registerRequest, TEST_IP, TEST_USER_AGENT);

        // Assert
        AuditLog auditLog = auditLogCaptor.getValue();
        assertThat(auditLog.getUserId()).isEqualTo(testUser.getId());
        assertThat(auditLog.getAction()).isEqualTo("REGISTRATION");
        assertThat(auditLog.getIpAddress()).isEqualTo(TEST_IP);
        assertThat(auditLog.getUserAgent()).isEqualTo(TEST_USER_AGENT);
    }

    // ==================== LOGIN TESTS ====================

    @Test
    @DisplayName("Should successfully login with valid credentials")
    void shouldSuccessfullyLoginWithValidCredentials() {
        // Arrange
        when(loginAttemptService.isBlocked(loginRequest.email())).thenReturn(false);
        when(userRepository.findByEmail(loginRequest.email())).thenReturn(Optional.of(testUser));
        when(jwtTokenProvider.generateAccessToken(testUser)).thenReturn("access-token");
        when(jwtTokenProvider.generateRefreshToken(testUser)).thenReturn("refresh-token");

        // Act
        LoginResponse response = authService.login(loginRequest, httpRequest);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.refreshToken()).isEqualTo("refresh-token");
        assertThat(response.expiresIn()).isEqualTo(3600L);
        assertThat(response.user().email()).isEqualTo(testUser.getEmail());

        verify(loginAttemptService).resetAttempts(loginRequest.email());
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Should throw exception when logging in with invalid email")
    void shouldThrowExceptionWhenLoggingInWithInvalidEmail() {
        // Arrange
        when(loginAttemptService.isBlocked(loginRequest.email())).thenReturn(false);
        when(userRepository.findByEmail(loginRequest.email())).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> authService.login(loginRequest, httpRequest))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");

        verify(loginAttemptService).recordFailedAttempt(loginRequest.email());
        verify(jwtTokenProvider, never()).generateAccessToken(any());
    }

    @Test
    @DisplayName("Should throw exception when logging in with invalid password")
    void shouldThrowExceptionWhenLoggingInWithInvalidPassword() {
        // Arrange
        when(loginAttemptService.isBlocked(loginRequest.email())).thenReturn(false);
        when(userRepository.findByEmail(loginRequest.email())).thenReturn(Optional.of(testUser));

        LoginRequest wrongPasswordRequest = new LoginRequest("test@ultrabms.com", "WrongP@ssw0rd");

        // Act & Assert
        assertThatThrownBy(() -> authService.login(wrongPasswordRequest, httpRequest))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");

        verify(loginAttemptService).recordFailedAttempt(wrongPasswordRequest.email());
        verify(userRepository).save(any(User.class)); // Failed attempts incremented
    }

    @Test
    @DisplayName("Should throw exception when account is rate limited")
    void shouldThrowExceptionWhenAccountIsRateLimited() {
        // Arrange
        when(loginAttemptService.isBlocked(loginRequest.email())).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> authService.login(loginRequest, httpRequest))
                .isInstanceOf(AccountLockedException.class)
                .hasMessageContaining("Too many failed login attempts");

        verify(userRepository, never()).findByEmail(anyString());
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Should throw exception when account is locked")
    void shouldThrowExceptionWhenAccountIsLocked() {
        // Arrange
        testUser.setAccountLocked(true);
        testUser.setLockedUntil(LocalDateTime.now().plusMinutes(30));

        when(loginAttemptService.isBlocked(loginRequest.email())).thenReturn(false);
        when(userRepository.findByEmail(loginRequest.email())).thenReturn(Optional.of(testUser));

        // Act & Assert
        assertThatThrownBy(() -> authService.login(loginRequest, httpRequest))
                .isInstanceOf(AccountLockedException.class)
                .hasMessageContaining("Account is locked until");
    }

    @Test
    @DisplayName("Should unlock account after lock period expires")
    void shouldUnlockAccountAfterLockPeriodExpires() {
        // Arrange
        testUser.setAccountLocked(true);
        testUser.setLockedUntil(LocalDateTime.now().minusMinutes(1)); // Lock expired
        testUser.setFailedLoginAttempts(5);

        when(loginAttemptService.isBlocked(loginRequest.email())).thenReturn(false);
        when(userRepository.findByEmail(loginRequest.email())).thenReturn(Optional.of(testUser));
        when(jwtTokenProvider.generateAccessToken(any())).thenReturn("access-token");
        when(jwtTokenProvider.generateRefreshToken(any())).thenReturn("refresh-token");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        when(userRepository.save(userCaptor.capture())).thenReturn(testUser);

        // Act
        authService.login(loginRequest, httpRequest);

        // Assert
        User savedUser = userCaptor.getAllValues().get(0); // First save unlocks
        assertThat(savedUser.getAccountLocked()).isFalse();
        assertThat(savedUser.getLockedUntil()).isNull();
        assertThat(savedUser.getFailedLoginAttempts()).isEqualTo(0);
    }

    @Test
    @DisplayName("Should increment failed login attempts on wrong password")
    void shouldIncrementFailedLoginAttemptsOnWrongPassword() {
        // Arrange
        testUser.setFailedLoginAttempts(2);
        when(loginAttemptService.isBlocked(anyString())).thenReturn(false);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));

        LoginRequest wrongRequest = new LoginRequest("test@ultrabms.com", "WrongPassword1!");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        when(userRepository.save(userCaptor.capture())).thenReturn(testUser);

        // Act & Assert
        assertThatThrownBy(() -> authService.login(wrongRequest, httpRequest))
                .isInstanceOf(BadCredentialsException.class);

        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getFailedLoginAttempts()).isEqualTo(3);
    }

    @Test
    @DisplayName("Should lock account after 5 failed attempts")
    void shouldLockAccountAfter5FailedAttempts() {
        // Arrange
        testUser.setFailedLoginAttempts(4); // 4 previous failures
        when(loginAttemptService.isBlocked(anyString())).thenReturn(false);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));

        LoginRequest wrongRequest = new LoginRequest("test@ultrabms.com", "WrongPassword1!");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        when(userRepository.save(userCaptor.capture())).thenReturn(testUser);

        // Act & Assert
        assertThatThrownBy(() -> authService.login(wrongRequest, httpRequest))
                .isInstanceOf(BadCredentialsException.class);

        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getFailedLoginAttempts()).isEqualTo(5);
        assertThat(savedUser.getAccountLocked()).isTrue();
        assertThat(savedUser.getLockedUntil()).isAfter(LocalDateTime.now().plusMinutes(29));
    }

    @Test
    @DisplayName("Should reset failed attempts on successful login")
    void shouldResetFailedAttemptsOnSuccessfulLogin() {
        // Arrange
        testUser.setFailedLoginAttempts(3);
        when(loginAttemptService.isBlocked(anyString())).thenReturn(false);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
        when(jwtTokenProvider.generateAccessToken(any())).thenReturn("access-token");
        when(jwtTokenProvider.generateRefreshToken(any())).thenReturn("refresh-token");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        when(userRepository.save(userCaptor.capture())).thenReturn(testUser);

        // Act
        authService.login(loginRequest, httpRequest);

        // Assert
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getFailedLoginAttempts()).isEqualTo(0);
        assertThat(savedUser.getAccountLocked()).isFalse();
        assertThat(savedUser.getLockedUntil()).isNull();
    }

    @Test
    @DisplayName("Should log LOGIN_SUCCESS audit event")
    void shouldLogLoginSuccessAuditEvent() {
        // Arrange
        when(loginAttemptService.isBlocked(anyString())).thenReturn(false);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
        when(jwtTokenProvider.generateAccessToken(any())).thenReturn("access-token");
        when(jwtTokenProvider.generateRefreshToken(any())).thenReturn("refresh-token");

        ArgumentCaptor<AuditLog> auditLogCaptor = ArgumentCaptor.forClass(AuditLog.class);
        when(auditLogRepository.save(auditLogCaptor.capture())).thenReturn(new AuditLog());

        // Act
        authService.login(loginRequest, httpRequest);

        // Assert
        AuditLog auditLog = auditLogCaptor.getValue();
        assertThat(auditLog.getUserId()).isEqualTo(testUser.getId());
        assertThat(auditLog.getAction()).isEqualTo("LOGIN_SUCCESS");
        assertThat(auditLog.getIpAddress()).isEqualTo(TEST_IP);
        assertThat(auditLog.getUserAgent()).isEqualTo(TEST_USER_AGENT);
    }

    // ==================== TOKEN REFRESH TESTS ====================

    @Test
    @DisplayName("Should successfully refresh access token")
    void shouldSuccessfullyRefreshAccessToken() {
        // Arrange
        String refreshToken = "valid-refresh-token";

        when(jwtTokenProvider.validateToken(refreshToken)).thenReturn(true);
        when(jwtTokenProvider.isRefreshToken(refreshToken)).thenReturn(true);
        when(tokenBlacklistRepository.existsByTokenHash(anyString())).thenReturn(false);
        when(jwtTokenProvider.getUserIdFromToken(refreshToken)).thenReturn(testUser.getId());
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(jwtTokenProvider.generateAccessToken(testUser)).thenReturn("new-access-token");

        // Act
        TokenResponse response = authService.refreshAccessToken(refreshToken, TEST_IP, TEST_USER_AGENT);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("new-access-token");
        assertThat(response.expiresIn()).isEqualTo(3600L);

        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Should throw exception when refreshing with invalid token")
    void shouldThrowExceptionWhenRefreshingWithInvalidToken() {
        // Arrange
        String invalidToken = "invalid-token";
        when(jwtTokenProvider.validateToken(invalidToken)).thenReturn(false);

        // Act & Assert
        assertThatThrownBy(() -> authService.refreshAccessToken(invalidToken, TEST_IP, TEST_USER_AGENT))
                .isInstanceOf(JwtException.class)
                .hasMessageContaining("Invalid or expired refresh token");

        verify(jwtTokenProvider, never()).generateAccessToken(any());
    }

    @Test
    @DisplayName("Should throw exception when refreshing with access token")
    void shouldThrowExceptionWhenRefreshingWithAccessToken() {
        // Arrange
        String accessToken = "access-token-not-refresh";
        when(jwtTokenProvider.validateToken(accessToken)).thenReturn(true);
        when(jwtTokenProvider.isRefreshToken(accessToken)).thenReturn(false);

        // Act & Assert
        assertThatThrownBy(() -> authService.refreshAccessToken(accessToken, TEST_IP, TEST_USER_AGENT))
                .isInstanceOf(JwtException.class)
                .hasMessageContaining("not a refresh token");
    }

    @Test
    @DisplayName("Should throw exception when refreshing with blacklisted token")
    void shouldThrowExceptionWhenRefreshingWithBlacklistedToken() {
        // Arrange
        String blacklistedToken = "blacklisted-token";
        when(jwtTokenProvider.validateToken(blacklistedToken)).thenReturn(true);
        when(jwtTokenProvider.isRefreshToken(blacklistedToken)).thenReturn(true);
        when(tokenBlacklistRepository.existsByTokenHash(anyString())).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> authService.refreshAccessToken(blacklistedToken, TEST_IP, TEST_USER_AGENT))
                .isInstanceOf(JwtException.class)
                .hasMessageContaining("Token has been revoked");

        verify(userRepository, never()).findById(any());
    }

    @Test
    @DisplayName("Should log TOKEN_REFRESH audit event")
    void shouldLogTokenRefreshAuditEvent() {
        // Arrange
        String refreshToken = "valid-refresh-token";
        when(jwtTokenProvider.validateToken(anyString())).thenReturn(true);
        when(jwtTokenProvider.isRefreshToken(anyString())).thenReturn(true);
        when(tokenBlacklistRepository.existsByTokenHash(anyString())).thenReturn(false);
        when(jwtTokenProvider.getUserIdFromToken(anyString())).thenReturn(testUser.getId());
        when(userRepository.findById(any())).thenReturn(Optional.of(testUser));
        when(jwtTokenProvider.generateAccessToken(any())).thenReturn("new-token");

        ArgumentCaptor<AuditLog> auditLogCaptor = ArgumentCaptor.forClass(AuditLog.class);
        when(auditLogRepository.save(auditLogCaptor.capture())).thenReturn(new AuditLog());

        // Act
        authService.refreshAccessToken(refreshToken, TEST_IP, TEST_USER_AGENT);

        // Assert
        AuditLog auditLog = auditLogCaptor.getValue();
        assertThat(auditLog.getUserId()).isEqualTo(testUser.getId());
        assertThat(auditLog.getAction()).isEqualTo("TOKEN_REFRESH");
        assertThat(auditLog.getIpAddress()).isEqualTo(TEST_IP);
        assertThat(auditLog.getUserAgent()).isEqualTo(TEST_USER_AGENT);
    }

    // ==================== LOGOUT TESTS ====================

    @Test
    @DisplayName("Should successfully logout when session exists")
    void shouldSuccessfullyLogoutAndBlacklistTokens() {
        // Arrange
        String accessToken = "access-token";
        String refreshToken = "refresh-token";
        String sessionId = "test-session-id";

        com.ultrabms.entity.UserSession mockSession = new com.ultrabms.entity.UserSession();
        mockSession.setSessionId(sessionId);

        // Mock session lookup to return a session
        when(userSessionRepository.findByAccessTokenHash(anyString())).thenReturn(Optional.of(mockSession));

        // Act
        authService.logout(accessToken, refreshToken);

        // Assert - Should call sessionService.invalidateSession
        verify(sessionService).invalidateSession(eq(sessionId), any(com.ultrabms.entity.enums.BlacklistReason.class));
    }

    @Test
    @DisplayName("Should handle logout with null tokens")
    void shouldHandleLogoutWithNullTokens() {
        // Act & Assert - Should not throw exception
        assertThatCode(() -> authService.logout(null, null))
                .doesNotThrowAnyException();

        verify(tokenBlacklistRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should handle logout with empty tokens")
    void shouldHandleLogoutWithEmptyTokens() {
        // Act & Assert - Should not throw exception
        assertThatCode(() -> authService.logout("", ""))
                .doesNotThrowAnyException();

        verify(tokenBlacklistRepository, never()).save(any());
    }
}
