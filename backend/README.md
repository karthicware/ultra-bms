# Ultra BMS Backend

Spring Boot backend for Ultra Building Maintenance System.

## Prerequisites

- Java 17 or higher
- Maven 3.9+
- PostgreSQL 14+ (for production, Story 1.2)

## Build & Run

```bash
# Build
./mvnw clean install

# Run
./mvnw spring-boot:run
```

## Configuration

- `application.yml` - Main configuration
- `application-dev.yml` - Development configuration
- `application-prod.yml` - Production configuration

## Code Quality

```bash
# Run Checkstyle
./mvnw checkstyle:check

# Run tests
./mvnw test
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs

## Authentication

The Ultra BMS API uses JWT (JSON Web Tokens) for stateless authentication with comprehensive security features including password strength validation, rate limiting, and account lockout.

### Security Features

- **JWT-based authentication** - Stateless access and refresh tokens
- **Password strength validation** - Enforced complexity requirements using Passay library
- **Rate limiting** - Prevents brute-force attacks (5 attempts per 15 minutes per email)
- **Account lockout** - Automatic 30-minute lockout after 5 failed login attempts
- **Token blacklisting** - Secure logout with SHA-256 hashed tokens
- **Audit logging** - All authentication events logged with IP address and user agent
- **BCrypt password hashing** - Passwords hashed with BCrypt (strength 12)

### Password Requirements

All passwords must meet the following criteria:
- **Minimum 8 characters** (maximum 128)
- At least **1 uppercase letter** (A-Z)
- At least **1 lowercase letter** (a-z)
- At least **1 digit** (0-9)
- At least **1 special character** (!@#$%^&*)
- **No whitespace** characters allowed

### Authentication Endpoints

#### 1. Register New User

Create a new user account with email and password.

**Endpoint:** `POST /api/v1/auth/register`

**Request Body:**
```json
{
  "email": "john.doe@ultrabms.com",
  "password": "P@ssw0rd123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "PROPERTY_MANAGER",
  "phone": "+971501234567"
}
```

**Available Roles:**
- `SUPER_ADMIN` - Full system access
- `PROPERTY_MANAGER` - Property management
- `MAINTENANCE_SUPERVISOR` - Maintenance operations
- `FINANCE_MANAGER` - Financial operations
- `TENANT` - Tenant portal access
- `VENDOR` - Vendor portal access

**Success Response (201 Created):**
```json
{
  "id": "baa4c1ce-8478-42d0-ae50-d93a075466a4",
  "email": "john.doe@ultrabms.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "PROPERTY_MANAGER",
  "active": true,
  "mfaEnabled": false,
  "createdAt": "2025-11-13T20:26:24.465611",
  "updatedAt": "2025-11-13T20:26:24.465611"
}
```

**Example curl:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@ultrabms.com",
    "password": "P@ssw0rd123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "PROPERTY_MANAGER",
    "phone": "+971501234567"
  }'
```

**Error Responses:**
- `400 Bad Request` - Password doesn't meet requirements or validation failed
- `409 Conflict` - Email already exists

#### 2. Login

Authenticate with email and password to receive JWT tokens.

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "email": "john.doe@ultrabms.com",
  "password": "P@ssw0rd123"
}
```

**Success Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "baa4c1ce-8478-42d0-ae50-d93a075466a4",
    "email": "john.doe@ultrabms.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "PROPERTY_MANAGER",
    "active": true,
    "mfaEnabled": false,
    "createdAt": "2025-11-13T20:26:24.465611",
    "updatedAt": "2025-11-13T20:26:24.465611"
  }
}
```

**Token Details:**
- `accessToken` - Short-lived token for API requests (1 hour)
- `refreshToken` - Long-lived token for obtaining new access tokens (7 days)
- `expiresIn` - Access token expiration time in seconds (3600 = 1 hour)

**Example curl:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@ultrabms.com",
    "password": "P@ssw0rd123"
  }'
```

**Error Responses:**
- `401 Unauthorized` - Invalid email or password
- `423 Locked` - Too many failed attempts (rate limiting or account lockout)

#### 3. Refresh Access Token

Obtain a new access token using a valid refresh token.

**Endpoint:** `POST /api/v1/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Success Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "expiresIn": 3600
}
```

**Example curl:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired refresh token
- `401 Unauthorized` - Refresh token has been blacklisted

#### 4. Logout

Invalidate the current access token by adding it to the blacklist.

**Endpoint:** `POST /api/v1/auth/logout`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Success Response (204 No Content)**

**Example curl:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token

### Using JWT Tokens

After successful login, include the access token in the `Authorization` header for all protected API requests:

**Header Format:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Example Protected Request:**
```bash
curl -X GET http://localhost:8080/api/v1/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

**Token Lifecycle:**
1. **Login** - Receive access token (1 hour) and refresh token (7 days)
2. **Use Access Token** - Include in Authorization header for API requests
3. **Token Expires** - When access token expires (after 1 hour):
   - Option A: Use refresh token to get new access token
   - Option B: Login again with credentials
4. **Logout** - Access token added to blacklist (cannot be used again)

