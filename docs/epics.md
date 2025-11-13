# ultra-bms - Epic Breakdown

**Author:** Nata
**Date:** November 2025
**Project Level:** Enterprise
**Target Scale:** Mid to large-scale property management (10+ properties)

---

## Overview

This document provides the complete epic and story breakdown for ultra-bms, decomposing the requirements from the [PRD](./prd.md) into implementable stories.

**Living Document Notice:** This is the initial version. It will be updated after UX Design and Architecture workflows add interaction and technical details to stories.

### Epic Structure Overview

This project is organized into 9 epics following the natural flow of building management operations:

1. **Platform Foundation & Infrastructure** - Technical foundation for all features
2. **Authentication & User Management** - Secure access with RBAC (FR1)
3. **Tenant Management & Portal** - Complete tenant lifecycle (FR3, FR4)
4. **Maintenance Operations** - Work orders, PM scheduling, field tracking (FR5, FR6, FR7)
5. **Vendor Management** - Vendor lifecycle and performance (FR8, FR9)
6. **Financial Management** - Revenue, expenses, PDC management (FR10, FR11, FR12)
7. **Asset & Compliance Management** - Assets, documents, compliance, parking (FR13, FR14, FR15, FR16)
8. **Dashboard & Reporting** - KPIs, analytics, custom reports (FR2, FR17, FR18)
9. **Communication & Notifications** - Multi-channel messaging (FR19, FR20)

Each epic delivers independent business value while building on the foundation established by prior epics.

---

## Functional Requirements Inventory

**FR1: User Authentication & Access Control**
- Multi-factor authentication (MFA) with password recovery
- Single Sign-On (SSO) support
- Role-based access control (RBAC) with 6 user roles
- Session management with timeout controls

**FR2: Executive Dashboard & Analytics**
- Real-time KPI visualization (profit/loss, occupancy, maintenance, conversions)
- Multi-view operational dashboards (maintenance, financial, occupancy, vendor)
- Trend analysis and 12-month forecasting
- Critical alerts and notifications panel

**FR3: Tenant Onboarding & Management**
- Complete tenant registration with lease terms, rent breakdown, document capture
- Automated lease agreement generation with digital signatures
- Welcome packet and move-in inspection scheduling
- Access card/key management

**FR4: Tenant Lifecycle & Portal**
- Lease renewal workflows
- Tenant communication portal with self-service capabilities
- Service request submission and tracking
- Online payment gateway and payment history
- Document repository access
- Exit/checkout process management
- Community amenity booking

**FR5: Work Order System**
- Multi-source job creation (manual, tenant request, PM auto-generation, emergency)
- Comprehensive job attributes (priority, category, location, asset, time, cost, photos)
- Bulk job creation capability

**FR6: Preventive Maintenance (PM) System**
- Calendar-based and asset-based PM scheduling
- Recurring job templates with automatic work order generation
- Resource allocation planning
- Parts inventory integration
- Compliance-driven and seasonal maintenance planning
- PM effectiveness tracking

**FR7: Job Tracking & Field Operations**
- Real-time status updates and GPS-based technician tracking
- Material usage and time logging
- Quality inspection workflows
- Customer satisfaction ratings

**FR8: Vendor Onboarding & Management**
- Vendor registration with certifications, licenses, insurance, rate cards
- SLA agreement management
- Document expiry tracking

**FR9: Vendor Operations & Performance**
- Job assignment algorithms with performance scoring
- Payment processing and communication portal
- SLA compliance monitoring and quality metrics
- Response time analysis and vendor ranking

**FR10: Revenue Management**
- Automated invoicing with multiple payment methods
- Payment reminder system with late fee calculation
- Service charge, utility billing, and additional income tracking
- Revenue forecasting

**FR11: Expense Management**
- Vendor payment processing
- Maintenance and utility cost tracking
- Staff payroll integration
- Operating expense allocation
- Budget vs. actual analysis

**FR12: PDC (Post-Dated Cheque) Management**
- PDC registration, tracking, and due date monitoring
- Bank deposit scheduling
- Bounce handling and replacement cheque workflow
- Bank-wise distribution dashboard

**FR13: Asset Registry & Lifecycle**
- Asset identification, tagging, and location mapping
- Specifications, manuals, and warranty tracking
- Service history and depreciation calculation
- Procurement to disposal lifecycle management
- Replacement planning

**FR14: Document Management**
- Centralized repository with version control
- Access permissions and expiry tracking
- Automated reminders and template library

**FR15: Compliance Tracking**
- Regulatory requirement mapping
- License and permit management
- Inspection scheduling and audit trail
- Compliance reporting and violation management

**FR16: Parking Management**
- Spot categorization and allocation management
- Tenant and visitor parking workflows
- Monthly permits and violation management
- Revenue tracking and utilization reporting

**FR17: Standard Reporting**
- Operational reports (maintenance cost, vendor performance, occupancy, asset utilization, compliance)
- Financial reports (income statements, cash flow, aged receivables, budget variance, security deposits)

**FR18: Custom Report Builder**
- Drag-and-drop interface with multiple data sources
- Visualization options and scheduling
- Export capabilities (PDF, Excel, CSV)

**FR19: Communication & Announcements**
- Building-wide and targeted announcements
- Emergency broadcasts
- Maintenance and event notifications

**FR20: Multi-Channel Notification System**
- Email, SMS, and in-app delivery
- Customizable triggers with escalation workflows
- Delivery confirmation and preference management

---

## FR Coverage Map

| Epic | FR Coverage | Description |
|------|-------------|-------------|
| Epic 1: Platform Foundation | Infrastructure for all FRs | AWS UAE infrastructure, PostgreSQL, Redis, CI/CD, monitoring |
| Epic 2: Authentication & User Management | FR1 | MFA, SSO, RBAC, session management |
| Epic 3: Tenant Management & Portal | FR3, FR4 | Onboarding, lifecycle, portal, payments, amenities |
| Epic 4: Maintenance Operations | FR5, FR6, FR7 | Work orders, PM scheduling, field tracking |
| Epic 5: Vendor Management | FR8, FR9 | Vendor onboarding, operations, performance tracking |
| Epic 6: Financial Management | FR10, FR11, FR12 | Revenue, expenses, PDC management |
| Epic 7: Asset & Compliance Management | FR13, FR14, FR15, FR16 | Assets, documents, compliance, parking |
| Epic 8: Dashboard & Reporting | FR2, FR17, FR18 | Executive dashboards, standard reports, custom builder |
| Epic 9: Communication & Notifications | FR19, FR20 | Announcements, multi-channel notifications |

**Coverage Validation:** All 20 functional requirements mapped to epics ✅

---

## Epic 1: Platform Foundation & Infrastructure

**Goal:** Establish the local development foundation with project structure, database setup, and caching configuration for all subsequent features.

**Note:** AWS deployment, monitoring infrastructure, and CI/CD will be implemented in later phases.

### Story 1.1: Project Initialization and Repository Structure

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

### Story 1.2: Local PostgreSQL Database Setup

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

### Story 1.3: Ehcache Configuration for Application Caching

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

### Story 1.4: Core Domain Models and JPA Entities

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

### Story 1.5: Basic REST API Structure and Exception Handling

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

## Epic 2: Authentication & User Management

**Goal:** Implement secure user authentication with role-based access control, password recovery, multi-factor authentication, and SSO support to protect the application and manage user permissions.

### Story 2.1: User Registration and Login with JWT Authentication

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

### Story 2.2: Role-Based Access Control (RBAC) Implementation

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

### Story 2.3: Password Reset and Recovery Workflow

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

### Story 2.4: Session Management and Security Enhancements

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

### Story 2.5: Frontend Authentication Components and Protected Routes

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

---

## Epic 3: Tenant Management & Portal

**Goal:** Streamline tenant lifecycle from lead generation through onboarding to exit, with comprehensive lease management, self-service portal for maintenance requests, payments, and amenity booking.

### Story 3.1: Lead Management and Quotation System

As a property manager,
I want to manage potential tenant leads and create quotations,
So that I can track prospects and convert them to tenants efficiently.

**Acceptance Criteria:**

**Given** I am logged in as a property manager
**When** I create a new lead
**Then** the lead form includes:

**Lead Information:**
- Full name (required, max 200 chars)
- Emirates ID (required, format: XXX-XXXX-XXXXXXX-X)
- Passport number (required, max 50 chars)
- Passport expiry date (date picker)
- Home country (dropdown, required)
- Email address (required, validated as RFC 5322 compliant)
- Contact number (required, E.164 format, default prefix: +971)
- Lead source (dropdown: WEBSITE, REFERRAL, WALK_IN, PHONE_CALL, SOCIAL_MEDIA, OTHER)
- Notes (text, max 1000 chars, optional)

**And** lead entity is created:
- id (UUID), leadNumber (unique, format: LEAD-2025-0001)
- fullName, emiratesId, passportNumber, passportExpiryDate
- homeCountry, email, contactNumber
- leadSource, notes
- status (enum: NEW, CONTACTED, QUOTATION_SENT, ACCEPTED, CONVERTED, LOST)
- createdAt, updatedAt timestamps
- createdBy (userId)

**And** leads list page displays:
- Filters: status, property of interest, lead source, date range
- Search by: lead name, email, phone, Emirates ID
- Shows: lead number, name, contact, status, property interest, days in pipeline
- Quick actions: View, Create Quotation, Convert to Tenant, Mark as Lost

**And** lead detail page shows:
- All lead information
- Document uploads (Emirates ID scan, passport scan, marriage certificate if applicable)
- Communication history (notes, calls, emails)
- Quotations issued for this lead
- Status timeline

**And** create quotation for lead:

**Quotation Form:**
- Lead selection (dropdown, required - links to lead)
- Quotation issue date (date picker, default: today)
- Quotation validity date (date picker, default: 30 days from issue)
- Property and unit selection (dropdown, required)
- Stay type (dropdown: STUDIO, ONE_BHK, TWO_BHK, THREE_BHK, VILLA, required)

**Rent Details:**
- Base monthly rent (decimal, auto-populated from unit or manual)
- Service charges (decimal)
- Parking spots (integer, default: 0)
- Parking fee per spot (decimal, if parking > 0)
- Security deposit (decimal, typically 1-2 months rent)
- Admin fee (decimal, one-time)
- Total first payment (calculated: security deposit + admin fee + first month)

**Document Requirements Checklist:**
- Emirates ID scan (checkbox)
- Passport copy (checkbox)
- Marriage certificate (checkbox, if applicable)
- Visa copy (checkbox)
- Salary certificate (checkbox, if applicable)
- Bank statements (checkbox, if applicable)
- Other documents (text input for additional requirements)

**Terms and Conditions:**
- Payment terms (text, default template)
- Move-in procedures (text, default template)
- Cancellation policy (text, default template)
- Special terms (text, optional, custom terms for this quote)

**And** quotation entity:
- id (UUID), quotationNumber (unique, format: QUO-2025-0001)
- leadId (foreign key)
- propertyId, unitId (foreign keys)
- stayType, issueDate, validityDate
- baseRent, serviceCharges, parkingSpots, parkingFee
- securityDeposit, adminFee
- totalFirstPayment (calculated)
- documentRequirements (JSON array)
- paymentTerms, moveinProcedures, cancellationPolicy, specialTerms
- status (enum: DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED, CONVERTED)
- sentAt, acceptedAt, rejectedAt timestamps
- createdBy, sentBy (userIds)
- createdAt, updatedAt timestamps

**And** quotation actions:
- Save as draft (status = DRAFT, can edit later)
- Send to lead (status = SENT, send email with PDF attachment)
- Accept quotation (manual action by manager when lead accepts)
- Reject quotation (manual action with rejection reason)
- Convert to tenant (creates tenant record from lead, status = CONVERTED)

**And** quotation PDF generation:
- Company header with logo
- Quotation number and date
- Lead information (name, Emirates ID, contact)
- Property and unit details
- Rent breakdown table (itemized costs)
- Total first payment highlighted
- Document requirements checklist
- Terms and conditions
- Validity date prominently displayed
- Contact information for questions

**And** quotation dashboard (at /leads-quotes):

**KPI Cards:**
- New Quotes (last 30 days) - count
- Quotes Converted (last 30 days) - count
- Conversion Rate (%) - (converted / sent) * 100
- Avg. Time to Convert (days) - average days from sent to converted

**Sales Funnel (horizontal bar chart):**
- Quotes Issued → Quotes Accepted → Converted
- Shows progression with counts

**Quotes Expiring Soon (table):**
- Shows quotes where validityDate is within next 30 days
- Columns: Lead name, property, expiry date (days remaining)
- Color-coded: red (< 7 days), yellow (7-14 days), green (14+ days)
- Sort by expiry date ascending

