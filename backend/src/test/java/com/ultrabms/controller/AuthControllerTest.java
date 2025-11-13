package com.ultrabms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ultrabms.dto.*;
import com.ultrabms.entity.enums.UserRole;
import com.ultrabms.exception.AccountLockedException;
import com.ultrabms.exception.DuplicateResourceException;
import com.ultrabms.repository.TokenBlacklistRepository;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.security.JwtTokenProvider;
import com.ultrabms.service.AuthService;
import com.ultrabms.service.LoginAttemptService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for AuthController.
 *
 * Tests all authentication endpoints with MockMvc and Spring Security.
 */
@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)  // Disable security filters for controller testing
@Import(com.ultrabms.exception.GlobalExceptionHandler.class)  // Import exception handler for proper error responses
@DisplayName("AuthController Integration Tests")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private LoginAttemptService loginAttemptService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private TokenBlacklistRepository tokenBlacklistRepository;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private UserDto userDto;
    private LoginResponse loginResponse;
    private TokenResponse tokenResponse;

    @BeforeEach
    void setUp() {
        // Create test data
        registerRequest = new RegisterRequest(
                "test@ultrabms.com",
                "P@ssw0rd123",
                "Test",
                "User",
                UserRole.PROPERTY_MANAGER,
                "+971501234567"
        );

        loginRequest = new LoginRequest("test@ultrabms.com", "P@ssw0rd123");

        userDto = new UserDto(
                UUID.randomUUID(),
                "test@ultrabms.com",
                "Test",
                "User",
                UserRole.PROPERTY_MANAGER,
                true,
                false,
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        loginResponse = new LoginResponse(
                "access-token",
                "refresh-token",
                3600L,
                userDto
        );

        tokenResponse = new TokenResponse("new-access-token", 3600L);
    }

    // ==================== REGISTRATION ENDPOINT TESTS ====================

    @Test
    @DisplayName("POST /api/v1/auth/register - Should return 201 Created with valid request")
    void registerShouldReturn201WithValidRequest() throws Exception {
        // Arrange
        when(authService.register(any(RegisterRequest.class), anyString(), anyString()))
                .thenReturn(userDto);

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.email").value("test@ultrabms.com"))
                .andExpect(jsonPath("$.firstName").value("Test"))
                .andExpect(jsonPath("$.lastName").value("User"))
                .andExpect(jsonPath("$.role").value("PROPERTY_MANAGER"))
                .andExpect(jsonPath("$.active").value(true));

        verify(authService).register(any(RegisterRequest.class), anyString(), anyString());
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - Should return 400 Bad Request with invalid email")
    void registerShouldReturn400WithInvalidEmail() throws Exception {
        // Arrange
        RegisterRequest invalidRequest = new RegisterRequest(
                "invalid-email",
                "P@ssw0rd123",
                "Test",
                "User",
                UserRole.PROPERTY_MANAGER,
                "+971501234567"
        );

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").exists());

        verify(authService, never()).register(any(), anyString(), anyString());
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - Should return 400 Bad Request with weak password")
    void registerShouldReturn400WithWeakPassword() throws Exception {
        // Arrange
        RegisterRequest weakPasswordRequest = new RegisterRequest(
                "test@ultrabms.com",
                "weak",
                "Test",
                "User",
                UserRole.PROPERTY_MANAGER,
                "+971501234567"
        );

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(weakPasswordRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").exists());

        verify(authService, never()).register(any(), anyString(), anyString());
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - Should return 400 Bad Request with missing required fields")
    void registerShouldReturn400WithMissingFields() throws Exception {
        // Arrange - Missing required fields
        String invalidJson = "{\"email\":\"test@ultrabms.com\"}";

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest());

        verify(authService, never()).register(any(), anyString(), anyString());
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - Should return 409 Conflict when email already exists")
    void registerShouldReturn409WhenEmailExists() throws Exception {
        // Arrange
        when(authService.register(any(RegisterRequest.class), anyString(), anyString()))
                .thenThrow(new DuplicateResourceException("Email address already exists"));

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Duplicate Resource"))
                .andExpect(jsonPath("$.message").value("Email address already exists"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - Should validate phone number format")
    void registerShouldValidatePhoneNumberFormat() throws Exception {
        // Arrange - Invalid phone number
        RegisterRequest invalidPhoneRequest = new RegisterRequest(
                "test@ultrabms.com",
                "P@ssw0rd123",
                "Test",
                "User",
                UserRole.PROPERTY_MANAGER,
                "123" // Invalid E.164 format
        );

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidPhoneRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").exists());
    }

    // ==================== LOGIN ENDPOINT TESTS ====================

    @Test
    @DisplayName("POST /api/v1/auth/login - Should return 200 OK with valid credentials")
    void loginShouldReturn200WithValidCredentials() throws Exception {
        // Arrange
        when(authService.login(any(LoginRequest.class), anyString(), anyString()))
                .thenReturn(loginResponse);

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access-token"))
                .andExpect(jsonPath("$.refreshToken").value("refresh-token"))
                .andExpect(jsonPath("$.expiresIn").value(3600))
                .andExpect(jsonPath("$.user.email").value("test@ultrabms.com"))
                .andExpect(cookie().exists("refreshToken"))
                .andExpect(cookie().httpOnly("refreshToken", true))
                .andExpect(cookie().path("refreshToken", "/api/v1/auth"));

        verify(authService).login(any(LoginRequest.class), anyString(), anyString());
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Should return 401 Unauthorized with invalid credentials")
    void loginShouldReturn401WithInvalidCredentials() throws Exception {
        // Arrange
        when(authService.login(any(LoginRequest.class), anyString(), anyString()))
                .thenThrow(new BadCredentialsException("Invalid email or password"));

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Should return 423 Locked when account is locked")
    void loginShouldReturn423WhenAccountIsLocked() throws Exception {
        // Arrange
        when(authService.login(any(LoginRequest.class), anyString(), anyString()))
                .thenThrow(new AccountLockedException("Account is locked until 2025-11-13 12:00"));

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isLocked())
                .andExpect(jsonPath("$.error").value("Account Locked"))
                .andExpect(jsonPath("$.message").value("Account is locked until 2025-11-13 12:00"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Should return 400 Bad Request with missing credentials")
    void loginShouldReturn400WithMissingCredentials() throws Exception {
        // Arrange - Empty request body
        String emptyJson = "{}";

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(emptyJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Should extract IP address from X-Forwarded-For header")
    void loginShouldExtractIpFromForwardedHeader() throws Exception {
        // Arrange
        when(authService.login(any(), anyString(), anyString())).thenReturn(loginResponse);

        // Act
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Forwarded-For", "203.0.113.1, 198.51.100.1")
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk());

        // Assert - Should extract first IP from X-Forwarded-For
        verify(authService).login(any(), eq("203.0.113.1"), anyString());
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Should extract User-Agent header")
    void loginShouldExtractUserAgent() throws Exception {
        // Arrange
        when(authService.login(any(), anyString(), anyString())).thenReturn(loginResponse);
        String userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

        // Act
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("User-Agent", userAgent)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk());

        // Assert
        verify(authService).login(any(), anyString(), eq(userAgent));
    }

    // ==================== REFRESH TOKEN ENDPOINT TESTS ====================

    @Test
    @DisplayName("POST /api/v1/auth/refresh - Should return 200 OK with valid refresh token in body")
    void refreshShouldReturn200WithValidTokenInBody() throws Exception {
        // Arrange
        RefreshTokenRequest refreshRequest = new RefreshTokenRequest("valid-refresh-token");
        when(authService.refreshAccessToken(anyString(), anyString(), anyString()))
                .thenReturn(tokenResponse);

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("new-access-token"))
                .andExpect(jsonPath("$.expiresIn").value(3600));

        verify(authService).refreshAccessToken(eq("valid-refresh-token"), anyString(), anyString());
    }

    @Test
    @DisplayName("POST /api/v1/auth/refresh - Should return 200 OK with valid refresh token in cookie")
    void refreshShouldReturn200WithValidTokenInCookie() throws Exception {
        // Arrange
        when(authService.refreshAccessToken(anyString(), anyString(), anyString()))
                .thenReturn(tokenResponse);

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .cookie(new jakarta.servlet.http.Cookie("refreshToken", "valid-refresh-token")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("new-access-token"));

        verify(authService).refreshAccessToken(eq("valid-refresh-token"), anyString(), anyString());
    }

    @Test
    @DisplayName("POST /api/v1/auth/refresh - Should return 401 Unauthorized with no refresh token")
    void refreshShouldReturn401WithNoToken() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());

        verify(authService, never()).refreshAccessToken(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("POST /api/v1/auth/refresh - Should return 401 Unauthorized with invalid refresh token")
    void refreshShouldReturn401WithInvalidToken() throws Exception {
        // Arrange
        RefreshTokenRequest refreshRequest = new RefreshTokenRequest("invalid-token");
        when(authService.refreshAccessToken(anyString(), anyString(), anyString()))
                .thenThrow(new io.jsonwebtoken.JwtException("Invalid or expired refresh token"));

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    // ==================== LOGOUT ENDPOINT TESTS ====================

    @Test
    @DisplayName("POST /api/v1/auth/logout - Should return 204 No Content on successful logout")
    void logoutShouldReturn204OnSuccess() throws Exception {
        // Arrange
        doNothing().when(authService).logout(anyString(), anyString());

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer access-token")
                        .cookie(new jakarta.servlet.http.Cookie("refreshToken", "refresh-token")))
                .andExpect(status().isNoContent())
                .andExpect(cookie().exists("refreshToken"))
                .andExpect(cookie().maxAge("refreshToken", 0)); // Cookie expired

        verify(authService).logout(eq("access-token"), eq("refresh-token"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/logout - Should handle logout with no tokens")
    void logoutShouldHandleNoTokens() throws Exception {
        // Arrange
        doNothing().when(authService).logout(anyString(), anyString());

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/logout"))
                .andExpect(status().isNoContent());

        verify(authService).logout(isNull(), isNull());
    }

    @Test
    @DisplayName("POST /api/v1/auth/logout - Should extract access token from Authorization header")
    void logoutShouldExtractAccessTokenFromHeader() throws Exception {
        // Arrange
        doNothing().when(authService).logout(anyString(), anyString());

        // Act
        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer my-access-token"))
                .andExpect(status().isNoContent());

        // Assert
        verify(authService).logout(eq("my-access-token"), isNull());
    }

    @Test
    @DisplayName("POST /api/v1/auth/logout - Should extract refresh token from cookie")
    void logoutShouldExtractRefreshTokenFromCookie() throws Exception {
        // Arrange
        doNothing().when(authService).logout(anyString(), anyString());

        // Act
        mockMvc.perform(post("/api/v1/auth/logout")
                        .cookie(new jakarta.servlet.http.Cookie("refreshToken", "my-refresh-token")))
                .andExpect(status().isNoContent());

        // Assert
        verify(authService).logout(isNull(), eq("my-refresh-token"));
    }

    // ==================== GENERAL ENDPOINT TESTS ====================

    @Test
    @DisplayName("All auth endpoints should be publicly accessible without authentication")
    void authEndpointsShouldBePubliclyAccessible() throws Exception {
        // Registration endpoint is public
        when(authService.register(any(), anyString(), anyString())).thenReturn(userDto);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        // Login endpoint is public
        when(authService.login(any(), anyString(), anyString())).thenReturn(loginResponse);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk());

        // Refresh endpoint is public
        when(authService.refreshAccessToken(anyString(), anyString(), anyString())).thenReturn(tokenResponse);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(new jakarta.servlet.http.Cookie("refreshToken", "token")))
                .andExpect(status().isOk());

        // Logout endpoint is public
        doNothing().when(authService).logout(anyString(), anyString());

        mockMvc.perform(post("/api/v1/auth/logout"))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("Should return proper content type for JSON responses")
    void shouldReturnJsonContentType() throws Exception {
        // Arrange
        when(authService.register(any(), anyString(), anyString())).thenReturn(userDto);

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }
}