### Rate Limiting

To prevent brute-force attacks, the API implements rate limiting on login attempts:

- **Limit:** 5 failed login attempts per email address
- **Time Window:** 15 minutes
- **Response:** HTTP 423 Locked after limit exceeded
- **Reset:** Automatic reset after 15 minutes
- **Scope:** Per email address (tracked in-memory)

**Example Rate Limit Response:**
```json
{
  "timestamp": "2025-11-13T20:31:59Z",
  "status": 423,
  "error": "Locked",
  "message": "Too many failed login attempts. Please try again later.",
  "path": "/api/v1/auth/login",
  "requestId": "b2e19110-69cd-4794-ad4a-cd626490c9ac"
}
```

### Account Lockout

After 5 consecutive failed login attempts, user accounts are temporarily locked:

- **Threshold:** 5 failed login attempts
- **Lockout Duration:** 30 minutes
- **Response:** HTTP 423 Locked
- **Reset:** Automatic unlock after 30 minutes
- **Persistence:** Stored in database (survives application restart)

**Account Lockout Response:**
```json
{
  "timestamp": "2025-11-13T20:32:20Z",
  "status": 423,
  "error": "Locked",
  "message": "Account is locked until 2025-11-13T21:02:20",
  "path": "/api/v1/auth/login",
  "requestId": "22269d77-ffbc-4551-8ef6-9afb0f8fa1a6"
}
```

### Audit Logging

All authentication events are logged to the database with the following details:

- **User ID** - Authenticated user (null for registration)
- **Action** - Event type (LOGIN_SUCCESS, LOGIN_FAILURE, REGISTRATION, LOGOUT)
- **IP Address** - Client IP address
- **User Agent** - Client browser/application
- **Timestamp** - When the event occurred
- **Details** - Additional context (JSON format)

**Logged Events:**
- `REGISTRATION` - New user account created
- `LOGIN_SUCCESS` - Successful authentication
- `LOGIN_FAILURE` - Failed authentication attempt
- `LOGOUT` - User logged out
- `TOKEN_REFRESH` - Access token refreshed

### Security Best Practices

**For Frontend Applications:**
1. Store access token in memory (React state, Vue store)
2. Store refresh token in HTTP-only cookie (recommended)
3. Implement automatic token refresh before expiration
4. Clear tokens on logout
5. Redirect to login on 401 Unauthorized responses

**For API Consumers:**
1. Never log or expose JWT tokens
2. Use HTTPS in production
3. Implement token refresh flow
4. Handle rate limiting gracefully
5. Monitor audit logs for suspicious activity

**JWT Configuration (Development):**
```yaml
jwt:
  secret: dGhpc0lzQURldmVsb3BtZW50U2VjcmV0S2V5Rm9yVGVzdGluZ09ubHlEb05vdFVzZUluUHJvZHVjdGlvbiEhISEhIQ==
  access-token-expiration: 3600000      # 1 hour
  refresh-token-expiration: 604800000   # 7 days
```

**⚠️ Production Security:**
- Generate a new secret: `openssl rand -base64 32`
- Store secret in environment variables
- Never commit secrets to version control
- Use secure key management (AWS Secrets Manager, Azure Key Vault)

## Password Reset

The Ultra BMS API provides a secure three-step password reset workflow that allows users to safely reset their forgotten passwords via email verification.

### Security Features

- **Cryptographically secure tokens** - 256-bit entropy (64-character hex strings)
- **Short token expiration** - 15-minute validity window
- **Single-use tokens** - Tokens invalidated after successful reset
- **Rate limiting** - 3 reset requests per hour per email address
- **Email enumeration prevention** - Consistent responses for existing/non-existing accounts
- **Password strength validation** - Same requirements as registration
- **Audit logging** - All password resets logged with timestamp and IP
- **Automated cleanup** - Hourly scheduled job removes expired/used tokens

### Three-Step Password Reset Flow

#### Step 1: Request Password Reset

User submits their email address to initiate the password reset process.

**Endpoint:** `POST /api/v1/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "If your email is registered, you'll receive password reset instructions shortly."
}
```

**Example curl:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@ultrabms.com"
  }'
```

**What Happens:**
1. System checks if email exists in database
2. If found, generates secure 64-character token (256-bit entropy)
3. Token stored with 15-minute expiration
4. Email sent with reset link containing token
5. Previous unused tokens for user invalidated
6. **Security:** Always returns 200 OK (prevents email enumeration)

**Rate Limiting:**
- **Limit:** 3 requests per hour per email address
- **Response:** 429 Too Many Requests after limit exceeded
- **Reset:** Automatic after 1 hour from first attempt

**Rate Limit Response (429):**
```json
{
  "status": 429,
  "error": "Too Many Requests",
  "message": "Too many password reset attempts. Please try again in 45 minutes.",
  "path": "/api/v1/auth/forgot-password",
  "requestId": "uuid"
}
```

#### Step 2: Validate Reset Token

Frontend validates the token when user clicks email link (optional step for better UX).

**Endpoint:** `GET /api/v1/auth/reset-password/validate?token={token}`

**Success Response (200 OK):**
```json
{
  "valid": true,
  "remainingMinutes": 12
}
```

**Example curl:**
```bash
curl -X GET "http://localhost:8080/api/v1/auth/reset-password/validate?token=a1b2c3d4e5f6..."
```

**Error Responses:**
- `400 Bad Request` - Token invalid, expired, or already used

**What Frontend Should Do:**
- If `valid: true` - Show password reset form
- If error - Show "Link expired" message with option to request new reset

#### Step 3: Complete Password Reset

User submits new password with valid token.

**Endpoint:** `POST /api/v1/auth/reset-password`

**Request Body:**
```json
{
  "token": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
  "newPassword": "NewSecureP@ssw0rd123"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successful. You can now log in with your new password."
}
```

**Example curl:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    "newPassword": "NewSecureP@ssw0rd123"
  }'
```

