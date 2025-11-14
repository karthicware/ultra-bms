# Password Reset API Documentation

## Overview

The Password Reset API provides a secure three-step workflow for users to reset their forgotten passwords. The implementation follows security best practices including rate limiting, secure token generation, and email verification.

## Base URL

```
http://localhost:8080/api/v1/auth
```

Production: `https://api.ultrabms.com/api/v1/auth`

---

## Endpoints

### 1. Request Password Reset

Initiates the password reset workflow by sending a reset email to the user.

**Endpoint:** `POST /forgot-password`

**Authentication:** None (public endpoint)

**Rate Limiting:** 3 requests per hour per email address

#### Request Body

```json
{
  "email": "user@example.com"
}
```

| Field | Type   | Required | Validation         |
|-------|--------|----------|--------------------|
| email | string | Yes      | Valid email format |

#### Success Response

**Code:** `200 OK`

```json
{
  "success": true,
  "message": "If your email is registered, you'll receive password reset instructions shortly."
}
```

**Note:** Always returns 200 OK regardless of whether the email exists (security feature to prevent email enumeration).

#### Error Responses

**Rate Limit Exceeded:**

**Code:** `429 Too Many Requests`

```json
{
  "status": 429,
  "error": "Too Many Requests",
  "message": "Too many password reset attempts. Please try again in 45 minutes.",
  "path": "/api/v1/auth/forgot-password",
  "requestId": "uuid"
}
```

**Validation Error:**

**Code:** `400 Bad Request`

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed for request body",
  "path": "/api/v1/auth/forgot-password",
  "requestId": "uuid",
  "fieldErrors": [
    {
      "field": "email",
      "message": "Email must be valid"
    }
  ]
}
```

---

### 2. Validate Reset Token

Validates a password reset token and returns remaining time before expiration.

**Endpoint:** `GET /reset-password/validate`

**Authentication:** None (public endpoint)

**Query Parameters:**

| Parameter | Type   | Required | Description                  |
|-----------|--------|----------|------------------------------|
| token     | string | Yes      | 64-character hex reset token |

#### Request Example

```
GET /reset-password/validate?token=a1b2c3d4e5f6...
```

#### Success Response

**Code:** `200 OK`

```json
{
  "valid": true,
  "remainingMinutes": 12
}
```

| Field            | Type    | Description                                |
|------------------|---------|--------------------------------------------|
| valid            | boolean | Whether the token is valid                 |
| remainingMinutes | number  | Minutes until token expires (1-15 minutes) |

#### Error Responses

**Invalid/Expired Token:**

**Code:** `400 Bad Request`

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Reset link is invalid or has expired",
  "path": "/api/v1/auth/reset-password/validate",
  "requestId": "uuid"
}
```

**Token Already Used:**

**Code:** `400 Bad Request`

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Reset link has already been used. Please request a new password reset.",
  "path": "/api/v1/auth/reset-password/validate",
  "requestId": "uuid"
}
```

---

### 3. Reset Password

Completes the password reset by setting a new password.

**Endpoint:** `POST /reset-password`

**Authentication:** None (public endpoint)

#### Request Body

```json
{
  "token": "a1b2c3d4e5f6...",
  "newPassword": "SecureP@ssw0rd123"
}
```

| Field       | Type   | Required | Validation                                                    |
|-------------|--------|----------|---------------------------------------------------------------|
| token       | string | Yes      | 64-character hex token from email                             |
| newPassword | string | Yes      | Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special (@$!%*?&) |

#### Success Response

**Code:** `200 OK`

```json
{
  "success": true,
  "message": "Password reset successful. You can now log in with your new password."
}
```

#### Error Responses

**Weak Password:**

**Code:** `400 Bad Request`

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Password does not meet requirements: Password must contain at least one special character",
  "path": "/api/v1/auth/reset-password",
  "requestId": "uuid",
  "fieldErrors": [
    {
      "field": "password",
      "message": "Password does not meet requirements: ...",
      "rejectedValue": "weak"
    }
  ]
}
```