**And** quotation expiry handling:
- Scheduled job runs daily
- Check quotations where validityDate < today and status = SENT
- Update status to EXPIRED
- Send notification to property manager (optional)

**And** lead to tenant conversion:
- When quotation is accepted, button: "Convert to Tenant"
- Pre-populate tenant onboarding form with lead data:
  - Name, Emirates ID, passport details, contact info
  - Selected property and unit
  - Rent details from quotation
- Link converted tenant back to original lead and quotation
- Update lead status to CONVERTED
- Update quotation status to CONVERTED
- Mark unit as RESERVED (until full onboarding completes)

**And** API endpoints:
- POST /api/v1/leads: Create lead
- GET /api/v1/leads: List leads with filters
- GET /api/v1/leads/{id}: Get lead details
- PUT /api/v1/leads/{id}: Update lead
- PATCH /api/v1/leads/{id}/status: Update lead status
- POST /api/v1/leads/{id}/documents: Upload lead document
- DELETE /api/v1/leads/{id}: Soft delete lead
- POST /api/v1/quotations: Create quotation
- GET /api/v1/quotations: List quotations with filters
- GET /api/v1/quotations/{id}: Get quotation details
- PUT /api/v1/quotations/{id}: Update quotation (if DRAFT)
- POST /api/v1/quotations/{id}/send: Send quotation email
- PATCH /api/v1/quotations/{id}/accept: Accept quotation
- PATCH /api/v1/quotations/{id}/reject: Reject quotation
- POST /api/v1/quotations/{id}/convert: Convert to tenant
- GET /api/v1/quotations/{id}/pdf: Generate quotation PDF
- GET /api/v1/leads-quotes/dashboard: Get dashboard KPIs
- DELETE /api/v1/quotations/{id}: Soft delete quotation

**Prerequisites:** Story 1.4 (Core domain models)

**Technical Notes:**
- Lead numbers and quotation numbers auto-increment with year prefix
- Store lead documents in /uploads/leads/{leadId}/documents/
- Generate quotation PDFs using iText or PDFBox
- Email quotations as PDF attachments
- Quotation validity date default: issue date + 30 days
- Calculate totalFirstPayment: securityDeposit + adminFee + baseRent + serviceCharges + (parkingSpots * parkingFee)
- Implement email notification when quotation is sent
- Add database indexes on leadNumber, quotationNumber, status, validityDate
- Frontend: Use shadcn/ui Form for lead and quotation creation
- Use Recharts for sales funnel visualization
- Link quotations to units to prevent double-booking (check unit availability)
- When lead is converted, create tenant record via Story 3.2 onboarding flow
- Quotation PDF template should match company branding
- All dates displayed in UAE timezone (Gulf Standard Time - GST)

### Story 3.2: Property and Unit Management

As a property manager,
I want to manage properties and their units,
So that I can track available units and assign tenants to them.

**Acceptance Criteria:**

**Given** I am logged in as a property manager
**When** I create a new property
**Then** the property form includes:
- Property name (required, max 200 chars)
- Full address (required, max 500 chars)
- Property type (enum: RESIDENTIAL, COMMERCIAL, MIXED_USE)
- Total units count (integer, min 1)
- Assigned property manager (dropdown of PROPERTY_MANAGER users)
- Year built (optional, 4-digit year)
- Total square footage (optional, decimal)
- Amenities list (pool, gym, parking, security, etc.)
- Property image upload (optional, max 5 images, 5MB each)

**And** property is created with:
- Unique property ID (UUID)
- Status: ACTIVE by default
- Created timestamp and created by user
- Validation: duplicate property names warned but allowed (different locations)

**And** I can manage units within a property:
- Add new unit: unit number, floor, bedrooms, bathrooms, square footage, rent amount
- Unit status: AVAILABLE, OCCUPIED, UNDER_MAINTENANCE, RESERVED
- Bulk unit creation (e.g., create 10 units at once with sequential numbers)
- Unit features: balcony, view, floor plan type, parking spots included

**And** unit entity includes:
- id (UUID), propertyId (foreign key to Property)
- unitNumber (required, unique within property, max 50 chars)
- floor (integer, can be negative for basement)
- bedroomCount, bathroomCount (decimal, e.g., 2.5 baths)
- squareFootage (decimal)
- monthlyRent (decimal, base rent amount)
- status (enum: AVAILABLE, OCCUPIED, UNDER_MAINTENANCE, RESERVED)
- features (JSON field for flexible attributes)
- createdAt, updatedAt timestamps

**And** property list page shows:
- Searchable and filterable list (by name, type, manager)
- Sortable columns (name, total units, occupied units, occupancy %)
- Occupancy rate calculation: (occupied units / total units) * 100
- Quick actions: View details, Edit, Add unit, View tenants
- Pagination (20 properties per page)

**And** unit list page (per property) shows:
- Grid or list view of all units
- Color-coded by status (green=available, red=occupied, yellow=maintenance)
- Filter by: status, floor, bedroom count, price range
- Quick assign tenant action for available units
- Bulk status updates (select multiple units)

**And** API endpoints:
- POST /api/v1/properties: Create property
- GET /api/v1/properties: List properties with filters
- GET /api/v1/properties/{id}: Get property details
- PUT /api/v1/properties/{id}: Update property
- DELETE /api/v1/properties/{id}: Soft delete property
- POST /api/v1/properties/{id}/units: Add unit to property
- GET /api/v1/properties/{id}/units: List units for property
- PUT /api/v1/units/{id}: Update unit
- DELETE /api/v1/units/{id}: Soft delete unit

**Prerequisites:** Story 1.4 (Property and Unit entities), Story 2.2 (RBAC)

**Technical Notes:**
- Use soft delete (active flag) instead of hard delete
- Cache property list in Ehcache (TTL 2 hours)
- Validate property manager has PROPERTY_MANAGER role
- Add database index on propertyId for fast unit lookups
- Frontend: Use shadcn/ui Table and Card components
- Implement optimistic UI updates for status changes
- Add map integration (Google Maps) for property location (optional)
- Store images in local file system or AWS S3 (future)

### Story 3.2: Tenant Onboarding and Registration

As a property manager,
I want to onboard new tenants with complete information capture,
So that I have all necessary details for lease management and compliance.

**Acceptance Criteria:**

**Given** I am managing a property
**When** I onboard a new tenant
**Then** the tenant registration form includes:

**Personal Information:**
- First name, last name (required, max 100 chars each)
- Email (required, unique, validated)
- Phone number (required, E.164 format)
- Date of birth (required, must be 18+ years)
- National ID / Passport number (required, max 50 chars)
- Nationality (dropdown)
- Emergency contact name and phone (required)

**Lease Information:**
- Property and unit selection (dropdowns, only AVAILABLE units shown)
- Lease start date (required, date picker)
- Lease end date (required, must be after start date)
- Lease duration (auto-calculated from dates, in months)
- Lease type (enum: FIXED_TERM, MONTH_TO_MONTH, YEARLY)
- Renewal option (checkbox: auto-renew, manual renew)

**Rent Breakdown:**
- Base rent (required, decimal, min 0)
- Admin fee (optional, decimal, one-time fee)
- Service charge (optional, decimal, monthly)
- Security deposit (required, decimal, typically 1-2 months rent)
- Total monthly rent (auto-calculated: base + service)

**Parking Allocation (Optional):**
- Number of parking spots (integer, default 0)
- Parking fee per spot (optional, decimal, monthly)
- Parking spot numbers (comma-separated, e.g., "P-101, P-102")
- Mulkiya document upload (optional, single file only, PDF/JPG, max 5MB)
- Note: Parking can be allocated during onboarding or later

**Payment Schedule:**
- Payment frequency (enum: MONTHLY, QUARTERLY, YEARLY)
- Payment due date (day of month, 1-31)
- Payment method (enum: BANK_TRANSFER, CHEQUE, PDC, CASH, ONLINE)
- Number of PDC cheques (if payment method = PDC)

**Document Upload:**
- Emirates ID / National ID scan (required, PDF/JPG, max 5MB)
- Passport copy (required, PDF/JPG, max 5MB)
- Visa copy (optional, PDF/JPG, max 5MB)
- Signed lease agreement (scanned physical document, PDF, max 10MB)
- Mulkiya document (optional, single file only, PDF/JPG, max 5MB)
- Additional documents (multiple files allowed)
- Note: All documents are physical copies signed in-person and scanned

**And** tenant entity is created with:
- id (UUID), userId (foreign key to User table)
- unitId (foreign key to Unit)
- All personal information fields
- Lease details (startDate, endDate, leaseType, etc.)
- Rent breakdown (baseRent, adminFee, serviceCharge)
- Parking details (parkingSpots count, parkingFee, spotNumbers, mulkiyaDocumentPath - single file)
- Payment schedule details
- Status (enum: PENDING, ACTIVE, EXPIRED, TERMINATED)
- leaseDocumentPath (path to uploaded signed lease PDF)
- createdAt, updatedAt timestamps

**And** when tenant is registered:
- Create user account with TENANT role (email, auto-generated password)
- Send welcome email with login credentials and password reset link
- Update unit status from AVAILABLE to OCCUPIED
- Generate tenant ID (e.g., TNT-2025-0001, auto-increment)
- If lease document is uploaded, send email with lease agreement attachment
- Log activity: "Tenant registered for Unit {unitNumber}"

**And** validation rules:
- Tenant cannot be assigned to already OCCUPIED unit
- Lease start date cannot be in the past (allow same day)
- Security deposit must be > 0
- Total monthly rent calculated correctly
- Email must be unique (one email per tenant)
- Age validation: Date of birth must result in 18+ years

**And** API endpoints:
- POST /api/v1/tenants: Create tenant (includes user creation)
- GET /api/v1/tenants: List tenants with filters
- GET /api/v1/tenants/{id}: Get tenant details
- PUT /api/v1/tenants/{id}: Update tenant information
- POST /api/v1/tenants/{id}/documents: Upload tenant documents
- POST /api/v1/tenants/{id}/parking: Allocate parking (can be done during or after onboarding)
- PUT /api/v1/tenants/{id}/parking: Update parking allocation
- DELETE /api/v1/tenants/{id}/parking/{spotId}: Remove parking allocation
- POST /api/v1/tenants/{id}/parking/mulkiya: Upload Mulkiya document for vehicle

**Prerequisites:** Story 3.1 (Property and Unit management), Story 2.1 (User creation)

**Technical Notes:**
- Use database transaction for tenant + user creation (rollback if either fails)
- Hash and store tenant ID documents securely
- Implement file upload with validation (file type, size)
- Store files in /uploads/tenants/{tenantId}/ directory
- Store lease agreements in /uploads/leases/{tenantId}/ directory
- Store Mulkiya document in /uploads/parking/{tenantId}/ directory (single file only)
- Auto-generate secure random password (12 chars, mixed case, numbers, symbols)
- Send email with lease agreement PDF as attachment after upload
- Frontend: Multi-step form wizard (Personal → Lease → Rent → Parking → Documents → Review)
- Use React Hook Form with Zod for complex validation
- Add field-level help text and tooltips for clarity
- Calculate total rent in real-time as user fills fields (including parking fees)
- Parking can be added later via tenant management page
- Store Mulkiya document as single file path (mulkiyaDocumentPath) in tenant record

### Story 3.3: Tenant Portal - Dashboard and Profile Management

As a tenant,
I want to access my portal dashboard and manage my profile,
So that I can view my lease details and update my information.

**Acceptance Criteria:**

**Given** I am logged in as a tenant
**When** I access my dashboard at /tenant/dashboard
**Then** I see:

**Dashboard Overview:**
- Welcome message: "Welcome back, {firstName}!"
- Current unit information:
  - Property name and address
  - Unit number, floor, bedroom/bathroom count
  - Lease start and end dates
  - Days remaining until lease expiration (countdown)
  - Lease status badge (ACTIVE, EXPIRING_SOON if < 60 days)

**Quick Stats Cards:**
- Outstanding balance (total unpaid amount)
- Next payment due date and amount
- Open maintenance requests count
- Upcoming amenity bookings count

**Quick Actions:**
- Submit maintenance request (button)
- Make payment (button)
- Book amenity (button)
- View lease agreement (button, downloads PDF)

**And** profile management page at /tenant/profile:

**Personal Information Section (Read-Only):**
- First name, last name (display only)
- Email (display only, tied to login)
- Phone number (display only)
- Date of birth (display only)
- National ID (display only)
- Emergency contact name and phone (display only)
- Note: "To update personal information, please contact property management"

**Lease Information Section (read-only):**
- Property and unit details
- Lease start and end dates
- Monthly rent breakdown (base, service, parking fees, total)
- Security deposit amount
- Payment schedule
- Download lease agreement button

