# Epic 1: Platform Foundation & Infrastructure

**Goal:** Establish the local development foundation with project structure, database setup, and caching configuration for all subsequent features.

**Note:** AWS deployment, monitoring infrastructure, and CI/CD will be implemented in later phases.

## Story 1.1: Project Initialization and Repository Structure

As a developer,
I want a standardized monolithic project structure with build tooling configured,
So that I can develop features with consistent patterns and automated quality checks.

**Acceptance Criteria:**

**Given** a new greenfield project
**When** the repository is initialized
**Then** the following structure exists:
- Monorepo root with frontend/ and backend/ directories
- Frontend: Next.js 14+ with TypeScript and App Router
- Backend: Java 17 with Spring Boot 3.x, Maven build configured
- Shared .editorconfig and .gitignore files
- README.md with project overview, setup instructions, and local development guide

**And** frontend dependencies include:
- Next.js 14+ with App Router, TypeScript 5+
- shadcn/ui component library initialized
- Tailwind CSS 3+ configured with dark theme as default
- React Hook Form + Zod for form validation
- Recharts for data visualization
- Lucide React for icons
- Axios for API communication
- next-auth for authentication (optional, evaluate in Epic 2)

**And** backend dependencies include:
- Spring Boot 3.x (Web, Data JPA, Security, Validation, Cache)
- PostgreSQL driver (org.postgresql:postgresql)
- Ehcache 3.x for caching (no Redis)
- Lombok for boilerplate reduction
- MapStruct for DTO mapping
- SpringDoc OpenAPI for API documentation
- BCrypt for password hashing

**And** code quality tools are configured:
- ESLint + Prettier for frontend
- Checkstyle for backend
- Pre-commit hooks for format checking
- Husky for Git hooks

**And** development configuration includes:
- Frontend dev server on port 3000 (Next.js default)
- Backend server on port 8080
- CORS enabled for localhost:3000
- Hot reload enabled for both frontend and backend
- Next.js configured for standalone backend API (no API routes in Next.js)

**Prerequisites:** None (first story)