**Invalid Token:**

**Code:** `400 Bad Request`

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Reset link is invalid or has expired",
  "path": "/api/v1/auth/reset-password",
  "requestId": "uuid"
}
```

---

## Workflow

### Complete Password Reset Flow

1. **User Requests Reset**
   - User visits `/forgot-password` page
   - Submits email address
   - System generates secure token and sends email

2. **User Receives Email**
   - Email contains reset link with token
   - Link format: `https://app.ultrabms.com/reset-password?token=abc123...`
   - Token valid for 15 minutes

3. **User Clicks Reset Link**
   - Frontend validates token via GET `/reset-password/validate`
   - If valid, shows password reset form
   - If invalid/expired, shows error and link to request new reset

4. **User Submits New Password**
   - Frontend validates password strength
   - Submits to POST `/reset-password`
   - On success, redirects to login page

---

## Security Features

### Rate Limiting

- **Limit:** 3 password reset requests per hour per email address
- **Tracking:** Based on email address, persisted in database
- **Window:** Rolling 1-hour window
- **Response:** 429 status code with retry time

### Token Security

- **Generation:** Cryptographically secure random (32 bytes, 256-bit entropy)
- **Format:** 64-character hexadecimal string
- **Expiration:** 15 minutes from generation
- **Single-use:** Token invalidated after successful password reset
- **Cleanup:** Expired tokens cleaned up hourly via scheduled job

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one digit (0-9)
- At least one special character (@$!%*?&)
- Validated on both frontend and backend
- Hashed with BCrypt (cost factor 12)

### Email Enumeration Prevention

- Forgot password endpoint always returns 200 OK
- Doesn't reveal whether email exists in system
- Same response for existing and non-existing accounts

### Audit Logging

- All password reset completions logged to audit_logs table
- Includes user ID, timestamp, IP address
- Helps track security events and suspicious activity

---

## Email Templates

### Password Reset Email

**Subject:** Reset Your Ultra BMS Password

**Content:**
- Personalized greeting with user's first name
- Reset button with secure token link
- Expiration warning (15 minutes)
- Security notice about unsolicited emails
- Support contact information

**Example:**
```
Hi John,

We received a request to reset your password. Click the button below to create a new password:

[Reset Password Button]

This link will expire in 15 minutes for security reasons.

If you didn't request this, please ignore this email.
```

### Password Change Confirmation Email

**Subject:** Your Ultra BMS Password Has Been Changed

**Content:**
- Confirmation of password change
- Timestamp of change
- Login button
- Security alert if change wasn't authorized
- Support contact information

### Email Template Customization

The password reset feature uses Thymeleaf templates for emails, providing both HTML and plain text versions for maximum compatibility.

#### Template Files

Email templates are located in `backend/src/main/resources/templates/email/`:

**Password Reset Email:**
- `password-reset-email.html` - HTML version with branding and styling
- `password-reset-email.txt` - Plain text fallback version

**Password Change Confirmation:**
- `password-change-confirmation.html` - HTML version with branding
- `password-change-confirmation.txt` - Plain text fallback version

#### Customizing Templates

