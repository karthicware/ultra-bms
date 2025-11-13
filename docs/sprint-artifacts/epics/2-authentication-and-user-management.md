# Epic 2: Authentication & User Management

**Goal:** Implement secure user authentication with role-based access control, password recovery, multi-factor authentication, and SSO support to protect the application and manage user permissions.

## Story 2.1: User Registration and Login with JWT Authentication

As a user,
I want to register an account and login securely,
So that I can access the application with my credentials.

**Acceptance Criteria:**

**Given** the application is running
**When** a new user registers
**Then** registration API accepts:
- Email (validated as RFC 5322 compliant)
- Password (min 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character)
- First name and last name (max 100 characters each)
- Role (selected from: SUPER_ADMIN, PROPERTY_MANAGER, MAINTENANCE_SUPERVISOR, FINANCE_MANAGER, TENANT, VENDOR)
- Phone number (optional, E.164 format validation)

**And** password validation includes:
- Password strength meter on frontend (weak/medium/strong/very strong)
- Real-time validation feedback as user types
- Reject common passwords (use library like zxcvbn)
- Hash password with BCrypt (strength 12) before storing
- Never store plain text passwords

**And** registration response:
- Success (201): Return user DTO (exclude passwordHash)
- Error (400): Validation errors with field-level details
- Error (409): Email already exists

**And** login API accepts:
- Email and password credentials
- Returns JWT access token (expires in 1 hour)
- Returns JWT refresh token (expires in 7 days)
- Token payload includes: userId, email, role, permissions

**And** JWT implementation:
- Use Spring Security with JWT
- HS256 algorithm for signing (secret in environment variable)
- Access token: short-lived (1 hour) for API requests
- Refresh token: longer-lived (7 days) for obtaining new access tokens
- Token refresh endpoint: POST /api/v1/auth/refresh

**And** login response includes:
- accessToken, refreshToken, expiresIn
- User profile: id, email, firstName, lastName, role
- HTTP-only cookie for refresh token (secure, sameSite=strict)

**And** security measures:
- Rate limiting: max 5 login attempts per 15 minutes per email
- Account lockout after 5 failed attempts for 30 minutes
- Log all authentication attempts (success/failure) with IP address
- CAPTCHA required after 3 failed attempts (optional for MVP)

**Prerequisites:** Story 1.4 (User entity), Story 1.5 (REST API structure)

**Technical Notes:**
- Use Spring Security 6+ with JWT
- Store refresh tokens in database with user association
- Implement token blacklist for logout functionality
- Add @PreAuthorize annotations for method-level security
- Frontend: Store access token in memory, refresh token in HTTP-only cookie
- Use Axios interceptors to add Authorization header to requests
- Auto-refresh access token when expired using refresh token

## Story 2.2: Role-Based Access Control (RBAC) Implementation

As a system administrator,
I want role-based permissions enforced across the application,
So that users can only access features appropriate to their role.

**Acceptance Criteria:**

**Given** a user is authenticated
**When** they attempt to access a resource
**Then** Spring Security evaluates permissions based on role:

**SUPER_ADMIN permissions:**
- Full system access (all operations on all modules)
- User management (create, update, delete users)
- System configuration
- Access to all properties and data

**PROPERTY_MANAGER permissions:**
- Manage assigned properties only
- Tenant management for their properties
- Work order creation and assignment
- View financial reports for their properties
- Cannot delete properties or modify system settings

**MAINTENANCE_SUPERVISOR permissions:**
- View and manage work orders
- Assign jobs to vendors
- Update work order status
- View vendor performance
- Cannot access financial data or tenant contracts

**FINANCE_MANAGER permissions:**
- View and manage all financial transactions
- Generate financial reports
- Process payments and invoices
- PDC management
- Cannot manage maintenance operations

**TENANT permissions:**
- View their own lease and payment history
- Submit maintenance requests
- Make online payments
- Book amenities
- Cannot access other tenants' data

**VENDOR permissions:**
- No specific role-based restrictions (vendors managed through vendor management module)
- Basic authenticated user permissions only

**And** backend authorization:
- @PreAuthorize annotations on controller methods
- @Secured annotations for role checks
- Custom permission evaluator for fine-grained access
- Method-level security for service layer

**And** frontend route protection:
- Next.js middleware for route guards
- Role-based navigation menu rendering
- Hide/show UI components based on permissions
- Redirect unauthorized users to 403 page

**And** API responses:
- 401 Unauthorized: Invalid/expired token
- 403 Forbidden: Valid token but insufficient permissions
- Include required permission in error message