**Parking Information Section (read-only):**
- Allocated parking spots (spot numbers)
- Parking fee per spot
- View/download Mulkiya document (if uploaded)
- Note: "To update parking allocation, please contact property management"

**Account Settings:**
- Change password (redirects to /settings/security)
- Language preference (future: English, Arabic)
- Note: All notifications are sent via email

**Document Repository:**
- List of uploaded documents (ID, passport, visa, etc.)
- Upload additional documents (e.g., salary certificate for renewal)
- Download previously uploaded documents
- File size and upload date shown for each

**And** API endpoints:
- GET /api/v1/tenant/dashboard: Get dashboard data (stats, activities, quick links)
- GET /api/v1/tenant/profile: Get tenant profile (read-only)
- GET /api/v1/tenant/lease: Get lease details and download PDF
- GET /api/v1/tenant/parking: Get parking allocation details
- POST /api/v1/tenant/documents: Upload document
- GET /api/v1/tenant/documents/{id}: Download document
- GET /api/v1/tenant/activities: Get activity history with pagination

**And** responsive design:
- Mobile-friendly layout (tenant portal primarily used on mobile)
- Touch-optimized buttons (min 44x44px)
- Collapsible sections on mobile
- Bottom navigation for quick access (dashboard, requests, payments, profile)

**Prerequisites:** Story 3.2 (Tenant registration)

**Technical Notes:**
- Use Next.js App Router with server components for dashboard (faster loading)
- Implement skeleton loaders for dashboard data
- Cache dashboard stats in browser (refresh every 5 minutes)
- Frontend: Use shadcn/ui Card, Badge, and Avatar components
- Add real-time updates for outstanding balance (refetch on payment)
- Implement activity logging service for audit trail
- Display dates in UAE timezone (all system dates in Gulf Standard Time - GST)
- Add breadcrumb navigation for better UX
- Profile is read-only - tenant must contact property management for changes
- All notifications sent via email only

### Story 3.4: Tenant Portal - Maintenance Request Submission

As a tenant,
I want to submit maintenance requests through the portal,
So that I can report issues and track their resolution.

**Acceptance Criteria:**

**Given** I am logged in as a tenant
**When** I submit a maintenance request
**Then** the request form includes:

**Request Details:**
- Category (dropdown: PLUMBING, ELECTRICAL, HVAC, APPLIANCE, CARPENTRY, PEST_CONTROL, CLEANING, OTHER)
- Priority (auto-suggested based on category, editable):
  - HIGH: No water, no electricity, AC not working in summer, gas leak
  - MEDIUM: Leaking faucet, broken appliance, door lock issue
  - LOW: Paint touch-up, minor repairs, general maintenance
- Title (required, max 100 chars, e.g., "Leaking kitchen faucet")
- Description (required, max 1000 chars, rich text editor for formatting)
- Preferred access time:
  - Immediate (emergencies)
  - Morning (8 AM - 12 PM)
  - Afternoon (12 PM - 5 PM)
  - Evening (5 PM - 8 PM)
  - Any time
- Preferred access date (date picker, default: today for HIGH, tomorrow for others)

**Attachments:**
- Upload up to 5 photos (JPG/PNG, max 5MB each)
- Photo preview with remove option
- Note: Video uploads not supported

**And** form validation:
- Title and description are required
- Category must be selected
- Photos are optional but recommended for faster resolution
- Description must be at least 20 characters
- Show character count for description (1000 chars max)

**And** request submission:
- API call: POST /api/v1/maintenance-requests
- Request body: {category, priority, title, description, preferredAccessTime, preferredAccessDate, attachments[]}
- Backend creates MaintenanceRequest entity:
  - id (UUID), tenantId, unitId, propertyId
  - requestNumber (unique, format: MR-2025-0001)
  - category, priority, title, description
  - status (default: SUBMITTED)
  - preferredAccessTime, preferredAccessDate
  - submittedAt timestamp
  - assignedTo (null initially, assigned by manager later)
  - attachments (array of file paths)
- Upload files to /uploads/maintenance/{requestId}/
- Send notification to property manager
- Return request number to tenant

**And** after submission:
- Success message: "Request #{requestNumber} submitted successfully"
- Redirect to request details page
- Email confirmation sent to tenant with request number
- Push notification to property manager (if enabled)

**And** request tracking page at /tenant/requests:
- List all requests (newest first)
- Filter by: status (all, open, in progress, completed, closed)
- Filter by: category
- Search by: request number, title, description
- Each request shows:
  - Request number (clickable link)
  - Title and category
  - Status badge with color coding:
    - SUBMITTED (yellow): "Waiting for assignment"
    - ASSIGNED (blue): "Assigned to {vendorName}"
    - IN_PROGRESS (orange): "Work in progress"
    - COMPLETED (green): "Work completed"
    - CLOSED (gray): "Request closed"
  - Submitted date and priority
  - Last updated timestamp

**And** request details page at /tenant/requests/{id}:
- Full request information (title, description, category, priority)
- Photo/video gallery (thumbnails, click to enlarge)
- Status timeline:
  - Submitted on {date}
  - Assigned to {vendor} on {date}
  - In progress on {date}
  - Completed on {date}
  - Closed on {date}
- Assigned vendor information (name, contact - if assigned)
- Estimated completion date (if provided)
- Actual completion date (if completed)
- Work notes from vendor (visible after completion)
- Completion photos (before/after photos from vendor)
- Tenant rating and feedback section (after completion):
  - Rate service: 1-5 stars
  - Comment field (optional, max 500 chars)
  - Submit feedback button

**And** status updates:
- Real-time status changes (polling every 30 seconds or WebSocket)
- Email notification on status change:
  - Assigned: "Your request has been assigned to {vendor}"
  - In Progress: "Work has started on your request"
  - Completed: "Your request has been completed. Please review."
  - Closed: "Your request has been closed"
- In-app notification badge on dashboard

**And** API endpoints:
- POST /api/v1/maintenance-requests: Create request
- GET /api/v1/maintenance-requests: List tenant's requests with filters
- GET /api/v1/maintenance-requests/{id}: Get request details
- POST /api/v1/maintenance-requests/{id}/feedback: Submit rating and feedback
- DELETE /api/v1/maintenance-requests/{id}: Cancel request (only if status = SUBMITTED)

**Prerequisites:** Story 3.3 (Tenant dashboard), Story 1.4 (Unit entity)

**Technical Notes:**
- Use React Hook Form with file upload component
- Implement image compression before upload (reduce 5MB to ~500KB)
- Store images with thumbnail generation (200x200px for list view)
- Use shadcn/ui Dialog for photo lightbox/gallery
- Implement optimistic UI update (show request immediately, then confirm)
- Add service worker for offline request drafts (save to IndexedDB)
- Frontend: Use react-rating-stars-component for star rating
- WebSocket for real-time status updates (or polling as fallback)
- Add analytics tracking for request categories to identify common issues
- No video upload support - photos only
- All status notifications sent via email

---

## Epic 4: Maintenance Operations

**Goal:** Implement straightforward maintenance management with work order creation, preventive maintenance scheduling, simple vendor assignment, and job completion tracking to ensure efficient property maintenance.

### Story 4.1: Work Order Creation and Management

As a property manager,
I want to create and manage work orders from multiple sources,
So that all maintenance needs are tracked and assigned efficiently.

**Acceptance Criteria:**

**Given** I am logged in as a property manager or maintenance supervisor
**When** I create a work order
**Then** the work order form includes:

**Basic Information:**
- Property and unit selection (dropdowns)
- Category (dropdown: PLUMBING, ELECTRICAL, HVAC, APPLIANCE, CARPENTRY, PEST_CONTROL, CLEANING, PAINTING, LANDSCAPING, OTHER)
- Priority (enum: HIGH, MEDIUM, LOW)
  - HIGH: Emergency repairs, safety issues
  - MEDIUM: Non-urgent repairs
  - LOW: General maintenance
- Title (required, max 100 chars)
- Description (required, max 1000 chars)
- Scheduled date (date picker)
- Access instructions (text, optional)
- Photo attachments (up to 5 photos, JPG/PNG, max 5MB each)

**And** work order entity is created:
- id (UUID), workOrderNumber (unique, format: WO-2025-0001)
- propertyId, unitId (foreign keys)
- category, priority, title, description
- status (enum: OPEN, ASSIGNED, IN_PROGRESS, COMPLETED, CLOSED)
- requestedBy (userId - tenant or manager)
- assignedTo (vendorId or null)
- scheduledDate
- completedDate
- accessInstructions
- attachments (array of file paths)
- estimatedCost, actualCost (visible only to managers, not tenants)
- createdAt, updatedAt timestamps
- maintenanceRequestId (foreign key, if source is tenant request)

**And** work order list page displays:
- Filterable list: status, priority, category, property, date range
- Search by work order number, title, description
- Color-coded priority badges (red=high, yellow=medium, blue=low)
- Shows: number, property/unit, title, priority, status, scheduled date, assigned vendor
- Quick actions: View, Edit, Assign

**And** work order detail page shows:
- All work order information (except cost for tenants)
- Status history with timestamps
- Photo gallery
- Comments/notes section
- Assigned vendor details

**And** tenant view restrictions:
- Tenants can only view work orders they created
- Cost information (estimatedCost, actualCost) hidden from tenants
- Tenants see only: status, title, description, photos, completion notes

**And** API endpoints:
- POST /api/v1/work-orders: Create work order
- GET /api/v1/work-orders: List work orders with filters
- GET /api/v1/work-orders/{id}: Get work order details
- PUT /api/v1/work-orders/{id}: Update work order
- PATCH /api/v1/work-orders/{id}/status: Update status
- POST /api/v1/work-orders/{id}/assign: Assign to vendor
- POST /api/v1/work-orders/{id}/comments: Add comment
- DELETE /api/v1/work-orders/{id}: Cancel work order

**Prerequisites:** Story 3.1 (Property and Unit), Story 3.4 (Tenant maintenance requests)

**Technical Notes:**
- Work order numbers auto-increment with year prefix
- Implement role-based access control for cost visibility
- When returning work order details, check user role and exclude cost fields for TENANT role
- Add database indexes on propertyId, status, assignedTo, scheduledDate
- Frontend: Use shadcn/ui DataTable with server-side pagination
- Store attachments in /uploads/work-orders/{workOrderId}/
- Send email notifications on creation, assignment, and status changes
- Link tenant maintenance requests to work orders automatically

### Story 4.2: Preventive Maintenance Scheduling

As a property manager,
I want to set up recurring preventive maintenance schedules,
So that equipment is maintained proactively and failures are prevented.

**Acceptance Criteria:**

**Given** I am logged in as a property manager
**When** I create a PM schedule
**Then** the PM schedule form includes:

**Schedule Information:**
- Schedule name (required, max 100 chars, e.g., "HVAC Quarterly Inspection")
- Property selection (dropdown, can be all properties or specific)
- Category (dropdown: PLUMBING, ELECTRICAL, HVAC, APPLIANCE, etc.)
- Description (required, max 1000 chars, describe what needs to be done)
- Recurrence type (enum: MONTHLY, QUARTERLY, SEMI_ANNUALLY, ANNUALLY)
- Start date (date picker, when to start generating work orders)
- End date (optional, date picker, when to stop generating work orders)
- Default priority (HIGH, MEDIUM, LOW)
- Default assignee (vendor or staff member, optional)

**And** PM schedule entity created:
- id (UUID), scheduleName
- propertyId (or null for all properties)
- category, description
- recurrenceType
- startDate, endDate (optional)
- defaultPriority, defaultAssigneeId
- status (enum: ACTIVE, PAUSED, COMPLETED)
- nextGenerationDate (calculated)
- createdAt, updatedAt timestamps

**And** automated work order generation:
- Scheduled job runs daily at 2 AM
- Check all active PM schedules where nextGenerationDate <= today
- Generate work order automatically:
  - Type: PREVENTIVE
  - Link to PM schedule
  - Set scheduled date to due date
  - Assign to default assignee (if specified)
- Update nextGenerationDate based on recurrence
- Send notification to assigned person

**And** PM schedule list page shows:
- All active and paused schedules
- Filters: property, category, status, frequency
- Shows: schedule name, property, frequency, next due date, last generated
- Quick actions: View, Edit, Pause/Resume, Generate Now (manual trigger)

**And** PM history tracking:
- Each PM schedule has history of generated work orders
- View all work orders generated from this schedule
- Identify overdue PM tasks