**What Happens:**
1. Token validated (exists, not used, not expired)
2. Password validated against strength requirements
3. Password hashed with BCrypt (cost factor 12)
4. User's password updated in database
5. Token marked as used (prevents reuse)
6. Confirmation email sent to user
7. Event logged to audit trail

**Error Responses:**
- `400 Bad Request` - Invalid/expired token or weak password
- `400 Bad Request` - Token already used

### Email Configuration

Password reset requires SMTP email configuration. The system uses Gmail SMTP by default.

**Required Environment Variables:**
```bash
export GMAIL_USERNAME=your-email@gmail.com
export GMAIL_APP_PASSWORD=your-16-char-app-password
```

**⚠️ Gmail App Password Setup:**
1. Enable 2-Factor Authentication on Google account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use 16-character app password (not your regular password)
4. Never commit credentials to version control

**Development Configuration (application-dev.yml):**
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
```

**Production Configuration:**
- Use environment-specific SMTP server
- Consider dedicated email service (SendGrid, AWS SES, Mailgun)
- Configure proper SPF/DKIM/DMARC records
- Use dedicated email domain for better deliverability

**Email Templates:**

Two branded HTML + plain text email templates:

1. **Password Reset Email** (`password-reset-email.html`)
   - Subject: "Reset Your Ultra BMS Password"
   - Contains reset button with token link
   - 15-minute expiration warning
   - Security notice about unsolicited emails

2. **Password Change Confirmation** (`password-change-confirmation.html`)
   - Subject: "Your Ultra BMS Password Has Been Changed"
   - Confirms successful password change
   - Timestamp of change
   - Alert if change wasn't authorized

### Token Security Details

**Token Generation:**
- **Algorithm:** `SecureRandom` (cryptographically secure)
- **Entropy:** 32 bytes (256 bits)
- **Format:** 64-character hexadecimal string
- **Example:** `a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2`

**Token Lifecycle:**
1. **Generation:** User requests password reset
2. **Storage:** Token stored in `password_reset_tokens` table
3. **Expiration:** 15 minutes from generation
4. **Validation:** Checked for existence, used status, expiration
5. **Usage:** Marked as used after successful password reset
6. **Cleanup:** Deleted by hourly scheduled job

**Database Schema:**

**password_reset_tokens table:**
| Column     | Type      | Description                      |
|------------|-----------|----------------------------------|
| id         | UUID      | Primary key                      |
| user_id    | UUID      | Foreign key to users table       |
| token      | VARCHAR   | 64-character hex token (unique)  |
| expires_at | TIMESTAMP | Expiration time (15 min)         |
| used       | BOOLEAN   | Single-use flag                  |
| created_at | TIMESTAMP | Token generation timestamp       |
| updated_at | TIMESTAMP | Last update timestamp            |
| version    | BIGINT    | Optimistic locking version       |

**password_reset_attempts table:**
| Column           | Type      | Description                   |
|------------------|-----------|-------------------------------|
| id               | UUID      | Primary key                   |
| email            | VARCHAR   | Email being reset (unique)    |
| attempt_count    | INTEGER   | Number of attempts            |
| first_attempt_at | TIMESTAMP | Rate limit window start       |
| last_attempt_at  | TIMESTAMP | Most recent attempt           |
| created_at       | TIMESTAMP | Record creation               |
| updated_at       | TIMESTAMP | Last update                   |
| version          | BIGINT    | Optimistic locking version    |

### Automated Cleanup

A scheduled job runs every hour to clean up old data and prevent database bloat.

**Schedule:** `0 0 * * * *` (every hour at :00 minutes)

**Service:** `PasswordResetCleanupService.cleanupExpiredData()`

**Cleanup Operations:**

1. **Expired Tokens:**
   - **Criteria:** `expiresAt < (now - 1 hour)`
   - **Retention:** 1 hour after expiration
   - **Purpose:** Debugging buffer for recently expired tokens

2. **Used Tokens:**
   - **Criteria:** `used = true AND createdAt < (now - 24 hours)`
   - **Retention:** 24 hours after creation
   - **Purpose:** Audit trail for recent password resets

3. **Rate Limit Attempts:**
   - **Criteria:** `firstAttemptAt < (now - 7 days)`
   - **Retention:** 7 days
   - **Purpose:** Security monitoring and analytics

**Monitoring Cleanup Job:**
```bash
# Check logs for cleanup job execution
docker logs ultra-bms-backend | grep "PasswordResetCleanupService"

