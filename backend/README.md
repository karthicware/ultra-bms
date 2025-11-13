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
