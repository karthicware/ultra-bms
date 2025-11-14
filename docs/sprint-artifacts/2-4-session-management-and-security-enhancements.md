# Story 2.4: Session Management and Security Enhancements

Status: ready-for-dev

## Story

As a system administrator,
I want robust session management and security controls,
So that user sessions are secure and properly managed.

## Acceptance Criteria

1. **AC1 - Session Timeout Configuration:** Configure session timeouts in application.yml: access token lifetime 1 hour (3600 seconds), refresh token lifetime 7 days (604800 seconds), idle timeout 30 minutes (1800 seconds - no activity), absolute timeout 12 hours (43200 seconds - force re-login). Implement JwtTokenProvider with configurable expiration times read from properties. Access token includes expiration claim (exp) set to now + 1 hour. Refresh token stored with expiresAt timestamp = now + 7 days. Idle timeout tracked via lastActivityAt field updated on each authenticated request. Absolute timeout enforced via sessionCreatedAt field (createdAt + 12 hours).

2. **AC2 - Session Tracking Database Schema:** Create user_sessions table via Flyway migration V15__create_user_sessions_table.sql with columns: id UUID PRIMARY KEY, user_id UUID REFERENCES users(id) NOT NULL, session_id VARCHAR(255) UNIQUE NOT NULL, access_token_hash VARCHAR(255), refresh_token_hash VARCHAR(255), created_at TIMESTAMP NOT NULL, last_activity_at TIMESTAMP NOT NULL, expires_at TIMESTAMP NOT NULL, ip_address VARCHAR(50), user_agent VARCHAR(500), device_type VARCHAR(50), is_active BOOLEAN DEFAULT true. Create indexes: idx_user_sessions_session_id (unique lookup), idx_user_sessions_user_id (user's sessions), idx_user_sessions_expires_at (cleanup), idx_user_sessions_last_activity_at (idle timeout check). Enforce max 3 concurrent sessions per user via application logic.

3. **AC3 - Session Creation on Login:** When user logs in via POST /api/v1/auth/login, create UserSession record in database. Generate unique sessionId using UUID.randomUUID(). Hash access token and refresh token using BCrypt before storing (security: don't store raw tokens). Extract IP address from HttpServletRequest.getRemoteAddr(). Extract User-Agent from request headers. Detect device type (Desktop/Mobile/Tablet) from User-Agent string. Set created_at and last_activity_at to now. Set expires_at to now + 12 hours (absolute timeout). Before creating new session, check user's active session count. If count >= 3, delete oldest session (ORDER BY created_at ASC LIMIT 1). Return sessionId in login response (client doesn't need to store, just for reference).

4. **AC4 - Session Activity Tracking:** Create SessionActivityFilter implementing OncePerRequestFilter. On each authenticated request, extract current user from SecurityContext. Query user_sessions table by userId + accessToken hash. Update last_activity_at to now. Check idle timeout: if now - last_activity_at > 30 minutes, invalidate session (is_active = false), add token to blacklist, return 401 Unauthorized with error code SESSION_EXPIRED_IDLE. Check absolute timeout: if now - created_at > 12 hours, invalidate session, return 401 Unauthorized with error code SESSION_EXPIRED_ABSOLUTE. If session valid, allow request to proceed. Register filter in Spring Security filter chain after JwtAuthenticationFilter.

5. **AC5 - Token Blacklist Implementation:** Create token_blacklist table via Flyway migration V16__create_token_blacklist_table.sql with columns: id UUID PRIMARY KEY, token_hash VARCHAR(255) UNIQUE NOT NULL, token_type VARCHAR(20) NOT NULL (ACCESS or REFRESH), expires_at TIMESTAMP NOT NULL, reason VARCHAR(100), created_at TIMESTAMP DEFAULT NOW(). Create index idx_token_blacklist_token_hash for fast lookup. Create index idx_token_blacklist_expires_at for cleanup. When validating JWT in JwtAuthenticationFilter, check if token hash exists in token_blacklist table. If found, reject token with 401 Unauthorized. Hash tokens using BCrypt before storing for security. Include reason field: LOGOUT, IDLE_TIMEOUT, ABSOLUTE_TIMEOUT, PASSWORD_RESET, SECURITY_VIOLATION.

6. **AC6 - Logout Endpoint Implementation:** Create POST /api/v1/auth/logout endpoint in AuthController. Extract access token from Authorization header. Extract refresh token from HTTP-only cookie. Find UserSession by access token hash. Mark session as inactive (is_active = false). Add both access token and refresh token to token_blacklist with reason = LOGOUT and expires_at matching token expiration. Delete or invalidate RefreshToken record from refresh_tokens table. Clear refresh token cookie: response.addCookie(cookie with maxAge=0). Log logout event to audit_logs: action = USER_LOGOUT, userId, sessionId, IP address. Return 200 OK: { success: true, message: "Logged out successfully" }. Frontend should clear access token from memory and redirect to login page.

7. **AC7 - Logout All Devices Endpoint:** Create POST /api/v1/auth/logout-all endpoint in AuthController. Extract current user from SecurityContext. Query all active sessions for user: user_sessions WHERE user_id = userId AND is_active = true. For each session, add access_token_hash and refresh_token_hash to token_blacklist with reason = LOGOUT_ALL_DEVICES. Mark all user sessions as inactive (UPDATE user_sessions SET is_active = false WHERE user_id = userId). Delete all user's refresh tokens from refresh_tokens table. Clear refresh token cookie for current session. Log to audit_logs: action = USER_LOGOUT_ALL, userId, sessionCount. Return 200 OK: { success: true, message: "Logged out from {count} devices", devicesCount: count }. User must re-login on all devices.

8. **AC8 - Active Sessions Management Endpoint:** Create GET /api/v1/auth/sessions endpoint in AuthController returning list of user's active sessions. Query user_sessions WHERE user_id = currentUserId AND is_active = true ORDER BY last_activity_at DESC. Return SessionDto list with fields: sessionId, deviceType, browser (parsed from userAgent), ipAddress, location (optional: derive from IP), lastActivityAt, createdAt, isCurrent (compare sessionId with current request's session). Create POST /api/v1/auth/sessions/{sessionId}/revoke endpoint to revoke individual session. Validate sessionId belongs to current user. Add session tokens to blacklist, mark session inactive. Return 200 OK. These endpoints used by frontend Account Settings page to show active sessions.

9. **AC9 - Security Headers Configuration:** Create SecurityHeadersConfig class with @Configuration. Add HeaderWriterFilter to Spring Security filter chain with following headers: X-Frame-Options: DENY (prevent clickjacking), X-Content-Type-Options: nosniff (prevent MIME sniffing), X-XSS-Protection: 1; mode=block (XSS protection), Strict-Transport-Security: max-age=31536000; includeSubDomains (force HTTPS), Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' (CSP). Configure headers in SecurityConfig using http.headers() builder. Test headers present in all API responses using curl or browser dev tools.

10. **AC10 - CSRF Protection Configuration:** Enable CSRF protection for state-changing operations (POST, PUT, DELETE). Configure CsrfTokenRepository using CookieCsrfTokenRepository.withHttpOnlyFalse() to store CSRF token in cookie named XSRF-TOKEN. Frontend reads token from cookie and sends in custom header X-XSRF-TOKEN with each request. Exclude authentication endpoints from CSRF: /api/v1/auth/login, /api/v1/auth/register, /api/v1/auth/refresh (these use JWT, not session-based). Configure in SecurityConfig: csrf().csrfTokenRepository(cookieCsrfTokenRepository()).ignoringRequestMatchers("/api/v1/auth/**"). SameSite=Strict attribute on CSRF cookie. Test CSRF protection: requests without valid XSRF-TOKEN should return 403 Forbidden.

11. **AC11 - Scheduled Session Cleanup Job:** Create SessionCleanupService with @Scheduled method cleanupExpiredSessions() running hourly (cron = "0 0 * * * *"). Delete expired sessions: DELETE FROM user_sessions WHERE expires_at < NOW() - 1 hour OR (is_active = false AND updated_at < NOW() - 24 hours). Delete expired blacklist entries: DELETE FROM token_blacklist WHERE expires_at < NOW() - 1 hour. Log cleanup statistics: "Cleaned up {sessionCount} expired sessions and {tokenCount} blacklist entries" at INFO level. Annotate with @Transactional for atomicity. Also cleanup old audit_logs: DELETE WHERE created_at < NOW() - 90 days (retain 90 days for compliance).

12. **AC12 - Frontend Token Refresh Implementation:** Create Axios interceptor in lib/api.ts to handle token refresh. On 401 response, check error code. If ACCESS_TOKEN_EXPIRED, call POST /api/v1/auth/refresh with refresh token from cookie. Backend validates refresh token, checks not in blacklist, generates new access token. Return new access token. Frontend stores new token in memory, retries original failed request with new token. If refresh fails (refresh token expired/invalid), clear auth state, redirect to login with returnUrl parameter. Implement refresh lock to prevent multiple simultaneous refresh requests (use mutex/flag). Store access token in React state/context, not localStorage (security: prevent XSS theft).

13. **AC13 - Session Expiry Warning UI:** Create SessionExpiryWarning component showing modal when session about to expire. Calculate time to expiry from access token exp claim. Show warning modal 5 minutes before access token expires: "Your session will expire in 5 minutes. Stay logged in?". Modal buttons: "Stay Logged In" (calls refresh token endpoint, extends session), "Logout" (calls logout endpoint). Auto-logout if user doesn't respond within 5 minutes. Display countdown timer in modal. Use setTimeout/setInterval to check token expiry. Alternative: show warning on idle timeout (30 minutes of no activity detected via user interaction events).

14. **AC14 - Account Settings Session Management UI:** Create app/(dashboard)/settings/security/page.tsx with Active Sessions section. Display table/list of active sessions from GET /api/v1/auth/sessions. Show columns: Device Type (icon + name), Browser, IP Address, Location (optional), Last Active (relative time: "5 minutes ago"), Current Session (badge). Each row has "Revoke" button calling POST /api/v1/auth/sessions/{sessionId}/revoke. Current session cannot be revoked (disabled button or hidden). Add "Logout All Other Devices" button calling POST /api/v1/auth/logout-all (excludes current session). Show confirmation dialog before revoking sessions. Use shadcn Table, Badge, Button components. Auto-refresh session list every 30 seconds.

15. **AC15 - IP-Based Anomaly Detection (Optional):** Track IP addresses per user session. When user logs in from new IP address (not in last 10 sessions), flag as suspicious. Send email notification: "New login detected from {ipAddress} in {location}". Email includes: login time, device, browser, IP, location. Link to revoke session if unauthorized: "Wasn't you? Secure your account". Store IP address history in user_sessions table. Optional enhancement: GeoIP lookup for location display using MaxMind GeoLite2 database. Optional enhancement: Alert on User-Agent change within same session (possible session hijacking). Log suspicious activities to audit_logs with action = SUSPICIOUS_LOGIN_DETECTED.

## Tasks / Subtasks

- [ ] **Task 1: Create Session Tables Database Schema** (AC: #2, #5)
  - [ ] Create Flyway migration V15__create_user_sessions_table.sql
  - [ ] Define user_sessions table schema:
    - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
    - user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL
    - session_id VARCHAR(255) UNIQUE NOT NULL
    - access_token_hash VARCHAR(255)
    - refresh_token_hash VARCHAR(255)
    - created_at TIMESTAMP DEFAULT NOW()
    - last_activity_at TIMESTAMP NOT NULL
    - expires_at TIMESTAMP NOT NULL
    - ip_address VARCHAR(50)
    - user_agent VARCHAR(500)
    - device_type VARCHAR(50)
    - is_active BOOLEAN DEFAULT true
    - version BIGINT (optimistic locking)
  - [ ] Create indexes:
    - CREATE UNIQUE INDEX idx_user_sessions_session_id ON user_sessions(session_id)
    - CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id)
    - CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at)
    - CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity_at)
  - [ ] Test migration runs successfully on local database