# Expected output every hour:
# INFO  c.u.service.PasswordResetCleanupService - Starting password reset cleanup job
# INFO  c.u.service.PasswordResetCleanupService - Deleted 5 expired password reset tokens
# INFO  c.u.service.PasswordResetCleanupService - Deleted 3 old used password reset tokens
# INFO  c.u.service.PasswordResetCleanupService - Deleted 12 old password reset rate limit attempts
# INFO  c.u.service.PasswordResetCleanupService - Password reset cleanup job completed successfully. Total records deleted: 20
```

### Testing Password Reset Flow

**Complete End-to-End Test:**

```bash
# Step 1: Request password reset
curl -X POST http://localhost:8080/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "john.doe@ultrabms.com"}'

# Response: {"success": true, "message": "If your email is registered..."}

# Step 2: Check email for reset link
# Link format: http://localhost:3000/reset-password?token=a1b2c3d4e5f6...

# Step 3: Validate token (optional, for better UX)
TOKEN="a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"
curl -X GET "http://localhost:8080/api/v1/auth/reset-password/validate?token=$TOKEN"

# Response: {"valid": true, "remainingMinutes": 14}

# Step 4: Reset password
curl -X POST http://localhost:8080/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$TOKEN\",
    \"newPassword\": \"NewSecureP@ssw0rd123\"
  }"

# Response: {"success": true, "message": "Password reset successful..."}

# Step 5: Verify login with new password
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@ultrabms.com",
    "password": "NewSecureP@ssw0rd123"
  }'

# Response: {"accessToken": "...", "refreshToken": "...", "user": {...}}
```

**Test Rate Limiting:**
```bash
# Send 4 requests to trigger rate limit
for i in {1..4}; do
  echo "Attempt $i:"
  curl -X POST http://localhost:8080/api/v1/auth/forgot-password \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com"}'
  echo -e "\n---"
done

# Expected:
# Attempts 1-3: HTTP 200 OK
# Attempt 4: HTTP 429 Too Many Requests
```

**Test Token Expiration:**
```bash
# Request reset
curl -X POST http://localhost:8080/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "john.doe@ultrabms.com"}'

# Wait 16 minutes, then try to use token
sleep 960

# Try to reset password (will fail)
curl -X POST http://localhost:8080/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$TOKEN\",
    \"newPassword\": \"NewSecureP@ssw0rd123\"
  }"

# Expected: HTTP 400 Bad Request - "Reset link is expired"
```

### Troubleshooting

#### Email Not Received

**Check 1: Email Configuration**
```bash
# Verify environment variables are set
echo $GMAIL_USERNAME
echo $GMAIL_APP_PASSWORD  # Should show 16-character app password

# Check application logs for SMTP errors
docker logs ultra-bms-backend | grep "mail"
```

**Check 2: Spam/Junk Folder**
- Check spam/junk folder in email client
- Add noreply@ultrabms.com to contacts

**Check 3: Gmail App Password**
- Ensure 2FA is enabled on Google account
- Generate new app password if needed
- Verify 16-character password (no spaces)

**Check 4: Application Logs**
```bash
# Look for email sending errors
docker logs ultra-bms-backend | grep "EmailService"