**And** API endpoints:
- POST /api/v1/pm-schedules: Create PM schedule
- GET /api/v1/pm-schedules: List PM schedules with filters
- GET /api/v1/pm-schedules/{id}: Get PM schedule details
- PUT /api/v1/pm-schedules/{id}: Update PM schedule
- PATCH /api/v1/pm-schedules/{id}/status: Pause/resume schedule
- POST /api/v1/pm-schedules/{id}/generate-now: Manually trigger work order generation
- GET /api/v1/pm-schedules/{id}/history: Get work orders generated from this schedule
- DELETE /api/v1/pm-schedules/{id}: Soft delete schedule

**Prerequisites:** Story 4.1 (Work order system)

**Technical Notes:**
- Use Spring Scheduler (@Scheduled) for automated generation
- Calculate nextGenerationDate using simple recurrence rules
- Implement calendar view for PM schedules (monthly/yearly view)
- Send reminder emails 3 days before PM due date
- Add validation: end date must be after start date

### Story 4.3: Work Order Assignment and Vendor Coordination

As a maintenance supervisor,
I want to assign work orders to internal staff or external vendors,
So that jobs are distributed efficiently.

**Acceptance Criteria:**

**Given** a work order exists with status = OPEN
**When** I assign the work order
**Then** the assignment workflow executes:

**Manual Assignment:**
- Click "Assign" button on work order
- Select assignee type: Internal Staff or External Vendor
- If Internal Staff: dropdown of users with role = MAINTENANCE_SUPERVISOR
- If External Vendor: dropdown of active vendors filtered by service category
- Optional: Add assignment notes (e.g., "Urgent, complete by EOD")
- Confirm assignment

**And** assignment updates:
- Update work order status: OPEN → ASSIGNED
- Set assignedTo field (userId or vendorId)
- Set assignedDate timestamp
- Log assignment action in history
- Send notification to assignee:
  - Email with work order details
  - Include property address, unit number, issue description
  - Include photos and access instructions
  - Include scheduled date and time slot

**And** reassignment:
- Manager can reassign work order to different vendor/staff
- Previous assignee is notified of reassignment
- Assignment history tracks all assignments
- Reason for reassignment captured

**And** API endpoints:
- POST /api/v1/work-orders/{id}/assign: Assign work order
- POST /api/v1/work-orders/{id}/reassign: Reassign to different person
- GET /api/v1/work-orders/unassigned: List unassigned work orders

**Prerequisites:** Story 4.1 (Work orders), Story 5.1 (Vendor management)

**Technical Notes:**
- Log all assignment actions for dispute resolution
- Send email notifications to assigned vendor/staff
- Track assignment history in work_order_assignments table
- Frontend: Use shadcn/ui Select component for assignee dropdown

### Story 4.4: Job Progress Tracking and Completion

As a maintenance staff or vendor,
I want to update job progress and mark work as complete,
So that work completion is tracked.

**Acceptance Criteria:**

**Given** a work order is assigned to me
**When** I update the job progress
**Then** I can perform the following actions:

**Start Work:**
- Click "Start Work" button
- Status changes: ASSIGNED → IN_PROGRESS
- startedAt timestamp recorded
- Send notification to manager: "Work has started on WO-2025-0001"

**Update Progress:**
- Add progress notes (text field, max 500 chars)
- Upload photos (before photos when starting, during photos for updates)
- Update estimated completion date (if different from scheduled)

**Mark Complete:**
- Click "Mark as Complete" button
- Status changes: IN_PROGRESS → COMPLETED
- completedAt timestamp recorded
- Required fields:
  - Completion notes (describe what was done)
  - Upload after photos (before/after comparison)
  - Total hours spent (decimal, e.g., 2.5 hours)
  - Total cost (decimal, includes labor and materials)
- Optional fields:
  - Recommendations (e.g., "Replace unit in 6 months")
  - Follow-up required (checkbox + description)

**And** photo management:
- Before photos (taken when starting)
- After photos (upon completion)
- Photo gallery with timestamps
- Compare before/after side-by-side

**And** API endpoints:
- PATCH /api/v1/work-orders/{id}/start: Start work
- POST /api/v1/work-orders/{id}/progress: Add progress update
- PATCH /api/v1/work-orders/{id}/complete: Mark as complete
- GET /api/v1/work-orders/{id}/timeline: Get progress timeline

**And** mobile-friendly interface:
- Touch-optimized buttons for quick updates
- Camera integration for photo capture

**Prerequisites:** Story 4.3 (Work order assignment)

**Technical Notes:**
- Store simple time and cost fields directly on work_order table
- Implement photo compression before upload (max 1MB per photo)
- Send email notifications on status changes
- Frontend: Use shadcn/ui Form components with file upload

---

## Epic 5: Vendor Management

**Goal:** Implement vendor registration, document management, and performance tracking to maintain a reliable network of service providers.

### Story 5.1: Vendor Registration and Profile Management

As a property manager,
I want to register and manage vendor profiles,
So that I have a reliable network of service providers for maintenance work.

**Acceptance Criteria:**

**Given** I am logged in as a property manager
**When** I register a new vendor
**Then** the vendor registration form includes:

**Company Information:**
- Company name (required, max 200 chars)
- Contact person name (required, max 100 chars)
- Email address (required, validated as RFC 5322 compliant)
- Phone number (required, E.164 format)
- Secondary phone number (optional)
- Company address (text, max 500 chars)
- Emirates ID or Trade License number (required, max 50 chars)
- TRN (Tax Registration Number, optional, for UAE tax compliance)

**Service Information:**
- Service categories (multi-select: PLUMBING, ELECTRICAL, HVAC, APPLIANCE, CARPENTRY, PEST_CONTROL, CLEANING, PAINTING, LANDSCAPING, OTHER)
- Service areas (properties they can serve, multi-select)
- Hourly rate (decimal, per hour for labor)
- Emergency callout fee (decimal, optional)
- Payment terms (dropdown: NET_15, NET_30, NET_45, NET_60 days)

**And** vendor entity is created:
- id (UUID), vendorNumber (unique, format: VND-2025-0001)
- companyName, contactPersonName
- email, phoneNumber, secondaryPhoneNumber
- address
- emiratesIdOrTradeLicense, trn
- serviceCategories (JSON array)
- serviceAreas (JSON array of propertyIds)
- hourlyRate, emergencyCalloutFee
- paymentTerms
- status (enum: ACTIVE, INACTIVE, SUSPENDED)
- rating (decimal, 0-5, calculated from feedback)
- totalJobsCompleted (integer, counter)
- createdAt, updatedAt timestamps

**And** vendor list page displays:
- Searchable and filterable list
- Filters: status, service category, rating
- Search by: company name, contact person, vendor number
- Shows: vendor number, company name, contact person, categories, rating, status
- Quick actions: View, Edit, Deactivate/Activate

**And** vendor detail page shows:
- All vendor information
- List of completed work orders
- Performance metrics (average rating, completion rate)
- Document status (licenses, insurance expiry)
- Payment history

**And** API endpoints:
- POST /api/v1/vendors: Create vendor
- GET /api/v1/vendors: List vendors with filters
- GET /api/v1/vendors/{id}: Get vendor details
- PUT /api/v1/vendors/{id}: Update vendor
- PATCH /api/v1/vendors/{id}/status: Activate/deactivate/suspend
- GET /api/v1/vendors/{id}/work-orders: Get vendor's work order history
- DELETE /api/v1/vendors/{id}: Soft delete vendor

**Prerequisites:** Story 1.4 (Core domain models)

**Technical Notes:**
- Vendor numbers auto-increment with year prefix
- Implement email validation and duplicate check
- Add database indexes on companyName, serviceCategories, status
- Frontend: Use shadcn/ui Form with multi-select for service categories
- Store service categories as JSON array for flexibility
- Calculate rating from work order feedback (average of all ratings)
- Track totalJobsCompleted counter (increment on work order completion)

### Story 5.2: Vendor Document and License Management

As a property manager,
I want to track vendor licenses and insurance documents,
So that I ensure compliance and vendor qualifications are current.

**Acceptance Criteria:**

**Given** a vendor is registered
**When** I manage their documents
**Then** the document management includes:

**Document Types:**
- Trade License (PDF, required, with expiry date)
- Insurance Certificate (PDF, required, with expiry date)
- Certifications (PDF, multiple allowed, optional, e.g., HVAC certification)
- ID copies (PDF/JPG, optional)

**And** document upload:
- Click "Upload Document" button
- Select document type from dropdown
- Choose file (PDF/JPG, max 10MB)
- Enter expiry date (date picker, for licenses and insurance)
- Optional: Add notes (max 200 chars)
- Upload and save

**And** document entity:
- id (UUID), vendorId (foreign key)
- documentType (enum: TRADE_LICENSE, INSURANCE, CERTIFICATION, ID_COPY)
- fileName, filePath (stored in /uploads/vendors/{vendorId}/documents/)
- fileSize, fileType
- expiryDate (date, null for documents without expiry)
- notes (text, optional)
- uploadedBy (userId)
- uploadedAt timestamp

**And** document expiry tracking:
- Dashboard alert for documents expiring in next 30 days
- Email notification to property manager 30 days before expiry
- Email notification to vendor 15 days before expiry
- Vendor status changes to SUSPENDED if critical docs (license/insurance) expire
- Manual reactivation after expired documents updated

**And** document list view:
- Shows all documents for vendor
- Color-coded status:
  - Green: Valid (expiry > 30 days away)
  - Yellow: Expiring soon (expiry within 30 days)
  - Red: Expired
- Quick actions: View, Download, Replace, Delete

**And** API endpoints:
- POST /api/v1/vendors/{vendorId}/documents: Upload document
- GET /api/v1/vendors/{vendorId}/documents: List vendor documents
- GET /api/v1/vendors/{vendorId}/documents/{id}: Download document
- PUT /api/v1/vendors/{vendorId}/documents/{id}: Replace document
- DELETE /api/v1/vendors/{vendorId}/documents/{id}: Delete document
- GET /api/v1/vendors/expiring-documents: Get all expiring documents (next 30 days)

**Prerequisites:** Story 5.1 (Vendor registration)

**Technical Notes:**
- Schedule daily job to check for expiring documents
- Send expiry notifications via email
- Auto-suspend vendors with expired critical documents
- Store documents in /uploads/vendors/{vendorId}/documents/
- Implement document versioning (keep history of replaced docs)
- Frontend: Use shadcn/ui Badge for expiry status colors
- Add calendar view for document expiry dates

### Story 5.3: Vendor Performance Tracking and Rating

As a property manager,
I want to track vendor performance and ratings,
So that I can make informed decisions when assigning work orders.

**Acceptance Criteria:**

**Given** a vendor has completed work orders
**When** I view their performance
**Then** the performance metrics include:

**Performance Summary:**
- Overall rating (1-5 stars, calculated from all work order feedback)
- Total jobs completed (counter)
- Average completion time (days)
- On-time completion rate (percentage of jobs completed by scheduled date)
- Total amount paid (sum of all work order costs)

**And** rating calculation:
- When work order is closed, property manager can rate vendor:
  - Quality of work (1-5 stars)
  - Timeliness (1-5 stars)
  - Communication (1-5 stars)
  - Professionalism (1-5 stars)
  - Comments (optional, max 500 chars)
- Overall vendor rating = average of all work order ratings
- Rating displayed on vendor profile and list

**And** performance dashboard shows:
- Vendor ranking table (sorted by rating)
- Filters: service category, date range
- Shows: rank, vendor name, rating, jobs completed, on-time rate
- Click to view vendor detail

**And** work order feedback:
- After work order completion, manager rates vendor
- Feedback linked to work order and vendor
- Feedback visible on vendor profile
- Historical feedback list with dates and comments

**And** API endpoints:
- POST /api/v1/work-orders/{id}/vendor-rating: Submit vendor rating
- GET /api/v1/vendors/{id}/performance: Get vendor performance metrics
- GET /api/v1/vendors/{id}/ratings: Get vendor rating history
- GET /api/v1/vendors/top-rated: Get top-rated vendors by category

**Prerequisites:** Story 5.1 (Vendor registration), Story 4.4 (Work order completion)

**Technical Notes:**
- Store vendor ratings in work_order_vendor_ratings table
- Calculate average rating on each new rating submission
- Update vendor.rating field (cached for performance)
- Implement scheduled job to recalculate all vendor ratings weekly
- Frontend: Use star rating component for rating input
- Display rating distribution (5-star: X%, 4-star: Y%, etc.)
- Add vendor comparison feature (compare multiple vendors side-by-side)

---

## Epic 6: Financial Management

**Goal:** Implement comprehensive financial management including rent collection, expense tracking, PDC management, and financial reporting to ensure accurate financial operations.

### Story 6.1: Rent Invoicing and Payment Management

As a finance manager,
I want to generate rent invoices and track payments,
So that rental income is collected efficiently and accurately.