**1. Modify HTML Template (`password-reset-email.html`):**

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>Reset Your Password</title>
    <style>
        /* Customize colors, fonts, layout */
        .button {
            background-color: #007bff; /* Change brand color */
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Personalized greeting using Thymeleaf variable -->
        <h2>Hi <span th:text="${firstName}">User</span>,</h2>

        <p>We received a request to reset your password.</p>

        <!-- Reset link with token variable -->
        <a th:href="${resetLink}" class="button">Reset Password</a>

        <p>This link will expire in <strong>15 minutes</strong>.</p>

        <p>If you didn't request this, please ignore this email.</p>

        <!-- Customize footer with your branding -->
        <footer>
            <p>Ultra BMS Team</p>
            <p>support@ultrabms.com</p>
        </footer>
    </div>
</body>
</html>
```

**2. Modify Plain Text Template (`password-reset-email.txt`):**

```text
Hi [[${firstName}]],

We received a request to reset your Ultra BMS password.

Reset your password:
[[${resetLink}]]

This link will expire in 15 minutes for security reasons.

If you didn't request this password reset, please ignore this email or contact us if you have concerns.

Best regards,
Ultra BMS Team
support@ultrabms.com
```

#### Available Template Variables

Templates have access to the following Thymeleaf variables:

**Password Reset Email:**
| Variable   | Type   | Description                                              | Example                                |
|------------|--------|----------------------------------------------------------|----------------------------------------|
| firstName  | String | User's first name                                        | "John"                                 |
| resetLink  | String | Complete reset URL with token                            | "https://app.ultrabms.com/reset?token=abc123..." |
| expirationMinutes | Integer | Token validity period | 15                                     |

**Password Change Confirmation:**
| Variable    | Type   | Description                                             | Example                                |
|-------------|--------|---------------------------------------------------------|----------------------------------------|
| firstName   | String | User's first name                                       | "John"                                 |
| changeTime  | String | Formatted timestamp of password change                  | "Nov 14, 2025 at 3:45 PM"              |
| loginLink   | String | Direct link to login page                               | "https://app.ultrabms.com/login"       |
| supportEmail| String | Support contact email                                   | "support@ultrabms.com"                 |

#### Testing Templates Locally

**1. Create Test HTML File:**

Save your modified template as a standalone HTML file and open in browser to preview styling:

```bash
# Copy template to temp file for testing
cp backend/src/main/resources/templates/email/password-reset-email.html /tmp/test-email.html

# Replace Thymeleaf variables with sample data for preview
sed 's/th:text="${firstName}">User/John/' /tmp/test-email.html > /tmp/preview.html
sed -i '' 's#th:href="${resetLink}"#href="http://localhost:3000/reset-password?token=abc123"#' /tmp/preview.html

# Open in browser
open /tmp/preview.html
```

**2. Send Test Email via API:**

```bash
# Trigger actual email send to test in real email client
curl -X POST http://localhost:8080/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "your-test-email@gmail.com"}'

# Check inbox for email with your customizations
```

**3. Test Both HTML and Plain Text Versions:**

Most email clients automatically choose HTML version if available, falling back to plain text. To test plain text version:

- **Gmail:** View menu → "Show original" to see both versions
- **Outlook:** Right-click email → "View Source"
- **Apple Mail:** View → Message → Raw Source

#### Customization Best Practices

**Branding:**
- Update colors to match your brand palette
- Replace "Ultra BMS" with your company name
- Add company logo (use inline base64 or hosted image URL)
- Customize footer with company address, social links

**Content:**
- Keep email concise and scannable
- Use clear call-to-action buttons
- Include support contact information
- Add unsubscribe link if required by regulations

**Security:**
- Never include the token in plain text (only in link)
- Don't reveal user information that could aid attackers
- Include warning about phishing emails
- Provide alternative contact method for verification

**Accessibility:**
- Use sufficient color contrast (WCAG AA standard)
- Include alt text for images
- Ensure plain text version is complete and readable
- Test with screen readers

**Email Client Compatibility:**
- Use inline CSS (many clients strip `<style>` blocks)
- Avoid JavaScript (not supported in email)
- Test in major email clients (Gmail, Outlook, Apple Mail)
- Use tables for layout in HTML emails (best compatibility)

#### Example: Adding Company Logo

```html
<!-- Add to password-reset-email.html -->
<div class="header" style="text-align: center; padding: 20px;">
    <img src="https://yourdomain.com/logo.png"
         alt="Company Logo"
         style="max-width: 200px; height: auto;">
</div>

<h2>Hi <span th:text="${firstName}">User</span>,</h2>
```

#### Example: Customizing Reset Button

```html
<!-- Customize button styling -->
<div style="text-align: center; margin: 30px 0;">
    <a th:href="${resetLink}"
       style="background-color: #28a745;
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              display: inline-block;">
        Reset Your Password
    </a>
</div>
```

#### Updating Email Service Code

If you need to pass additional variables to templates, modify `EmailService.java`:

```java
@Service
public class EmailService {

    public void sendPasswordResetEmail(User user, String token) {
        Context context = new Context();
        context.setVariable("firstName", user.getFirstName());
        context.setVariable("resetLink", buildResetLink(token));
        context.setVariable("expirationMinutes", 15);

        // Add custom variables
        context.setVariable("companyName", "Your Company");
        context.setVariable("logoUrl", "https://yourdomain.com/logo.png");
        context.setVariable("supportPhone", "+1-555-123-4567");

        // ... send email with context
    }
}
```

#### Multilingual Support

For multi-language support, create locale-specific templates:

```
templates/email/
├── password-reset-email_en.html     # English
├── password-reset-email_ar.html     # Arabic
├── password-reset-email_hi.html     # Hindi
├── password-reset-email.txt         # Default plain text
```

Update `EmailService` to select template based on user's preferred locale:

```java
String templateName = "email/password-reset-email";
if (user.getLocale() != null) {
    templateName += "_" + user.getLocale().getLanguage();
}
String htmlContent = templateEngine.process(templateName, context);
```

---

## Testing

### Manual Testing with cURL

**Request Password Reset:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

**Validate Token:**
```bash
curl -X GET "http://localhost:8080/api/v1/auth/reset-password/validate?token=YOUR_TOKEN"
```

**Reset Password:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_TOKEN",
    "newPassword": "NewSecureP@ssw0rd123"
  }'
```

### Test Rate Limiting

```bash
# Send 4 requests within an hour to trigger rate limiting
for i in {1..4}; do
  curl -X POST http://localhost:8080/api/v1/auth/forgot-password \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com"}'
  echo "\n---"
done
```

---

## Swagger/OpenAPI Documentation

Interactive API documentation available at:

```
http://localhost:8080/swagger-ui.html
```

Endpoints are documented with:
- Request/response schemas
- Validation rules
- Error codes
- Try-it-out functionality

---

## Frontend Integration

### TypeScript API Client

```typescript
import { apiClient } from '@/lib/api';

// Request password reset
const response = await apiClient.post('/v1/auth/forgot-password', {
  email: 'user@example.com'
});

// Validate token
const validation = await apiClient.get('/v1/auth/reset-password/validate', {
  params: { token: 'abc123...' }
});

// Reset password
const result = await apiClient.post('/v1/auth/reset-password', {
  token: 'abc123...',
  newPassword: 'NewP@ssw0rd123'
});
```

### Error Handling

```typescript
try {
  await requestPasswordReset(email);
} catch (error) {
  if (error.response?.status === 429) {
    // Handle rate limiting
    showError(error.response.data.message);
  } else {
    // Generic error
    showError('Please try again later');
  }
}
```

---

## Database Schema

### password_reset_tokens

| Column      | Type      | Constraints    | Description                  |
|-------------|-----------|----------------|------------------------------|
| id          | UUID      | PRIMARY KEY    | Token identifier             |
| user_id     | UUID      | NOT NULL, FK   | References users(id)         |
| token       | VARCHAR   | UNIQUE         | 64-char hex token            |
| expires_at  | TIMESTAMP | NOT NULL       | Expiration time (15 min)     |
| used        | BOOLEAN   | DEFAULT false  | Single-use flag              |
| created_at  | TIMESTAMP | NOT NULL       | Token generation time        |
| updated_at  | TIMESTAMP | NOT NULL       | Last update time             |
| version     | BIGINT    | DEFAULT 0      | Optimistic locking           |

### password_reset_attempts

| Column          | Type      | Constraints    | Description                  |
|-----------------|-----------|----------------|------------------------------|
| id              | UUID      | PRIMARY KEY    | Attempt identifier           |
| email           | VARCHAR   | UNIQUE         | Email being reset            |
| attempt_count   | INTEGER   | DEFAULT 0      | Number of attempts           |
| first_attempt_at| TIMESTAMP | NOT NULL       | Window start time            |
| last_attempt_at | TIMESTAMP | NOT NULL       | Most recent attempt          |
| created_at      | TIMESTAMP | NOT NULL       | Record creation time         |
| updated_at      | TIMESTAMP | NOT NULL       | Last update time             |
| version         | BIGINT    | DEFAULT 0      | Optimistic locking           |

---

## Maintenance

### Cleanup Scheduled Job

**Schedule:** Hourly (every :00 minutes)

**Service:** `PasswordResetCleanupService.cleanupExpiredData()`

**Actions:**
1. **Expired Tokens:** Deletes tokens where `expiresAt < (now - 1 hour)`
   - Keeps tokens for 1 hour after expiration for debugging
   - Prevents unbounded database growth

2. **Used Tokens:** Deletes used tokens where `createdAt < (now - 24 hours)`
   - Maintains 24-hour audit trail
   - Allows investigation of recent password resets

3. **Rate Limit Attempts:** Deletes attempts where `firstAttemptAt < (now - 7 days)`
   - Prevents unbounded growth of rate limiting table
   - Retains recent attempts for security monitoring

**Retention Periods:**
- `EXPIRED_TOKEN_RETENTION_HOURS = 1`
- `USED_TOKEN_RETENTION_HOURS = 24`
- `RESET_ATTEMPT_RETENTION_DAYS = 7`

**Logging:**
- Logs count of deleted records per operation type
- Logs total records deleted
- Error-resilient: Catches exceptions to allow next scheduled run

**Monitoring:**
```sql
-- Check expired tokens waiting for cleanup
SELECT COUNT(*) FROM password_reset_tokens
WHERE expires_at < NOW() - INTERVAL '1 hour'
AND used = false;

-- Check old used tokens waiting for cleanup
SELECT COUNT(*) FROM password_reset_tokens
WHERE used = true
AND created_at < NOW() - INTERVAL '24 hours';

-- Check rate limit entries
SELECT email, attempt_count, first_attempt_at,
       NOW() - first_attempt_at AS age
FROM password_reset_attempts
WHERE first_attempt_at > NOW() - INTERVAL '7 days'
ORDER BY first_attempt_at DESC;

-- View cleanup job logs
SELECT * FROM logs
WHERE logger_name = 'com.ultrabms.service.PasswordResetCleanupService'
ORDER BY timestamp DESC
LIMIT 10;
```

---

## Troubleshooting

### Common Issues

**Email not received:**
- Check spam/junk folder
- Verify email configuration in application.yml
- Check email service logs
- Verify SMTP credentials

**Token validation fails:**
- Token may have expired (15-minute limit)
- Token may have been used already
- Token may be malformed (copy-paste error)
- Solution: Request new password reset

**Rate limiting triggered:**
- Wait for the time specified in error message
- Maximum 3 attempts per hour per email
- Window resets 1 hour after first attempt

**Password validation fails:**
- Ensure password meets all requirements
- Check for special character restrictions
- Frontend validation mirrors backend rules

---

## Related Documentation

- [Authentication API](./authentication-api.md)
- [User Management API](./user-management-api.md)
- [Email Configuration](../deployment/email-configuration.md)
- [Security Best Practices](../security/password-security.md)

---

## Changelog

### Version 1.0.0 (2025-11-14)

- Initial implementation
- Three-step password reset workflow
- Rate limiting (3 requests/hour)
- Secure token generation (256-bit entropy)
- 15-minute token expiration
- Email notifications with branded templates
- Password strength validation
- Audit logging
- Automated cleanup job

---

## Support

For issues or questions:

- **Email:** support@ultrabms.com
- **Documentation:** https://docs.ultrabms.com
- **GitHub Issues:** https://github.com/ultrabms/ultra-bms/issues