# Expected success log:
# INFO c.u.service.EmailService - Password reset email sent successfully to user@example.com
```

#### Token Validation Fails

**Problem:** "Reset link is invalid or has expired"

**Solutions:**
1. **Token Expired:**
   - Tokens valid for only 15 minutes
   - Request new password reset
   - Use reset link immediately after receiving email

2. **Token Already Used:**
   - Each token can only be used once
   - Request new password reset

3. **Token Malformed:**
   - Ensure full 64-character token copied from email
   - Check for truncation or extra characters
   - Token should be pure hexadecimal (0-9, a-f)

4. **Database Issue:**
   - Check database connectivity
   - Verify `password_reset_tokens` table exists
   - Check application logs for database errors

#### Rate Limiting Triggered

**Problem:** "Too many password reset attempts"

**Solutions:**
- Wait for time specified in error message (up to 1 hour)
- Rate limit: 3 attempts per hour per email address
- Window resets 1 hour after first attempt
- Contact support if legitimate user needs immediate access

**Override Rate Limit (Development Only):**
```sql
-- Delete rate limit entries for specific email
DELETE FROM password_reset_attempts WHERE email = 'user@example.com';
```

#### Password Validation Fails

**Problem:** "Password does not meet requirements"

**Solutions:**
- Ensure password meets all requirements:
  - Minimum 8 characters
  - At least 1 uppercase letter (A-Z)
  - At least 1 lowercase letter (a-z)
  - At least 1 digit (0-9)
  - At least 1 special character (@$!%*?&)
- Frontend validation mirrors backend rules
- Try stronger password: `SecureP@ssw0rd123`

#### Cleanup Job Not Running

**Problem:** Old tokens not being deleted

**Solutions:**
1. **Check Scheduling Enabled:**
   ```java
   // Verify @EnableScheduling in EmailConfig.java
   @Configuration
   @EnableAsync
   @EnableScheduling
   public class EmailConfig { ... }
   ```

2. **Check Logs:**
   ```bash
   # Should see hourly log entries
   docker logs ultra-bms-backend | grep "cleanup job"
   ```

3. **Manual Cleanup (if needed):**
   ```sql
   -- Delete expired tokens
   DELETE FROM password_reset_tokens
   WHERE expires_at < NOW() - INTERVAL '1 hour';

   -- Delete old used tokens
   DELETE FROM password_reset_tokens
   WHERE used = true
   AND created_at < NOW() - INTERVAL '24 hours';

   -- Delete old rate limit attempts
   DELETE FROM password_reset_attempts
   WHERE first_attempt_at < NOW() - INTERVAL '7 days';
   ```

### Security Best Practices

**For Production Deployment:**
1. **Email Security:**
   - Use dedicated SMTP service (SendGrid, AWS SES, Mailgun)
   - Configure SPF, DKIM, DMARC records
   - Use dedicated domain for emails
   - Monitor email deliverability rates

2. **Token Security:**
   - Never log complete tokens (only first 10 characters)
   - Use HTTPS for all reset links
   - Consider shorter expiration time for high-security apps
   - Monitor for unusual token generation patterns

3. **Rate Limiting:**
   - Adjust limits based on abuse patterns
   - Consider IP-based rate limiting in addition to email-based
   - Implement CAPTCHA for repeated attempts
   - Monitor rate limit triggers for abuse detection

4. **Monitoring:**
   - Alert on high password reset volumes
   - Track failed reset attempts
   - Monitor email bounce rates
   - Review audit logs regularly

5. **User Experience:**
   - Clear error messages guide users
   - Provide support contact for locked accounts
   - Consider SMS-based reset as alternative
   - Show remaining time on validation page

### API Documentation

For detailed API documentation including request/response schemas, error codes, and interactive testing:

**Swagger UI:** http://localhost:8080/swagger-ui.html

**Navigate to:** Auth Controller → Password Reset Endpoints

**Interactive Testing:**
1. Open Swagger UI
2. Find "POST /api/v1/auth/forgot-password"
3. Click "Try it out"
4. Enter request body
5. Click "Execute"
6. View response

**Full API Documentation:** `/docs/api/password-reset-api.md`

## Session Management

Ultra BMS implements robust session management with tracking, timeout enforcement, and security controls to protect user sessions.

### Session Lifecycle

#### 1. Session Creation (On Login)

When a user successfully authenticates:
- **Database Record:** `UserSession` entity created in `user_sessions` table
- **Session ID:** UUID generated as unique session identifier
- **Token Hashing:** Access and refresh tokens hashed (SHA-256) before storage
- **Metadata Captured:** IP address, User-Agent, device type, creation timestamp
- **Expiration Set:** Absolute timeout (12 hours from creation)
- **Concurrent Limit:** Max 3 sessions per user; oldest deleted if exceeded

```java
// SessionService.createSession()
String sessionId = UUID.randomUUID().toString();
String accessTokenHash = TokenHashUtil.hashToken(accessToken);
String refreshTokenHash = TokenHashUtil.hashToken(refreshToken);

UserSession session = new UserSession();
session.setUser(user);
session.setSessionId(sessionId);
session.setAccessTokenHash(accessTokenHash);
session.setRefreshTokenHash(refreshTokenHash);
session.setExpiresAt(now.plusSeconds(absoluteTimeout)); // 12 hours
session.setIpAddress(request.getRemoteAddr());
session.setUserAgent(request.getHeader("User-Agent"));
session.updateDeviceType(); // Desktop/Mobile/Tablet
```

#### 2. Session Activity Tracking

On each authenticated request:
- **Filter:** `SessionActivityFilter` intercepts after JWT validation
- **Timestamp Update:** `last_activity_at` updated to current time
- **Idle Check:** Session invalidated if idle > 30 minutes
- **Absolute Check:** Session invalidated if age > 12 hours
- **Blacklist:** Expired sessions add tokens to `token_blacklist`

```java
// SessionActivityFilter.doFilterInternal()
Authentication auth = SecurityContextHolder.getContext().getAuthentication();
if (auth != null && auth.isAuthenticated()) {
    String token = extractTokenFromRequest(request);
    sessionService.updateSessionActivity(token); // Checks timeouts
}
```

#### 3. Session Timeout Enforcement

**Idle Timeout (30 minutes):**
- No authenticated requests for 30 minutes → session invalidated
- `last_activity_at` compared to current time
- User must login again after idle timeout

**Absolute Timeout (12 hours):**
- Session expires 12 hours after creation, regardless of activity
- `expires_at` timestamp checked on each request
- Forces re-authentication for long-running sessions

```yaml
# application.yml
app:
  security:
    session:
      idle-timeout: 1800      # 30 minutes in seconds
      absolute-timeout: 43200 # 12 hours in seconds
      max-concurrent-sessions: 3