**Acceptance Criteria:**

**Given** a tenant has an active lease
**When** I generate a rent invoice
**Then** the invoice generation includes:

**Invoice Generation:**
- Automatic monthly invoice generation (scheduled job runs on 1st of month)
- Manual invoice generation option for ad-hoc charges
- Invoice includes:
  - Invoice number (unique, format: INV-2025-0001)
  - Tenant name and unit
  - Invoice date and due date (configurable, default: due on 5th of month)
  - Rent breakdown:
    - Base rent (from lease agreement)
    - Service charges (from lease agreement)
    - Parking fees (from lease agreement)
    - Additional charges (late fees, utilities, other)
  - Total amount due
  - Payment instructions

**And** invoice entity:
- id (UUID), invoiceNumber (unique)
- tenantId, unitId, propertyId
- leaseId (foreign key)
- invoiceDate, dueDate
- baseRent, serviceCharges, parkingFees
- additionalCharges (JSON array with description and amount)
- totalAmount
- paidAmount (running total)
- balanceAmount (totalAmount - paidAmount)
- status (enum: DRAFT, SENT, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED)
- sentAt, paidAt timestamps
- createdAt, updatedAt timestamps

**And** payment recording:
- Record payment button on invoice
- Payment form includes:
  - Amount paid (decimal, up to balanceAmount)
  - Payment method (enum: CASH, BANK_TRANSFER, CARD, CHEQUE, PDC)
  - Payment date (date picker, default: today)
  - Transaction reference (text, optional, e.g., bank reference number)
  - Notes (text, optional)
- Create payment record
- Update invoice paidAmount and balanceAmount
- Update invoice status (PARTIALLY_PAID if balance remains, PAID if fully paid)
- Generate receipt (PDF) with payment details
- Send receipt email to tenant

**And** payment entity:
- id (UUID), paymentNumber (unique, format: PAY-2025-0001)
- invoiceId (foreign key)
- tenantId, amount
- paymentMethod, paymentDate
- transactionReference, notes
- receiptFilePath (PDF stored in /uploads/receipts/)
- recordedBy (userId)
- createdAt timestamp

**And** overdue tracking:
- Scheduled job runs daily
- Check invoices where dueDate < today and status != PAID
- Update status to OVERDUE
- Calculate late fees (configurable, e.g., 5% after 7 days overdue)
- Add late fee as additional charge to next invoice or current invoice
- Send overdue reminder email to tenant

**And** invoice list page:
- Filters: status, property, tenant, date range
- Search by: invoice number, tenant name
- Shows: invoice number, tenant, unit, amount, paid, balance, due date, status
- Quick actions: View, Record Payment, Send Email, Download PDF

**And** API endpoints:
- POST /api/v1/invoices: Create invoice manually
- GET /api/v1/invoices: List invoices with filters
- GET /api/v1/invoices/{id}: Get invoice details
- PUT /api/v1/invoices/{id}: Update invoice
- POST /api/v1/invoices/{id}/send: Send invoice email to tenant
- POST /api/v1/invoices/{id}/payments: Record payment
- GET /api/v1/invoices/{id}/pdf: Generate invoice PDF
- GET /api/v1/payments/{id}/receipt: Generate payment receipt PDF
- GET /api/v1/tenants/{id}/invoices: Get tenant's invoice history

**Prerequisites:** Story 3.2 (Tenant onboarding with lease terms)

**Technical Notes:**
- Use Spring Scheduler (@Scheduled) for automatic monthly invoice generation
- Calculate late fees based on configurable business rules
- Generate PDFs using iText or PDFBox library
- Email invoices as PDF attachments
- Store invoice PDFs in /uploads/invoices/
- Store payment receipts in /uploads/receipts/
- Add database indexes on invoiceNumber, tenantId, status, dueDate
- Frontend: Use shadcn/ui Table for invoice list
- Implement print-friendly invoice layout
- Support multiple payment methods including PDC (link to Story 6.3)

### Story 6.2: Expense Management and Vendor Payments

As a finance manager,
I want to track expenses and process vendor payments,
So that all costs are recorded and vendors are paid on time.

**Acceptance Criteria:**

**Given** expenses occur (maintenance, utilities, etc.)
**When** I record an expense
**Then** the expense management includes:

**Expense Recording:**
- Expense form includes:
  - Expense category (dropdown: MAINTENANCE, UTILITIES, SALARIES, SUPPLIES, INSURANCE, TAXES, OTHER)
  - Property (dropdown, can be "All Properties" for general expenses)
  - Vendor (dropdown, optional, for vendor-related expenses)
  - Work order (dropdown, optional, link to maintenance work order)
  - Amount (decimal)
  - Expense date (date picker)
  - Payment status (enum: PENDING, PAID)
  - Payment method (enum: CASH, BANK_TRANSFER, CARD, CHEQUE)
  - Description (text, max 500 chars)
  - Receipt upload (PDF/JPG, max 5MB)

**And** expense entity:
- id (UUID), expenseNumber (unique, format: EXP-2025-0001)
- category, propertyId
- vendorId (foreign key, optional)
- workOrderId (foreign key, optional)
- amount, expenseDate
- paymentStatus, paymentMethod
- paymentDate (when payment was made)
- description
- receiptFilePath (stored in /uploads/expenses/)
- recordedBy (userId)
- createdAt, updatedAt timestamps

**And** automatic expense creation from work orders:
- When work order is marked as COMPLETED
- If actualCost > 0, create expense automatically
- Link expense to work order and vendor
- Category = MAINTENANCE
- Payment status = PENDING (manager approves and processes payment)

**And** vendor payment processing:
- View pending vendor payments (expenses with paymentStatus = PENDING)
- Filter by vendor
- Select multiple expenses for batch payment
- Click "Process Payment" button
- Enter payment date and transaction reference
- Mark expenses as PAID
- Update paymentDate
- Generate payment summary report (PDF)
- Send payment confirmation email to vendor

**And** expense list page:
- Filters: category, property, vendor, payment status, date range
- Search by: expense number, description
- Shows: expense number, category, property, vendor, amount, date, status
- Quick actions: View, Edit, Mark as Paid, Download Receipt

**And** expense summary:
- Total expenses by category (pie chart)
- Monthly expense trend (line chart)
- Expense vs. budget comparison
- Top vendors by payment amount

**And** API endpoints:
- POST /api/v1/expenses: Create expense
- GET /api/v1/expenses: List expenses with filters
- GET /api/v1/expenses/{id}: Get expense details
- PUT /api/v1/expenses/{id}: Update expense
- PATCH /api/v1/expenses/{id}/pay: Mark as paid
- POST /api/v1/expenses/batch-pay: Process batch payment
- GET /api/v1/expenses/summary: Get expense summary and charts
- DELETE /api/v1/expenses/{id}: Soft delete expense

**Prerequisites:** Story 5.1 (Vendor registration), Story 4.4 (Work order completion)

**Technical Notes:**
- Auto-create expenses from completed work orders with actualCost
- Store expense receipts in /uploads/expenses/
- Implement batch payment processing for multiple expenses
- Generate payment summary PDFs with expense details
- Add database indexes on category, propertyId, vendorId, paymentStatus
- Frontend: Use Recharts for expense charts
- Calculate month-over-month expense growth
- Support expense approval workflow (optional enhancement)

### Story 6.3: Post-Dated Cheque (PDC) Management

As a finance manager,
I want to manage post-dated cheques from tenants,
So that I can track cheque deposits and handle bounced cheques.

**Acceptance Criteria:**

**Given** a tenant pays rent with post-dated cheques
**When** I register PDCs
**Then** the PDC management includes:

**PDC Registration:**
- PDC registration form (accessed from tenant profile or invoice)
- Form includes:
  - Tenant selection (dropdown)
  - Lease/Invoice link (optional)
  - Number of cheques (integer, e.g., 12 for annual lease)
  - Cheque details for each:
    - Cheque number (text, max 50 chars)
    - Bank name (text, max 100 chars)
    - Cheque amount (decimal)
    - Cheque date (date picker, post-dated)
    - Status (default: RECEIVED)
- Bulk entry mode: enter details for all cheques in table format
- Save all PDCs at once

**And** PDC entity:
- id (UUID), chequeNumber
- tenantId (foreign key)
- invoiceId (foreign key, optional, link to specific invoice)
- leaseId (foreign key, optional)
- bankName, amount
- chequeDate (post-dated)
- status (enum: RECEIVED, DUE, DEPOSITED, CLEARED, BOUNCED, CANCELLED, REPLACED)
- depositDate (when deposited to bank)
- clearedDate (when cheque cleared)
- bouncedDate, bounceReason (if bounced)
- replacementChequeId (foreign key, if replaced)
- notes (text, optional)
- createdBy (userId)
- createdAt, updatedAt timestamps

**And** PDC dashboard:
- KPI cards:
  - PDCs due this week (count and total value)
  - PDCs deposited (count and total value)
  - Total outstanding PDC value
  - Recently bounced cheques (count)
- Upcoming PDCs list (next 30 days):
  - Shows: cheque number, tenant, bank, amount, cheque date, status
  - Quick action: Mark as Deposited
- Recently deposited PDCs:
  - Shows: cheque number, tenant, amount, deposit date
  - Quick action: Mark as Cleared or Bounced

**And** PDC status workflow:
- RECEIVED → DUE (automatic, when chequeDate is within 7 days)
- DUE → DEPOSITED (manual, when manager deposits cheque)
  - Enter deposit date
  - Status updates to DEPOSITED
  - Send deposit confirmation email to property manager
- DEPOSITED → CLEARED (manual, when bank confirms clearance)
  - Enter cleared date
  - Link PDC payment to invoice (auto-record payment if invoice linked)
  - Status updates to CLEARED
- DEPOSITED → BOUNCED (manual, if cheque bounces)
  - Enter bounced date and reason
  - Status updates to BOUNCED
  - Send bounce notification email to property manager and tenant
  - Tenant status flagged for follow-up
- BOUNCED → REPLACED (manual, when tenant provides replacement cheque)
  - Register new PDC as replacement
  - Link to original bounced PDC
  - Original PDC status updates to REPLACED

**And** PDC list page:
- Filters: status, tenant, date range, bank
- Search by: cheque number, tenant name
- Color-coded status badges
- Shows: cheque number, tenant, bank, amount, cheque date, status
- Quick actions: View, Mark as Deposited, Mark as Cleared, Report Bounce, Cancel

**And** bounce handling:
- Record bounce with reason (e.g., insufficient funds, signature mismatch)
- Add late fee to tenant invoice
- Flag tenant account for follow-up
- Track bounce history per tenant
- Send notification to property manager

**And** API endpoints:
- POST /api/v1/pdcs: Register PDCs (single or bulk)
- GET /api/v1/pdcs: List PDCs with filters
- GET /api/v1/pdcs/{id}: Get PDC details
- PUT /api/v1/pdcs/{id}: Update PDC
- PATCH /api/v1/pdcs/{id}/deposit: Mark as deposited
- PATCH /api/v1/pdcs/{id}/clear: Mark as cleared
- PATCH /api/v1/pdcs/{id}/bounce: Report bounce
- PATCH /api/v1/pdcs/{id}/cancel: Cancel PDC
- GET /api/v1/pdcs/dashboard: Get PDC dashboard data
- GET /api/v1/tenants/{id}/pdcs: Get tenant's PDC history

**Prerequisites:** Story 6.1 (Invoicing), Story 3.2 (Tenant onboarding)

**Technical Notes:**
- Scheduled job runs daily to check for PDCs becoming due (chequeDate within 7 days)
- Send email reminders for PDCs due soon (3 days before chequeDate)
- When PDC is cleared, auto-record payment on linked invoice
- Track bounce rate per tenant (number of bounces / total PDCs)
- Add database indexes on tenantId, status, chequeDate
- Frontend: Use shadcn/ui Calendar for cheque date visualization
- Display PDC calendar view showing all upcoming cheque dates
- Implement bulk deposit action (mark multiple PDCs as deposited)

### Story 6.4: Financial Reporting and Analytics

As a finance manager,
I want to view financial reports and analytics,
So that I can understand income, expenses, and profitability.

**Acceptance Criteria:**

**Given** financial data exists (invoices, payments, expenses)
**When** I view financial reports
**Then** the reporting includes:

**Income Statement (Profit & Loss):**
- Date range selector (default: current month)
- Property filter (all properties or specific)
- Revenue section:
  - Rental income (from invoices)
  - Service charges
  - Parking fees
  - Late fees
  - Other income
  - Total revenue
- Expense section:
  - Maintenance expenses
  - Utilities
  - Salaries
  - Supplies
  - Insurance
  - Taxes
  - Other expenses
  - Total expenses