**Technical Notes:**
- Use Next.js 14+ App Router for modern React Server Components support
- Configure path aliases (@/components, @/hooks, @/lib, etc.) in tsconfig.json
- Set up TypeScript strict mode
- Spring Boot application.yml with dev profile for local development
- Use Maven wrapper (mvnw) for consistent builds
- Include docker-compose.yml for optional containerized PostgreSQL
- Configure Next.js to proxy API calls to Spring Boot backend (http://localhost:8080/api)
- Disable Next.js API routes - use only as frontend (all APIs in Spring Boot)

## Story 1.2: Local PostgreSQL Database Setup

As a backend developer,
I want a local PostgreSQL database configured for development,
So that I can develop and test database operations without cloud dependencies.

**Acceptance Criteria:**

**Given** PostgreSQL is installed locally or running via Docker
**When** the database is initialized
**Then** PostgreSQL 15+ is running locally with:
- Database name: ultra_bms_dev
- Username: ultra_bms_user
- Password: configured via environment variable or application.yml
- Port: 5432 (default)
- Schema auto-creation enabled via Hibernate DDL

**And** Spring Boot is configured with:
- spring.datasource.url=jdbc:postgresql://localhost:5432/ultra_bms_dev
- spring.datasource.username from configuration
- spring.datasource.password from configuration or environment
- spring.jpa.hibernate.ddl-auto=update for dev (creates/updates schema automatically)
- spring.jpa.show-sql=true for dev (log SQL statements)
- spring.jpa.properties.hibernate.format_sql=true
- Connection pool: HikariCP (Spring Boot default) with max 10 connections

**And** database initialization scripts:
- data.sql for seed data (if needed)
- schema.sql for initial schema (optional, Hibernate can generate)
- Flyway or Liquibase integration for version control (optional for now)

**And** docker-compose.yml includes:
```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: ultra-bms-postgres
    environment:
      POSTGRES_DB: ultra_bms_dev
      POSTGRES_USER: ultra_bms_user
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

**And** README.md documents:
- How to install PostgreSQL locally (Windows, Mac, Linux)
- How to use docker-compose for PostgreSQL
- How to create database manually
- Connection string format
- How to access database with psql or GUI tools (pgAdmin, DBeaver)

**Prerequisites:** Story 1.1

**Technical Notes:**
- For Windows: Use PostgreSQL installer or Docker Desktop
- For Mac: Use Homebrew (brew install postgresql@15) or Docker
- For Linux: Use apt/yum package manager or Docker
- Configure PostgreSQL to auto-start on system boot
- Use .env file or application-dev.yml for local credentials (never commit passwords)
- Document backup/restore process for local development data
- Later migration to AWS RDS will require minimal configuration changes

## Story 1.3: Ehcache Configuration for Application Caching

As a backend developer,
I want Ehcache configured for application-level caching,
So that frequently accessed data is cached in-memory for performance optimization.

**Acceptance Criteria:**

**Given** Spring Boot application is running
**When** Ehcache is configured
**Then** Spring Cache abstraction is enabled with:
- @EnableCaching annotation on main application class
- Ehcache 3.x as cache provider
- ehcache.xml configuration file in src/main/resources

**And** ehcache.xml defines cache regions:
- userCache: max 1000 entries, TTL 30 minutes (for user profiles)
- sessionCache: max 5000 entries, TTL 24 hours (for session data)
- tenantCache: max 2000 entries, TTL 1 hour (for tenant details)
- propertyCache: max 500 entries, TTL 2 hours (for property data)
- lookupCache: max 10000 entries, TTL 12 hours (for dropdown/reference data)

**And** cache configuration includes:
- Heap memory allocation: max 100 MB total
- Eviction policy: LRU (Least Recently Used)
- Statistics enabled for monitoring cache hit/miss rates
- JSR-107 (JCache) API support

**And** caching annotations are documented:
- @Cacheable: cache method results
- @CachePut: update cache
- @CacheEvict: remove from cache
- @Caching: combine multiple cache operations
- Cache key generation strategies

**And** cache monitoring endpoint:
- Actuator endpoint /actuator/caches for cache statistics
- Log cache hit/miss ratios periodically
- JMX beans enabled for monitoring via JConsole/VisualVM

**Prerequisites:** Story 1.1

**Technical Notes:**
- Use Ehcache 3.x (javax.cache API compatible)
- Configure separate cache regions for different data types
- Document which service methods should be cached
- Implement cache warming on application startup for reference data
- Consider tiered storage (heap + disk) for larger datasets later
- Plan cache invalidation strategies (TTL vs manual eviction)
- When migrating to AWS, can switch to ElastiCache with minimal code changes

## Story 1.4: Core Domain Models and JPA Entities

As a backend developer,
I want core domain entities defined with JPA annotations,
So that the database schema is established and relationships are mapped correctly.

**Acceptance Criteria:**

**Given** database connection is configured
**When** core entities are created
**Then** the following base entities exist:

**User entity:**
- id (UUID, primary key)
- email (unique, not null, max 255 chars)
- passwordHash (not null, BCrypt hashed)
- firstName, lastName (not null, max 100 chars each)
- role (enum: SUPER_ADMIN, PROPERTY_MANAGER, MAINTENANCE_SUPERVISOR, FINANCE_MANAGER, TENANT, VENDOR)
- active (boolean, default true)
- mfaEnabled (boolean, default false)
- createdAt, updatedAt (timestamps, auto-managed)

**Property entity:**
- id (UUID, primary key)
- name (not null, max 200 chars)
- address (not null, max 500 chars)
- type (enum: RESIDENTIAL, COMMERCIAL, MIXED_USE)
- totalUnits (integer)
- managerId (foreign key to User)
- createdAt, updatedAt

**Unit entity:**
- id (UUID, primary key)
- propertyId (foreign key to Property)
- unitNumber (not null, max 50 chars)
- floor (integer)
- bedroomCount, bathroomCount (integer)
- squareFootage (decimal)
- status (enum: AVAILABLE, OCCUPIED, UNDER_MAINTENANCE)
- createdAt, updatedAt

**And** entities include:
- Proper JPA annotations (@Entity, @Table, @Id, @Column, @ManyToOne, etc.)
- Lombok annotations (@Data, @NoArgsConstructor, @AllArgsConstructor)
- Validation annotations (@NotNull, @Email, @Size, etc.)
- Auditing fields (@CreatedDate, @LastModifiedDate with @EntityListeners)
- JSON serialization annotations (@JsonIgnore for sensitive fields like passwordHash)

**And** JPA configuration includes:
- AuditorAware implementation for tracking created/modified by user
- @EnableJpaAuditing in configuration
- Naming strategy: snake_case for database columns
- UUID generation strategy for primary keys
- Optimistic locking with @Version for concurrent updates

**And** repository interfaces created:
- UserRepository extends JpaRepository<User, UUID>
- PropertyRepository extends JpaRepository<Property, UUID>
- UnitRepository extends JpaRepository<Unit, UUID>
- Custom query methods using Spring Data JPA naming conventions

**Prerequisites:** Story 1.2

**Technical Notes:**
- Use UUID for primary keys (more scalable than auto-increment)
- Implement soft delete pattern (active/deleted flag) instead of hard deletes
- Add database indexes on frequently queried fields (email, propertyId, etc.)
- Document entity relationships with ER diagram
- Use @Transactional on service layer, not repository layer
- Implement custom validators for business rules
- Consider using MapStruct for DTO mapping later

## Story 1.5: Basic REST API Structure and Exception Handling

As a backend developer,
I want a standardized REST API structure with global exception handling,
So that APIs follow consistent patterns and errors are handled gracefully.

**Acceptance Criteria:**

**Given** Spring Boot application is configured
**When** REST controllers are created
**Then** API structure follows:
- Base path: /api/v1
- Controller package structure: com.ultrabms.controller
- Service package: com.ultrabms.service
- Repository package: com.ultrabms.repository
- DTO package: com.ultrabms.dto

**And** global exception handler includes:
- @RestControllerAdvice for centralized exception handling
- @ExceptionHandler for specific exceptions:
  - EntityNotFoundException → 404 Not Found
  - ValidationException → 400 Bad Request
  - AccessDeniedException → 403 Forbidden
  - AuthenticationException → 401 Unauthorized
  - DuplicateResourceException → 409 Conflict
  - Generic Exception → 500 Internal Server Error

**And** error response format:
```json
{
  "timestamp": "2025-11-13T10:30:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "User with id 123 not found",
  "path": "/api/v1/users/123",
  "requestId": "uuid-correlation-id"
}
```

**And** API response format:
- Success (200): Return DTO directly or wrapped in response object
- Created (201): Return created resource with Location header
- No Content (204): For successful DELETE operations
- Consistent date format: ISO-8601 (yyyy-MM-dd'T'HH:mm:ss'Z')
- Pagination support: Page, size, sort parameters

**And** request validation:
- @Valid annotation on request bodies
- BindingResult for validation errors
- Custom validators for complex business rules
- Validation error response with field-level details

**And** health check endpoints:
- /api/health: Basic health check (returns UP/DOWN)
- /api/info: Application version, build info
- Spring Boot Actuator endpoints (limited for dev)

**And** CORS configuration:
- Allow localhost:3000 (Next.js dev server)
- Allow specific HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Allow credentials (for cookie-based auth)
- Configurable allowed origins via application.yml

**And** API documentation:
- SpringDoc OpenAPI auto-generates docs
- Swagger UI available at /swagger-ui.html
- OpenAPI spec at /v3/api-docs
- API descriptions via @Operation, @ApiResponse annotations

**Prerequisites:** Story 1.1, Story 1.4

**Technical Notes:**
- Use @RestController instead of @Controller + @ResponseBody
- Implement correlation ID filter for request tracing
- Add request/response logging interceptor for debugging
- Use @Validated on controller class for method-level validation
- Implement rate limiting later using Spring AOP or filters
- Document API contracts with examples
- Use DTOs to avoid exposing entity structure directly
- Implement API versioning strategy (/v1, /v2) from the start

---