```

#### 4. Session Termination

**Logout (Single Device):**
- `POST /api/v1/auth/logout`
- Marks session `is_active = false`
- Adds access and refresh tokens to blacklist
- Clears refresh token cookie
- Logs audit event

**Logout All Devices:**
- `POST /api/v1/auth/logout-all`
- Invalidates all user sessions except current
- Blacklists all associated tokens
- Returns count of revoked sessions

**Session Revocation:**
- `DELETE /api/v1/sessions/{sessionId}`
- User can revoke individual sessions from security settings
- Validates session belongs to current user
- Same invalidation process as logout

#### 5. Session Cleanup (Scheduled)

**Hourly Cleanup Job:**
- **Schedule:** Every hour (`@Scheduled(fixedDelay = 3600000)`)
- **Expired Sessions:** Deleted if `expires_at < now`
- **Inactive Sessions:** Deleted if inactive for 30+ days
- **Blacklist Entries:** Deleted after token expiration
- **Audit Logs:** Retained for 90 days (cleanup optional)

```java
// SessionCleanupService
@Scheduled(fixedDelay = 3600000) // Every hour
@Transactional
public void cleanupExpiredSessions() {
    LocalDateTime now = LocalDateTime.now();

    // Delete expired sessions
    int deleted = userSessionRepository.deleteByExpiresAtBefore(now);

    // Delete old inactive sessions (30+ days)
    LocalDateTime threshold = now.minusDays(30);
    int inactive = userSessionRepository.deleteInactiveSessionsBefore(threshold);
}
```

### Token Blacklisting

**Purpose:** Prevent use of invalidated tokens after logout

**Implementation:**
- **Table:** `token_blacklist`
- **Hash:** SHA-256 hash of token stored (not plain text)
- **Type:** ACCESS or REFRESH token
- **Reason:** LOGOUT, LOGOUT_ALL, IDLE_TIMEOUT, ABSOLUTE_TIMEOUT, PASSWORD_RESET, SECURITY_VIOLATION
- **Expiration:** Token's original expiry time (for cleanup)

**Validation Flow:**
```java
// JwtAuthenticationFilter.doFilterInternal()
if (jwtTokenProvider.validateToken(token)) {
    String tokenHash = TokenHashUtil.hashToken(token);
    if (tokenBlacklistRepository.existsByTokenHash(tokenHash)) {
        // Token is blacklisted - reject authentication
        log.warn("Attempted to use blacklisted token");
        return;
    }
    // Token valid - proceed with authentication
}
```

### Concurrent Session Enforcement

**Limit:** Maximum 3 active sessions per user

**Enforcement Logic:**
```java
// SessionService.createSession()
long activeCount = userSessionRepository.countByUserIdAndIsActiveTrue(userId);
int maxSessions = securityProperties.getSession().getMaxConcurrentSessions();

if (activeCount >= maxSessions) {
    // Delete oldest session
    List<UserSession> oldest = userSessionRepository.findOldestActiveSessionByUserId(userId);
    UserSession oldestSession = oldest.get(0);
    invalidateSession(oldestSession.getSessionId(), BlacklistReason.SECURITY_VIOLATION);
}
```

**User Impact:**
- Login from 4th device → oldest session automatically terminated
- User sees "Your session was terminated due to login from another device" on next request
- Prevents account sharing and session hijacking

### Session Management Endpoints

**Get Active Sessions:**
```bash
GET /api/v1/sessions
Authorization: Bearer {accessToken}

# Response:
{
  "sessions": [
    {
      "sessionId": "550e8400-e29b-41d4-a716-446655440000",
      "deviceType": "Desktop",
      "browser": "Chrome 120",
      "ipAddress": "192.168.1.100",
      "location": "Dubai, UAE",
      "lastActivityAt": "2025-11-15T10:30:00Z",
      "createdAt": "2025-11-15T08:00:00Z",
      "isCurrent": true
    }
  ]
}
```

**Revoke Session:**
```bash
DELETE /api/v1/sessions/{sessionId}
Authorization: Bearer {accessToken}

# Response: 204 No Content
```

**Logout All Devices:**
```bash
POST /api/v1/auth/logout-all
Authorization: Bearer {accessToken}

# Response:
{
  "success": true,
  "message": "Logged out from 2 other device(s)",
  "revokedSessions": 2
}
```

### Security Headers

Session security enhanced with HTTP security headers:

```java
// SecurityConfig - Security Headers Configuration
.headers(headers -> headers
    .frameOptions(frame -> frame.deny())  // Prevent clickjacking
    .xssProtection(xss -> xss.headerValue(ENABLED_MODE_BLOCK))  // XSS protection
    .contentTypeOptions(contentTypeOptions -> {})  // MIME sniffing prevention
    .httpStrictTransportSecurity(hsts -> hsts
        .includeSubDomains(true)
        .maxAgeInSeconds(31536000)  // 1 year HSTS
    )
    .contentSecurityPolicy(csp -> csp
        .policyDirectives("default-src 'self'; frame-ancestors 'none'")
    )
)
```

**Headers Applied:**
- `X-Frame-Options: DENY` - Prevents embedding in iframes
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - Browser XSS protection
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` - Force HTTPS
- `Content-Security-Policy: default-src 'self'; frame-ancestors 'none'` - CSP protection

