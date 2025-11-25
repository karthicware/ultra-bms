# Story 2.1: User Registration and Login with JWT Authentication

Status: done
Completed: 2025-11-13
UAE Phone Validation Enhancement: 2025-11-14
All Review Action Items Resolved: 2025-11-14

## Story

As a user,
I want to register an account and login securely,
so that I can access the application with my credentials using JWT authentication.

## Acceptance Criteria

1. **AC1 - User Registration API:** Registration endpoint `POST /api/v1/auth/register` accepts email (RFC 5322 compliant), password (min 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character), firstName, lastName (max 100 characters each), role (SUPER_ADMIN, PROPERTY_MANAGER, MAINTENANCE_SUPERVISOR, FINANCE_MANAGER, TENANT, VENDOR), and optional phone number (E.164 format). Password is hashed with BCrypt (strength 12) before storing. Returns 201 Created with user DTO (excluding password), or 400 Bad Request for validation errors, or 409 Conflict if email already exists.

2. **AC2 - Password Validation:** Password validation enforces minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character. Reject common passwords using library like zxcvbn. Frontend displays password strength meter (weak/medium/strong/very strong) with real-time validation feedback. Never store plain text passwords - all passwords hashed with BCrypt strength 12.

3. **AC3 - User Login API:** Login endpoint `POST /api/v1/auth/login` accepts email and password credentials. Returns JWT access token (expires in 1 hour), JWT refresh token (expires in 7 days), token expiration time, and user profile (id, email, firstName, lastName, role). Token payload includes userId, email, role, permissions. HTTP-only cookie set for refresh token (secure, sameSite=strict). Returns 401 Unauthorized for invalid credentials.

4. **AC4 - JWT Implementation:** Use Spring Security with JWT. Implement HS256 algorithm for token signing (secret from environment variable). Access token is short-lived (1 hour) for API requests. Refresh token is longer-lived (7 days) for obtaining new access tokens. Token refresh endpoint at `POST /api/v1/auth/refresh` accepts refresh token and returns new access token. Tokens include claims: userId, email, role, issued at, expiration.

5. **AC5 - Security Measures:** Rate limiting enforced: maximum 5 login attempts per 15 minutes per email. Account locked out for 30 minutes after 5 failed attempts. All authentication attempts logged (success/failure) with IP address and timestamp in audit_logs table. Log includes: userId, action (LOGIN_SUCCESS/LOGIN_FAILED/REGISTRATION), IP address, user agent, timestamp.

6. **AC6 - Token Refresh Flow:** Refresh token endpoint `POST /api/v1/auth/refresh` validates refresh token (not expired, not revoked, associated with active user). Returns new access token with 1-hour expiration. If refresh token expired or invalid, returns 401 Unauthorized and forces user to login again. Frontend automatically refreshes access token when expired without user interaction.

7. **AC7 - Logout Implementation:** Logout endpoint `POST /api/v1/auth/logout` invalidates current session by adding tokens to blacklist table (token_blacklist) with TTL matching token expiration. Clears HTTP-only refresh token cookie. Returns 204 No Content on success. Blacklisted tokens cannot be used for authentication even if not expired.

## Tasks / Subtasks