- Net profit/loss: Total revenue - Total expenses
- Profit margin percentage

**And** cash flow summary:
- Cash inflows (payments received)
- Cash outflows (expenses paid)
- Net cash flow
- Month-over-month comparison

**And** accounts receivable aging:
- Outstanding invoices grouped by age:
  - Current (not yet due)
  - 1-30 days overdue
  - 31-60 days overdue
  - 61-90 days overdue
  - 90+ days overdue
- Total outstanding amount
- Collection rate percentage

**And** revenue breakdown charts:
- Revenue by property (pie chart)
- Revenue by type (rent, service charges, parking, other)
- Monthly revenue trend (line chart, last 12 months)
- Year-over-year comparison

**And** expense breakdown charts:
- Expenses by category (pie chart)
- Monthly expense trend (line chart, last 12 months)
- Top 5 vendors by payment amount
- Maintenance cost per property

**And** financial dashboard:
- KPI cards:
  - Total revenue (current month)
  - Total expenses (current month)
  - Net profit/loss (current month)
  - Collection rate (payments / invoices issued)
  - Outstanding receivables
- Quick insights:
  - Revenue growth vs. last month
  - Expense growth vs. last month
  - Top performing property (by revenue)
  - Highest expense category

**And** export capabilities:
- Export reports to PDF
- Export data to Excel/CSV
- Include charts and tables in exports
- Email reports to stakeholders

**And** API endpoints:
- GET /api/v1/reports/income-statement: Get P&L report
- GET /api/v1/reports/cash-flow: Get cash flow summary
- GET /api/v1/reports/receivables-aging: Get AR aging report
- GET /api/v1/reports/revenue-breakdown: Get revenue charts
- GET /api/v1/reports/expense-breakdown: Get expense charts
- GET /api/v1/reports/financial-dashboard: Get dashboard KPIs
- GET /api/v1/reports/export/pdf: Export report as PDF
- GET /api/v1/reports/export/excel: Export report as Excel

**Prerequisites:** Story 6.1 (Invoicing), Story 6.2 (Expense management)

**Technical Notes:**
- Calculate all metrics server-side for performance
- Cache dashboard KPIs (refresh every hour or on demand)
- Use database aggregation queries for efficient reporting
- Frontend: Use Recharts for all charts and graphs
- Implement drill-down capability (click chart to see details)
- Generate PDFs using iText or PDFBox
- Export Excel using Apache POI library
- Add comparative reporting (current vs. previous period)
- Support custom date range selection

---

## Epic 7: Asset & Compliance Management

**Goal:** Implement asset tracking and compliance management to maintain equipment records and ensure regulatory compliance.

### Story 7.1: Asset Registry and Tracking

As a property manager,
I want to maintain an asset registry for property equipment,
So that I can track maintenance history and warranty information.

**Acceptance Criteria:**

**Given** I am managing properties with equipment
**When** I register an asset
**Then** the asset registration includes:

**Asset Information:**
- Asset name (required, max 200 chars, e.g., "HVAC Unit - Floor 3")
- Asset category (dropdown: HVAC, ELEVATOR, GENERATOR, WATER_PUMP, FIRE_SYSTEM, SECURITY_SYSTEM, ELECTRICAL_PANEL, PLUMBING_FIXTURE, APPLIANCE, OTHER)
- Property and location (required, property dropdown + location text like "Basement", "Roof", "Unit 301")
- Manufacturer (text, max 100 chars)
- Model number (text, max 100 chars)
- Serial number (text, max 100 chars, optional)
- Installation date (date picker)
- Warranty expiry date (date picker, optional)
- Purchase cost (decimal, optional)
- Estimated useful life (integer, years, optional)

**And** asset entity:
- id (UUID), assetNumber (unique, format: AST-2025-0001)
- assetName, category
- propertyId (foreign key), location
- manufacturer, modelNumber, serialNumber
- installationDate, warrantyExpiryDate
- purchaseCost, estimatedUsefulLife
- status (enum: ACTIVE, UNDER_MAINTENANCE, OUT_OF_SERVICE, DISPOSED)
- lastMaintenanceDate (updated from work orders)
- nextMaintenanceDate (calculated or manual)
- createdAt, updatedAt timestamps

**And** asset documents:
- Upload asset documents (manuals, warranties, specs)
- Document types: MANUAL, WARRANTY, PURCHASE_INVOICE, SPECIFICATION, OTHER
- Store in /uploads/assets/{assetId}/documents/
- View and download documents from asset detail page

**And** maintenance history:
- Link work orders to assets
- View all maintenance performed on asset
- Shows: work order number, date, description, cost, vendor
- Track total maintenance cost per asset
- Identify high-maintenance assets

**And** warranty tracking:
- Dashboard alert for warranties expiring in next 30 days
- Email notification 30 days before warranty expiry
- Warranty status indicator on asset list (active/expired)

**And** asset list page:
- Filters: property, category, status
- Search by: asset name, model number, serial number
- Shows: asset number, name, category, property, location, status, warranty status
- Quick actions: View, Edit, View Maintenance History, Dispose

**And** API endpoints:
- POST /api/v1/assets: Create asset
- GET /api/v1/assets: List assets with filters
- GET /api/v1/assets/{id}: Get asset details
- PUT /api/v1/assets/{id}: Update asset
- PATCH /api/v1/assets/{id}/status: Update asset status
- GET /api/v1/assets/{id}/maintenance-history: Get maintenance work orders
- POST /api/v1/assets/{id}/documents: Upload document
- GET /api/v1/assets/expiring-warranties: Get assets with expiring warranties
- DELETE /api/v1/assets/{id}: Soft delete asset

**Prerequisites:** Story 3.1 (Property management), Story 4.1 (Work orders)

**Technical Notes:**
- Asset numbers auto-increment with year prefix
- Link work orders to assets via assetId field (optional foreign key)
- Calculate total maintenance cost by summing linked work order costs
- Schedule daily job to check for expiring warranties
- Add database indexes on assetNumber, propertyId, category, status
- Frontend: Use shadcn/ui Form with cascading dropdowns (property → location suggestions)
- Display asset QR code for easy mobile access (optional)
- Track asset depreciation using straight-line method (optional)

### Story 7.2: Document Management System

As a property manager,
I want a centralized document repository,
So that all property-related documents are organized and easily accessible.

**Acceptance Criteria:**

**Given** I manage multiple properties and entities
**When** I upload a document
**Then** the document management includes:

**Document Upload:**
- Document upload form accessible from multiple contexts:
  - Property documents (ownership, permits, NOC)
  - Tenant documents (contracts, IDs, visas)
  - Vendor documents (licenses, insurance - covered in Story 5.2)
  - Asset documents (manuals, warranties - covered in Story 7.1)
  - General documents (policies, templates, certificates)
- Form fields:
  - Document type (dropdown, context-specific)
  - Title (required, max 200 chars)
  - Description (text, max 500 chars, optional)
  - File upload (PDF/JPG/PNG/DOC/XLSX, max 10MB)
  - Expiry date (date picker, optional, for expiring documents)
  - Tags (multi-select or text input for categorization)
  - Access level (enum: PUBLIC, INTERNAL, RESTRICTED)

**And** document entity:
- id (UUID), documentNumber (unique, format: DOC-2025-0001)
- documentType, title, description
- fileName, filePath, fileSize, fileType
- entityType (enum: PROPERTY, TENANT, VENDOR, ASSET, GENERAL)
- entityId (foreign key to related entity, nullable for GENERAL)
- expiryDate (nullable)
- tags (JSON array)
- accessLevel
- uploadedBy (userId)
- uploadedAt, updatedAt timestamps
- version (integer, for version control)

**And** document list/search:
- Global document search across all entities
- Filters: entity type, document type, expiry status, access level, tags, date range
- Search by: title, description, file name
- Shows: document number, title, entity, type, expiry status, upload date
- Quick actions: View, Download, Edit, Replace (new version), Delete

**And** document versioning:
- Replace document creates new version
- Previous versions archived but accessible
- Version history shows:
  - Version number
  - Upload date and user
  - File name and size
  - Download link for each version

**And** document expiry tracking:
- Dashboard alert for documents expiring in next 30 days
- Email notifications 30 days before expiry
- Color-coded expiry status:
  - Green: Valid (expiry > 30 days away or no expiry)
  - Yellow: Expiring soon (within 30 days)
  - Red: Expired
- Expired documents highlighted in searches

**And** access control:
- PUBLIC: All authenticated users can view
- INTERNAL: Only staff (managers, supervisors, finance) can view
- RESTRICTED: Only specific users or roles can view
- Implement @PreAuthorize checks on document download endpoint

**And** document preview:
- In-browser preview for PDFs and images
- Download option for all file types
- Thumbnail generation for images

**And** API endpoints:
- POST /api/v1/documents: Upload document
- GET /api/v1/documents: List/search documents with filters
- GET /api/v1/documents/{id}: Get document metadata
- GET /api/v1/documents/{id}/download: Download document file
- GET /api/v1/documents/{id}/preview: Get document preview URL
- PUT /api/v1/documents/{id}: Update document metadata
- POST /api/v1/documents/{id}/replace: Upload new version
- GET /api/v1/documents/{id}/versions: Get version history
- DELETE /api/v1/documents/{id}: Soft delete document
- GET /api/v1/documents/expiring: Get expiring documents

**Prerequisites:** Story 3.2 (Tenants), Story 5.2 (Vendors), Story 7.1 (Assets)

**Technical Notes:**
- Store documents in /uploads/documents/{entityType}/{entityId}/
- Implement file virus scanning before storage (optional)
- Generate thumbnails for images (200x200px)
- Store document versions in /uploads/documents/{entityType}/{entityId}/versions/
- Add full-text search capability for document content (optional, using Apache Tika)
- Implement document templates for common forms (lease agreement template, etc.)
- Track document download history for audit trail
- Add database indexes on entityType, entityId, documentType, expiryDate
- Frontend: Use shadcn/ui Dialog for document preview modal
- Implement drag-and-drop file upload

### Story 7.3: Compliance and Inspection Tracking

As a property manager,
I want to track regulatory compliance and inspections,
So that all properties meet legal requirements and avoid violations.

**Acceptance Criteria:**

**Given** properties must comply with regulations
**When** I manage compliance requirements
**Then** the compliance tracking includes:

**Compliance Requirements:**
- Define compliance requirements for properties
- Requirement form includes:
  - Requirement name (required, max 200 chars, e.g., "Civil Defense Inspection")
  - Category (dropdown: SAFETY, FIRE, ELECTRICAL, PLUMBING, STRUCTURAL, ENVIRONMENTAL, LICENSING, OTHER)
  - Description (text, max 1000 chars)
  - Applicable to (multi-select properties or "All Properties")
  - Frequency (enum: ONE_TIME, MONTHLY, QUARTERLY, SEMI_ANNUALLY, ANNUALLY, BIANNUALLY)
  - Authority/Agency (text, max 200 chars, e.g., "Dubai Civil Defense")
  - Penalty for non-compliance (text, max 500 chars)

**And** compliance requirement entity:
- id (UUID), requirementNumber (unique, format: CMP-2025-0001)
- requirementName, category, description
- applicableProperties (JSON array of propertyIds, or null for all)
- frequency
- authorityAgency, penaltyDescription
- status (enum: ACTIVE, INACTIVE)
- createdAt, updatedAt timestamps

**And** compliance schedule:
- Auto-generate compliance tasks based on frequency
- Schedule entity tracks:
  - complianceRequirementId (foreign key)
  - propertyId (foreign key)
  - dueDate (calculated based on frequency)
  - status (enum: UPCOMING, DUE, COMPLETED, OVERDUE, EXEMPT)
  - completedDate, completedBy
  - notes (text, compliance results or notes)
  - certificateFilePath (PDF of compliance certificate)

**And** inspection scheduling:
- Create inspection record for compliance requirement
- Inspection form:
  - Property and requirement (dropdowns)
  - Inspector name (text, may be external agency)
  - Scheduled date (date picker)
  - Status (enum: SCHEDULED, IN_PROGRESS, PASSED, FAILED, CANCELLED)
- Link to compliance schedule

**And** inspection completion:
- Record inspection results
  - Inspection date (date picker)
  - Result (dropdown: PASSED, FAILED, PARTIAL_PASS)
  - Issues found (text, max 1000 chars)
  - Recommendations (text, max 1000 chars)
  - Certificate upload (PDF, if passed)
  - Next inspection date (date picker, if recurring)
- If passed: mark compliance schedule as COMPLETED
- If failed: create remediation work order (link to maintenance)

**And** compliance dashboard:
- KPI cards:
  - Upcoming inspections (next 30 days)
  - Overdue compliance items
  - Recent violations
  - Compliance rate percentage (completed / total)