### Frontend Integration

**Token Refresh Interceptor:**
```typescript
// frontend/src/lib/api.ts
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Attempt token refresh
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include' // Send refresh token cookie
      });

      if (response.ok) {
        const { accessToken } = await response.json();
        setAccessToken(accessToken);
        // Retry original request with new token
        return apiClient(originalRequest);
      }

      // Refresh failed - logout user
      await logout();
    }
    return Promise.reject(error);
  }
);
```

**Session Expiry Warning:**
- Modal displays 5 minutes before access token expires
- Countdown timer shows remaining time
- "Stay Logged In" button triggers token refresh
- "Logout" button immediately ends session
- Auto-logout if user doesn't respond

**Active Sessions UI:**
- Located at `/settings/security` in dashboard
- Table shows all active sessions with device, browser, IP, last active time
- Current session highlighted with badge
- Revoke button for each session
- "Logout All Other Devices" button

### Troubleshooting

#### Session Expired (Idle Timeout)

**Problem:** "Session expired due to inactivity"

**Cause:** No requests for 30+ minutes

**Solution:**
- Login again
- Increase `app.security.session.idle-timeout` in application.yml (not recommended for security)
- Frontend can ping backend periodically to keep session alive

#### Session Expired (Absolute Timeout)

**Problem:** "Session expired (absolute timeout)"

**Cause:** Session older than 12 hours

**Solution:**
- Login again
- Long-running sessions force re-authentication for security

#### Concurrent Session Limit

**Problem:** "Your session was terminated due to login from another device"

**Cause:** More than 3 active sessions

**Solution:**
- Logout from unused devices via `/settings/security` page
- Use "Logout All Other Devices" button
- Adjust `app.security.session.max-concurrent-sessions` if needed

#### Token Blacklisted

**Problem:** "Attempted to use blacklisted token"

**Cause:** Token was invalidated via logout or timeout

**Solution:**
- Login again to get new tokens
- Check if logout was accidental
- Verify session wasn't revoked from another device

### Monitoring

**Session Metrics to Monitor:**
- Active session count per user
- Session creation rate
- Session invalidation rate (timeouts vs. manual logout)
- Concurrent session limit violations
- Token blacklist size (should shrink after cleanup)

**Log Events:**
```
INFO  c.u.service.SessionService - Created session abc123 for user user@example.com from IP 192.168.1.100
WARN  c.u.service.SessionService - Session xyz789 idle timeout exceeded (30min). Invalidating session.
INFO  c.u.service.SessionService - Session abc123 revoked by user
INFO  c.u.service.SessionCleanupService - Session cleanup completed: deleted 15 expired sessions and 8 old inactive sessions
```

### Security Best Practices

1. **Never Log Complete Tokens:** Only log session IDs or first 10 characters of token
2. **Monitor Anomalies:** Alert on unusual session patterns (many logins, rapid device changes)
3. **IP Validation (Optional):** Track IP changes within session; flag as suspicious
4. **Device Fingerprinting:** Enhance device detection beyond User-Agent parsing
5. **Geographic Tracking:** Use GeoIP for location-based alerts (optional)

### Database Schema

**user_sessions Table:**
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    access_token_hash VARCHAR(255),
    refresh_token_hash VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    device_type VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity_at);
