# Session Management API Documentation

**Version:** 1.0
**Base URL:** `/api/v1/auth`
**Date:** 2025-11-15
**Story:** 2.4 - Session Management and Security Enhancements

---

## Overview

The Session Management API provides endpoints for managing user sessions, including logout, session tracking, and concurrent session control.

## Authentication

All endpoints require a valid JWT access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Refresh tokens are automatically sent via HTTP-only cookies.

---

## Endpoints

### 1. Logout

Logs out the current user by invalidating the session and blacklisting tokens.

**Endpoint:** `POST /api/v1/auth/logout`

**Headers:**
- `Authorization`: Bearer token (required)
- `Cookie`: refreshToken (HTTP-only, sent automatically)

**Request Body:** None

**Success Response:**
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Logged out successfully"
}
```

**Error Responses:**
```json
HTTP/1.1 401 Unauthorized
{
  "timestamp": "2025-11-15T10:30:00.000+00:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "path": "/api/v1/auth/logout"
}
```

**Side Effects:**
- Current session marked as inactive
- Access and refresh tokens added to blacklist
- Refresh token cookie cleared
- Audit log entry created

---

### 2. Logout All Devices

Logs out the user from all active sessions across all devices.

**Endpoint:** `POST /api/v1/auth/logout-all`

**Headers:**
- `Authorization`: Bearer token (required)

**Request Body:** None

**Success Response:**
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Logged out from 3 devices",
  "devicesCount": 3
}
```

**Side Effects:**
- All user sessions marked as inactive
- All session tokens added to blacklist
- All refresh tokens deleted
- Audit log entry created

---

### 3. Get Active Sessions

Retrieves a list of all active sessions for the current user.

**Endpoint:** `GET /api/v1/auth/sessions`

**Headers:**
- `Authorization`: Bearer token (required)

**Query Parameters:** None

**Success Response:**
```json
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "deviceType": "Desktop",
    "browser": "Chrome 120.0.0.0",
    "ipAddress": "192.168.1.100",
    "location": null,
    "lastActivityAt": "2025-11-15T10:25:00.000Z",
    "createdAt": "2025-11-15T08:00:00.000Z",
    "isCurrent": true
  },
  {
    "sessionId": "550e8400-e29b-41d4-a716-446655440001",
    "deviceType": "Mobile",
    "browser": "Safari 17.0",
    "ipAddress": "10.0.0.50",
    "location": null,
    "lastActivityAt": "2025-11-15T09:45:00.000Z",
    "createdAt": "2025-11-14T20:00:00.000Z",
    "isCurrent": false
  }
]
```

**Response Fields:**
- `sessionId` (string, UUID): Unique session identifier
- `deviceType` (string): Desktop | Mobile | Tablet | Unknown
- `browser` (string, nullable): Parsed browser name and version
- `ipAddress` (string, nullable): Client IP address
- `location` (string, nullable): Geographic location (future enhancement)
- `lastActivityAt` (string, ISO 8601): Last authenticated request timestamp
- `createdAt` (string, ISO 8601): Session creation timestamp
- `isCurrent` (boolean): Whether this is the current session

---

### 4. Revoke Session

Revokes a specific session, logging out that device.

**Endpoint:** `DELETE /api/v1/auth/sessions/{sessionId}`

**Headers:**
- `Authorization`: Bearer token (required)

**Path Parameters:**
- `sessionId` (UUID, required): Session ID to revoke

**Request Body:** None

**Success Response:**
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Session revoked successfully"
}
```

**Error Responses:**

Session not found:
```json
HTTP/1.1 404 Not Found
{
  "timestamp": "2025-11-15T10:30:00.000+00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Session not found",
  "path": "/api/v1/auth/sessions/550e8400-e29b-41d4-a716-446655440000"
}
```

Forbidden (session belongs to another user):
```json
HTTP/1.1 403 Forbidden
{
  "timestamp": "2025-11-15T10:30:00.000+00:00",
  "status": 403,
  "error": "Forbidden",
  "message": "You don't have permission to revoke this session",
  "path": "/api/v1/auth/sessions/550e8400-e29b-41d4-a716-446655440000"
}
```

**Side Effects:**
- Session marked as inactive
- Session tokens added to blacklist

---

### 5. Refresh Access Token

Obtains a new access token using a valid refresh token.

**Endpoint:** `POST /api/v1/auth/refresh`

**Headers:**
- `Cookie`: refreshToken (HTTP-only, sent automatically)

**Request Body:** None

**Success Response:**
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600
}
```

**Response Fields:**
- `accessToken` (string): New JWT access token
- `expiresIn` (number): Token expiration time in seconds (3600 = 1 hour)

**Error Responses:**

Refresh token expired or invalid:
```json
HTTP/1.1 401 Unauthorized
{
  "timestamp": "2025-11-15T10:30:00.000+00:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid or expired refresh token",
  "path": "/api/v1/auth/refresh"
}
```

**Note:** Frontend should automatically call this endpoint when receiving 401 errors with expired access tokens.

---

## Session Lifecycle

### Session Creation
- Created automatically on successful login
- Stores hashed tokens, IP address, User-Agent, device type
- Enforces maximum 3 concurrent sessions per user (oldest deleted when limit exceeded)
- Sets `created_at`, `last_activity_at`, `expires_at` timestamps

### Session Tracking
- `last_activity_at` updated on every authenticated request
- Idle timeout: 30 minutes (no activity)
- Absolute timeout: 12 hours (from creation)
- Automatic invalidation when timeout exceeded

### Session Invalidation
Occurs when:
- User explicitly logs out (single session or all)
- Idle timeout exceeded (30 minutes)
- Absolute timeout exceeded (12 hours)
- Token refresh fails
- Password is reset
- Security violation detected

### Token Blacklisting
When invalidated, tokens are added to blacklist with:
- Token hash (BCrypt)
- Token type (ACCESS | REFRESH)
- Expiration timestamp
- Reason (LOGOUT, IDLE_TIMEOUT, ABSOLUTE_TIMEOUT, etc.)

---

## Security Headers

All API responses include security headers:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
```

---

## Rate Limiting

Login and authentication endpoints have rate limits:
- Login: 5 attempts per 15 minutes per email
- Refresh token: 10 requests per minute per user
- Session endpoints: 30 requests per minute per user

---

## Examples

### Complete Logout Flow (Frontend)

```typescript
// 1. Call logout endpoint
const response = await fetch('/api/v1/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
  credentials: 'include', // Send cookies
});

// 2. Clear local state
setAccessToken(null);
setUser(null);

// 3. Redirect to login
router.push('/login');
```

### Token Refresh Flow (Axios Interceptor)

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;

      // Refresh token
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      const { accessToken } = await response.json();

      // Update token and retry request
      setAccessToken(accessToken);
      error.config.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

## Related Documentation

- [Password Reset API](./password-reset-api.md)
- [Story 2.4: Session Management](../sprint-artifacts/2-4-session-management-and-security-enhancements.md)
- [Architecture: Session Management](../architecture.md#session-management)
- [PRD: Security Requirements](../prd.md#5.4)
