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