```

**token_blacklist Table:**
```sql
CREATE TABLE token_blacklist (
    id UUID PRIMARY KEY,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    token_type VARCHAR(20) NOT NULL CHECK (token_type IN ('ACCESS', 'REFRESH')),
    expires_at TIMESTAMP NOT NULL,
    reason VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    blacklisted_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_token_blacklist_token_hash ON token_blacklist(token_hash);
CREATE INDEX idx_token_blacklist_expires_at ON token_blacklist(expires_at);
```

### API Documentation

For detailed session management API documentation:

**Swagger UI:** http://localhost:8080/swagger-ui.html → Session Controller

**Full API Docs:** `/docs/api/session-management-api.md`

## Package Structure

```
com.ultrabms/
├── config/          # Configuration classes
├── controller/      # REST controllers
├── service/         # Business logic
├── repository/      # Data access
├── entity/          # JPA entities
├── dto/             # Data transfer objects
├── mapper/          # Entity-DTO mappers
├── exception/       # Custom exceptions
├── filter/          # Servlet filters
├── security/        # Security configuration
└── util/            # Utility classes
```

## REST API Structure

### API Base Path

All API endpoints are prefixed with `/api/v1`:

```
http://localhost:8080/api/v1/{resource}
```

Examples:
- `GET /api/v1/users` - List users
- `GET /api/v1/users/{id}` - Get user by ID
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Health Check Endpoints

Basic health and info endpoints (no authentication required):

```bash
# Basic health check
curl http://localhost:8080/api/health

# Application info
curl http://localhost:8080/api/info

# Detailed health (Spring Boot Actuator)
curl http://localhost:8080/actuator/health

# Cache metrics
curl http://localhost:8080/actuator/caches
```

### Error Response Format

All API errors return a standardized JSON structure:

```json
{
  "timestamp": "2025-11-13T10:30:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "User with id 550e8400-e29b-41d4-a716-446655440000 not found",
  "path": "/api/v1/users/550e8400-e29b-41d4-a716-446655440000",
  "requestId": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
}
```

**Error Response Fields:**
- `timestamp` - When the error occurred (ISO-8601 format)
- `status` - HTTP status code (404, 400, 500, etc.)
- `error` - HTTP status reason phrase
- `message` - User-friendly error description
- `path` - The requested URI path
- `requestId` - Correlation UUID for log tracing

**HTTP Status Codes:**
- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource
- `500 Internal Server Error` - Server errors

### Validation Errors

Validation errors (400 Bad Request) include field-level details:

```json
{
  "timestamp": "2025-11-13T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed for request body",
  "path": "/api/v1/users",
  "requestId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "errors": [
    {
      "field": "email",
      "error": "Email must be valid",
      "rejectedValue": "invalid-email"
    },
    {
      "field": "firstName",
      "error": "First name is required",
      "rejectedValue": null
    }
  ]
}
```

### Pagination

List endpoints support pagination via query parameters:

```bash
# Basic pagination
curl "http://localhost:8080/api/v1/users?page=0&size=20"

# With sorting
curl "http://localhost:8080/api/v1/users?page=0&size=20&sort=createdAt,desc"

# Multiple sort fields
curl "http://localhost:8080/api/v1/users?page=0&size=20&sort=lastName,asc&sort=firstName,asc"
```

**Pagination Parameters:**
- `page` - Page number (0-indexed, default: 0)
- `size` - Page size (default: 20, max: 100)
- `sort` - Sort field and direction (e.g., `createdAt,desc`)

**Pagination Response:**
```json
{
  "content": [
    { "id": "...", "email": "..." }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": { "sorted": true, "unsorted": false }
  },
  "totalElements": 100,
  "totalPages": 5,
  "last": false,
  "first": true
}
```

### CORS Configuration

CORS is configured to allow requests from the Next.js frontend:

**Allowed Origins:**
- Development: `http://localhost:3000` (Next.js dev server)
- Production: Configured in `application-prod.yml`

**Allowed Methods:**
- `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`

**Allowed Headers:**
- `Content-Type`, `Authorization`, `X-Requested-With`, `X-Correlation-ID`

**Example CORS Request from Frontend:**
```javascript
// Next.js frontend (localhost:3000)
fetch('http://localhost:8080/api/v1/users', {
  method: 'GET',
  credentials: 'include', // Include cookies
  headers: {
    'Content-Type': 'application/json'
  }
})
```

### Request Tracing

Every API request receives a unique correlation ID:

- **Header:** `X-Correlation-ID`
- **Format:** UUID (e.g., `7c9e6679-7425-40de-944b-e07fc1f90ae7`)
- **Purpose:** Trace requests across logs for debugging

**Example:**
```bash
curl -v http://localhost:8080/api/health
# Response includes:
# X-Correlation-ID: 7c9e6679-7425-40de-944b-e07fc1f90ae7
```

All log statements include the correlation ID via MDC (Mapped Diagnostic Context):
```
2025-11-13 10:30:00.123 [http-nio-8080-exec-1] INFO  c.u.filter.RequestCorrelationFilter [correlationId=7c9e6679-7425-40de-944b-e07fc1f90ae7] - Request received: GET /api/health
```

### Example API Calls

**Get all users (with pagination):**
```bash
curl -X GET "http://localhost:8080/api/v1/users?page=0&size=10&sort=createdAt,desc" \
  -H "Content-Type: application/json"
```

**Get user by ID:**
```bash
curl -X GET "http://localhost:8080/api/v1/users/550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json"
```

**Create user:**
```bash
curl -X POST "http://localhost:8080/api/v1/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@ultrabms.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "PROPERTY_MANAGER",
    "active": true,
    "mfaEnabled": false
  }'
```

**Update user:**
```bash
curl -X PUT "http://localhost:8080/api/v1/users/550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@ultrabms.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "PROPERTY_MANAGER",
    "active": true,
    "mfaEnabled": true
  }'
```

**Delete user (soft delete):**
```bash
curl -X DELETE "http://localhost:8080/api/v1/users/550e8400-e29b-41d4-a716-446655440000"
```

### Testing via Swagger UI

The easiest way to test APIs is through Swagger UI:

1. Start the application: `./mvnw spring-boot:run`
2. Open browser: http://localhost:8080/swagger-ui.html
3. Click "Try it out" on any endpoint
4. Fill in parameters and request body
5. Click "Execute" to send the request
6. View response details (status, headers, body)

**Swagger UI Features:**
- Interactive API documentation
- Request/response examples
- Schema validation
- "Try it out" functionality
- Model schemas with validation rules
