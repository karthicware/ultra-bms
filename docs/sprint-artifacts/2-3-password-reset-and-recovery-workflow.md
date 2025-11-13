# Story 2.3: Password Reset and Recovery Workflow

Status: ready-for-dev

## Story

As a user,
I want to reset my password if I forget it,
So that I can regain access to my account securely.

## Acceptance Criteria

1. **AC1 - Password Reset Request Endpoint:** Create POST /api/v1/auth/forgot-password endpoint accepting { email } in request body. Validate email format using @Email annotation. Check if user exists in database with active account (is_active = true). Generate secure random token using SecureRandom (32 bytes, hex-encoded). Create password_reset_tokens table entry with userId, token, expiresAt (15 minutes from now), used (false), createdAt. If email doesn't exist, still return 200 OK with generic "check your email" message (security: don't reveal account existence). Send password reset email asynchronously with reset link. Return 200 OK: { success: true, message: "If account exists, password reset link sent to email" }.

2. **AC2 - Password Reset Token Validation:** Create GET /api/v1/auth/reset-password/validate endpoint with query parameter ?token={token}. Query password_reset_tokens table for matching token. Validate: token exists, not expired (expiresAt > now), not used (used = false), associated user account is active. Return 200 OK if valid: { success: true, valid: true }. Return 400 Bad Request if invalid/expired: { success: false, error: { code: "INVALID_TOKEN", message: "Reset link is invalid or has expired" } }. Include remaining time until expiration in valid response.

3. **AC3 - Password Reset Completion:** Create POST /api/v1/auth/reset-password endpoint accepting { token, newPassword }. Re-validate token (same checks as AC2). Validate newPassword meets requirements: min 8 characters, contains uppercase, lowercase, number, special character (same as registration). Hash password with BCrypt (cost factor 12). Update user.passwordHash in users table. Mark token as used (used = true) in password_reset_tokens. Invalidate all existing refresh tokens for user (delete from refresh_tokens table or mark invalid). Log password reset to audit_logs table with userId, action "PASSWORD_RESET", IP address. Send password change confirmation email. Return 200 OK: { success: true, message: "Password reset successful" }.

4. **AC4 - Password Reset Tokens Database Schema:** Create password_reset_tokens table via Flyway migration V13__create_password_reset_tokens_table.sql with columns: id BIGSERIAL PRIMARY KEY, user_id BIGINT REFERENCES users(id) NOT NULL, token VARCHAR(255) UNIQUE NOT NULL, expires_at TIMESTAMP NOT NULL, used BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW(). Create index on token for fast lookup: idx_password_reset_tokens_token. Create index on expires_at for cleanup job: idx_password_reset_tokens_expires_at. Add constraint to prevent multiple active tokens per user (optional).

5. **AC5 - Email Service Integration:** Configure Spring Mail in application.yml with SMTP settings (Gmail API or SMTP server). Create EmailService in com.ultrabms.service package with methods: sendPasswordResetEmail(User user, String resetToken) and sendPasswordChangeConfirmation(User user). Generate reset link: {FRONTEND_URL}/reset-password?token={token}. Email contains: branded HTML template, clear instructions, clickable reset link button, expiration warning (15 minutes), support contact, plain text fallback. Use Thymeleaf or similar for email templates. Send emails asynchronously using @Async to avoid blocking request.