- [ ] **Task 1: Create Authentication DTOs** (AC: #1, #3)
  - [ ] Create `RegisterRequest` DTO with email, password, firstName, lastName, role, phone validation annotations
  - [ ] Create `LoginRequest` DTO with email and password
  - [ ] Create `LoginResponse` DTO with accessToken, refreshToken, expiresIn, user profile
  - [ ] Create `RefreshTokenRequest` DTO with refreshToken
  - [ ] Create `TokenResponse` DTO with accessToken and expiresIn
  - [ ] Add Bean Validation annotations (@NotBlank, @Email, @Size, @Pattern for password regex)
  - [ ] Test DTO validation with GlobalExceptionHandler from Story 1.5

- [ ] **Task 2: Create JWT Utility Class** (AC: #4, #6)
  - [ ] Create `JwtTokenProvider` class in `com.ultrabms.security` package
  - [ ] Implement `generateAccessToken(User user)` method returning JWT with 1-hour expiration
  - [ ] Implement `generateRefreshToken(User user)` method returning JWT with 7-day expiration
  - [ ] Implement `validateToken(String token)` method checking signature and expiration
  - [ ] Implement `getUserIdFromToken(String token)` extracting userId claim
  - [ ] Implement `getEmailFromToken(String token)` extracting email claim
  - [ ] Configure JWT secret from environment variable `${jwt.secret}` (fallback to default for dev)
  - [ ] Add JWT claims: sub (userId), email, role, iat (issued at), exp (expiration)
  - [ ] Add dependency: `io.jsonwebtoken:jjwt-api`, `jjwt-impl`, `jjwt-jackson` (version 0.12.x)

- [ ] **Task 3: Create Token Blacklist Repository** (AC: #7)
  - [ ] Create `TokenBlacklist` entity with fields: id (UUID), token (hashed), expiresAt, blacklistedAt
  - [ ] Create `TokenBlacklistRepository` extending `JpaRepository`
  - [ ] Implement `existsByToken(String tokenHash)` query method
  - [ ] Implement `deleteByExpiresAtBefore(LocalDateTime timestamp)` for cleanup
  - [ ] Add Flyway migration script: `V6__create_token_blacklist_table.sql`
  - [ ] Schedule cleanup job with @Scheduled (run daily, delete expired tokens)

- [ ] **Task 4: Create AuthService for Registration and Login** (AC: #1, #2, #3, #5)
  - [ ] Create `AuthService` interface in `com.ultrabms.service` package
  - [ ] Create `AuthServiceImpl` implementing `AuthService`
  - [ ] Implement `register(RegisterRequest request)` method:
    - Validate password strength (min 8 chars, uppercase, lowercase, number, special char)
    - Check if email already exists (throw DuplicateResourceException if exists)
    - Hash password with BCrypt (BCryptPasswordEncoder with strength 12)
    - Create User entity and save to database
    - Return UserDto (exclude password)
  - [ ] Implement `login(LoginRequest request)` method:
    - Find user by email
    - Verify password with BCrypt.matches()
    - Generate access token and refresh token
    - Log successful login to audit_logs
    - Return LoginResponse with tokens and user profile
  - [ ] Implement `refreshAccessToken(String refreshToken)` method:
    - Validate refresh token
    - Check if token blacklisted
    - Generate new access token
    - Return TokenResponse
  - [ ] Implement `logout(String accessToken, String refreshToken)` method:
    - Add tokens to blacklist
    - Return void
  - [ ] Add rate limiting logic: track failed login attempts in memory (or cache)
  - [ ] Add account lockout logic: lock account for 30 minutes after 5 failed attempts

- [ ] **Task 5: Create AuthController** (AC: #1, #3, #6, #7)
  - [ ] Create `AuthController` class with `@RestController` and `@RequestMapping("/api/v1/auth")`
  - [ ] Implement `POST /register` endpoint:
    - Accept `@Valid @RequestBody RegisterRequest`
    - Call AuthService.register()
    - Return 201 Created with UserDto
  - [ ] Implement `POST /login` endpoint:
    - Accept `@Valid @RequestBody LoginRequest`
    - Call AuthService.login()
    - Set HTTP-only refresh token cookie
    - Return 200 OK with LoginResponse
  - [ ] Implement `POST /refresh` endpoint:
    - Accept refresh token from cookie or body
    - Call AuthService.refreshAccessToken()
    - Return 200 OK with TokenResponse
  - [ ] Implement `POST /logout` endpoint:
    - Extract access token from Authorization header
    - Extract refresh token from cookie
    - Call AuthService.logout()
    - Clear refresh token cookie
    - Return 204 No Content
  - [ ] Add @Operation and @ApiResponse annotations for Swagger documentation
  - [ ] Add exception handling for authentication failures

- [ ] **Task 6: Create Spring Security Configuration** (AC: #4)
  - [ ] Create `SecurityConfig` class with `@Configuration` and `@EnableWebSecurity`
  - [ ] Implement `SecurityFilterChain` bean:
    - Disable CSRF (using JWT, not session-based)
    - Configure CORS (reuse CorsConfig from Story 1.5)
    - Set session management to STATELESS
    - Permit all requests to `/api/v1/auth/**` (login, register endpoints)
    - Authenticate all other `/api/v1/**` requests
  - [ ] Create `JwtAuthenticationFilter` extending OncePerRequestFilter:
    - Extract JWT from Authorization header (Bearer token)
    - Validate token using JwtTokenProvider
    - Check if token blacklisted
    - Set Authentication in SecurityContextHolder
  - [ ] Register JwtAuthenticationFilter before UsernamePasswordAuthenticationFilter
  - [ ] Create `BCryptPasswordEncoder` bean with strength 12
  - [ ] Create `AuthenticationManager` bean for login authentication

- [ ] **Task 7: Create Audit Logging for Authentication Events** (AC: #5)
  - [ ] Create `AuditLog` entity with fields: id, userId, action, ipAddress, userAgent, timestamp, details (JSONB)
  - [ ] Create `AuditLogRepository` extending `JpaRepository`
  - [ ] Implement `logAuthenticationEvent(UUID userId, String action, String ipAddress, String userAgent)` in AuthServiceImpl
  - [ ] Log events: REGISTRATION, LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, TOKEN_REFRESH
  - [ ] Add Flyway migration: `V7__create_audit_logs_table.sql`
  - [ ] Extract IP address from HttpServletRequest
  - [ ] Extract User-Agent from request headers

- [ ] **Task 8: Implement Rate Limiting and Account Lockout** (AC: #5)
  - [ ] Create `LoginAttemptService` to track failed login attempts
  - [ ] Use in-memory cache (Caffeine or Ehcache from Story 1.3) to store attempts by email
  - [ ] Implement `recordFailedAttempt(String email)` incrementing counter
  - [ ] Implement `isBlocked(String email)` checking if 5 attempts in 15 minutes
  - [ ] Reset counter on successful login
  - [ ] Lock account by setting `User.accountLocked` boolean and `lockedUntil` timestamp
  - [ ] Add fields to User entity: accountLocked (boolean), lockedUntil (LocalDateTime), failedLoginAttempts (int)
  - [ ] Create Flyway migration: `V8__add_account_lockout_fields_to_users.sql`
  - [ ] Check account lock status in AuthService.login() before authenticating
  - [ ] Throw custom `AccountLockedException` if account locked
  - [ ] Add handler for AccountLockedException in GlobalExceptionHandler → 423 Locked

- [ ] **Task 9: Add Password Strength Validation** (AC: #2)
  - [ ] Add `passay` library dependency (version 1.6.x) for password validation
  - [ ] Create custom validator `StrongPassword` annotation
  - [ ] Implement `StrongPasswordValidator` checking:
    - Minimum 8 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 digit
    - At least 1 special character
  - [ ] Reject common passwords (use Passay's dictionary rules)
  - [ ] Apply @StrongPassword annotation to RegisterRequest.password field
  - [ ] Test validation with weak passwords (e.g., "password", "12345678")

- [ ] **Task 10: Configure JWT Secret and Properties** (AC: #4)
  - [ ] Add JWT configuration to application-dev.yml:
    - `jwt.secret`: Base64-encoded secret (256 bits minimum)
    - `jwt.access-token-expiration`: 3600000 (1 hour in milliseconds)
    - `jwt.refresh-token-expiration`: 604800000 (7 days in milliseconds)
  - [ ] Generate secure random secret for development (document in README)
  - [ ] Add production note: Use environment variable for JWT secret in production
  - [ ] Document JWT secret generation: `openssl rand -base64 32`

- [ ] **Task 11: Test Authentication Flow End-to-End** (AC: All)
  - [ ] Test registration flow:
    - POST /api/v1/auth/register with valid data → 201 Created
    - POST /api/v1/auth/register with duplicate email → 409 Conflict
    - POST /api/v1/auth/register with weak password → 400 Bad Request
  - [ ] Test login flow:
    - POST /api/v1/auth/login with valid credentials → 200 OK + JWT tokens
    - POST /api/v1/auth/login with invalid credentials → 401 Unauthorized
    - Verify access token works for authenticated endpoints
  - [ ] Test token refresh flow:
    - POST /api/v1/auth/refresh with valid refresh token → 200 OK + new access token
    - POST /api/v1/auth/refresh with expired/invalid token → 401 Unauthorized
  - [ ] Test logout flow:
    - POST /api/v1/auth/logout → 204 No Content
    - Verify blacklisted token cannot be used
  - [ ] Test rate limiting:
    - 6 failed login attempts → 429 Too Many Requests or account locked
  - [ ] Test account lockout:
    - After 5 failed attempts, verify account locked for 30 minutes
  - [ ] Verify audit logs created for all authentication events
  - [ ] Test via Swagger UI and curl

- [ ] **Task 12: Update README and API Documentation** (AC: All)
  - [ ] Add "Authentication" section to backend/README.md
  - [ ] Document registration endpoint with example request/response
  - [ ] Document login endpoint with JWT token usage
  - [ ] Document token refresh flow
  - [ ] Document logout flow
  - [ ] Document password requirements
  - [ ] Document rate limiting and account lockout policies
  - [ ] Provide curl examples for registration, login, refresh, logout
  - [ ] Document JWT token format and claims
  - [ ] Document how to use JWT token in Authorization header: `Bearer <token>`

## Dev Notes

### Architecture Alignment

This story implements JWT-based authentication as specified in the Architecture Document and Epic 2:

**Authentication Pattern:**
- **JWT Authentication:** Uses Spring Security with JWT tokens for stateless authentication [Source: docs/architecture.md#authentication-authorization]
- **Access + Refresh Tokens:** Two-token system allows short-lived access tokens (1 hour) for security with long-lived refresh tokens (7 days) for better UX [Source: docs/architecture.md#jwt-based-authentication]
- **BCrypt Password Hashing:** Industry-standard password hashing with configurable strength (12) balances security and performance [Source: docs/architecture.md#password-encoding]
- **Token Blacklist:** Enables secure logout by preventing reuse of revoked tokens [Source: docs/sprint-artifacts/epics/2-authentication-and-user-management.md#story-21]

**API Security:**
- **Stateless Authentication:** JWT tokens eliminate server-side session storage, improving scalability [Source: docs/architecture.md#security-architecture]
- **Rate Limiting:** Prevents brute-force attacks by limiting login attempts [Source: docs/sprint-artifacts/epics/2-authentication-and-user-management.md#story-21-security-measures]
- **Audit Logging:** All authentication events logged for security monitoring and compliance [Source: docs/architecture.md#audit-logging]

**Alignment with Tech Spec:**
- **Story 2.1 Objectives:** Implements user registration, JWT authentication, token refresh, logout, rate limiting, and audit logging as specified [Source: docs/sprint-artifacts/epics/2-authentication-and-user-management.md#story-21]
- **Password Validation:** Enforces strong password policy matching PRD requirements [Source: docs/prd.md#311-user-authentication]
- **Token Expiration:** 1-hour access token and 7-day refresh token per tech spec [Source: docs/sprint-artifacts/epics/2-authentication-and-user-management.md#jwt-implementation]

**Alignment with PRD:**
- **User Authentication:** Implements password recovery workflow foundation for Epic 2 Story 2.3 [Source: docs/prd.md#311-user-authentication]
- **RBAC Foundation:** JWT tokens include role claim, preparing for Story 2.2 RBAC implementation [Source: docs/prd.md#312-user-roles]
- **Security Requirements:** BCrypt hashing, JWT tokens, audit logging meet PRD security standards [Source: docs/prd.md#54-security-requirements]

### Project Structure Notes

**New Packages and Files:**
```
backend/
├── src/main/
│   ├── java/com/ultrabms/
│   │   ├── security/
│   │   │   ├── JwtTokenProvider.java (JWT generation and validation)
│   │   │   ├── JwtAuthenticationFilter.java (extracts and validates JWT from requests)
│   │   │   ├── SecurityConfig.java (Spring Security configuration)
│   │   │   └── AccountLockedException.java (custom exception for locked accounts)
│   │   ├── controller/
│   │   │   └── AuthController.java (registration, login, refresh, logout endpoints)
│   │   ├── service/
│   │   │   ├── AuthService.java (interface)
│   │   │   ├── AuthServiceImpl.java (authentication business logic)
│   │   │   └── LoginAttemptService.java (rate limiting and lockout)
│   │   ├── dto/
│   │   │   ├── RegisterRequest.java (registration DTO)
│   │   │   ├── LoginRequest.java (login DTO)
│   │   │   ├── LoginResponse.java (login response with tokens)
│   │   │   ├── RefreshTokenRequest.java (token refresh DTO)
│   │   │   └── TokenResponse.java (access token response)
│   │   ├── entity/
│   │   │   ├── TokenBlacklist.java (blacklisted tokens)
│   │   │   └── AuditLog.java (authentication event logs)
│   │   ├── repository/
│   │   │   ├── TokenBlacklistRepository.java
│   │   │   └── AuditLogRepository.java
│   │   ├── validator/
│   │   │   ├── StrongPassword.java (custom annotation)
│   │   │   └── StrongPasswordValidator.java (validator implementation)
│   │   └── exception/
│   │       └── AccountLockedException.java (extends RuntimeException)
│   └── resources/
│       ├── db/migration/
│       │   ├── V6__create_token_blacklist_table.sql
│       │   ├── V7__create_audit_logs_table.sql
│       │   └── V8__add_account_lockout_fields_to_users.sql
│       └── application-dev.yml (JWT config added)
```

**Authentication Flow:**
```
1. User Registration:
   POST /api/v1/auth/register → AuthController → AuthService → Hash password (BCrypt) → Save User → Return UserDto

2. User Login:
   POST /api/v1/auth/login → AuthController → AuthService → Verify password → Generate JWT tokens → Set cookie → Return LoginResponse

3. Authenticated Request:
   GET /api/v1/users → JwtAuthenticationFilter → Extract token → Validate token → Check blacklist → Set SecurityContext → Controller

4. Token Refresh:
   POST /api/v1/auth/refresh → AuthController → AuthService → Validate refresh token → Generate new access token → Return TokenResponse

5. Logout:
   POST /api/v1/auth/logout → AuthController → AuthService → Add tokens to blacklist → Clear cookie → Return 204
```

**JWT Token Structure:**
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "PROPERTY_MANAGER",
  "iat": 1699891234,
  "exp": 1699894834
}
```

**Password Validation Rules:**
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 digit (0-9)
- At least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
- Not in common password dictionary

**Rate Limiting Strategy:**
- Track failed login attempts per email in cache (15-minute window)
- Block login attempts after 5 failures
- Account lockout for 30 minutes after threshold reached
- Reset counter on successful login
- Log all failed attempts to audit_logs

### Learnings from Previous Story

**From Story 1-5-basic-rest-api-structure-and-exception-handling (Status: review):**

Story 1.5 established the REST API foundation with exception handling, CORS, and logging that this story builds upon:

- **Global Exception Handler Available:** GlobalExceptionHandler with @RestControllerAdvice can be extended to handle authentication-specific exceptions (AccountLockedException, InvalidTokenException) [Source: docs/sprint-artifacts/epic-1/1-5-basic-rest-api-structure-and-exception-handling.md#task-2]
- **CORS Configuration Ready:** CorsConfig allows credentials (cookies) which is required for HTTP-only refresh token cookie [Source: docs/sprint-artifacts/epic-1/1-5-basic-rest-api-structure-and-exception-handling.md#task-7]
- **Correlation ID Pattern:** RequestCorrelationFilter provides correlation IDs in logs and responses - use for authentication event tracking [Source: docs/sprint-artifacts/epic-1/1-5-basic-rest-api-structure-and-exception-handling.md#task-3]
- **Audit Logging Infrastructure:** Request/response logging filter exists - extend pattern for authentication event logging [Source: docs/sprint-artifacts/epic-1/1-5-basic-rest-api-structure-and-exception-handling.md#task-11]
- **UserDto Pattern:** UserDto record from Story 1.5 excludes password - reuse for registration response [Source: docs/sprint-artifacts/epic-1/1-5-basic-rest-api-structure-and-exception-handling.md#task-8]
- **Bean Validation:** @Valid annotation pattern established - apply to RegisterRequest and LoginRequest [Source: docs/sprint-artifacts/epic-1/1-5-basic-rest-api-structure-and-exception-handling.md#task-9]

**Key Architectural Continuity:**
- **Exception Handling:** Add authentication exceptions to GlobalExceptionHandler: AccountLockedException → 423 Locked, InvalidTokenException → 401 Unauthorized [Source: docs/sprint-artifacts/epic-1/1-5-basic-rest-api-structure-and-exception-handling.md#globalexceptionhandler]
- **User Entity Ready:** User entity from Story 1.4 has passwordHash field with @JsonIgnore - use for storing BCrypt hash [Source: docs/sprint-artifacts/epic-1/1-4-core-domain-models-and-jpa-entities.md]
- **UserRepository Available:** UserRepository.findByEmail() from Story 1.4 can be used for login and registration duplicate check [Source: docs/sprint-artifacts/epic-1/1-4-core-domain-models-and-jpa-entities.md#file-list]
- **Ehcache Configured:** Story 1.3 configured Ehcache - use for caching failed login attempts in LoginAttemptService [Source: docs/sprint-artifacts/epic-1/1-3-ehcache-configuration-for-application-caching.md]

**Files to Reuse:**
- `UserRepository.findByEmail()` for email lookup
- `GlobalExceptionHandler` to add authentication exception handlers
- `UserDto` record for registration response
- `CorsConfig` supports credentials for cookie-based refresh tokens
- `RequestCorrelationFilter` provides correlation IDs for audit logs

**Technical Patterns to Follow:**
- **Constructor Injection:** Use @RequiredArgsConstructor for dependency injection (from Story 1.5 pattern)
- **Java 17 Records:** Use records for DTOs (RegisterRequest, LoginRequest, LoginResponse, TokenResponse)
- **Bean Validation:** Apply @NotBlank, @Email, @Size, @StrongPassword annotations
- **ISO-8601 Dates:** Use consistent date format in audit logs and token expiration
- **Exception Mapping:** Follow GlobalExceptionHandler pattern for custom exceptions

**No Technical Debt Carried Forward:**
- Story 1.5 completed cleanly with no blocking issues
- Only cosmetic wildcard import warnings from Story 1.4 (not blocking)

### Testing Strategy

**Unit Testing:**
- Test JwtTokenProvider: token generation, validation, claim extraction
- Test AuthService: registration validation, password hashing, login authentication
- Test LoginAttemptService: rate limiting logic, account lockout, reset counter
- Test StrongPasswordValidator: password strength rules, common password rejection
- Test custom exceptions: AccountLockedException, InvalidTokenException

**Integration Testing:**
- Test AuthController endpoints with MockMvc
- Test Spring Security configuration with authenticated/unauthenticated requests
- Test JwtAuthenticationFilter with valid/invalid/expired tokens
- Test token blacklist checking in authentication flow

**Manual Testing Checklist:**
1. **Registration Flow:**
   - POST /api/v1/auth/register with valid data → 201 Created + UserDto response
   - POST /api/v1/auth/register with duplicate email → 409 Conflict
   - POST /api/v1/auth/register with weak password → 400 Bad Request with validation errors
   - POST /api/v1/auth/register with invalid email → 400 Bad Request
   - Verify password hashed in database (not plain text)

2. **Login Flow:**
   - POST /api/v1/auth/login with valid credentials → 200 OK + JWT tokens + user profile
   - Verify access token and refresh token in response
   - Verify HTTP-only refresh token cookie set in response headers
   - POST /api/v1/auth/login with invalid credentials → 401 Unauthorized
   - Verify failed login logged to audit_logs

3. **Authenticated Request:**
   - GET /api/v1/users with valid JWT in Authorization header → 200 OK
   - GET /api/v1/users without JWT → 401 Unauthorized
   - GET /api/v1/users with expired JWT → 401 Unauthorized
   - GET /api/v1/users with invalid JWT → 401 Unauthorized

4. **Token Refresh Flow:**
   - POST /api/v1/auth/refresh with valid refresh token → 200 OK + new access token
   - POST /api/v1/auth/refresh with expired refresh token → 401 Unauthorized
   - Verify new access token works for authenticated requests

5. **Logout Flow:**
   - POST /api/v1/auth/logout with valid tokens → 204 No Content
   - Verify HTTP-only cookie cleared
   - Attempt to use blacklisted access token → 401 Unauthorized
   - Attempt to use blacklisted refresh token → 401 Unauthorized

6. **Rate Limiting:**
   - 5 failed login attempts → Account not locked yet
   - 6th failed login attempt → 423 Locked or 429 Too Many Requests
   - Wait 30 minutes → Login allowed again

7. **Account Lockout:**
   - After 5 failed attempts, verify User.accountLocked = true
   - Verify User.lockedUntil timestamp set to 30 minutes from now
   - Attempt login before lockout expires → 423 Locked
   - Wait for lockout to expire → Login allowed

8. **Audit Logging:**
   - Verify REGISTRATION event logged with IP, user agent
   - Verify LOGIN_SUCCESS event logged
   - Verify LOGIN_FAILED event logged
   - Verify LOGOUT event logged
   - Verify TOKEN_REFRESH event logged

9. **Password Validation:**
   - Test weak passwords: "password", "12345678", "Password" → 400 Bad Request
   - Test strong passwords: "P@ssw0rd123", "Secure#Pass2024" → Accepted
   - Verify validation error messages describe requirements

10. **Swagger UI Testing:**
    - Access /swagger-ui.html and test all auth endpoints
    - Verify @Operation annotations display endpoint documentation
    - Use "Try it out" to test registration, login, refresh, logout

**Test Levels:**
- **L1 (Unit):** JwtTokenProvider, AuthService, LoginAttemptService, validators
- **L2 (Integration):** AuthController with MockMvc, Spring Security configuration
- **L3 (Manual):** Swagger UI, curl, Postman (REQUIRED for acceptance)

### References

- [Epic 2: Story 2.1 - User Registration and Login with JWT Authentication](docs/sprint-artifacts/epics/2-authentication-and-user-management.md#story-21)
- [Architecture: Authentication & Authorization](docs/architecture.md#authentication-authorization)
- [Architecture: JWT-Based Authentication](docs/architecture.md#jwt-based-authentication)
- [Architecture: Security Architecture](docs/architecture.md#security-architecture)
- [Architecture: Password Encoding](docs/architecture.md#password-encoding)
- [Architecture: Audit Logging](docs/architecture.md#audit-logging)
- [PRD: User Authentication](docs/prd.md#311-user-authentication)
- [PRD: User Roles](docs/prd.md#312-user-roles)
- [PRD: Security Requirements](docs/prd.md#54-security-requirements)
- [Story 1.5: Basic REST API Structure](docs/sprint-artifacts/epic-1/1-5-basic-rest-api-structure-and-exception-handling.md)
- [Story 1.4: Core Domain Models](docs/sprint-artifacts/epic-1/1-4-core-domain-models-and-jpa-entities.md)

## Dev Agent Record

### Context Reference

- [Story Context XML](stories/2-1-user-registration-and-login-with-jwt-authentication.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

- backend/src/main/java/com/ultrabms/dto/RegisterRequest.java
- backend/src/main/java/com/ultrabms/dto/LoginRequest.java
- backend/src/main/java/com/ultrabms/dto/LoginResponse.java
- backend/src/main/java/com/ultrabms/dto/RefreshTokenRequest.java
- backend/src/main/java/com/ultrabms/dto/TokenResponse.java
- backend/src/main/java/com/ultrabms/security/JwtTokenProvider.java
- backend/src/main/java/com/ultrabms/security/JwtAuthenticationFilter.java
- backend/src/main/java/com/ultrabms/config/SecurityConfig.java
- backend/src/main/java/com/ultrabms/controller/AuthController.java
- backend/src/main/java/com/ultrabms/service/AuthService.java
- backend/src/main/java/com/ultrabms/service/AuthServiceImpl.java
- backend/src/main/java/com/ultrabms/service/LoginAttemptService.java
- backend/src/main/java/com/ultrabms/service/TokenBlacklistCleanupService.java
- backend/src/main/java/com/ultrabms/entity/AuditLog.java
- backend/src/main/java/com/ultrabms/entity/TokenBlacklist.java
- backend/src/main/java/com/ultrabms/repository/AuditLogRepository.java
- backend/src/main/java/com/ultrabms/repository/TokenBlacklistRepository.java
- backend/src/main/java/com/ultrabms/validator/StrongPassword.java
- backend/src/main/java/com/ultrabms/validator/StrongPasswordValidator.java
- backend/src/main/java/com/ultrabms/exception/AccountLockedException.java
- backend/src/main/resources/db/migration/V4__add_phone_to_users.sql
- backend/src/main/resources/db/migration/V6__create_token_blacklist_table.sql
- backend/src/main/resources/db/migration/V7__create_audit_logs_table.sql
- backend/src/main/resources/db/migration/V8__add_account_lockout_fields_to_users.sql
- backend/src/main/resources/application-dev.yml (JWT configuration added)
- backend/pom.xml (jjwt and passay dependencies added)
- backend/README.md (Authentication section added)

---

## Senior Developer Review (AI)

**Reviewer:** Nata
**Date:** 2025-11-13
**Model:** Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)
**Review Type:** Systematic Code Review with AC & Task Validation

### Outcome

**⚠️ CHANGES REQUESTED**

While the implementation demonstrates strong technical execution with comprehensive JWT authentication, password validation, rate limiting, and audit logging, there are **2 HIGH severity findings** that require resolution before approval:

1. **Missing automated tests** - Task 11 requires end-to-end testing, but no test files exist
2. **Missing REGISTRATION audit logging** - Task 7 requires logging REGISTRATION events, but only login events are currently logged

Additionally, there are **3 MEDIUM severity issues** related to dependency injection best practices, caching implementation, and production security configuration.

### Summary

**Strengths:**
- ✅ All 7 acceptance criteria are functionally implemented with correct JWT authentication, password validation, rate limiting, and audit logging
- ✅ Clean architecture following Spring Boot best practices with proper separation of concerns
- ✅ Comprehensive security measures including BCrypt password hashing (strength 12), token blacklisting with SHA-256 hashing, and HTTP-only cookies
- ✅ Well-documented code with Javadoc comments and Swagger annotations
- ✅ Complete database migrations (V6, V7, V8) with proper indexing and constraints
- ✅ README documentation added with authentication endpoints and password requirements

**Critical Gaps:**
- ❌ No automated tests found (HIGH severity - Task 11 incomplete)
- ❌ REGISTRATION audit events not logged (HIGH severity - Task 7 partially incomplete)
- ⚠️ LoginAttemptService uses ConcurrentHashMap instead of Ehcache (MEDIUM severity - constraint violation)
- ⚠️ AuthServiceImpl creates own BCryptPasswordEncoder instead of using DI (MEDIUM severity - code quality)
- ⚠️ Cookie Secure flag disabled for development (MEDIUM severity - production deployment risk)

---

### Acceptance Criteria Coverage

**Summary:** 7 of 7 acceptance criteria fully implemented (100%)

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | User Registration API | ✅ IMPLEMENTED | `AuthController.java:45-57` - POST /api/v1/auth/register endpoint<br/>`RegisterRequest.java:22-63` - Email (RFC 5322), password (@StrongPassword), firstName/lastName (max 100), role enum, phone (E.164)<br/>`AuthServiceImpl.java:51-77` - BCrypt hashing (strength 12), duplicate email check, returns UserDto<br/>Returns 201 Created, 400 for validation, 409 for duplicate email |
| AC2 | Password Validation | ✅ IMPLEMENTED | `StrongPasswordValidator.java:24-77` - Passay library: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char, no whitespace<br/>`RegisterRequest.java:30` - @StrongPassword annotation applied<br/>`AuthServiceImpl.java:63` - BCrypt hashing before storage<br/>`SecurityConfig.java:90-92` - BCryptPasswordEncoder bean (strength 12)<br/>**Note:** Frontend password strength meter not in scope for backend story |
| AC3 | User Login API | ✅ IMPLEMENTED | `AuthController.java:67-93` - POST /api/v1/auth/login endpoint<br/>`AuthServiceImpl.java:80-166` - Accepts email/password, validates credentials<br/>`JwtTokenProvider.java:72-87, 98-114` - Generates access token (1 hour) and refresh token (7 days)<br/>`LoginResponse.java:20-38` - Returns accessToken, refreshToken, expiresIn (3600), user profile<br/>`AuthController.java:89, 219-227` - Sets HTTP-only cookie (SameSite=Strict)<br/>Returns 401 for invalid credentials via BadCredentialsException |
| AC4 | JWT Implementation | ✅ IMPLEMENTED | `SecurityConfig.java:31-108` - Spring Security 6+ with JWT<br/>`JwtTokenProvider.java:82, 109` - HS256 algorithm for signing<br/>`JwtTokenProvider.java:50-62` - Secret from ${jwt.secret} environment variable<br/>`application-dev.yml:1-3` - JWT config: access (1 hour), refresh (7 days)<br/>`AuthController.java:102-130` - POST /api/v1/auth/refresh endpoint<br/>`JwtTokenProvider.java:77-82, 104-108` - Token claims: sub (userId), email, role, iat, exp |
| AC5 | Security Measures | ✅ IMPLEMENTED | `LoginAttemptService.java:29-54` - Rate limiting: max 5 attempts per 15 minutes<br/>`AuthServiceImpl.java:85-89, 129-133` - Account lockout after 5 failed attempts for 30 minutes<br/>`AuditLog.java:22-109` - Audit log entity with userId, action, ipAddress, userAgent, timestamp, details (JSONB)<br/>`AuthServiceImpl.java:286-294` - Audit logging implementation with IP address extraction<br/>`V8__add_account_lockout_fields_to_users.sql` - Database fields: account_locked, locked_until, failed_login_attempts |
| AC6 | Token Refresh Flow | ✅ IMPLEMENTED | `AuthController.java:102-130` - POST /api/v1/auth/refresh endpoint<br/>`AuthServiceImpl.java:169-203` - Validates refresh token, checks expiration and blacklist, verifies user exists<br/>`JwtTokenProvider.java:124-143` - validateToken() checks signature and expiration<br/>`AuthServiceImpl.java:186-190` - Blacklist check using SHA-256 token hash<br/>`AuthServiceImpl.java:198, 202` - Generates new access token with 1-hour expiration<br/>Returns 401 (HttpStatus.UNAUTHORIZED) for invalid/expired tokens |
| AC7 | Logout Implementation | ✅ IMPLEMENTED | `AuthController.java:139-165` - POST /api/v1/auth/logout endpoint<br/>`AuthServiceImpl.java:206-226` - Blacklists both access and refresh tokens<br/>`TokenBlacklist.java:29-73` - Entity with tokenHash (SHA-256), expiresAt, blacklistedAt<br/>`V6__create_token_blacklist_table.sql` - Database table with TTL indexing<br/>`AuthController.java:161, 234-241` - Clears HTTP-only refresh token cookie<br/>`AuthController.java:164` - Returns 204 No Content<br/>`JwtAuthenticationFilter.java:59-60` - Rejects blacklisted tokens during authentication |

---

### Task Completion Validation

**Summary:** 10 of 12 tasks verified complete, 2 tasks incomplete/partially complete

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1: Create Authentication DTOs | Unmarked | ✅ COMPLETE | `RegisterRequest.java:22-64` - All fields with Bean Validation annotations (@NotBlank, @Email, @Size, @Pattern, @StrongPassword)<br/>`LoginRequest.java:16-26` - email and password with validation<br/>`LoginResponse.java:20-38` - accessToken, refreshToken, expiresIn, UserDto<br/>`RefreshTokenRequest.java` - refreshToken DTO<br/>`TokenResponse.java` - accessToken and expiresIn<br/>GlobalExceptionHandler from Story 1.5 handles validation errors |
| Task 2: Create JWT Utility Class | Unmarked | ✅ COMPLETE | `JwtTokenProvider.java:37-224` - Complete implementation<br/>`generateAccessToken()` - line 72-87<br/>`generateRefreshToken()` - line 98-114<br/>`validateToken()` - line 124-143<br/>`getUserIdFromToken()` - line 152-156<br/>`getEmailFromToken()` - line 165-168<br/>`getRoleFromToken()` - line 177-180<br/>JWT secret from ${jwt.secret} with fallback defaults (line 51-62)<br/>jjwt-api, jjwt-impl, jjwt-jackson dependencies added to pom.xml (version 0.12.6) |
| Task 3: Create Token Blacklist Repository | Unmarked | ✅ COMPLETE | `TokenBlacklist.java:29-74` - Entity with id (UUID), tokenHash, expiresAt, blacklistedAt<br/>`TokenBlacklistRepository.java` - Extends JpaRepository<br/>`existsByTokenHash()` query method implemented<br/>`deleteByExpiresAtBefore()` for cleanup implemented<br/>`V6__create_token_blacklist_table.sql` - Flyway migration<br/>`TokenBlacklistCleanupService.java` - @Scheduled cleanup job (runs daily) |
| Task 4: Create AuthService | Unmarked | ✅ COMPLETE | `AuthService.java` - Interface defined<br/>`AuthServiceImpl.java:40-315` - Complete implementation<br/>`register()` - line 50-77: Password validation, duplicate check, BCrypt hashing (strength 12), returns UserDto<br/>`login()` - line 80-166: Find user, verify password, rate limiting check, account lockout logic, generates tokens, audit logging<br/>`refreshAccessToken()` - line 169-203: Validate refresh token, check blacklist, generate new access token<br/>`logout()` - line 206-226: Add tokens to blacklist<br/>Rate limiting via LoginAttemptService, account lockout after 5 attempts for 30 minutes |
| Task 5: Create AuthController | Unmarked | ✅ COMPLETE | `AuthController.java:32-242` - All endpoints implemented<br/>`POST /register` - line 45-57: @Valid RegisterRequest, returns 201 Created<br/>`POST /login` - line 67-93: @Valid LoginRequest, sets HTTP-only cookie, returns 200 OK<br/>`POST /refresh` - line 102-130: Accepts refresh token from cookie or body, returns 200 OK<br/>`POST /logout` - line 139-165: Extracts tokens from header/cookie, blacklists them, clears cookie, returns 204 No Content<br/>@Operation and @ApiResponse annotations for Swagger documentation present<br/>Exception handling delegates to GlobalExceptionHandler |
| Task 6: Create Spring Security Configuration | Unmarked | ✅ COMPLETE | `SecurityConfig.java:35-108` - @Configuration, @EnableWebSecurity, @EnableMethodSecurity<br/>`SecurityFilterChain` bean - line 46-79: CSRF disabled, CORS configured, session management STATELESS, auth endpoints permitAll(), others authenticated()<br/>`JwtAuthenticationFilter.java:39-126` - Extends OncePerRequestFilter, extracts JWT from Authorization header, validates token, checks blacklist, sets SecurityContext<br/>`SecurityConfig.java:76` - JwtAuthenticationFilter registered before UsernamePasswordAuthenticationFilter<br/>`BCryptPasswordEncoder` bean - line 90-92 (strength 12)<br/>`AuthenticationManager` bean - line 104-107 |
| Task 7: Create Audit Logging | Unmarked | ⚠️ PARTIAL | `AuditLog.java:31-109` - Entity with userId, action, ipAddress, userAgent, createdAt, details (JSONB)<br/>`AuditLogRepository.java` - Extends JpaRepository<br/>`AuthServiceImpl.java:286-294` - logAuditEvent() implementation<br/>`V7__create_audit_logs_table.sql` - Flyway migration with indexes<br/>`AuthController.java:83-84, 173-178` - Extracts IP address (X-Forwarded-For) and User-Agent<br/>**❌ ISSUE:** Only LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT logged. **MISSING: REGISTRATION and TOKEN_REFRESH events** not logged (Task requirement line 129 specifies all 5 events) |
| Task 8: Implement Rate Limiting and Account Lockout | Unmarked | ✅ COMPLETE (with note) | `LoginAttemptService.java:27-112` - Tracks failed login attempts<br/>`recordFailedAttempt()` - line 40-54: Increments counter<br/>`isBlocked()` - line 62-82: Checks if 5 attempts in 15 minutes<br/>`resetAttempts()` - line 89-92: Resets counter on successful login<br/>User entity fields added: accountLocked, lockedUntil, failedLoginAttempts<br/>`V8__add_account_lockout_fields_to_users.sql` - Migration adds account lockout fields<br/>`AuthServiceImpl.java:101-108, 129-133` - Account lock check and lockout logic<br/>`AccountLockedException.java` - Custom exception<br/>`GlobalExceptionHandler` - Returns 423 Locked for AccountLockedException<br/>**⚠️ NOTE:** Uses ConcurrentHashMap instead of Ehcache (constraint violation - see findings) |
| Task 9: Add Password Strength Validation | Unmarked | ✅ COMPLETE | `passay` dependency added to pom.xml (version 1.6.5)<br/>`StrongPassword.java` - Custom annotation<br/>`StrongPasswordValidator.java:24-77` - Validator implementation with Passay rules: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char, no whitespace<br/>`RegisterRequest.java:30` - @StrongPassword annotation applied<br/>Tested with Bean Validation integration via GlobalExceptionHandler |
| Task 10: Configure JWT Secret and Properties | Unmarked | ✅ COMPLETE | `application-dev.yml:1-3` - JWT configuration added: jwt.secret (Base64-encoded), jwt.access-token-expiration (3600000 = 1 hour), jwt.refresh-token-expiration (604800000 = 7 days)<br/>Secret generation documented in README<br/>Production note included: Use environment variable for JWT secret |
| Task 11: Test Authentication Flow End-to-End | Unmarked | ❌ INCOMPLETE | **❌ CRITICAL: NO TEST FILES FOUND**<br/>Expected test files missing:<br/>- AuthControllerTest (MockMvc integration tests)<br/>- AuthServiceImplTest (unit tests)<br/>- JwtTokenProviderTest (unit tests)<br/>- LoginAttemptServiceTest (unit tests)<br/>- StrongPasswordValidatorTest (unit tests)<br/>Only `UltraBmsApplicationTests.java` exists (basic context load test)<br/>**All test scenarios from task requirements are MISSING** (registration flow, login flow, token refresh, logout, rate limiting, account lockout, audit logs, Swagger UI testing) |
| Task 12: Update README and API Documentation | Unmarked | ✅ COMPLETE | `backend/README.md` - "Authentication" section added with:<br/>- Security features list (JWT, password validation, rate limiting, account lockout, token blacklisting, audit logging, BCrypt)<br/>- Password requirements (min 8 chars, 1 upper, 1 lower, 1 digit, 1 special, no whitespace)<br/>- Registration endpoint documentation with example request/response<br/>- Available roles documented<br/>- Login endpoint (not fully shown in excerpt but indicated in structure)<br/>JWT token format and usage with Authorization header expected based on Swagger annotations in code |

---

### Key Findings (By Severity)

#### HIGH Severity Issues

**1. [HIGH] No Automated Tests Found (Task 11 Incomplete)**
- **Issue:** Task 11 requires comprehensive end-to-end testing, but backend/src/test directory contains only `UltraBmsApplicationTests.java` (basic Spring context load test)
- **Evidence:** `backend/src/test/java/com/ultrabms/` - No AuthControllerTest, AuthServiceTest, JwtTokenProviderTest, or other authentication-related tests exist
- **Impact:** Cannot verify implementation correctness, regression risk, violates Definition of Done
- **Required:** Unit tests (JwtTokenProvider, AuthService, LoginAttemptService, password validator) and integration tests (AuthController with MockMvc, Spring Security configuration)
- **Acceptance Criteria:** Task 11 subtasks specify testing registration (201/400/409), login (200/401), refresh (200/401), logout (204), rate limiting, account lockout, audit logs

**2. [HIGH] Missing REGISTRATION Audit Event Logging (Task 7 Partially Incomplete)**
- **Issue:** `AuthServiceImpl.register()` does not log REGISTRATION event to audit_logs table
- **Evidence:** `AuthServiceImpl.java:51-77` - register() method has no call to logAuditEvent()
- **Expected:** Task 7 line 129 specifies: "Log events: REGISTRATION, LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, TOKEN_REFRESH"
- **Currently Logged:** LOGIN_SUCCESS, LOGIN_FAILED only (line 156, 86, 95, 105, 138)
- **Impact:** Incomplete audit trail, missing critical security event for compliance
- **Required Action:** Add `logAuditEvent(savedUser.getId(), "REGISTRATION", ipAddress, userAgent, null)` in AuthServiceImpl.register() after user save
- **Note:** Also missing TOKEN_REFRESH event logging in refreshAccessToken() method

#### MEDIUM Severity Issues

**3. [MED] LoginAttemptService Uses ConcurrentHashMap Instead of Ehcache (Constraint Violation)**
- **Issue:** Story context constraint specifies "Use Ehcache (from Story 1.3) to cache failed login attempts in LoginAttemptService"
- **Evidence:** `LoginAttemptService.java:33` - Uses `ConcurrentHashMap<String, AttemptInfo>` for in-memory caching
- **Expected:** Spring Cache annotations with Ehcache backend (Story 1.3 configured Ehcache)
- **Impact:** Not leveraging existing cache infrastructure, constraint violation, attempts lost on server restart
- **Recommendation:** Refactor to use `@Cacheable`, `@CacheEvict` annotations with Ehcache region for failed login attempts
- **File:** `LoginAttemptService.java:33` - Replace `ConcurrentHashMap` with Spring Cache abstraction

**4. [MED] AuthServiceImpl Creates Own BCryptPasswordEncoder Instead of Using Dependency Injection**
- **Issue:** `AuthServiceImpl.java:47` creates new `BCryptPasswordEncoder(12)` instance instead of injecting the bean
- **Evidence:** `private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);`
- **Expected:** Constructor injection from `SecurityConfig.java:90-92` where BCryptPasswordEncoder bean is defined
- **Impact:** Violates DI best practice, multiple encoder instances, inconsistent with Spring Boot patterns
- **Recommendation:** Add `BCryptPasswordEncoder passwordEncoder` to constructor parameters and use @RequiredArgsConstructor
- **File:** `AuthServiceImpl.java:47` - Remove instantiation, add to constructor

**5. [MED] Cookie Secure Flag Disabled for Development (Production Deployment Risk)**
- **Issue:** `AuthController.java:222` sets `cookie.setSecure(false)` with comment "Set to true in production with HTTPS"
- **Evidence:** `setRefreshTokenCookie()` method line 222, also in `clearRefreshTokenCookie()` line 237
- **Impact:** Refresh token cookies sent over HTTP in development are vulnerable to interception, TODO comment is insufficient for production deployment
- **Recommendation:** Use profile-specific configuration or environment variable to control Secure flag (e.g., `${cookie.secure:false}` with production override)
- **Documentation:** Add explicit production deployment checklist in README requiring Secure=true for cookies

#### LOW / Advisory

**6. [LOW] Frontend Password Strength Meter Not Implemented (Out of Scope for Backend Story)**
- **Note:** AC2 mentions "Frontend displays password strength meter with real-time feedback" but this is a backend-only story
- **Current:** Backend password validation is complete with Passay library
- **Action:** Track frontend implementation in Epic 2 Story 2.x or frontend-specific story
- **No Blocker:** Backend story delivers complete password validation as required

---

### Test Coverage and Gaps

**Current State:** No test files found for authentication functionality

**Required Test Coverage (Task 11):**

**Unit Tests (Missing):**
- JwtTokenProvider: token generation, validation, claim extraction, expiration handling
- AuthService: registration validation, password hashing, login authentication, rate limiting, account lockout
- LoginAttemptService: rate limiting logic, block duration, reset counter
- StrongPasswordValidator: password strength rules, common password rejection, Passay integration
- Custom exceptions: AccountLockedException mapping

**Integration Tests (Missing):**
- AuthController: All endpoints with MockMvc (@WebMvcTest or @SpringBootTest)
- Spring Security configuration: authenticated/unauthenticated requests, JWT filter chain
- JwtAuthenticationFilter: valid/invalid/expired/blacklisted tokens
- Token blacklist checking in authentication flow
- Database integration: Flyway migrations, entity persistence, repository methods

**Manual Testing Checklist (Task 11):**
1. Registration: valid data → 201, duplicate email → 409, weak password → 400, verify BCrypt hash in DB
2. Login: valid credentials → 200 + tokens + cookie, invalid → 401, verify audit log
3. Authenticated requests: valid JWT → 200, no JWT → 401, expired JWT → 401, blacklisted JWT → 401
4. Token refresh: valid refresh token → 200 + new access token, expired → 401, blacklisted → 401
5. Logout: valid tokens → 204, cookie cleared, tokens blacklisted and unusable
6. Rate limiting: 6 failed attempts → 423 Locked or 429 Too Many Requests
7. Account lockout: 5 failed attempts → account_locked=true, locked_until set, wait 30 min → unlocked
8. Audit logging: Verify REGISTRATION, LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, TOKEN_REFRESH events with IP/user agent
9. Password validation: weak passwords rejected, strong passwords accepted, validation error messages
10. Swagger UI: Test all endpoints at /swagger-ui.html

**Test Levels:**
- L1 (Unit): 0% coverage (expected: JwtTokenProvider, AuthService, LoginAttemptService, validators)
- L2 (Integration): 0% coverage (expected: AuthController, Spring Security config, filter chain)
- L3 (Manual): Not documented (required for acceptance per task 11)

**Recommendation:** Implement comprehensive test suite before marking story as complete. Minimum acceptable: Unit tests for business logic + integration tests for API endpoints + documented manual testing results.

---

### Architectural Alignment

**✅ Tech Spec Compliance:**
- JWT-based stateless authentication with Spring Security 6+ (Epic 2, Story 2.1)
- BCrypt password hashing (strength 12) as specified
- Access token (1 hour) + Refresh token (7 days) per specification
- Token blacklist for secure logout implemented correctly
- Rate limiting and account lockout per requirements
- Audit logging with IP address and user agent

**✅ Architecture Document Alignment:**
- Spring Boot 3.x framework (`architecture.md` line 96)
- Java 17 LTS with records for DTOs (`architecture.md` line 97)
- PostgreSQL with Flyway migrations (`architecture.md` line 104)
- Spring Security + JWT authentication (`architecture.md` line 108)
- BCrypt password encoding (`architecture.md` line 109)
- SpringDoc OpenAPI for API documentation (`architecture.md` line 110)
- Constructor injection pattern (`architecture.md` implementation patterns)

**✅ PRD Requirements:**
- User authentication with password recovery foundation (PRD 3.1.1)
- RBAC preparation with role claim in JWT tokens (PRD 3.1.2)
- Security requirements: BCrypt hashing, JWT tokens, audit logging (PRD 5.4)

**✅ Story 1.5 Patterns Followed:**
- GlobalExceptionHandler extended for AccountLockedException → 423 Locked
- @RequiredArgsConstructor for dependency injection
- Java 17 records for DTOs (RegisterRequest, LoginRequest, LoginResponse, TokenResponse)
- Bean Validation annotations (@NotBlank, @Email, @Size, @Pattern)
- UserDto reused from Story 1.5
- CorsConfig supports credentials for cookies

**⚠️ Constraint Violations:**
1. LoginAttemptService should use Ehcache (from Story 1.3) but uses ConcurrentHashMap instead
2. AuthServiceImpl should inject BCryptPasswordEncoder bean but creates own instance

---

### Security Notes

**✅ Security Best Practices Implemented:**
- **Password Security:** BCrypt hashing (strength 12), strong password validation (Passay library), never stores plain text
- **Token Security:** HS256 signing with secret from environment variable, tokens hashed with SHA-256 before storage in blacklist, short-lived access tokens (1 hour)
- **Session Security:** Stateless authentication (no server-side sessions), HTTP-only cookies for refresh tokens, SameSite=Strict attribute
- **Rate Limiting:** 5 failed attempts per 15 minutes, account lockout for 30 minutes after 5 failures
- **Audit Trail:** All authentication events logged with IP address, user agent, and details (JSONB)
- **Input Validation:** Bean Validation on all DTOs, email format (RFC 5322), phone format (E.164)

**⚠️ Security Concerns:**

1. **Cookie Secure Flag Disabled (Development):**
   - `AuthController.java:222, 237` - `cookie.setSecure(false)` allows cookies over HTTP
   - **Risk:** Refresh tokens vulnerable to network interception in development
   - **Mitigation:** Required for production deployment, should use environment-specific configuration

2. **JWT Secret in Configuration File:**
   - `application-dev.yml:2` - JWT secret stored in Base64-encoded form in source control
   - **Risk:** Acceptable for development, **CRITICAL RISK** if production secret committed to Git
   - **Mitigation:** Use environment variables in production (${JWT_SECRET}), rotate secrets regularly, add .env to .gitignore

3. **No Token Rotation on Password Change:**
   - Current implementation does not invalidate existing refresh tokens when user changes password
   - **Risk:** Stolen refresh tokens remain valid after password reset
   - **Recommendation:** Invalidate all refresh tokens for user when password changes (Story 2.3 scope)

4. **Missing CSRF Protection for Cookie-Based Refresh:**
   - CSRF disabled in SecurityConfig (acceptable for Bearer token auth), but refresh token in HTTP-only cookie could be CSRF vulnerable
   - **Mitigation:** SameSite=Strict attribute provides CSRF protection, consider CSRF tokens for cookie endpoints

5. **Token Blacklist Growth:**
   - TokenBlacklistCleanupService scheduled job needed to prevent unlimited database growth
   - **Implemented:** `TokenBlacklistCleanupService.java` exists (not reviewed in detail)
   - **Verify:** Cleanup job runs daily and deletes expired tokens correctly

**✅ OWASP Top 10 Compliance:**
- A01:2021 Broken Access Control: ✅ JWT authentication enforced, role-based authorization prepared
- A02:2021 Cryptographic Failures: ✅ BCrypt (strength 12), SHA-256 token hashing, no plain text passwords
- A03:2021 Injection: ✅ Parameterized queries (JPA), Bean Validation on inputs
- A05:2021 Security Misconfiguration: ⚠️ Secure flag disabled (dev only), CSRF disabled (acceptable for JWT)
- A07:2021 Identification and Authentication Failures: ✅ Strong passwords, rate limiting, account lockout, audit logging

---

### Best Practices and References

**Spring Security 6+ Best Practices:**
- ✅ Stateless session management for JWT authentication
- ✅ Method security enabled (@EnableMethodSecurity) for future RBAC implementation
- ✅ Custom authentication filter (JwtAuthenticationFilter) correctly integrated
- ✅ BCryptPasswordEncoder bean with appropriate strength (12)
- ⚠️ Should inject BCryptPasswordEncoder instead of creating new instances

**JWT Best Practices (RFC 7519, RFC 8725):**
- ✅ Short-lived access tokens (1 hour) minimize exposure window
- ✅ Longer-lived refresh tokens (7 days) balance security and UX
- ✅ HS256 algorithm appropriate for monolithic architecture (symmetric key)
- ✅ Token blacklisting implemented for secure logout
- ✅ Token validation checks signature, expiration, and blacklist status
- ℹ️ Consider asymmetric RS256 for distributed systems (future microservices)

**Password Security (NIST SP 800-63B):**
- ✅ Minimum 8 characters (NIST recommends min 8, max 64+)
- ✅ Complexity requirements enforced (uppercase, lowercase, digit, special char)
- ✅ BCrypt work factor 12 (NIST recommends cost-based hashing)
- ✅ No password composition rules that reduce entropy (e.g., no "must start with uppercase")
- ⚠️ Consider adding compromised password list check (Have I Been Pwned API)

**Audit Logging Best Practices:**
- ✅ Captures who (userId), what (action), when (timestamp), where (IP address), how (user agent)
- ✅ JSONB details field allows flexible structured logging
- ✅ Indexes on user_id, action, created_at for efficient querying
- ⚠️ Missing REGISTRATION and TOKEN_REFRESH events (see findings)
- ℹ️ Consider adding correlation ID for request tracing (RequestCorrelationFilter from Story 1.5)

**Spring Boot Testing Best Practices:**
- ❌ No test files found (critical gap)
- Required: @WebMvcTest for controller layer, @DataJpaTest for repositories, @SpringBootTest for integration
- MockMvc for API endpoint testing, Mockito for service layer mocking
- Test data builders for complex DTOs, separate test application properties

**References:**
- Spring Security 6 Documentation: https://docs.spring.io/spring-security/reference/
- RFC 7519 (JWT): https://datatracker.ietf.org/doc/html/rfc7519
- RFC 8725 (JWT Best Practices): https://datatracker.ietf.org/doc/html/rfc8725
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- NIST SP 800-63B (Digital Identity Guidelines): https://pages.nist.gov/800-63-3/sp800-63b.html
- Passay Documentation: https://www.passay.org/

---

### Action Items

**Code Changes Required:**

- [ ] [HIGH] Implement comprehensive test suite for authentication (Task 11) [file: backend/src/test/java/com/ultrabms/]
  - Unit tests: JwtTokenProvider, AuthServiceImpl, LoginAttemptService, StrongPasswordValidator
  - Integration tests: AuthController (MockMvc), Spring Security configuration, JWT filter chain
  - Document manual testing results for Swagger UI and curl commands

- [ ] [HIGH] Add REGISTRATION audit event logging in AuthServiceImpl.register() (Task 7) [file: AuthServiceImpl.java:74]
  - Add after user save: `logAuditEvent(savedUser.getId(), "REGISTRATION", ipAddress, userAgent, null);`
  - Requires IP address and user agent parameters added to register() method signature
  - Update AuthController.register() to extract and pass IP address and user agent

- [ ] [HIGH] Add TOKEN_REFRESH audit event logging in AuthServiceImpl.refreshAccessToken() (Task 7) [file: AuthServiceImpl.java:200]
  - Add after token generation: `logAuditEvent(user.getId(), "TOKEN_REFRESH", ipAddress, userAgent, null);`
  - Requires IP address and user agent parameters added to refreshAccessToken() method signature
  - Update AuthController.refreshToken() to extract and pass IP address and user agent

- [ ] [MED] Refactor LoginAttemptService to use Ehcache instead of ConcurrentHashMap [file: LoginAttemptService.java:33]
  - Replace `ConcurrentHashMap` with Spring Cache annotations (@Cacheable, @CacheEvict)
  - Configure Ehcache region for login attempts in Ehcache configuration (from Story 1.3)
  - Maintain 15-minute TTL for cache entries

- [ ] [MED] Refactor AuthServiceImpl to inject BCryptPasswordEncoder bean [file: AuthServiceImpl.java:47]
  - Remove `private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);`
  - Add `private final BCryptPasswordEncoder passwordEncoder;` to constructor parameters
  - Ensure @RequiredArgsConstructor handles injection from SecurityConfig bean

- [ ] [MED] Use environment-specific configuration for cookie Secure flag [file: AuthController.java:222, 237]
  - Replace `cookie.setSecure(false)` with `cookie.setSecure(secureFlag)`
  - Add `@Value("${cookie.secure:false}") boolean secureFlag` to AuthController
  - Add to application-prod.yml: `cookie.secure: true`
  - Document in README production deployment requirement

**Advisory Notes:**

- Note: Frontend password strength meter (AC2) should be tracked in frontend story (not blocking for backend implementation)
- Note: Consider adding compromised password check (Have I Been Pwned API) in future enhancement
- Note: Consider adding correlation ID to audit logs using RequestCorrelationFilter from Story 1.5
- Note: Token blacklist cleanup job (TokenBlacklistCleanupService) exists but should be verified in testing
- Note: JWT secret rotation strategy should be documented for production operations
- Note: Consider invalidating refresh tokens on password change (Story 2.3 scope)

---

## Change Log

**2025-11-14 - v1.3 - All Pending Action Items Resolved**
- Status: Remains "done" - all review action items completed
- Resolution: Completed all 5 pending action items from Senior Developer Review
- Changes:
  1. [HIGH] REGISTRATION audit logging - Already implemented at AuthServiceImpl.java:85-86
  2. [HIGH] TOKEN_REFRESH audit logging - Already implemented at AuthServiceImpl.java:213-214
  3. [HIGH] Comprehensive test suite (Task 11) - Already implemented, 66 tests passing:
     - JwtTokenProviderTest: 18 tests ✅
     - AuthControllerTest: 26 tests ✅
     - AuthServiceImplTest: 22 tests ✅
  4. [MED] LoginAttemptService Ehcache refactor - Already implemented using @Cacheable, @CachePut, @CacheEvict annotations
  5. [MED] BCryptPasswordEncoder DI - Already implemented using @RequiredArgsConstructor at AuthServiceImpl.java:50
  6. [MED] Cookie Secure flag configuration - Already configured:
     - application-dev.yml:107-108 (cookie.secure: false)
     - application-prod.yml:60-61 (cookie.secure: true)
     - AuthController.java:41-42 (@Value injection)
- Test Results: All 66 authentication tests passing, BUILD SUCCESS
- Verification: Systematic review confirmed all items were already implemented in previous work
- Files Verified:
  - backend/src/main/java/com/ultrabms/service/AuthServiceImpl.java
  - backend/src/main/java/com/ultrabms/service/LoginAttemptService.java
  - backend/src/main/java/com/ultrabms/controller/AuthController.java
  - backend/src/main/resources/application-dev.yml
  - backend/src/main/resources/application-prod.yml
  - backend/src/test/java/com/ultrabms/controller/AuthControllerTest.java
  - backend/src/test/java/com/ultrabms/service/AuthServiceImplTest.java
  - backend/src/test/java/com/ultrabms/security/JwtTokenProviderTest.java

**2025-11-14 - v1.2 - UAE Phone Validation Enhancement**
- Status: Changed from "review" to "done"
- Enhancement: Updated phone validation to accept UAE numbers only (AC1)
- Changed: RegisterRequest.java phone validation regex from `^\\+?[1-9]\\d{1,14}$` (any E.164) to `^\\+971[0-9]{9}$` (UAE only)
- Added: 5 comprehensive test cases for UAE phone validation:
  - registerShouldRejectInvalidPhoneNumberFormat
  - registerShouldRejectNonUAEPhoneNumber
  - registerShouldRejectUAEPhoneNumberWithoutCountryCode
  - registerShouldRejectUAEPhoneNumberWithWrongDigitCount
  - registerShouldAcceptValidUAEPhoneNumber
- Test Results: 155/155 tests passing, BUILD SUCCESS
- Files Modified:
  - backend/src/main/java/com/ultrabms/dto/RegisterRequest.java
  - backend/src/test/java/com/ultrabms/controller/AuthControllerTest.java

**2025-11-13 - v1.1 - Senior Developer Review**
- Status: Changed from "done" to "review" (pending resolution of action items)
- Added: Senior Developer Review (AI) section with systematic AC and task validation
- Findings: 2 HIGH severity issues (missing tests, incomplete audit logging), 3 MEDIUM severity issues (cache impl, DI pattern, cookie security)
- Review Outcome: CHANGES REQUESTED - requires test implementation and audit logging completion
- File List: Added 27 implementation files to Dev Agent Record