- Compliance calendar view showing all scheduled inspections
- Alerts for overdue items

**And** compliance list page:
- View all compliance schedules
- Filters: property, category, status, due date range
- Color-coded status indicators
- Shows: requirement name, property, due date, status, last completed
- Quick actions: Mark Complete, Schedule Inspection, Upload Certificate

**And** violation tracking:
- Record violations if compliance failed
- Violation entity:
  - complianceScheduleId (foreign key)
  - violationDate, description
  - fine amount (decimal, if applicable)
  - fineStatus (enum: PENDING, PAID, APPEALED, WAIVED)
  - remediation work order ID (link to fix)
  - resolutionDate
- Track violations per property for reporting

**And** API endpoints:
- POST /api/v1/compliance-requirements: Create requirement
- GET /api/v1/compliance-requirements: List requirements
- GET /api/v1/compliance-requirements/{id}: Get requirement details
- PUT /api/v1/compliance-requirements/{id}: Update requirement
- GET /api/v1/compliance-schedules: List scheduled compliance items
- PATCH /api/v1/compliance-schedules/{id}/complete: Mark as completed
- POST /api/v1/inspections: Schedule inspection
- PUT /api/v1/inspections/{id}: Update inspection results
- POST /api/v1/violations: Record violation
- GET /api/v1/compliance/dashboard: Get dashboard data
- GET /api/v1/properties/{id}/compliance-history: Get property compliance history

**Prerequisites:** Story 3.1 (Properties), Story 4.1 (Work orders for remediation)

**Technical Notes:**
- Scheduled job runs daily to check for due compliance items
- Send email reminders 30 days before compliance due date
- Auto-generate recurring compliance schedules based on frequency
- Calculate next due date after completion
- Store compliance certificates in /uploads/compliance/{scheduleId}/
- Add database indexes on propertyId, dueDate, status
- Frontend: Use FullCalendar for compliance calendar view
- Implement color-coding: green (completed), yellow (upcoming), red (overdue)
- Link failed inspections to work order creation for remediation
- Generate compliance reports for property audits

---

## Epic 8: Dashboard & Reporting

**Goal:** Implement comprehensive dashboards and reporting to provide real-time insights into operations, finances, and property performance.

### Story 8.1: Executive Summary Dashboard

As an executive or property manager,
I want an executive dashboard with key performance indicators,
So that I can quickly understand the overall business health and identify issues.

**Acceptance Criteria:**

**Given** I am logged in as an authorized user
**When** I access the main dashboard
**Then** the executive dashboard displays:

**KPI Cards (Top Row):**
- **Net Profit/Loss (Current Month)**
  - Amount with currency
  - Percentage change vs. last month (green up arrow or red down arrow)
  - Calculated as: Total Revenue - Total Expenses (from Story 6.4)
- **Overall Occupancy Rate**
  - Percentage (occupied units / total units)
  - Change vs. last month
  - Drill-down to see by property
- **Overdue Maintenance Jobs**
  - Count of work orders with status != COMPLETED and scheduledDate < today
  - Click to view list
- **Outstanding Receivables**
  - Total amount from unpaid invoices
  - Aging breakdown (current, 30+, 60+, 90+)

**And** visual components:

**Priority Maintenance Queue (Card):**
- List of HIGH priority work orders (status: OPEN or ASSIGNED)
- Shows: work order number, property/unit, title, days overdue
- Limited to top 5, with "View All" link
- Red highlight for overdue items

**Upcoming PM Jobs (Card - 30-day view):**
- Bar chart showing PM jobs by category (next 30 days)
- Categories on Y-axis, count on X-axis
- Color-coded by status: scheduled, overdue
- Click category to view details

**Lease Expirations (Card - 12-month forecast):**
- Timeline showing lease expirations by month
- Shows: month, count of expiring leases
- Highlight months with > 5 expirations (renewal planning needed)
- Click to see list of expiring leases for that month

**Critical Alerts Panel (Card):**
- Color-coded alerts requiring attention:
  - Red (Urgent): Overdue compliance, bounced cheques, expired vendor licenses
  - Yellow (Warning): Documents expiring in 7 days, high-value invoices overdue
  - Blue (Info): Low occupancy rates, high maintenance costs
- Count per alert type
- Click to view alert details and take action

**And** property performance comparison:
- Table showing key metrics per property:
  - Property name
  - Occupancy rate
  - Maintenance cost (current month)
  - Revenue (current month)
  - Open work orders
- Sortable by any column
- Highlight top and bottom performers

**And** dashboard filters:
- Date range selector (default: current month)
- Property filter (all or specific properties)
- Refresh button to reload data
- Auto-refresh every 5 minutes (configurable)

**And** API endpoints:
- GET /api/v1/dashboard/executive: Get all KPIs and dashboard data
- GET /api/v1/dashboard/kpis: Get just KPI cards data
- GET /api/v1/dashboard/maintenance-queue: Get priority maintenance list
- GET /api/v1/dashboard/pm-upcoming: Get upcoming PM jobs chart data
- GET /api/v1/dashboard/lease-expirations: Get lease expiration timeline
- GET /api/v1/dashboard/alerts: Get critical alerts
- GET /api/v1/dashboard/property-comparison: Get property performance table

**Prerequisites:** All previous epics (data from all modules)

**Technical Notes:**
- Cache dashboard data for 5 minutes to reduce database load
- Use database aggregation queries for efficient KPI calculation
- Implement real-time updates using WebSocket (optional) or polling
- Frontend: Use Recharts for all charts (bar, line, pie)
- Use shadcn/ui Card components for dashboard layout
- Implement skeleton loaders while dashboard data loads
- Add export dashboard as PDF feature
- Ensure responsive layout for tablets
- Calculate KPIs server-side for accuracy
- Add drill-down capability for each KPI (click to see details)

### Story 8.2: Operational Dashboards

As a department user (maintenance supervisor, finance manager),
I want role-specific operational dashboards,
So that I can monitor and manage my area of responsibility effectively.

**Acceptance Criteria:**

**Given** I am logged in with a specific role
**When** I access my operational dashboard
**Then** I see role-appropriate information:

**Maintenance Dashboard (for MAINTENANCE_SUPERVISOR):**

- **KPI Cards:**
  - Open work orders (count)
  - In-progress work orders (count)
  - Completed this month (count)
  - Average completion time (days)

- **Work Order Status Chart:**
  - Pie chart: distribution by status (OPEN, ASSIGNED, IN_PROGRESS, COMPLETED)
  - Click slice to filter work order list

- **Work Orders by Category:**
  - Bar chart showing count by category (PLUMBING, ELECTRICAL, etc.)
  - Identify most common issues

- **Work Order List:**
  - Filterable, sortable table
  - Shows: number, property/unit, category, priority, status, scheduled date, assigned to
  - Quick actions: View, Assign, Update Status

- **Vendor Performance:**
  - List of top 5 vendors by jobs completed this month
  - Shows: vendor name, jobs completed, average rating, on-time rate
  - Click to view vendor details

**Financial Dashboard (for FINANCE_MANAGER):**

- **KPI Cards:**
  - Total revenue (current month)
  - Total expenses (current month)
  - Net profit/loss (current month)
  - Collection rate (payments received / invoices issued)

- **Income vs. Expense Chart:**
  - Line chart showing monthly trend (last 12 months)
  - Two lines: income (green) and expenses (red)
  - Net profit/loss area in between

- **Revenue Breakdown:**
  - Pie chart: rent, service charges, parking, other
  - Shows percentage and amount for each

- **Expense Breakdown:**
  - Pie chart: maintenance, utilities, salaries, other
  - Click to see detailed expense list

- **Outstanding Invoices:**
  - Table of unpaid invoices (sorted by due date)
  - Shows: invoice number, tenant, amount, due date, days overdue
  - Quick actions: View, Record Payment

- **PDC Status:**
  - Summary of PDC status (from Story 6.3):
    - Due this week
    - Due this month
    - Deposited awaiting clearance
    - Recently bounced
  - Click to view PDC management page

**Occupancy Dashboard (for PROPERTY_MANAGER):**

- **KPI Cards:**
  - Overall occupancy rate (percentage)
  - Vacant units (count)
  - Leases expiring (next 90 days)
  - Average rent per sqft

- **Occupancy by Property:**
  - Bar chart showing occupancy rate per property
  - Identify underperforming properties

- **Unit Status Breakdown:**
  - Pie chart: occupied, vacant, under renovation, notice period
  - Count and percentage for each

- **Vacant Units List:**
  - Table of available units
  - Shows: property, unit number, type, size, rent, days vacant
  - Sort by days vacant to prioritize leasing
  - Quick action: Create Lead/Lease

- **Lease Expiration Timeline:**
  - Calendar view of upcoming expirations (next 6 months)
  - Color-coded: renewed (green), pending renewal (yellow), notice given (red)
  - Click date to see leases expiring that month

- **Tenant Satisfaction:**
  - Average rating from maintenance request feedback
  - Top 3 properties by satisfaction
  - Bottom 3 properties needing attention

**And** dashboard navigation:
- Sidebar or tab navigation between dashboards
- Breadcrumb showing current dashboard
- Quick switch dropdown to change dashboard

**And** common features across all dashboards:
- Date range filter
- Property filter (if applicable to role)
- Export to PDF/Excel
- Print-friendly layout
- Refresh button and auto-refresh

**And** API endpoints:
- GET /api/v1/dashboard/maintenance: Get maintenance dashboard data
- GET /api/v1/dashboard/financial: Get financial dashboard data
- GET /api/v1/dashboard/occupancy: Get occupancy dashboard data
- Each dashboard endpoint returns all charts and tables data

**Prerequisites:** All previous epics

**Technical Notes:**
- Implement role-based dashboard access (@PreAuthorize)
- Cache dashboard data per role (5-minute TTL)
- Use database views for complex queries
- Frontend: Consistent chart styling across dashboards
- Use shadcn/ui Tabs for dashboard navigation
- Implement drill-down from charts to detailed lists
- Add data export functionality for each dashboard
- Ensure mobile-friendly layouts
- Display loading states with skeleton screens
- Add customization: users can hide/show dashboard widgets (optional)

---

## Epic 9: Communication & Notifications

**Goal:** Implement email-based notification system and announcement management to keep all stakeholders informed.

### Story 9.1: Email Notification System

As a system administrator,
I want an automated email notification system,
So that users are informed of important events and updates via email.

**Acceptance Criteria:**

**Given** various events occur in the system
**When** a notification-triggering event happens
**Then** the email notification system handles it:

**Email Configuration:**
- Configure Gmail API for email sending (per PRD requirement)
- SMTP settings in application.properties:
  - Gmail API credentials or SMTP host/port
  - Sender email address (e.g., noreply@ultrabms.com)
  - Sender display name (e.g., "Ultra BMS")
- Test email connection on application startup

**And** notification triggers:

**Authentication & User Management:**
- Password reset requested: Send reset link email
- Password changed: Confirmation email
- New user account created: Welcome email with credentials

**Tenant Management:**
- Tenant onboarded: Welcome email with portal access details
- Lease agreement uploaded: Email with PDF attachment
- Lease expiring soon: Reminder 90, 60, 30 days before expiry

**Maintenance:**
- Maintenance request submitted: Confirmation to tenant, alert to property manager
- Work order assigned: Email to assigned vendor/staff
- Work order status changed: Email to requester (tenant or manager)
- Work order completed: Notification to requester

**Financial:**
- Invoice generated: Email invoice PDF to tenant
- Payment received: Email receipt PDF to tenant
- Invoice overdue: Reminder emails (7 days, 14 days, 30 days overdue)
- PDC due soon: Reminder 3 days before cheque date
- PDC bounced: Alert to property manager and tenant

**Vendor Management:**
- Vendor registered: Welcome email with company details
- Vendor document expiring: Reminder 30 days before expiry
- Vendor license expired: Suspension notification

**Compliance:**
- Compliance item due soon: Reminder 30 days before due date
- Compliance overdue: Alert to property manager
- Inspection scheduled: Notification with date and details

**Document Management:**
- Document uploaded: Notification to relevant parties
- Document expiring: Reminder 30 days before expiry

**And** email notification entity:
- id (UUID)
- recipientEmail, recipientName
- notificationType (enum: all trigger types above)
- subject, body (HTML)
- entityType, entityId (link to related entity)
- status (enum: PENDING, SENT, FAILED, QUEUED)
- sentAt, failedAt timestamps
- failureReason (if failed)
- retryCount (max 3 attempts)
- createdAt timestamp