- [ ] **Task 2: Create Token Blacklist Database Schema** (AC: #5)
  - [ ] Create Flyway migration V16__create_token_blacklist_table.sql
  - [ ] Define token_blacklist table schema:
    - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
    - token_hash VARCHAR(255) UNIQUE NOT NULL
    - token_type VARCHAR(20) NOT NULL (CHECK constraint: 'ACCESS' or 'REFRESH')
    - expires_at TIMESTAMP NOT NULL
    - reason VARCHAR(100)
    - created_at TIMESTAMP DEFAULT NOW()
  - [ ] Create indexes:
    - CREATE UNIQUE INDEX idx_token_blacklist_token_hash ON token_blacklist(token_hash)
    - CREATE INDEX idx_token_blacklist_expires_at ON token_blacklist(expires_at)
  - [ ] Test migration runs successfully

- [ ] **Task 3: Create Session JPA Entities and Repositories** (AC: #2, #5)
  - [ ] Create UserSession entity in com.ultrabms.entity package:
    - Extend BaseEntity for id, createdAt, updatedAt, version
    - Fields: user (User @ManyToOne), sessionId (String UNIQUE), accessTokenHash, refreshTokenHash, lastActivityAt, expiresAt, ipAddress, userAgent, deviceType, isActive
    - Add method: boolean isExpired() checks expires_at vs now
    - Add method: boolean isIdle(int minutes) checks lastActivityAt
    - Add method: String getDeviceType() parses userAgent to detect Desktop/Mobile/Tablet
  - [ ] Create UserSessionRepository extending JpaRepository<UserSession, UUID>:
    - findBySessionId(String sessionId): Optional<UserSession>
    - findByUserIdAndIsActiveTrue(UUID userId): List<UserSession>
    - countByUserIdAndIsActiveTrue(UUID userId): long
    - deleteByExpiresAtBefore(LocalDateTime dateTime): int
    - findByAccessTokenHash(String tokenHash): Optional<UserSession>
  - [ ] Create TokenBlacklist entity:
    - Fields: tokenHash (String UNIQUE), tokenType (Enum: ACCESS/REFRESH), expiresAt, reason
    - Enum TokenType with values: ACCESS, REFRESH
    - Enum BlacklistReason: LOGOUT, LOGOUT_ALL, IDLE_TIMEOUT, ABSOLUTE_TIMEOUT, PASSWORD_RESET
  - [ ] Create TokenBlacklistRepository:
    - existsByTokenHash(String tokenHash): boolean (for validation)
    - deleteByExpiresAtBefore(LocalDateTime dateTime): int (cleanup)

- [ ] **Task 4: Configure Session Timeout Properties** (AC: #1)
  - [ ] Add session configuration to application.yml:
    ```yaml
    app:
      security:
        jwt:
          access-token-expiration: 3600 # 1 hour in seconds
          refresh-token-expiration: 604800 # 7 days in seconds
        session:
          idle-timeout: 1800 # 30 minutes in seconds
          absolute-timeout: 43200 # 12 hours in seconds
          max-concurrent-sessions: 3
    ```
  - [ ] Create SecurityProperties class with @ConfigurationProperties("app.security")
  - [ ] Define nested classes: JwtProperties, SessionProperties with fields matching YAML
  - [ ] Inject SecurityProperties into JwtTokenProvider and SessionService

- [ ] **Task 5: Update JwtTokenProvider with Configurable Expiration** (AC: #1)
  - [ ] Modify JwtTokenProvider to inject SecurityProperties
  - [ ] Update generateAccessToken() to use jwtProperties.getAccessTokenExpiration()
  - [ ] Set exp claim: .setExpiration(new Date(now + accessTokenExpiration * 1000))
  - [ ] Update generateRefreshToken() to use jwtProperties.getRefreshTokenExpiration()
  - [ ] Add method: long getAccessTokenExpiration() returns configured value
  - [ ] Add method: Date getExpirationDateFromToken(String token) extracts exp claim

- [ ] **Task 6: Implement Session Service** (AC: #3, #8)
  - [ ] Create SessionService in com.ultrabms.service package
  - [ ] Inject UserSessionRepository, TokenBlacklistRepository, SecurityProperties
  - [ ] Implement createSession(User user, String accessToken, String refreshToken, HttpServletRequest request):
    - Check concurrent sessions: if count >= maxConcurrentSessions, delete oldest
    - Generate sessionId: UUID.randomUUID().toString()
    - Hash tokens: BCrypt.hashpw(token, BCrypt.gensalt())
    - Extract IP: request.getRemoteAddr()
    - Extract User-Agent: request.getHeader("User-Agent")
    - Detect device type from User-Agent (Mobile/Tablet/Desktop)
    - Set timestamps: createdAt, lastActivityAt, expiresAt (now + absoluteTimeout)
    - Save UserSession entity
    - Return sessionId
  - [ ] Implement updateSessionActivity(String sessionId):
    - Find session by sessionId
    - Update lastActivityAt to now
    - Check idle timeout and absolute timeout
    - If expired, call invalidateSession()
  - [ ] Implement invalidateSession(String sessionId, BlacklistReason reason):
    - Find session, mark is_active = false
    - Add tokens to blacklist with reason
    - Delete refresh token from refresh_tokens table
  - [ ] Implement getUserActiveSessions(UUID userId): List<SessionDto>
  - [ ] Implement revokeSession(UUID userId, String sessionId)
  - [ ] Implement revokeAllUserSessions(UUID userId, String exceptSessionId)

- [ ] **Task 7: Create Session Activity Filter** (AC: #4)
  - [ ] Create SessionActivityFilter extending OncePerRequestFilter
  - [ ] Inject SessionService, SecurityProperties
  - [ ] Override doFilterInternal(request, response, filterChain):
    - Check if request is authenticated (SecurityContextHolder.getContext().getAuthentication())
    - If authenticated, extract user and access token
    - Find session by access token hash
    - If session not found, return 401 (invalid session)
    - Check idle timeout: now - lastActivityAt > idleTimeout
    - Check absolute timeout: now - createdAt > absoluteTimeout
    - If either expired, invalidate session, return 401 with specific error code
    - Otherwise, update lastActivityAt via sessionService.updateSessionActivity()
    - Continue filter chain
  - [ ] Register filter in SecurityConfig:
    - http.addFilterAfter(sessionActivityFilter, JwtAuthenticationFilter.class)

- [ ] **Task 8: Update Token Blacklist Check in JwtAuthenticationFilter** (AC: #5)
  - [ ] Inject TokenBlacklistRepository into JwtAuthenticationFilter
  - [ ] After validating JWT signature, hash the token
  - [ ] Check if tokenBlacklistRepository.existsByTokenHash(hash)
  - [ ] If token blacklisted, reject authentication (return 401)
  - [ ] Continue existing JWT validation logic if not blacklisted

- [ ] **Task 9: Implement Logout Endpoint** (AC: #6)
  - [ ] Create logout(HttpServletRequest request, HttpServletResponse response) in AuthController
  - [ ] Annotated with @PostMapping("/api/v1/auth/logout")
  - [ ] Extract access token from Authorization header (remove "Bearer " prefix)
  - [ ] Extract refresh token from cookie named "refreshToken"
  - [ ] Find session by access token hash
  - [ ] Call sessionService.invalidateSession(sessionId, BlacklistReason.LOGOUT)
  - [ ] Clear refresh token cookie: Cookie cookie = new Cookie("refreshToken", null); cookie.setMaxAge(0); cookie.setHttpOnly(true); response.addCookie(cookie)
  - [ ] Log to audit_logs: action USER_LOGOUT
  - [ ] Return 200 OK: { success: true, message: "Logged out successfully" }

- [ ] **Task 10: Implement Logout All Devices Endpoint** (AC: #7)
  - [ ] Create logoutAllDevices() in AuthController
  - [ ] Annotated with @PostMapping("/api/v1/auth/logout-all")
  - [ ] Get current user from SecurityContext
  - [ ] Get current sessionId from request attribute (set by SessionActivityFilter)
  - [ ] Call sessionService.revokeAllUserSessions(userId, exceptSessionId = currentSessionId)
  - [ ] Clear refresh token cookie for current session
  - [ ] Log to audit_logs: action USER_LOGOUT_ALL with session count
  - [ ] Return 200 OK: { success: true, message: "Logged out from {count} devices", devicesCount }

- [ ] **Task 11: Implement Active Sessions Endpoints** (AC: #8)
  - [ ] Create getUserSessions() in AuthController
  - [ ] Annotated with @GetMapping("/api/v1/auth/sessions")
  - [ ] Call sessionService.getUserActiveSessions(currentUserId)
  - [ ] Return List<SessionDto> with fields: sessionId, deviceType, browser, ipAddress, location, lastActivityAt, createdAt, isCurrent
  - [ ] Create revokeSession(@PathVariable String sessionId) endpoint
  - [ ] Annotated with @PostMapping("/api/v1/auth/sessions/{sessionId}/revoke")
  - [ ] Validate sessionId belongs to current user (security check)
  - [ ] Call sessionService.revokeSession(userId, sessionId)
  - [ ] Return 200 OK: { success: true, message: "Session revoked" }
  - [ ] Create SessionDto record with required fields

- [ ] **Task 12: Configure Security Headers** (AC: #9)
  - [ ] In SecurityConfig, configure headers using http.headers() builder:
    ```java
    .headers(headers -> headers
        .frameOptions(frame -> frame.deny())
        .xssProtection(xss -> xss.headerValue("1; mode=block"))
        .contentTypeOptions(content -> content.disable())
        .httpStrictTransportSecurity(hsts -> hsts
            .maxAgeInSeconds(31536000)
            .includeSubDomains(true)
        )
        .contentSecurityPolicy(csp -> csp
            .policyDirectives("default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'")
        )
    )
    ```
  - [ ] Test headers present in responses: curl -I http://localhost:8080/api/v1/auth/login
  - [ ] Verify X-Frame-Options, X-Content-Type-Options, HSTS headers present

- [ ] **Task 13: Configure CSRF Protection** (AC: #10)
  - [ ] In SecurityConfig, configure CSRF:
    ```java
    .csrf(csrf -> csrf
        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
        .ignoringRequestMatchers("/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/refresh")
    )
    ```
  - [ ] CSRF token stored in cookie named XSRF-TOKEN (readable by JavaScript)
  - [ ] Frontend reads token from cookie, sends in X-XSRF-TOKEN header
  - [ ] Test: POST request without XSRF-TOKEN header should return 403 Forbidden
  - [ ] Document CSRF setup in frontend API client configuration

- [ ] **Task 14: Update AuthService to Create Sessions on Login** (AC: #3)
  - [ ] Modify AuthService.login() method
  - [ ] After successful authentication and token generation:
    - Call sessionService.createSession(user, accessToken, refreshToken, request)
    - Store sessionId in response (optional, for reference)
  - [ ] Update LoginResponse DTO to include sessionId field
  - [ ] Ensure refresh token set in HTTP-only cookie (existing from Story 2.1)

- [ ] **Task 15: Implement Session Cleanup Scheduled Job** (AC: #11)
  - [ ] Create SessionCleanupService in com.ultrabms.service package
  - [ ] Implement cleanupExpiredSessions() method:
    - Delete expired sessions: sessionRepository.deleteByExpiresAtBefore(now - 1 hour)
    - Delete inactive sessions >24h old: DELETE WHERE is_active = false AND updated_at < now - 24h
    - Delete expired blacklist entries: blacklistRepository.deleteByExpiresAtBefore(now - 1 hour)
    - Cleanup old audit logs: DELETE FROM audit_logs WHERE created_at < now - 90 days
    - Log cleanup stats at INFO level
  - [ ] Annotate with @Scheduled(cron = "0 0 * * * *") for hourly execution
  - [ ] Annotate with @Transactional
  - [ ] Add @EnableScheduling to main application class or config

- [ ] **Task 16: Create Frontend Token Refresh Interceptor** (AC: #12)
  - [ ] Update lib/api.ts Axios configuration
  - [ ] Add response interceptor:
    ```typescript
    api.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401 && error.response?.data?.error?.code === 'ACCESS_TOKEN_EXPIRED') {
          // Refresh token logic
          const newAccessToken = await refreshAccessToken()
          error.config.headers.Authorization = `Bearer ${newAccessToken}`
          return api.request(error.config)
        }
        return Promise.reject(error)
      }
    )
    ```
  - [ ] Implement refreshAccessToken() function:
    - Call POST /api/v1/auth/refresh (refresh token in cookie)
    - Return new access token
    - If refresh fails, clear auth state, redirect to /login
  - [ ] Implement refresh lock to prevent concurrent refresh requests (use flag)
  - [ ] Store access token in React Context, not localStorage

- [ ] **Task 17: Create Session Expiry Warning Component** (AC: #13)
  - [ ] Create components/auth/SessionExpiryWarning.tsx
  - [ ] Use shadcn Dialog component for modal
  - [ ] Calculate expiry from JWT token exp claim
  - [ ] Show modal 5 minutes before expiry
  - [ ] Display countdown timer: "Session expires in 4:32"
  - [ ] Buttons: "Stay Logged In" (refresh token), "Logout"
  - [ ] If user doesn't respond, auto-logout after countdown reaches 0
  - [ ] Use useEffect with setInterval to check expiry every 10 seconds
  - [ ] Alternative: detect idle timeout using mouse/keyboard event listeners

- [ ] **Task 18: Create Active Sessions Management UI** (AC: #14)
  - [ ] Create app/(dashboard)/settings/security/page.tsx
  - [ ] Add "Active Sessions" section
  - [ ] Fetch sessions from GET /api/v1/auth/sessions on mount
  - [ ] Display in shadcn Table:
    - Columns: Device (icon + type), Browser, IP Address, Last Active (relative time), Actions
    - Parse userAgent to extract browser name (Chrome, Firefox, Safari, etc.)
    - Show "Current Session" badge for isCurrent = true
  - [ ] Implement revokeSession(sessionId) handler:
    - Call POST /api/v1/auth/sessions/{sessionId}/revoke
    - Show confirmation dialog: "Revoke session from {device}?"
    - Refresh session list on success
  - [ ] Add "Logout All Other Devices" button:
    - Calls POST /api/v1/auth/logout-all
    - Show confirmation: "This will log you out from {count} devices"
    - Excludes current session
  - [ ] Auto-refresh session list every 30 seconds using useEffect + setInterval
  - [ ] Style with shadcn components: Table, Badge, Button, AlertDialog

- [ ] **Task 19: Test Session Management Flow End-to-End** (AC: All)
  - [ ] Test session creation on login:
    - Login → Verify UserSession created in database
    - Verify sessionId returned in response
    - Verify access/refresh tokens hashed in user_sessions table
  - [ ] Test session activity tracking:
    - Login, make authenticated requests
    - Verify last_activity_at updates on each request
  - [ ] Test idle timeout:
    - Login, wait 31 minutes without requests
    - Make request → 401 with SESSION_EXPIRED_IDLE
    - Verify session marked inactive, tokens blacklisted
  - [ ] Test absolute timeout:
    - Login, make requests periodically
    - After 12 hours + 1 minute → 401 with SESSION_EXPIRED_ABSOLUTE
  - [ ] Test logout:
    - Login, call POST /api/v1/auth/logout
    - Verify session inactive, tokens blacklisted
    - Verify refresh token cookie cleared
    - Attempt to use old access token → 401
  - [ ] Test logout all devices:
    - Login from 3 devices (3 sessions)
    - Call logout-all from device 1
    - Verify sessions 2 and 3 invalidated
    - Device 1 remains active
  - [ ] Test concurrent session limit:
    - Login 3 times (max sessions)
    - Login 4th time
    - Verify oldest session deleted, only 3 active sessions remain
  - [ ] Test token refresh:
    - Wait for access token to expire (1 hour)
    - Frontend auto-refreshes token
    - Verify new access token obtained, request retried successfully
  - [ ] Test blacklist check:
    - Logout (token blacklisted)
    - Attempt to use blacklisted access token → 401
  - [ ] Test session revocation UI:
    - Login from 2 devices
    - From device 1, revoke device 2's session
    - Verify device 2 cannot make requests
  - [ ] Test security headers:
    - Make any API request
    - Verify headers present: X-Frame-Options, HSTS, CSP, etc.
  - [ ] Test CSRF protection:
    - POST request without X-XSRF-TOKEN → 403 Forbidden
    - POST with valid XSRF token → Success
  - [ ] Test cleanup job:
    - Create expired sessions (set expires_at to past)
    - Run scheduled job manually or wait for hourly trigger
    - Verify expired sessions deleted

- [ ] **Task 20: Update API Documentation** (AC: All)
  - [ ] Add Swagger annotations to session endpoints:
    - @Operation for logout, logout-all, sessions, revoke-session
    - @ApiResponse for 200, 401, 403 status codes
  - [ ] Document session management flow in backend/README.md:
    - Session lifecycle (creation, tracking, expiration, cleanup)
    - Timeout configurations
    - Token blacklist mechanism
    - Security headers and CSRF protection
  - [ ] Update frontend API client docs:
    - Token refresh interceptor setup
    - CSRF token handling
    - Session expiry warning component usage
  - [ ] Add troubleshooting guide:
    - Session expiry issues
    - Token refresh failures
    - CSRF token errors

## Dev Notes

### Architecture Alignment

This story implements robust session management and security enhancements as specified in the PRD and Architecture Document:

**JWT-Based Authentication:**
- **Token Lifecycle Management:** Access tokens (1 hour) and refresh tokens (7 days) with configurable expiration [Source: docs/architecture.md#jwt-based-authentication]
- **Stateless Authentication:** JWT tokens contain user claims (userId, email, role, permissions) for stateless API authentication [Source: docs/architecture.md#authentication--authorization]
- **Token Storage:** Access tokens in memory (frontend), refresh tokens in HTTP-only cookies [Source: docs/architecture.md#api-security]

**Session Management:**
- **Database-Backed Sessions:** user_sessions table tracks active sessions with IP, User-Agent, device type [Source: docs/architecture.md#security-architecture]
- **Timeout Configurations:** Idle timeout (30 min), absolute timeout (12 hours), configurable via properties [Source: docs/prd.md#3.1.1]
- **Concurrent Session Limits:** Maximum 3 active sessions per user, oldest session removed when limit exceeded [Source: docs/architecture.md#session-management]

**Security Requirements:**
- **Token Blacklisting:** Invalidated tokens stored in token_blacklist table with expiration for cleanup [Source: docs/architecture.md#api-security]
- **Security Headers:** X-Frame-Options, HSTS, CSP, X-XSS-Protection for defense-in-depth [Source: docs/architecture.md#security-architecture]
- **CSRF Protection:** Cookie-based CSRF tokens with SameSite=Strict attribute [Source: docs/architecture.md#api-security]
- **Audit Logging:** All session events (login, logout, timeout) logged to audit_logs table [Source: docs/architecture.md#audit-logging]

**Database Schema:**
- **Normalized Tables:** user_sessions and token_blacklist follow snake_case naming convention [Source: docs/architecture.md#database-naming]
- **Indexed Columns:** session_id, user_id, expires_at, token_hash indexed for fast lookup [Source: docs/architecture.md#database-optimization]
- **Foreign Keys:** user_id references users table with ON DELETE CASCADE for data integrity [Source: docs/architecture.md#data-integrity-rules]

**API Design:**
- **RESTful Endpoints:** Follow /api/v1 base URL with noun-based paths (logout, sessions) [Source: docs/architecture.md#rest-api-conventions]
- **Consistent Response Format:** All APIs return { success, data/error, timestamp } structure [Source: docs/architecture.md#api-response-format]
- **HTTP Status Codes:** 200 OK (success), 401 Unauthorized (expired token), 403 Forbidden (CSRF failure) [Source: docs/architecture.md#status-codes]

**Frontend Implementation:**
- **Next.js Middleware:** Server-side route protection with token validation [Source: docs/architecture.md#project-structure]
- **Axios Interceptors:** Automatic token refresh on 401 responses with retry logic [Source: docs/architecture.md#frontend-implementation-patterns]
- **shadcn/ui Components:** Dialog, Table, Badge, Button for session management UI [Source: docs/ux-design-specification.md#component-library-strategy]
- **React Context:** Global auth state management for access token and user info [Source: docs/architecture.md#state-management-pattern]

**Alignment with PRD:**
- **Session Timeout Controls:** Implements all timeout types specified in authentication requirements [Source: docs/prd.md#3.1.1]
- **Multi-Factor Session Security:** IP tracking, device fingerprinting, anomaly detection [Source: docs/prd.md#5.4]
- **User Session Management:** Active sessions UI for users to monitor and revoke sessions [Source: docs/prd.md#3.1.1]

### Project Structure Notes

**New Files and Packages:**
```
backend/
├── src/main/
│   ├── java/com/ultrabms/
│   │   ├── entity/
│   │   │   ├── UserSession.java (NEW: session tracking entity)
│   │   │   └── TokenBlacklist.java (NEW: invalidated tokens entity)
│   │   ├── repository/
│   │   │   ├── UserSessionRepository.java (NEW)
│   │   │   └── TokenBlacklistRepository.java (NEW)
│   │   ├── service/
│   │   │   ├── SessionService.java (NEW: session lifecycle management)
│   │   │   └── SessionCleanupService.java (NEW: scheduled cleanup)
│   │   ├── filter/
│   │   │   └── SessionActivityFilter.java (NEW: activity tracking filter)
│   │   ├── controller/
│   │   │   └── AuthController.java (UPDATED: add logout, sessions endpoints)
│   │   ├── dto/
│   │   │   ├── SessionDto.java (NEW: record)
│   │   │   └── LogoutResponse.java (NEW: record)
│   │   ├── config/
│   │   │   ├── SecurityProperties.java (NEW: @ConfigurationProperties)
│   │   │   └── SecurityConfig.java (UPDATED: headers, CSRF, filters)
│   │   └── security/
│   │       └── JwtAuthenticationFilter.java (UPDATED: blacklist check)
│   └── resources/
│       ├── application.yml (UPDATED: add security properties)
│       ├── application-dev.yml (UPDATED: session config)
│       └── db/migration/
│           ├── V15__create_user_sessions_table.sql (NEW)
│           └── V16__create_token_blacklist_table.sql (NEW)

frontend/
├── src/
│   ├── app/
│   │   └── (dashboard)/
│   │       └── settings/
│   │           └── security/
│   │               └── page.tsx (NEW: active sessions UI)
│   ├── components/
│   │   └── auth/
│   │       └── SessionExpiryWarning.tsx (NEW: expiry modal)
│   ├── lib/
│   │   └── api.ts (UPDATED: refresh interceptor)
│   └── contexts/
│       └── AuthContext.tsx (UPDATED: session state)
```

**Database Schema:**
```sql
-- user_sessions table
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  access_token_hash VARCHAR(255),
  refresh_token_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(50),
  user_agent VARCHAR(500),
  device_type VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  version BIGINT DEFAULT 0
);

CREATE UNIQUE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity_at);

-- token_blacklist table
CREATE TABLE token_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  token_type VARCHAR(20) NOT NULL CHECK (token_type IN ('ACCESS', 'REFRESH')),
  expires_at TIMESTAMP NOT NULL,
  reason VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_token_blacklist_token_hash ON token_blacklist(token_hash);
CREATE INDEX idx_token_blacklist_expires_at ON token_blacklist(expires_at);
```

**Session Configuration (application.yml):**
```yaml
app:
  security:
    jwt:
      access-token-expiration: 3600 # 1 hour
      refresh-token-expiration: 604800 # 7 days
    session:
      idle-timeout: 1800 # 30 minutes
      absolute-timeout: 43200 # 12 hours
      max-concurrent-sessions: 3
```

**Token Hashing Pattern:**
```java
// Hash tokens before storing (security: prevent token theft from DB)
import org.springframework.security.crypto.bcrypt.BCrypt;

String tokenHash = BCrypt.hashpw(token, BCrypt.gensalt());

// To verify token against hash
boolean isValid = BCrypt.checkpw(token, storedHash);
```

**Session Activity Filter Pattern:**
```java
@Component
@RequiredArgsConstructor
public class SessionActivityFilter extends OncePerRequestFilter {
    private final SessionService sessionService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                   HttpServletResponse response,
                                   FilterChain filterChain) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String token = extractToken(request);
            sessionService.updateSessionActivity(token);
        }
        filterChain.doFilter(request, response);
    }
}
```

**Frontend Token Refresh Pattern:**
```typescript
// Axios interceptor for automatic token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 &&
        error.response?.data?.error?.code === 'ACCESS_TOKEN_EXPIRED') {
      const newToken = await refreshAccessToken()
      error.config.headers.Authorization = `Bearer ${newToken}`
      return api.request(error.config) // Retry with new token
    }
    return Promise.reject(error)
  }
)
```

### Learnings from Previous Story

**From Story 2-3-password-reset-and-recovery-workflow (Status: in-progress):**

Story 2.3 established critical infrastructure and patterns that Story 2.4 builds upon:

- **Scheduled Cleanup Pattern:** PasswordResetCleanupService with @Scheduled hourly job - replicate for SessionCleanupService [Source: docs/sprint-artifacts/2-3-password-reset-and-recovery-workflow.md#task-11]
- **Token Management Tables:** password_reset_tokens table with expires_at and used fields - similar pattern for user_sessions with is_active [Source: docs/sprint-artifacts/2-3-password-reset-and-recovery-workflow.md#task-1]
- **Rate Limiting Table Pattern:** password_reset_attempts table tracks attempt counts - can adapt for session anomaly detection [Source: docs/sprint-artifacts/2-3-password-reset-and-recovery-workflow.md#task-3]
- **Email Service Available:** EmailService ready for session notifications (new login alerts, suspicious activity) [Source: docs/sprint-artifacts/2-3-password-reset-and-recovery-workflow.md#task-6]
- **Security Token Generation:** SecureRandom pattern established for reset tokens - use for sessionId generation [Source: docs/sprint-artifacts/2-3-password-reset-and-recovery-workflow.md#completion-notes]
- **Database Migration Versioning:** V13, V14 used - continue with V15, V16 for session tables [Source: docs/sprint-artifacts/2-3-password-reset-and-recovery-workflow.md#file-list]

**From Story 2-2-role-based-access-control-rbac-implementation (Status: in-progress):**

Story 2.2 established permission and audit infrastructure:

- **Audit Logging Service:** AuditLogService with methods to log user actions - use for session events (login, logout, timeout) [Source: docs/sprint-artifacts/2-2-role-based-access-control-rbac-implementation.md#task-10]
- **GlobalExceptionHandler Extended:** Handles authorization exceptions - extend for session expiry exceptions [Source: docs/sprint-artifacts/2-2-role-based-access-control-rbac-implementation.md#task-11]
- **Spring Security Configuration:** SecurityConfig already configured - add security headers and CSRF to existing config [Source: docs/sprint-artifacts/2-2-role-based-access-control-rbac-implementation.md#task-4]

**From Story 2-1-user-registration-and-login-with-jwt-authentication (Status: in-progress):**

Story 2.1 established core authentication that Story 2.4 enhances:

- **JwtTokenProvider Service:** Generates and validates JWT tokens - extend with configurable expiration from SecurityProperties [Source: docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md#task-3]
- **RefreshToken Entity & Repository:** Manages refresh tokens - use to delete user's tokens on logout-all [Source: docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md#task-5]
- **AuthController Endpoints:** Login and refresh endpoints exist - add logout, logout-all, sessions endpoints [Source: docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md#task-4]
- **JwtAuthenticationFilter:** Validates JWT on requests - extend to check token_blacklist [Source: docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md#task-8]
- **HTTP-Only Refresh Token Cookie:** Already set in login response - clear on logout [Source: docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md#task-4]
- **AuthService:** Handles login logic - integrate sessionService.createSession() after successful auth [Source: docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md#task-6]

**Key Architectural Continuity:**
- **Filter Chain Integration:** SessionActivityFilter added after JwtAuthenticationFilter in Spring Security filter chain
- **Constructor Injection:** Use @RequiredArgsConstructor for SessionService, SessionCleanupService
- **Record-Based DTOs:** Use Java 17 records for SessionDto, LogoutResponse (consistent with Story 2.1-2.3 pattern)
- **Repository Query Methods:** Follow Spring Data JPA naming conventions (findByUserIdAndIsActiveTrue, deleteByExpiresAtBefore)
- **Scheduled Job Pattern:** Same @Scheduled(cron) pattern as PasswordResetCleanupService

**Files to Extend/Reuse:**
- `AuthController` → Add logout, logout-all, sessions, revoke-session endpoints
- `JwtAuthenticationFilter` → Add token blacklist check before validating JWT
- `AuthService` → Integrate sessionService.createSession() in login method
- `SecurityConfig` → Add security headers, CSRF config, register SessionActivityFilter
- `GlobalExceptionHandler` → Add handlers for session expiry exceptions
- `RefreshTokenRepository` → Delete user's refresh tokens on logout-all
- `AuditLogRepository` → Log session events (logout, timeout, suspicious login)

**No Technical Debt from Previous Stories:**
- Story 2.1 JWT infrastructure is solid
- Story 2.2 RBAC and audit logging ready
- Story 2.3 cleanup job pattern well-established
- No conflicts between stories

**Important Integration Points:**
- When user changes password (Story 2.3), invalidate all sessions and add tokens to blacklist
- Session management respects role-based permissions (Story 2.2)
- Audit logging captures session lifecycle for compliance

### Testing Strategy

**Unit Testing:**
- **SessionService:** Test session creation, activity updates, timeout checks, concurrent session limit enforcement, session invalidation
- **SessionActivityFilter:** Test filter logic with authenticated/unauthenticated requests, idle timeout detection, absolute timeout detection
- **UserSession Entity:** Test isExpired(), isIdle() helper methods with various timestamps
- **TokenBlacklist Repository:** Test existsByTokenHash() query performance
- **SecurityProperties:** Test @ConfigurationProperties binding from application.yml
- **Device Detection:** Test getDeviceType() parsing from various User-Agent strings

**Integration Testing:**
- **Session Creation on Login:**
  - Login → Verify UserSession created with correct fields (sessionId, IP, User-Agent, timestamps)
  - Verify tokens hashed before storage
  - Verify max 3 concurrent sessions enforced
- **Logout Endpoint:**
  - POST /api/v1/auth/logout → Verify session inactive, tokens blacklisted, cookie cleared
  - Attempt to use logged-out token → 401 Unauthorized
- **Logout All Devices:**
  - Create 3 sessions for user
  - POST /api/v1/auth/logout-all → Verify all sessions invalidated except current
  - Test other sessions receive 401 on next request
- **Session Activity Tracking:**
  - Login, make requests → Verify last_activity_at updates
  - Wait 31 minutes → Next request returns 401 SESSION_EXPIRED_IDLE
- **Absolute Timeout:**
  - Mock time to 12 hours + 1 minute after login
  - Request → 401 SESSION_EXPIRED_ABSOLUTE
- **Token Blacklist Check:**
  - Logout (token blacklisted)
  - Attempt request with blacklisted token → 401
- **Active Sessions Endpoint:**
  - GET /api/v1/auth/sessions → Returns list of active sessions
  - POST /api/v1/auth/sessions/{sessionId}/revoke → Revokes specific session
- **Security Headers:**
  - Make any request → Verify X-Frame-Options, HSTS, CSP headers present
- **CSRF Protection:**
  - POST without XSRF-TOKEN → 403 Forbidden
  - POST with valid XSRF-TOKEN → Success
- **Cleanup Job:**
  - Create expired sessions
  - Run @Scheduled method → Verify cleanup
- **Token Refresh Flow:**
  - Access token expires → Frontend auto-refreshes → Verify new token obtained and request retried

**Manual Testing Checklist:**

1. **Session Creation and Tracking:**
   - Login from browser → Verify session created in database
   - Check sessionId, IP address, User-Agent stored correctly
   - Make API requests → Verify last_activity_at updates in real-time
   - Query database: `SELECT * FROM user_sessions WHERE user_id = ?`

2. **Concurrent Session Limit:**
   - Login from Chrome (session 1)
   - Login from Firefox (session 2)
   - Login from Safari (session 3)
   - Login from Edge (session 4) → Verify session 1 deleted automatically
   - Attempt request from Chrome → 401 (session invalidated)
   - Query: `SELECT COUNT(*) FROM user_sessions WHERE user_id = ? AND is_active = true` → Should be 3

3. **Idle Timeout:**
   - Login
   - Wait 31 minutes without making requests
   - Make any authenticated request → 401 with error code SESSION_EXPIRED_IDLE
   - Verify session marked inactive in database
   - Verify token added to blacklist

4. **Absolute Timeout:**
   - Login at 9:00 AM
   - Make requests periodically (keep session active)
   - At 9:01 PM (12 hours + 1 minute) → Make request → 401 SESSION_EXPIRED_ABSOLUTE
   - Verify session invalidated

5. **Logout Flow:**
   - Login, get access token
   - Call POST /api/v1/auth/logout
   - Verify response: { success: true, message: "Logged out successfully" }
   - Verify refresh token cookie cleared (check browser dev tools)
   - Attempt to use old access token → 401
   - Check database: session is_active = false, tokens in blacklist

6. **Logout All Devices:**
   - Login from 3 browsers (3 sessions)
   - From browser 1, navigate to /settings/security
   - Click "Logout All Other Devices"
   - Confirm dialog → Click "Yes"
   - Verify success message shows "Logged out from 2 devices"
   - From browser 2, make request → 401
   - From browser 1, make request → Still works (current session preserved)

7. **Active Sessions Management UI:**
   - Login from multiple devices
   - Navigate to /settings/security
   - Verify "Active Sessions" table shows:
     - Device type icons (Desktop, Mobile, Tablet)
     - Browser name (Chrome, Firefox, Safari)
     - IP address
     - Last active (relative time: "2 minutes ago")
     - Current session badge
   - Click "Revoke" on another session
   - Confirm dialog → Session disappears from list
   - From revoked device, make request → 401

8. **Token Refresh:**
   - Login
   - Wait for access token to expire (1 hour) OR manually set short expiration for testing
   - Make API request
   - Observe: Request fails with 401 → Frontend calls /auth/refresh → New token obtained → Request retried automatically
   - User should not notice interruption

9. **Session Expiry Warning Modal:**
   - Login
   - Wait 55 minutes (5 minutes before expiry)
   - Modal appears: "Your session will expire in 5 minutes. Stay logged in?"
   - Click "Stay Logged In" → Token refreshed, modal closes
   - Alternative: Wait for countdown to reach 0 → Auto-logout, redirect to login

10. **Security Headers:**
    - Open browser dev tools → Network tab
    - Make any API request
    - Check response headers:
      - X-Frame-Options: DENY
      - Strict-Transport-Security: max-age=31536000; includeSubDomains
      - X-Content-Type-Options: nosniff
      - X-XSS-Protection: 1; mode=block
      - Content-Security-Policy: default-src 'self'; ...

11. **CSRF Protection:**
    - Use curl or Postman
    - POST to /api/v1/tenants without XSRF-TOKEN header → 403 Forbidden
    - Include XSRF-TOKEN header (read from cookie) → 200 OK
    - Verify XSRF-TOKEN cookie set by server

12. **Cleanup Job:**
    - Manually create expired sessions in database:
      ```sql
      UPDATE user_sessions SET expires_at = NOW() - INTERVAL '2 hours' WHERE id = ?;
      ```
    - Wait for hourly job OR manually trigger @Scheduled method
    - Check logs: "Cleaned up X expired sessions and Y blacklist entries"
    - Verify expired sessions deleted from database

13. **IP-Based Anomaly Detection (Optional AC15):**
    - Login from IP 1 (e.g., home)
    - Logout
    - Login from IP 2 (e.g., VPN, different location)
    - Check email: "New login detected from {IP2} in {Location}"
    - Email includes device, browser, login time
    - Click "Secure your account" link → Navigate to revoke sessions page

**Error Scenarios:**
- Network error during session creation → Return error to user
- Database connection failure → 500 Internal Server Error
- Invalid sessionId in revoke request → 404 Not Found
- Attempt to revoke another user's session → 403 Forbidden (security check)

**Frontend Testing:**
- Test all UI components with shadcn dark mode
- Test responsive design on mobile/tablet for session management page
- Test keyboard navigation (Tab through session list, Revoke buttons)
- Test screen reader accessibility
- Test with slow network (loading states for session list)

**Performance Testing:**
- Simulate 100 concurrent users logging in → Verify session creation performance
- Query active sessions for user with 100+ sessions → Should be fast (indexed queries)
- Token blacklist check on every request → Should not significantly impact response time (indexed lookup)

**Test Levels:**
- **L1 (Unit):** Service methods, entity helpers, filter logic, DTO mapping
- **L2 (Integration):** All endpoints with MockMvc, scheduled cleanup, filter chain integration
- **L3 (Manual):** Full session lifecycle, UI interactions, security header verification (REQUIRED for acceptance)

### References

- [Epic 2: Story 2.4 - Session Management and Security Enhancements](docs/epics/epic-2-authentication-user-management.md#story-24-session-management-and-security-enhancements)
- [PRD: User Authentication - Session Management](docs/prd.md#3.1.1)
- [PRD: Security Requirements](docs/prd.md#5.4)
- [Architecture: JWT-Based Authentication](docs/architecture.md#jwt-based-authentication)
- [Architecture: Security Architecture](docs/architecture.md#security-architecture)
- [Architecture: API Security - Rate Limiting](docs/architecture.md#api-security)
- [Architecture: Session Management](docs/architecture.md#session-management)
- [Story 2.1: User Registration and Login with JWT Authentication](docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md)
- [Story 2.2: Role-Based Access Control (RBAC) Implementation](docs/sprint-artifacts/2-2-role-based-access-control-rbac-implementation.md)
- [Story 2.3: Password Reset and Recovery Workflow](docs/sprint-artifacts/2-3-password-reset-and-recovery-workflow.md)
- [UX Design: Session Management Patterns](docs/ux-design-specification.md#session-management)

## Dev Agent Record

### Context Reference

- [Story Context XML](stories/2-4-session-management-and-security-enhancements.context.xml) - Generated 2025-11-14

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