**And** permission matrix documented:
- Spreadsheet or markdown table mapping roles to permissions
- Feature-level and data-level access control
- Special cases (e.g., property manager can only see their properties)

**Prerequisites:** Story 2.1

**Technical Notes:**
- Create Permission enum for granular permissions
- Implement custom AccessDecisionVoter for complex rules
- Use Spring Security Expression-Based Access Control (SpEL)
- Cache user permissions in Ehcache to reduce DB queries
- Frontend: Create ProtectedRoute component and usePermission hook
- Document permission inheritance (e.g., SUPER_ADMIN inherits all)
- Consider using RBAC library like Casbin for complex scenarios

## Story 2.3: Password Reset and Recovery Workflow

As a user,
I want to reset my password if I forget it,
So that I can regain access to my account securely.

**Acceptance Criteria:**

**Given** a user has forgotten their password
**When** they initiate password reset
**Then** the 3-step workflow executes:

**Step 1: Request Password Reset**
- User enters email on /forgot-password page
- API endpoint: POST /api/v1/auth/forgot-password
- Validate email exists in system
- Generate secure random token (UUID or crypto-random 32 bytes)
- Store token in password_reset_tokens table with:
  - userId, token, expiresAt (15 minutes from now), used (boolean)
- Send password reset email with reset link
- Always return 200 OK (don't reveal if email exists for security)

**Step 2: Validate Reset Token**
- User clicks link: /reset-password?token={token}
- Frontend validates token with backend: GET /api/v1/auth/reset-password/validate?token={token}
- Backend checks:
  - Token exists and not expired (< 15 minutes old)
  - Token not already used
  - Associated user account is active
- Return 200 if valid, 400 if invalid/expired

**Step 3: Set New Password**
- User enters new password (same validation as registration)
- API endpoint: POST /api/v1/auth/reset-password
- Request body: { token, newPassword }
- Backend:
  - Re-validate token (not expired, not used)
  - Hash new password with BCrypt
  - Update user's passwordHash
  - Mark token as used
  - Invalidate all existing refresh tokens for user (force re-login)
  - Send confirmation email
- Return 200 on success

**And** email templates include:
- Password reset email with expiring link (15 min)
- Password changed confirmation email
- Branded HTML templates with company logo
- Plain text fallback for email clients

**And** security measures:
- Rate limiting: max 3 reset requests per hour per email
- Tokens expire after 15 minutes
- Tokens are single-use only
- Old tokens invalidated when new reset requested
- Log all password reset activities

**And** UI/UX includes:
- Clear instructions at each step
- Token expiration countdown timer
- Password strength meter on new password field
- Success message with redirect to login
- Error handling for expired/invalid tokens

**Prerequisites:** Story 2.1

**Technical Notes:**
- Use Spring Boot Mail Starter for email sending
- Configure Gmail SMTP or AWS SES for email delivery
- Create password_reset_tokens table with TTL cleanup job
- Schedule job to delete expired tokens (daily cleanup)
- Use secure random token generation (SecureRandom)
- Frontend: React Hook Form with Zod validation
- Implement email queueing for async sending (optional)
- Consider SMS-based reset as alternative (future enhancement)

## Story 2.4: Session Management and Security Enhancements

As a system administrator,
I want robust session management and security controls,
So that user sessions are secure and properly managed.

**Acceptance Criteria:**

**Given** users are authenticated
**When** they interact with the application
**Then** session management includes:

**Session timeout configuration:**
- Access token: 1 hour lifetime
- Refresh token: 7 days lifetime (configurable)
- Idle timeout: 30 minutes of inactivity
- Absolute timeout: 12 hours (force re-login)

**And** session tracking:
- Store active sessions in database (user_sessions table)
- Track: sessionId, userId, accessToken (hashed), refreshToken (hashed), createdAt, lastActivityAt, expiresAt, ipAddress, userAgent
- Update lastActivityAt on each API request
- Enforce max concurrent sessions per user: 3 devices

**And** logout functionality:
- Logout endpoint: POST /api/v1/auth/logout
- Invalidate current session (delete from user_sessions)
- Add tokens to blacklist (token_blacklist table with TTL)
- Clear HTTP-only refresh token cookie
- Frontend: Clear access token from memory, redirect to login

**And** logout all devices:
- Endpoint: POST /api/v1/auth/logout-all
- Invalidate all sessions for current user
- Useful when user suspects account compromise

**And** session management UI:
- Account settings page shows active sessions
- Display: device type, browser, IP address, last activity, location (optional)
- User can revoke individual sessions
- Highlight current session

**And** security headers:
- X-Frame-Options: DENY (prevent clickjacking)
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000; includeSubDomains
- Content-Security-Policy: default-src 'self'

**And** additional security measures:
- CSRF protection enabled for state-changing operations
- CSRF token in custom header (X-XSRF-TOKEN)
- Secure and HttpOnly flags on cookies
- SameSite=Strict for cookies
- IP-based anomaly detection (optional: alert if IP changes)
- User-Agent tracking to detect session hijacking

**And** token refresh flow:
- Frontend detects token expiry (via JWT expiration claim)
- Automatically call refresh endpoint with refresh token
- Obtain new access token without user interaction
- If refresh token expired, redirect to login

**And** scheduled cleanup jobs:
- Delete expired sessions daily
- Delete expired token blacklist entries
- Delete expired password reset tokens
- Clean up old audit logs (retain 90 days)

**Prerequisites:** Story 2.1, Story 2.2

**Technical Notes:**
- Implement session tracking with database table
- Use Spring Security's SecurityContextHolder for current user
- Add Filter to update lastActivityAt on each request
- Implement token blacklist with Ehcache (expires with token TTL)
- Frontend: Implement token refresh interceptor in Axios
- Store device fingerprint for session tracking (optional)
- Consider Redis for session storage in production (future)
- Use Spring Security's CSRF protection
- Document session limits and timeout policies

## Story 2.5: Frontend Authentication Components and Protected Routes

As a frontend developer,
I want reusable authentication components and route protection,
So that I can easily secure pages and handle auth states.

**Acceptance Criteria:**

**Given** Next.js frontend is configured
**When** authentication features are implemented
**Then** the following components exist:

**Login page (/login):**
- Email and password fields with validation
- "Remember me" checkbox (extends refresh token lifetime)
- "Forgot password?" link
- Error messages for invalid credentials
- Loading state during authentication
- Redirect to dashboard on success

**Registration page (/register):**
- Email, password, confirm password, first name, last name fields
- Role selection (if admin is creating user)
- Password strength meter with requirements checklist
- Terms of service checkbox
- reCAPTCHA v3 integration (optional)
- Email verification notice after registration

**Password reset pages:**
- /forgot-password: Email input form
- /reset-password: New password form with token validation
- Success messages and redirects

**Account settings page (/settings/security):**
- Change password section
- Active sessions list with revoke buttons
- Update profile information

**And** authentication hooks:
- useAuth(): Returns { user, isAuthenticated, login, logout, register }
- useUser(): Returns current user profile and loading state
- usePermission(permission): Check if user has specific permission

**And** authentication context:
- React Context API for global auth state
- Persists user info across page refreshes
- Auto-refresh token when expired
- Logout on token refresh failure

**And** route protection:
- Next.js middleware for server-side route guards
- ProtectedRoute component for client-side protection
- Redirect unauthenticated users to /login
- Redirect unauthorized users to /403

**And** protected route patterns:
```typescript
// Middleware protection (app/middleware.ts)
export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')
  if (!token && isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

// Component-level protection
<ProtectedRoute requiredRole="PROPERTY_MANAGER">
  <PropertyManagementPage />
</ProtectedRoute>
```

**And** API integration:
- Axios instance with auth interceptor
- Automatically adds Authorization header
- Handles 401 by refreshing token
- Handles 403 by showing error message
- Retry failed requests after token refresh

**And** UI/UX polish:
- Loading skeletons during auth checks
- Smooth transitions between auth states
- Persist redirect URL after login (return to intended page)
- Session expiry warning modal (5 minutes before timeout)
- "Your session is about to expire. Stay logged in?" prompt

**And** error handling:
- Network errors: Show retry button
- Invalid credentials: Clear form and show error
- Account locked: Show contact support message
- Email not verified: Show resend verification link

**Prerequisites:** Story 2.1, Story 2.2, Story 2.3, Story 2.4

**Technical Notes:**
- Use Next.js App Router with server components where possible
- Store access token in memory (not localStorage for security)
- Store refresh token in HTTP-only cookie
- Implement token refresh logic in Axios interceptor
- Use React Hook Form + Zod for form validation
- Create reusable Form components from shadcn/ui
- Implement proper TypeScript types for User, AuthState, etc.
- Add E2E tests for authentication flows (Playwright/Cypress)
- Document authentication flow diagrams for developers
