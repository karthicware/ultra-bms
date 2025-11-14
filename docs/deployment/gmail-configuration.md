# Gmail SMTP Configuration Guide

## Overview

Ultra BMS uses Gmail's SMTP server to send transactional emails such as password reset notifications. This guide walks you through configuring Gmail for the application.

## Prerequisites

- Gmail account (karthicware@gmail.com)
- 2-Factor Authentication enabled on your Google account
- Access to Google Account settings

## Step-by-Step Setup

### 1. Enable 2-Factor Authentication

Gmail App Passwords require 2-Factor Authentication (2FA) to be enabled on your Google account.

1. Visit [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", select "2-Step Verification"
3. Follow the prompts to enable 2FA if not already enabled
4. Verify it's working by signing in to your Google account

### 2. Generate App Password

1. Visit [Google App Passwords](https://myaccount.google.com/apppasswords)
   - If you don't see this option, ensure 2FA is enabled first
2. In the "Select app" dropdown, choose **Mail**
3. In the "Select device" dropdown, choose **Other (Custom name)**
4. Enter a name: `Ultra BMS` or `Ultra BMS Dev`
5. Click **Generate**
6. Google will display a 16-character password (e.g., `abcd efgh ijkl mnop`)
7. **IMPORTANT:** Copy this password immediately - you won't be able to see it again

### 3. Configure Environment Variables

#### Development Environment

1. Navigate to your project root:
   ```bash
   cd /Users/natarajan/Documents/Projects/ultra-bms
   ```

2. Copy the example environment file (if not already done):
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and update the Gmail configuration:
   ```bash
   GMAIL_USERNAME=karthicware@gmail.com
   GMAIL_APP_PASSWORD=abcdefghijklmnop  # Replace with your actual App Password (no spaces)
   ```

   **Note:** Remove all spaces from the App Password that Google shows you.

4. Ensure `.env` is in your `.gitignore` to prevent committing credentials

#### Production Environment

For production deployment, set environment variables in your hosting platform:

```bash
export GMAIL_USERNAME=karthicware@gmail.com
export GMAIL_APP_PASSWORD=your_app_password_here
```

Or configure them in your deployment platform's environment variables section.

### 4. Verify Configuration

#### Backend Configuration

The application is already configured to use Gmail SMTP in:

**Development** (`application-dev.yml`):
```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${GMAIL_USERNAME:karthicware@gmail.com}
    password: ${GMAIL_APP_PASSWORD}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
            required: true
```

**Production** (`application-prod.yml`):
```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${GMAIL_USERNAME:karthicware@gmail.com}
    password: ${GMAIL_APP_PASSWORD}
    # ... same properties as dev
```

### 5. Test Email Sending

Start the backend server:
```bash
cd backend
./mvnw spring-boot:run -Dspring.profiles.active=dev
```

Test the password reset workflow:

```bash
curl -X POST http://localhost:8080/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

Check your Gmail account's Sent folder to verify the email was sent.

## Troubleshooting

### "Authentication failed" Error

**Problem:** You see authentication errors in the logs.

**Solutions:**
1. Verify App Password is correct (no spaces, all lowercase)
2. Ensure 2FA is enabled on your Google account
3. Regenerate a new App Password if the current one isn't working
4. Check that `GMAIL_APP_PASSWORD` environment variable is set correctly

### "Connection refused" Error

**Problem:** Application cannot connect to Gmail SMTP server.

**Solutions:**
1. Verify your internet connection
2. Check firewall settings - ensure port 587 is not blocked
3. Verify SMTP host is `smtp.gmail.com` and port is `587`

### Emails Not Received

**Problem:** Password reset emails are not being received.

**Solutions:**
1. Check spam/junk folder
2. Verify email is being sent from Gmail (check Sent folder in karthicware@gmail.com)
3. Check application logs for sending errors
4. Verify recipient email is valid

### "Less secure app access" Message

**Problem:** Google warns about less secure apps.

**Solution:** Use App Passwords (this guide) instead of enabling "Less secure app access". App Passwords are the secure, recommended approach.

## Security Best Practices

### Protect Your App Password

- ✅ Store in environment variables only
- ✅ Add `.env` to `.gitignore`
- ✅ Never commit credentials to Git
- ✅ Use different App Passwords for dev/staging/prod
- ✅ Rotate App Passwords periodically (every 90 days)
- ❌ Never hardcode passwords in source code
- ❌ Never share App Passwords via email or chat

### Revoke Compromised Passwords

If an App Password is compromised:

1. Visit [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Find "Ultra BMS" in the list
3. Click **Remove**
4. Generate a new App Password
5. Update environment variables immediately

## Email Sending Limits

Gmail has sending limits to prevent spam:

- **Individual accounts:** ~500 emails/day
- **Google Workspace:** ~2,000 emails/day

For production applications exceeding these limits, consider:
- **SendGrid** (recommended for transactional emails)
- **Amazon SES** (AWS Simple Email Service)
- **Mailgun**
- **Postmark**

## Alternative: Using MailHog for Development

For local development without Gmail, use MailHog (fake SMTP server):

1. Install MailHog:
   ```bash
   # macOS
   brew install mailhog

   # Windows
   choco install mailhog

   # Linux
   # Download binary from https://github.com/mailhog/MailHog/releases
   ```

2. Start MailHog:
   ```bash
   mailhog
   ```

3. Update `.env`:
   ```bash
   MAIL_HOST=localhost
   MAIL_PORT=1025
   # Leave GMAIL_USERNAME and GMAIL_APP_PASSWORD commented out
   ```

4. View emails at http://localhost:8025

## Related Documentation

- [Password Reset API](../api/password-reset-api.md)
- [Email Templates](../templates/email-templates.md)
- [Security Best Practices](../security/authentication-security.md)

## Support

For issues with Gmail configuration:

1. Check [Google Support](https://support.google.com/accounts/answer/185833)
2. Review application logs: `backend/logs/application.log`
3. Contact support: support@ultrabms.com

---

**Last Updated:** 2025-11-14
**Configured Email:** karthicware@gmail.com