6. **AC6 - Email Templates:** Create email templates in resources/templates/email/ directory: password-reset-email.html (reset link with 15-minute expiration notice, instructions, support contact) and password-change-confirmation.html (notification of successful password change, login link, security alert message). Include Ultra BMS branding: logo, colors (#0A2342 primary), footer with company info. Ensure responsive HTML (mobile-friendly). Include plain text alternatives for email clients that don't support HTML. Test templates render correctly in major email clients.

7. **AC7 - Rate Limiting for Password Reset:** Implement rate limiting on POST /api/v1/auth/forgot-password endpoint: maximum 3 requests per hour per email address. Store rate limit data in password_reset_attempts table with columns: email, attempt_count, first_attempt_at, last_attempt_at. Increment attempt_count on each request, reset after 1 hour. Return 429 Too Many Requests if limit exceeded: { success: false, error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many password reset attempts. Please try again in {minutes} minutes." } }. Include Retry-After header with seconds until retry allowed. Log rate limit violations to audit_logs.

8. **AC8 - Token Expiration and Cleanup:** Tokens expire 15 minutes after creation (expires_at = created_at + 15 minutes). Create scheduled job using @Scheduled(cron = "0 0 * * * *") to run hourly. Job deletes expired tokens from password_reset_tokens table where expires_at < NOW() - 1 hour (keep recent for audit). Also delete old used tokens (>24 hours old). Log cleanup statistics (deleted count) at INFO level. Ensure job uses @Transactional for atomicity.

9. **AC9 - Security Measures:** When new reset requested for same email, invalidate all previous unused tokens for that user (set used = true or delete). Generate cryptographically secure tokens using java.security.SecureRandom. Tokens must be at least 32 bytes (256 bits) entropy, hex-encoded to 64 characters. Hash tokens before storing in database (optional enhancement for extra security). Log all password reset activities to audit_logs: request initiated, token validated, password changed, rate limit exceeded. Include userId (if exists), email, IP address, timestamp. Never expose sensitive information in error messages (e.g., "user not found").

10. **AC10 - Frontend Forgot Password Page:** Create app/(auth)/forgot-password/page.tsx with email input form. Use React Hook Form with Zod validation: email required and valid format. On submit, call POST /api/v1/auth/forgot-password. Show success message: "If your email is registered, you'll receive reset instructions shortly." Show error message for network failures. Include link back to login page. Style with shadcn/ui components (Card, Input, Button). Show loading state during API call. Display recaptcha or similar to prevent abuse (optional).

11. **AC11 - Frontend Reset Password Page:** Create app/(auth)/reset-password/page.tsx with query parameter token extraction. On page load, validate token by calling GET /api/v1/auth/reset-password/validate?token={token}. If token invalid/expired, show error message with link to request new reset. If valid, show new password form with two fields: newPassword and confirmPassword. Implement password strength meter (weak/medium/strong) showing requirements checklist. Use Zod validation: passwords match, meets complexity requirements. On submit, call POST /api/v1/auth/reset-password with { token, newPassword }. Show success message and redirect to login after 3 seconds. Include countdown timer showing token expiration (15 minutes from email sent).

12. **AC12 - Password Strength Validation:** Frontend and backend validate password strength consistently. Requirements: minimum 8 characters, at least 1 uppercase letter (A-Z), at least 1 lowercase letter (a-z), at least 1 number (0-9), at least 1 special character (!@#$%^&*). Backend uses regex pattern validation in PasswordValidator utility class. Frontend shows real-time feedback: checklist of requirements with checkmarks as user types, overall strength indicator (weak/medium/strong), color-coded strength bar (red/yellow/green). Reject common passwords (optional: check against top 10000 common passwords list).

## Tasks / Subtasks

- [ ] **Task 1: Create Password Reset Tokens Database Schema** (AC: #4)
  - [ ] Create Flyway migration V13__create_password_reset_tokens_table.sql
  - [ ] Define table schema:
    - id BIGSERIAL PRIMARY KEY
    - user_id BIGINT REFERENCES users(id) NOT NULL
    - token VARCHAR(255) UNIQUE NOT NULL
    - expires_at TIMESTAMP NOT NULL
    - used BOOLEAN DEFAULT false
    - created_at TIMESTAMP DEFAULT NOW()
  - [ ] Create index: CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token)
  - [ ] Create index: CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at)
  - [ ] Add foreign key constraint with ON DELETE CASCADE to users table
  - [ ] Test migration runs successfully on local database

- [ ] **Task 2: Create Password Reset Tokens JPA Entity** (AC: #4)
  - [ ] Create PasswordResetToken entity in com.ultrabms.entity package:
    - Fields: id (Long), user (User @ManyToOne), token (String UNIQUE), expiresAt (LocalDateTime), used (Boolean), createdAt (LocalDateTime)
    - Annotations: @Entity, @Table(name = "password_reset_tokens"), @Index for token and expiresAt
  - [ ] Add validation annotations: @NotNull on user, token, expiresAt
  - [ ] Add method: boolean isExpired() returns expiresAt.isBefore(LocalDateTime.now())
  - [ ] Add method: boolean isValid() returns !used && !isExpired()
  - [ ] Create PasswordResetTokenRepository extending JpaRepository<PasswordResetToken, Long>:
    - findByToken(String token): Optional<PasswordResetToken>
    - deleteByExpiresAtBefore(LocalDateTime dateTime): void (for cleanup)
    - findByUserIdAndUsedFalse(Long userId): List<PasswordResetToken> (for invalidation)

- [ ] **Task 3: Create Rate Limiting Table and Repository** (AC: #7)
  - [ ] Create Flyway migration V14__create_password_reset_attempts_table.sql:
    - Columns: id BIGSERIAL PRIMARY KEY, email VARCHAR(255) NOT NULL, attempt_count INT DEFAULT 1, first_attempt_at TIMESTAMP, last_attempt_at TIMESTAMP
    - Create unique index on email: idx_password_reset_attempts_email
  - [ ] Create PasswordResetAttempt entity:
    - Fields: id, email, attemptCount, firstAttemptAt, lastAttemptAt
  - [ ] Create PasswordResetAttemptRepository:
    - findByEmail(String email): Optional<PasswordResetAttempt>
    - deleteByFirstAttemptAtBefore(LocalDateTime dateTime): void (cleanup old attempts)

- [ ] **Task 4: Configure Spring Mail** (AC: #5)
  - [ ] Add spring-boot-starter-mail dependency to pom.xml (if not present)
  - [ ] Configure SMTP settings in application-dev.yml:
    - spring.mail.host, port, username, password
    - For Gmail: host=smtp.gmail.com, port=587, enable TLS
    - For AWS SES: configure AWS SES SMTP credentials
  - [ ] Configure async execution in application.yml:
    - spring.mail.properties.mail.smtp.auth=true
    - spring.mail.properties.mail.smtp.starttls.enable=true
  - [ ] Create EmailConfig class with @EnableAsync annotation
  - [ ] Configure ThreadPoolTaskExecutor bean for async email sending
  - [ ] Test SMTP connection on application startup

- [ ] **Task 5: Create Email Templates** (AC: #6)
  - [ ] Create resources/templates/email/ directory
  - [ ] Create password-reset-email.html Thymeleaf template:
    - Include Ultra BMS logo and branding
    - User greeting with name variable: "Hi {{firstName}}"
    - Clear instructions: "You requested to reset your password"
    - Reset link button: href="${resetLink}"
    - Expiration warning: "Link expires in 15 minutes"
    - Support contact footer
    - Responsive HTML with inline CSS (email-safe)
  - [ ] Create password-change-confirmation.html template:
    - Notification: "Your password was successfully changed"
    - Security alert: "If you didn't make this change, contact support immediately"
    - Login link button
    - Timestamp of change
  - [ ] Create plain text versions: password-reset-email.txt and password-change-confirmation.txt
  - [ ] Test templates render correctly with sample data

- [ ] **Task 6: Implement Email Service** (AC: #5, #6)
  - [ ] Create EmailService class in com.ultrabms.service package
  - [ ] Inject JavaMailSender and TemplateEngine (Thymeleaf)
  - [ ] Implement sendPasswordResetEmail(User user, String resetToken) method:
    - Generate reset link: String resetLink = frontendUrl + "/reset-password?token=" + resetToken
    - Build context with variables: firstName, resetLink, expirationMinutes
    - Render HTML template using templateEngine.process("email/password-reset-email", context)
    - Create MimeMessage with HTML content
    - Set subject: "Reset Your Ultra BMS Password"
    - Send email using mailSender.send()
    - Annotate method with @Async for async execution
    - Log email sent at INFO level
  - [ ] Implement sendPasswordChangeConfirmation(User user) method:
    - Build context with firstName, loginLink, timestamp
    - Render confirmation template
    - Subject: "Your Ultra BMS Password Has Been Changed"
    - Send asynchronously
  - [ ] Add error handling: catch and log email failures without throwing exceptions
  - [ ] Configure retry logic for transient email failures (optional)

- [ ] **Task 7: Create Password Validator Utility** (AC: #12)
  - [ ] Create PasswordValidator utility class in com.ultrabms.util package
  - [ ] Define password requirements constants:
    - MIN_LENGTH = 8
    - REGEX_PATTERN = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
  - [ ] Implement validate(String password): ValidationResult method:
    - Check length >= 8
    - Check contains uppercase (regex match)
    - Check contains lowercase
    - Check contains digit
    - Check contains special character
    - Return ValidationResult with boolean isValid and List<String> errors
  - [ ] Create ValidationResult record class
  - [ ] Add unit tests for validator with valid and invalid passwords

- [ ] **Task 8: Implement Password Reset Request Endpoint** (AC: #1, #7, #9)
  - [ ] Create PasswordResetService in com.ultrabms.service package
  - [ ] Implement initiatePasswordReset(String email) method:
    - Check rate limiting: query PasswordResetAttemptRepository
    - If attempts >= 3 in last hour, throw RateLimitExceededException
    - If attempts < 3, increment attempt_count or create new entry
    - Find user by email (optional query - don't fail if not exists)
    - If user exists and active:
      * Invalidate previous unused tokens for user (set used = true)
      * Generate secure token: SecureRandom 32 bytes, hex-encoded
      * Calculate expiresAt: LocalDateTime.now().plusMinutes(15)
      * Save PasswordResetToken entity
      * Call emailService.sendPasswordResetEmail(user, token) async
      * Log to audit_logs: action "PASSWORD_RESET_REQUESTED", userId, email
    - Always return success (don't reveal if user exists)
  - [ ] Create AuthController method: POST /api/v1/auth/forgot-password
    - Accepts ForgotPasswordRequest DTO: { email }
    - Validate email format with @Valid @Email
    - Call passwordResetService.initiatePasswordReset(email)
    - Return 200 OK: { success: true, message: "If account exists, reset link sent" }
  - [ ] Create ForgotPasswordRequest record: email field with @Email, @NotBlank
  - [ ] Add @ExceptionHandler in GlobalExceptionHandler for RateLimitExceededException → 429 Too Many Requests

- [ ] **Task 9: Implement Token Validation Endpoint** (AC: #2)
  - [ ] Implement validateResetToken(String token): TokenValidationResult in PasswordResetService
    - Query passwordResetTokenRepository.findByToken(token)
    - If not found, return invalid with message "Token not found"
    - Check isValid() method (not expired, not used)
    - Check user is active
    - Calculate remaining time: Duration.between(now, expiresAt).toMinutes()
    - Return TokenValidationResult: valid (boolean), remainingMinutes (long), message (String)
  - [ ] Create TokenValidationResult record
  - [ ] Create AuthController method: GET /api/v1/auth/reset-password/validate
    - Query parameter: @RequestParam String token
    - Call passwordResetService.validateResetToken(token)
    - If valid, return 200 OK: { success: true, valid: true, remainingMinutes }
    - If invalid, return 400 Bad Request: { success: false, error: { code: "INVALID_TOKEN", message } }

- [ ] **Task 10: Implement Password Reset Completion Endpoint** (AC: #3, #9, #12)
  - [ ] Implement resetPassword(String token, String newPassword) in PasswordResetService:
    - Re-validate token using validateResetToken() - throw InvalidTokenException if invalid
    - Validate newPassword using PasswordValidator - throw ValidationException if fails
    - Find PasswordResetToken entity by token
    - Hash newPassword with BCrypt: passwordEncoder.encode(newPassword)
    - Update user.passwordHash
    - Mark token as used: token.setUsed(true)
    - Delete all refresh tokens for user from refresh_tokens table
    - Save changes
    - Log to audit_logs: action "PASSWORD_RESET_COMPLETED", userId
    - Call emailService.sendPasswordChangeConfirmation(user) async
    - Return success message
  - [ ] Create AuthController method: POST /api/v1/auth/reset-password
    - Request body: ResetPasswordRequest { token, newPassword }
    - Validate with @Valid
    - Call passwordResetService.resetPassword(token, newPassword)
    - Return 200 OK: { success: true, message: "Password reset successful" }
  - [ ] Create ResetPasswordRequest record with @NotBlank annotations
  - [ ] Add exception handlers: InvalidTokenException → 400, ValidationException → 400

- [ ] **Task 11: Implement Token Cleanup Scheduled Job** (AC: #8)
  - [ ] Create PasswordResetCleanupService in com.ultrabms.service package
  - [ ] Implement cleanupExpiredTokens() method:
    - Calculate cutoff: LocalDateTime.now().minusHours(1)
    - Delete expired tokens: passwordResetTokenRepository.deleteByExpiresAtBefore(cutoff)
    - Delete old used tokens: delete where used = true AND created_at < now - 24 hours
    - Log deleted count at INFO level: "Cleaned up {count} expired password reset tokens"
  - [ ] Annotate method with @Scheduled(cron = "0 0 * * * *") for hourly execution
  - [ ] Annotate method with @Transactional
  - [ ] Create similar cleanup for password_reset_attempts: delete entries > 7 days old
  - [ ] Test scheduled job runs correctly (use @EnableScheduling in config)

- [ ] **Task 12: Create Frontend Forgot Password Page** (AC: #10)
  - [ ] Create app/(auth)/forgot-password/page.tsx
  - [ ] Install shadcn components: npx shadcn@latest add card input button alert
  - [ ] Build form with React Hook Form:
    - Email input field with validation
    - Submit button: "Send Reset Link"
    - Loading state during submission
  - [ ] Create Zod schema: z.object({ email: z.string().email("Invalid email address") })
  - [ ] Implement onSubmit handler:
    - Call POST /api/v1/auth/forgot-password with { email }
    - On success: show success message "Check your email for reset instructions"
    - On error: show error alert
    - Disable form after successful submission
  - [ ] Add link back to login: "Remember your password? Sign in"
  - [ ] Style with shadcn Card, dark mode support
  - [ ] Add meta tags: title "Forgot Password - Ultra BMS"

- [ ] **Task 13: Create Frontend Reset Password Page** (AC: #11, #12)
  - [ ] Create app/(auth)/reset-password/page.tsx
  - [ ] Extract token from URL query params: const { token } = useSearchParams()
  - [ ] On mount, validate token:
    - Call GET /api/v1/auth/reset-password/validate?token={token}
    - If invalid, show error: "Reset link is invalid or expired" with "Request new link" button
    - If valid, show password form and countdown timer
  - [ ] Build password form with two fields: newPassword, confirmPassword
  - [ ] Create Zod schema:
    - newPassword: min 8 chars, regex for complexity requirements
    - confirmPassword: must match newPassword with .refine()
  - [ ] Implement password strength meter component:
    - Calculate strength score based on requirements met
    - Show checklist: ✓ 8+ characters, ✓ Uppercase, ✓ Lowercase, ✓ Number, ✓ Special char
    - Color-coded strength bar: red (weak), yellow (medium), green (strong)
  - [ ] Implement countdown timer:
    - Show remaining time from API response
    - Update every second
    - Show warning when < 2 minutes remaining
  - [ ] Implement onSubmit handler:
    - Call POST /api/v1/auth/reset-password with { token, newPassword }
    - On success: show success message, redirect to /login after 3 seconds
    - On error: show error alert
  - [ ] Style with shadcn components: Card, Input, Button, Progress, Alert

- [ ] **Task 14: Test Password Reset Flow End-to-End** (AC: All)
  - [ ] Test happy path:
    - Request reset with valid email → 200 OK, email sent
    - Check email received with reset link
    - Click link, validate token → 200 OK, form shown
    - Enter new password → 200 OK, password changed
    - Login with new password → Success
    - Check confirmation email received
  - [ ] Test invalid email:
    - Request reset with non-existent email → 200 OK (doesn't reveal)
    - No email sent
  - [ ] Test token expiration:
    - Request reset
    - Wait 16 minutes
    - Validate token → 400 Bad Request "expired"
    - Attempt reset → 400 Bad Request
  - [ ] Test token reuse:
    - Complete password reset successfully
    - Attempt to use same token again → 400 Bad Request "already used"
  - [ ] Test rate limiting:
    - Request reset 3 times in 10 minutes → Success
    - Request 4th time → 429 Too Many Requests
    - Wait 1 hour, retry → Success
  - [ ] Test token invalidation:
    - Request reset (token1)
    - Request reset again (token2)
    - Attempt to use token1 → 400 Bad Request "invalidated"
    - Use token2 → Success
  - [ ] Test password validation:
    - Attempt weak password (no uppercase) → 400 Bad Request with specific error
    - Attempt short password (<8 chars) → 400 Bad Request
  - [ ] Test refresh token invalidation:
    - Login, get refresh token
    - Reset password
    - Attempt to use old refresh token → 401 Unauthorized
  - [ ] Test audit logging:
    - Complete full flow
    - Check audit_logs table has entries for: reset requested, reset completed

- [ ] **Task 15: Update API Documentation** (AC: All)
  - [ ] Add Swagger annotations to AuthController endpoints:
    - @Operation for forgot-password, validate-token, reset-password
    - @ApiResponse for 200, 400, 429 status codes
    - Include example request/response bodies
  - [ ] Update backend/README.md with "Password Reset" section:
    - Document 3-step flow
    - Document security measures (rate limiting, token expiration)
    - Document email configuration requirements
    - Provide testing instructions
  - [ ] Document email template customization process
  - [ ] Add troubleshooting section for common issues:
    - Email not sending (SMTP config)
    - Token validation failures
    - Rate limiting triggers

## Dev Notes

### Architecture Alignment

This story implements the password reset and recovery workflow as specified in the PRD and Architecture Document:

**Email Service Integration:**
- **Spring Mail Configuration:** Uses Spring Boot Mail Starter with Gmail API as specified in PRD [Source: docs/prd.md#52-integration-requirements]
- **Async Email Sending:** Leverages Spring @Async for non-blocking email operations, aligning with async processing pattern [Source: docs/architecture.md#async-processing]
- **Thymeleaf Templates:** HTML email templates with branding, consistent with UI component approach [Source: docs/architecture.md#implementation-patterns]

**Security Requirements:**
- **Token-Based Reset:** Cryptographically secure tokens (SecureRandom, 32 bytes) with 15-minute expiration [Source: docs/prd.md#54-security-requirements]
- **Rate Limiting:** Maximum 3 reset attempts per hour prevents abuse and brute-force attacks [Source: docs/architecture.md#api-security]
- **Audit Logging:** All password reset activities logged to audit_logs table for compliance and security monitoring [Source: docs/architecture.md#audit-logging]
- **BCrypt Password Hashing:** Consistent with authentication pattern, cost factor 12 [Source: docs/architecture.md#sensitive-data-handling]

**Database Schema:**
- **Normalized Tables:** password_reset_tokens and password_reset_attempts follow snake_case naming convention [Source: docs/architecture.md#database-naming]
- **Indexed Columns:** token and expires_at indexed for fast lookup and cleanup operations [Source: docs/architecture.md#database-optimization]
- **Foreign Keys:** user_id references users table with ON DELETE CASCADE for data integrity [Source: docs/architecture.md#data-integrity-rules]

**API Design:**
- **RESTful Endpoints:** Follow /api/v1 base URL convention with noun-based paths [Source: docs/architecture.md#rest-api-conventions]
- **Consistent Response Format:** All APIs return { success, data/error, timestamp } structure [Source: docs/architecture.md#api-response-format]
- **HTTP Status Codes:** 200 OK (success), 400 Bad Request (invalid token), 429 Too Many Requests (rate limit) [Source: docs/architecture.md#status-codes]

**Frontend Implementation:**
- **Next.js Pages:** /forgot-password and /reset-password routes in (auth) route group [Source: docs/architecture.md#project-structure]
- **React Hook Form + Zod:** Standard form validation pattern for consistency [Source: docs/architecture.md#form-pattern-with-react-hook-form-zod]
- **shadcn/ui Components:** Card, Input, Button, Alert for consistent UI [Source: docs/ux-design-specification.md#component-library-strategy]
- **Password Strength Meter:** Real-time validation feedback following UX patterns [Source: docs/ux-design-specification.md#form-patterns]

**Alignment with PRD:**
- **3-Step Password Reset:** Request → Validate → Complete flow as specified [Source: docs/prd.md#311-user-authentication]
- **15-Minute Expiration:** Token lifetime matches PRD security requirements [Source: docs/prd.md#54-security-requirements]
- **Email Notifications:** Reset request and confirmation emails with branding [Source: docs/prd.md#1011-user-support]

### Project Structure Notes

**New Files and Packages:**
```
backend/
├── src/main/
│   ├── java/com/ultrabms/
│   │   ├── entity/
│   │   │   ├── PasswordResetToken.java (NEW: token management entity)
│   │   │   └── PasswordResetAttempt.java (NEW: rate limiting entity)
│   │   ├── repository/
│   │   │   ├── PasswordResetTokenRepository.java (NEW)
│   │   │   └── PasswordResetAttemptRepository.java (NEW)
│   │   ├── service/
│   │   │   ├── PasswordResetService.java (NEW: reset logic)
│   │   │   ├── EmailService.java (NEW: email sending)
│   │   │   └── PasswordResetCleanupService.java (NEW: scheduled cleanup)
│   │   ├── controller/
│   │   │   └── AuthController.java (UPDATED: add reset endpoints)
│   │   ├── dto/
│   │   │   ├── ForgotPasswordRequest.java (NEW: record)
│   │   │   ├── ResetPasswordRequest.java (NEW: record)
│   │   │   ├── TokenValidationResult.java (NEW: record)
│   │   │   └── ValidationResult.java (NEW: record for password validation)
│   │   ├── util/
│   │   │   └── PasswordValidator.java (NEW: utility class)
│   │   ├── exception/
│   │   │   ├── InvalidTokenException.java (NEW)
│   │   │   └── RateLimitExceededException.java (NEW)
│   │   └── config/
│   │       └── EmailConfig.java (NEW: async email configuration)
│   └── resources/
│       ├── application-dev.yml (UPDATED: add mail config)
│       ├── templates/
│       │   └── email/
│       │       ├── password-reset-email.html (NEW: Thymeleaf template)
│       │       ├── password-reset-email.txt (NEW: plain text)
│       │       ├── password-change-confirmation.html (NEW)
│       │       └── password-change-confirmation.txt (NEW)
│       └── db/migration/
│           ├── V13__create_password_reset_tokens_table.sql (NEW)
│           └── V14__create_password_reset_attempts_table.sql (NEW)

frontend/
├── src/
│   ├── app/
│   │   └── (auth)/
│   │       ├── forgot-password/
│   │       │   └── page.tsx (NEW)
│   │       └── reset-password/
│   │           └── page.tsx (NEW)
│   └── components/
│       ├── auth/
│       │   └── PasswordStrengthMeter.tsx (NEW: optional component)
│       └── ui/
│           └── countdown-timer.tsx (NEW: token expiration timer)
```

**Database Schema:**
```sql
-- password_reset_tokens table
CREATE TABLE password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- password_reset_attempts table (rate limiting)
CREATE TABLE password_reset_attempts (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  attempt_count INT DEFAULT 1,
  first_attempt_at TIMESTAMP NOT NULL,
  last_attempt_at TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX idx_password_reset_attempts_email ON password_reset_attempts(email);
```

**Email Configuration (application-dev.yml):**
```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${GMAIL_USERNAME}
    password: ${GMAIL_APP_PASSWORD}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
            required: true
          connectiontimeout: 5000
          timeout: 5000
          writetimeout: 5000

app:
  frontend-url: http://localhost:3000
  support-email: support@ultrabms.com
```

**Token Generation Pattern:**
```java
// Secure token generation
SecureRandom secureRandom = new SecureRandom();
byte[] tokenBytes = new byte[32]; // 256 bits
secureRandom.nextBytes(tokenBytes);
String token = Hex.encodeHexString(tokenBytes); // 64 character hex string
```

**Password Validation Pattern:**
```java
// Password strength requirements
private static final String PASSWORD_PATTERN =
    "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";

public ValidationResult validate(String password) {
    List<String> errors = new ArrayList<>();
    if (password.length() < 8) errors.add("Password must be at least 8 characters");
    if (!password.matches(".*[A-Z].*")) errors.add("Must contain uppercase letter");
    if (!password.matches(".*[a-z].*")) errors.add("Must contain lowercase letter");
    if (!password.matches(".*\\d.*")) errors.add("Must contain number");
    if (!password.matches(".*[@$!%*?&].*")) errors.add("Must contain special character");
    return new ValidationResult(errors.isEmpty(), errors);
}
```

### Learnings from Previous Story

**From Story 2-2-role-based-access-control-rbac-implementation (Status: ready-for-dev):**

Story 2.2 is not yet implemented, so no code-level learnings. However, the story establishes important infrastructure this story can leverage:

- **Audit Logging Pattern Established:** Story 2.2 extends audit_logs table usage for authorization failures - reuse same pattern for password reset activities [Source: docs/sprint-artifacts/2-2-role-based-access-control-rbac-implementation.md#ac10]
- **GlobalExceptionHandler Pattern:** Story 2.2 adds custom exception handlers - follow same pattern for InvalidTokenException and RateLimitExceededException [Source: docs/sprint-artifacts/2-2-role-based-access-control-rbac-implementation.md#task-11]
- **Email Service Infrastructure:** Spring Mail is configured in Story 2.1's prerequisites - verify SMTP settings work before implementing [Source: docs/sprint-artifacts/2-2-role-based-access-control-rbac-implementation.md#learnings-from-previous-story]

**From Story 2-1-user-registration-and-login-with-jwt-authentication (Status: in-progress):**

Story 2.1 established core authentication infrastructure that Story 2.3 extends:

- **BCrypt Password Encoding:** PasswordEncoder bean already configured - reuse for hashing reset passwords [Source: docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md#task-6]
- **User Entity Ready:** User entity with passwordHash field exists - update via PasswordResetService [Source: docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md#project-structure-notes]
- **AuthController Exists:** Add password reset endpoints to existing AuthController [Source: docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md#task-4]
- **Refresh Token Infrastructure:** RefreshToken entity and repository exist - delete user's refresh tokens on password reset for security [Source: docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md#task-5]
- **UserRepository Available:** UserRepository.findByEmail() method exists - use to lookup user for password reset [Source: docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md#files-to-reuse]
- **Audit Logging Setup:** AuditLog entity and pattern established - log all password reset activities [Source: docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md#task-7]

**Key Architectural Continuity:**
- **Authentication Package Structure:** Continue organizing in com.ultrabms.service, com.ultrabms.controller pattern
- **DTO Pattern:** Use Java 17 records for request/response DTOs (ForgotPasswordRequest, ResetPasswordRequest)
- **Exception Handling:** Extend GlobalExceptionHandler with new exception handlers following established pattern
- **Constructor Injection:** Use @RequiredArgsConstructor for all services (established pattern)

**Files to Extend/Reuse:**
- `AuthController` → Add 3 password reset endpoints
- `GlobalExceptionHandler` → Add handlers for InvalidTokenException, RateLimitExceededException
- `UserRepository` → Use findByEmail() to lookup users
- `PasswordEncoder` → Use to hash new passwords
- `AuditLogRepository` → Log password reset events
- `RefreshTokenRepository` → Delete tokens on password reset (from Story 2.1)

**No Technical Debt from Previous Stories:**
- Story 2.1 authentication infrastructure is solid
- Email service configuration is straightforward
- No conflicts with RBAC implementation (Story 2.2)

### Testing Strategy

**Unit Testing:**
- **PasswordValidator:** Test all validation rules (length, uppercase, lowercase, number, special char), valid and invalid passwords
- **PasswordResetService:** Test token generation uniqueness, expiration calculation, token invalidation logic, rate limiting logic
- **EmailService:** Mock JavaMailSender, verify template rendering, verify email content contains reset link
- **PasswordResetToken Entity:** Test isExpired() and isValid() methods with various timestamps
- **Token Generation:** Verify SecureRandom produces unique tokens, hex encoding produces 64-char strings

**Integration Testing:**
- **Forgot Password Endpoint:**
  - POST with valid email → 200 OK, token created in DB, email sent
  - POST with invalid email → 200 OK (doesn't reveal), no token created
  - POST 4 times in hour → 429 Too Many Requests on 4th attempt
  - Verify audit_logs entry created
- **Validate Token Endpoint:**
  - GET with valid token → 200 OK { valid: true, remainingMinutes }
  - GET with expired token → 400 Bad Request { valid: false }
  - GET with used token → 400 Bad Request
  - GET with non-existent token → 400 Bad Request
- **Reset Password Endpoint:**
  - POST with valid token + strong password → 200 OK, password updated, token marked used
  - POST with valid token + weak password → 400 Bad Request with validation errors
  - POST with expired token → 400 Bad Request
  - POST with used token → 400 Bad Request
  - Verify refresh tokens deleted for user
  - Verify confirmation email sent
  - Verify audit_logs entry created
- **Token Cleanup Job:**
  - Create expired tokens (expiresAt in past)
  - Run @Scheduled method manually
  - Verify expired tokens deleted from DB

**Manual Testing Checklist:**

1. **Happy Path - Complete Password Reset:**
   - Navigate to /forgot-password
   - Enter valid email (e.g., test@ultrabms.com)
   - Click "Send Reset Link" → See success message
   - Check email inbox → Verify reset email received with branded template
   - Click reset link → Redirected to /reset-password?token={token}
   - Verify countdown timer shows ~15 minutes remaining
   - Enter new password meeting all requirements
   - See password strength meter turn green
   - Click "Reset Password" → See success message
   - Redirect to /login after 3 seconds
   - Login with new password → Success
   - Check email → Verify confirmation email received

2. **Token Expiration:**
   - Request password reset
   - Wait 16 minutes (or manually set expiresAt to past in DB)
   - Click reset link → See "Token expired" error
   - Click "Request new link" → Return to /forgot-password
   - Request new reset → Success with new token

3. **Token Reuse Prevention:**
   - Complete password reset successfully
   - Copy reset link from email
   - Navigate to reset link again
   - See error: "Token already used"

4. **Rate Limiting:**
   - Request password reset for same email
   - Repeat immediately 2 more times → Success (3 total)
   - Request 4th time within hour → See 429 error "Too many attempts"
   - Wait 61 minutes
   - Request again → Success (counter reset)

5. **Token Invalidation:**
   - Request password reset → Token1 created
   - Request password reset again → Token2 created
   - Try to use Token1 → Error "Token invalid"
   - Use Token2 → Success

6. **Password Validation:**
   - On reset page, enter passwords testing each rule:
     - Short password (7 chars) → See "8+ characters" unchecked
     - No uppercase → See "Uppercase letter" unchecked
     - No number → See "Number" unchecked
     - No special char → See "Special character" unchecked
   - Enter strong password → All checkmarks, green strength bar
   - Mismatched passwords → See "Passwords must match" error

7. **Refresh Token Invalidation:**
   - Login, get access and refresh tokens
   - Reset password
   - Try to use old refresh token to get new access token → 401 Unauthorized
   - Login with new password → Success with new tokens

8. **Email Configuration:**
   - Verify SMTP settings in application-dev.yml
   - Check email templates render correctly (test with sample data)
   - Verify emails sent async (API returns immediately, email sent in background)
   - Check email spam folder if not received

9. **Audit Logging:**
   - Complete full password reset flow
   - Query audit_logs table: SELECT * FROM audit_logs WHERE action LIKE 'PASSWORD%' ORDER BY created_at DESC
   - Verify entries: PASSWORD_RESET_REQUESTED, PASSWORD_RESET_COMPLETED
   - Verify entries include userId, email, IP address

10. **Scheduled Cleanup:**
    - Create test tokens with various expiresAt values (expired, used, fresh)
    - Manually trigger @Scheduled job or wait for hourly execution
    - Verify expired tokens (>1 hour old) deleted
    - Verify fresh tokens remain
    - Check logs for cleanup statistics

**Error Scenarios:**
- Network error during email send → API still returns 200, log error
- Invalid email format → 400 Bad Request with validation error
- Database connection failure → 500 Internal Server Error
- SMTP authentication failure → Log error, user sees success (fails silently)

**Frontend Testing:**
- Test responsiveness on mobile devices
- Test dark mode for both pages
- Test keyboard navigation (Tab through form fields)
- Test screen reader compatibility
- Test with slow network (loading states)

**Test Levels:**
- **L1 (Unit):** PasswordValidator, token generation, email template rendering, entity methods
- **L2 (Integration):** All 3 endpoints with MockMvc, scheduled cleanup, email sending with mock SMTP
- **L3 (Manual):** Full flow with real email, UI interactions, error handling (REQUIRED for acceptance)

### References

- [Epic 2: Story 2.3 - Password Reset and Recovery Workflow](docs/epics.md#story-23-password-reset-and-recovery-workflow)
- [PRD: User Authentication](docs/prd.md#311-user-authentication)
- [PRD: Security Requirements](docs/prd.md#54-security-requirements)
- [PRD: Email Service Integration](docs/prd.md#52-integration-requirements)
- [Architecture: Security Architecture](docs/architecture.md#security-architecture)
- [Architecture: API Security - Rate Limiting](docs/architecture.md#api-security)
- [Architecture: Async Processing](docs/architecture.md#async-processing)
- [Story 2.1: User Registration and Login with JWT Authentication](docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md)
- [Story 2.2: Role-Based Access Control (RBAC) Implementation](docs/sprint-artifacts/2-2-role-based-access-control-rbac-implementation.md)
- [UX Design: Form Patterns](docs/ux-design-specification.md#form-patterns)

## Dev Agent Record

### Context Reference

- [Story Context XML](./2-3-password-reset-and-recovery-workflow.context.xml) - Generated 2025-11-13

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