**And** email templates:
- HTML email templates for each notification type
- Templates include:
  - Company logo
  - Personalized greeting
  - Event details
  - Call-to-action button (e.g., "View Invoice", "Access Portal")
  - Footer with contact information
- Template variables: {{tenantName}}, {{invoiceNumber}}, {{amount}}, etc.
- Plain text fallback for email clients

**And** email sending:
- Asynchronous email sending using @Async
- Queue emails for batch processing (Spring @Scheduled task every 1 minute)
- Retry failed emails (max 3 attempts with exponential backoff)
- Log all email attempts (success/failure) for audit
- Track email delivery status

**And** notification preferences:
- System-level notification settings (admin configuration)
- Enable/disable specific notification types
- Configure notification frequency (immediate, daily digest, weekly digest)
- Default: all notifications enabled, immediate delivery

**And** API endpoints:
- POST /api/v1/notifications/send: Send immediate email
- GET /api/v1/notifications: List notification history
- GET /api/v1/notifications/{id}: Get notification details
- POST /api/v1/notifications/retry/{id}: Retry failed notification
- GET /api/v1/notifications/settings: Get notification settings
- PUT /api/v1/notifications/settings: Update notification settings

**Prerequisites:** Story 2.3 (Password reset uses email)

**Technical Notes:**
- Use Spring Boot Mail Starter for email
- Configure Gmail API authentication (OAuth 2.0 or App Password)
- Store email templates in /resources/email-templates/ as HTML files
- Use Thymeleaf for template rendering with variable substitution
- Implement email queue using database table (email_notifications)
- Use @Async for non-blocking email sending
- Scheduled job processes queued emails every 1 minute
- Implement exponential backoff for retries (1 min, 5 min, 15 min)
- Add email attachments support (invoices, receipts, PDFs)
- Log all emails in email_log table for tracking
- Frontend: Admin UI to view email logs and resend failed emails
- Consider using AWS SES as alternative to Gmail (future enhancement)
- Add email preview feature (send test email)

### Story 9.2: Announcement Management

As a property manager,
I want to create and send announcements to tenants,
So that I can communicate important information to residents.

**Acceptance Criteria:**

**Given** I need to communicate with tenants
**When** I create an announcement
**Then** the announcement management includes:

**Announcement Creation:**
- Announcement form includes:
  - Title (required, max 200 chars)
  - Message (required, rich text editor, max 5000 chars)
  - Category (dropdown: GENERAL, MAINTENANCE, EMERGENCY, EVENT, POLICY_CHANGE, OTHER)
  - Priority (enum: HIGH, NORMAL, LOW)
  - Target audience (multi-select):
    - All tenants
    - Specific property (dropdown)
    - Specific tenants (multi-select)
  - Schedule delivery (date-time picker, default: immediate)
  - Attachment (optional, PDF, max 5MB, e.g., policy document)

**And** announcement entity:
- id (UUID), announcementNumber (unique, format: ANN-2025-0001)
- title, message (HTML), category, priority
- targetAudience (enum: ALL_TENANTS, SPECIFIC_PROPERTY, SPECIFIC_TENANTS)
- propertyIds (JSON array, if property-specific)
- tenantIds (JSON array, if tenant-specific)
- scheduledAt (datetime)
- status (enum: DRAFT, SCHEDULED, SENT, CANCELLED)
- sentAt timestamp
- attachmentFilePath (PDF stored in /uploads/announcements/)
- createdBy (userId)
- createdAt, updatedAt timestamps

**And** announcement delivery:
- If scheduled for future: status = SCHEDULED
  - Scheduled job checks for due announcements every 5 minutes
  - Send when scheduledAt <= now
- If immediate: status = SENT immediately
- Email sent to all recipients in target audience
- Email subject: "[Priority] Announcement: {title}"
- Email body: rendered message HTML with attachment link
- Track delivery: store email_notification records for each recipient

**And** announcement list page (for managers):
- Filters: category, priority, status, date range
- Search by: title, message
- Shows: announcement number, title, category, priority, target audience, scheduled date, status
- Quick actions: View, Edit (if draft), Cancel (if scheduled), Delete

**And** announcement view (for tenants):
- Tenant portal shows recent announcements (last 30 days)
- List shows: title, category, date, read/unread status
- Click to view full announcement
- Mark as read when viewed
- Download attachment if available
- Filter by category

**And** announcement read tracking:
- Track which tenants have read which announcements
- Entity: announcement_reads
  - announcementId, tenantId, readAt timestamp
- Show read count / total recipients on announcement detail page

**And** API endpoints:
- POST /api/v1/announcements: Create announcement
- GET /api/v1/announcements: List announcements (manager view)
- GET /api/v1/announcements/{id}: Get announcement details
- PUT /api/v1/announcements/{id}: Update announcement (if draft)
- PATCH /api/v1/announcements/{id}/send: Send immediately
- PATCH /api/v1/announcements/{id}/cancel: Cancel scheduled announcement
- DELETE /api/v1/announcements/{id}: Delete announcement
- GET /api/v1/tenant/announcements: List announcements for logged-in tenant
- POST /api/v1/tenant/announcements/{id}/mark-read: Mark as read

**Prerequisites:** Story 9.1 (Email notification system), Story 3.3 (Tenant portal)

**Technical Notes:**
- Use rich text editor (Quill or TinyMCE) for message formatting
- Sanitize HTML input to prevent XSS
- Store attachments in /uploads/announcements/
- Scheduled job (@Scheduled) runs every 5 minutes to check for due announcements
- Batch email sending for large recipient lists
- Track email delivery status per recipient
- Add database indexes on status, scheduledAt
- Frontend: Use shadcn/ui Badge for priority/category indicators
- Implement announcement preview before sending
- Add confirmation dialog for sending to all tenants
- Display recipient count before sending
- Optional: Add in-app notification banner for high-priority announcements

---

## FR Coverage Matrix

This section validates that ALL functional requirements from the PRD are covered by the epic and story breakdown.

| FR ID | Functional Requirement | Epic(s) | Story(ies) |
|-------|------------------------|---------|------------|
| **FR1** | User Authentication & Access Control with password recovery and role-based access | Epic 2 | Story 2.1, 2.2, 2.3, 2.4 |
| **FR2** | Executive and Operational Dashboards with KPIs, analytics, and real-time insights | Epic 8 | Story 8.1, 8.2 |
| **FR3** | Tenant Onboarding with lease terms, parking allocation, document upload, and email notifications (including pre-tenancy lead management and quotations) | Epic 3 | Story 3.1, 3.3 |
| **FR4** | Tenant Lifecycle Management including portal access, maintenance requests, payment history | Epic 3 | Story 3.4, 3.5 |
| **FR5** | Tenant Self-Service Portal for maintenance requests, document access, announcements | Epic 3, Epic 9 | Story 3.4, 3.5, 9.2 |
| **FR6** | Work Order Creation and Management with priority levels, photo attachments, assignment | Epic 4 | Story 4.1, 4.3 |
| **FR7** | Preventive Maintenance Scheduling with recurring schedules and automated generation | Epic 4 | Story 4.2 |
| **FR8** | Job Progress Tracking with status updates, time logging, photo uploads | Epic 4 | Story 4.4 |
| **FR9** | Vendor Registration and Profile Management with service categories, rates, documents | Epic 5 | Story 5.1, 5.2 |
| **FR10** | Vendor Document and License Management with expiry tracking and auto-suspension | Epic 5 | Story 5.2 |
| **FR11** | Vendor Performance Tracking with ratings, job completion metrics, rankings | Epic 5 | Story 5.3 |
| **FR12** | Revenue Management with rent invoicing, payment recording, overdue tracking | Epic 6 | Story 6.1 |
| **FR13** | Expense Management with vendor payments, work order cost tracking, batch processing | Epic 6 | Story 6.2 |
| **FR14** | PDC Management with registration, deposit tracking, bounce handling, replacement workflow | Epic 6 | Story 6.3 |
| **FR15** | Financial Reporting with P&L, cash flow, AR aging, revenue/expense breakdowns | Epic 6 | Story 6.4 |
| **FR16** | Asset Registry and Tracking with maintenance history, warranty tracking, document storage | Epic 7 | Story 7.1 |
| **FR17** | Document Management System with version control, expiry tracking, access control | Epic 7 | Story 7.2 |
| **FR18** | Compliance and Inspection Tracking with regulatory requirements, schedules, violations | Epic 7 | Story 7.3 |
| **FR19** | Parking Management integrated with tenant onboarding (Mulkiya upload, spot allocation) | Epic 3 | Story 3.2 |
| **FR20** | Email Notification System and Announcement Management for stakeholder communication | Epic 9 | Story 9.1, 9.2 |

**Coverage Summary:**
- **Total FRs:** 20
- **FRs Covered:** 20
- **Coverage Rate:** 100%

All functional requirements from the PRD have been decomposed into epics and stories with detailed acceptance criteria.

---

## Epic Breakdown Summary

### Epic 1: Platform Foundation
**Stories:** 5
**Focus:** Project setup, database, API structure, caching, core domain models
**Status:** Simplified per user feedback (local PostgreSQL, Ehcache, no CI/CD, no AWS initially)

### Epic 2: Authentication & User Management
**Stories:** 5
**Focus:** JWT authentication, RBAC, password recovery, session management, security
**Status:** Simplified (removed MFA, SSO, vendor role is basic)

### Epic 3: Tenant Management
**Stories:** 5
**Focus:** Lead management and quotations, property setup, tenant onboarding with parking/Mulkiya, tenant portal, maintenance requests
**Status:** Revised (added leads and quotations feature, parking optional, physical documents, email-only notifications, photos only)

### Epic 4: Maintenance Operations
**Stories:** 4
**Focus:** Work orders, preventive maintenance, vendor assignment, progress tracking
**Status:** Significantly simplified (removed task checklists, effectiveness metrics, vendor portal, auto-assignment, quality inspection, detailed time logging)

### Epic 5: Vendor Management
**Stories:** 3
**Focus:** Vendor registration, document/license management, performance tracking
**Status:** Simplified approach without vendor portal

### Epic 6: Financial Management
**Stories:** 4
**Focus:** Rent invoicing, payments, expenses, PDC management, financial reporting
**Status:** Comprehensive with automated invoicing and PDC workflows

### Epic 7: Asset & Compliance Management
**Stories:** 3
**Focus:** Asset registry, document management, compliance/inspection tracking
**Status:** Integrated asset tracking with maintenance work orders

### Epic 8: Dashboard & Reporting
**Stories:** 2
**Focus:** Executive dashboard, role-specific operational dashboards
**Status:** Comprehensive KPIs and analytics across all modules

### Epic 9: Communication & Notifications
**Stories:** 2
**Focus:** Email notification system, announcement management
**Status:** Email-only as per user requirements (no SMS, no push)

**Total Stories:** 33 stories across 9 epics

---

## Implementation Notes

### Key Simplifications Made
Based on user feedback, the following simplifications were applied:

1. **Infrastructure:** Local PostgreSQL instead of RDS, Ehcache instead of Redis, no load balancer
2. **Authentication:** No MFA, no SSO implementation
3. **Tenant Management:** Physical documents (no digital signatures), email-only notifications, parking Mulkiya as single document
4. **Maintenance:** Removed vendor portal, auto-assignment rules, vendor acceptance workflow, quality inspection, detailed time tracking with start/end times, task checklists, effectiveness metrics
5. **Communication:** Email-only (no SMS, no push notifications)

### Technology Stack Summary
- **Frontend:** Next.js 14+, TypeScript, shadcn/ui, Tailwind CSS, React Hook Form, Zod
- **Backend:** Java 17, Spring Boot 3.x, Maven, Spring Security, Spring Data JPA
- **Database:** PostgreSQL 15+ (local for development)
- **Caching:** Ehcache 3.x
- **Email:** Gmail API
- **Deployment:** Monolithic application (AWS UAE deferred to final phase)
- **Timezone:** All system dates and times in UAE timezone (Gulf Standard Time - GST, UTC+4)

### Story Characteristics
- **Vertically sliced:** Each story delivers complete functionality
- **Sequentially ordered:** No forward dependencies
- **BDD acceptance criteria:** Given/When/Then/And format throughout
- **Implementation-ready:** Detailed technical notes and prerequisites for each story

### Next Steps in BMad Method
1. **UX Design Workflow:** Add interaction details to story acceptance criteria
2. **Architecture Workflow:** Add technical decisions and data models to story technical notes
3. **Phase 4 Implementation:** Execute stories with full context from PRD + epics + UX + Architecture

---

**Document Generated:** November 2025
**Project:** Ultra BMS - Building Maintenance Software Platform
**Method:** BMad Method - Epic and Story Decomposition Workflow
**Status:** ✅ Complete - Ready for UX Design Workflow

---
