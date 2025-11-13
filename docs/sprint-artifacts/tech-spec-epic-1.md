# Epic Technical Specification: Platform Foundation & Infrastructure

Date: 2025-11-13
Author: Nata
Epic ID: 1
Status: Draft

---

## Overview

Epic 1 establishes the foundational infrastructure for the Ultra BMS application by initializing a monolithic architecture with Spring Boot backend and Next.js frontend. This epic creates the local development environment, database configuration, in-memory caching layer, core domain models, and standardized REST API patterns. The goal is to provide a solid, maintainable foundation that all subsequent features will build upon, ensuring consistency in development practices and architecture.

This epic delivers a fully functional local development setup with hot-reload capabilities, automated code quality checks, and basic API infrastructure. AWS deployment and cloud services will be implemented in later phases, keeping this epic focused on rapid local development iteration.

## Objectives and Scope

**In Scope:**
- Monorepo initialization with backend (Spring Boot 3 + Java 17) and frontend (Next.js 15 + TypeScript)
- Local PostgreSQL database setup with Hibernate auto-schema generation
- Ehcache configuration for application-level caching (no distributed cache)
- Core JPA entities: User, Property, Unit with relationships and auditing
- REST API foundation with global exception handling and CORS configuration
- Code quality tooling: ESLint, Prettier, Checkstyle, pre-commit hooks
- API documentation with SpringDoc OpenAPI (Swagger UI)
- Docker Compose configuration for local PostgreSQL
- Developer documentation for local setup

**Out of Scope:**
- AWS infrastructure deployment (planned for later phase)
- CI/CD pipelines (planned for later phase)
- Redis or distributed caching (using Ehcache only)
- Authentication and authorization (covered in Epic 2)
- Frontend UI components beyond basic structure (implemented per-module)
- Message queues or async processing infrastructure (added as needed)
- Monitoring and logging infrastructure (added in later phase)

## System Architecture Alignment

**Backend Architecture:**
- Follows Spring Boot best practices with layered architecture: Controller → Service → Repository → Entity
- Uses Spring Data JPA with Hibernate for ORM, PostgreSQL as RDBMS
- Implements dependency injection via constructor injection (no field injection)
- Leverages Spring Cache abstraction with Ehcache provider for performance optimization
- Adopts RESTful API design with /api/v1 versioning strategy

**Frontend Architecture:**
- Uses Next.js 15 App Router with Server Components as default rendering strategy
- Implements shadcn/ui component library built on Radix UI primitives for accessibility
- Adopts Tailwind CSS utility-first styling with dark theme as default
- Configures TypeScript strict mode for type safety
- Separates frontend (port 3000) from backend (port 8080) with CORS-enabled API calls

**Alignment with PRD:**
- Section 5.1 (System Architecture): Implements specified Spring Boot + Next.js + PostgreSQL stack
- Section 5.3 (Infrastructure): Establishes local-first development with cloud migration path
- Section 4.2 (UI Components): Initializes shadcn/ui and Tailwind CSS as mandated

**Alignment with Architecture Document:**
- Implements Decision Summary table: Java 17, Spring Boot 3, Next.js 15, PostgreSQL, Ehcache
- Follows Project Structure section: Monorepo with backend/ and frontend/ separation
- Adopts Implementation Patterns: Naming conventions, controller patterns, service patterns, repository patterns

## Detailed Design

### Services and Modules

| Service/Module | Responsibility | Key Components | Inputs/Outputs | Owner |
|----------------|----------------|----------------|----------------|-------|
| **Project Initialization** | Bootstrap monorepo with tooling | Spring Initializr, create-next-app, shadcn init | None → Initialized repo structure | Story 1.1 |
| **Database Service** | PostgreSQL connection management | HikariCP pool, Spring Data JPA config | application.yml → DB connection | Story 1.2 |
| **Cache Service** | In-memory caching layer | Ehcache 3.x, Spring Cache abstraction | Cache configs → Cache regions | Story 1.3 |
| **Entity Layer** | Domain model definition | User, Property, Unit entities with JPA | None → Database schema | Story 1.4 |
| **API Foundation** | REST endpoint structure | Controllers, DTOs, Exception handlers | HTTP requests → JSON responses | Story 1.5 |

### Data Models and Contracts

**User Entity:**
```java
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(generator = "UUID")
    private UUID id;

    @Column(nullable = false, unique = true, length = 255)
    @Email
    private String email;

    @Column(nullable = false)
    @JsonIgnore
    private String passwordHash; // BCrypt hashed

    @Column(nullable = false, length = 100)
    private String firstName;

    @Column(nullable = false, length = 100)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role; // SUPER_ADMIN, PROPERTY_MANAGER, MAINTENANCE_SUPERVISOR, FINANCE_MANAGER, TENANT, VENDOR

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false)
    private Boolean mfaEnabled = false;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
```

**Property Entity:**
```java
@Entity
@Table(name = "properties")
@Data
public class Property {
    @Id
    @GeneratedValue(generator = "UUID")
    private UUID id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 500)
    private String address;

    @Enumerated(EnumType.STRING)
    private PropertyType type; // RESIDENTIAL, COMMERCIAL, MIXED_USE

    private Integer totalUnits;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
```

**Unit Entity:**
```java
@Entity
@Table(name = "units")
@Data
public class Unit {
    @Id
    @GeneratedValue(generator = "UUID")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @Column(nullable = false, length = 50)
    private String unitNumber;

    private Integer floor;
    private Integer bedroomCount;
    private Integer bathroomCount;

    @Column(precision = 10, scale = 2)
    private BigDecimal squareFootage;

    @Enumerated(EnumType.STRING)
    private UnitStatus status; // AVAILABLE, OCCUPIED, UNDER_MAINTENANCE

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
```

**Database Indexes:**
- `users.email` (unique index for fast lookup)
- `units.property_id` (foreign key index)
- `properties.manager_id` (foreign key index)

**Relationships:**
- Property → User (Many-to-One): manager relationship
- Unit → Property (Many-to-One): property assignment

### APIs and Interfaces

**Health Check API:**
- `GET /api/health` → `{ "status": "UP", "timestamp": "2025-11-13T10:00:00Z" }`
- `GET /api/info` → `{ "version": "1.0.0", "build": "2025-11-13" }`

**Error Response Contract:**
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

**Pagination Contract:**
- Query parameters: `page` (0-indexed), `size` (default 20), `sort` (e.g., `createdAt,desc`)
- Response wrapper:
```json
{
  "content": [],
  "pageable": { "pageNumber": 0, "pageSize": 20 },
  "totalElements": 100,
  "totalPages": 5
}
```

**CORS Configuration:**
- Allowed origins: `http://localhost:3000` (Next.js dev server)
- Allowed methods: `GET, POST, PUT, DELETE, PATCH, OPTIONS`
- Allowed headers: `Content-Type, Authorization, X-Requested-With`
- Allow credentials: `true` (for cookie-based auth)

### Workflows and Sequencing

**Story 1.1 → 1.2 → 1.3 → 1.4 → 1.5 (Sequential Dependency Chain):**

1. **Story 1.1 (Project Init):** Developer runs Spring Initializr → creates backend/ → runs create-next-app → creates frontend/ → initializes shadcn/ui → commits initial structure
2. **Story 1.2 (Database):** Developer starts PostgreSQL via Docker Compose → configures application.yml with datasource → Spring Boot connects on startup → Hibernate validates schema
3. **Story 1.3 (Caching):** Developer adds Ehcache dependency → creates ehcache.xml → enables @EnableCaching → cache regions initialized
4. **Story 1.4 (Entities):** Developer defines User, Property, Unit entities → annotates with JPA → Hibernate auto-generates DDL → creates repositories
5. **Story 1.5 (API):** Developer creates @RestControllerAdvice → implements exception handlers → defines /api/health endpoint → configures CORS → Swagger UI accessible

**Development Workflow:**
- Developer clones repo → runs `docker-compose up -d` → starts backend (`./mvnw spring-boot:run`) → starts frontend (`npm run dev`) → accesses http://localhost:3000

## Non-Functional Requirements

### Performance

**Response Time:**
- Health check API: < 50ms (in-memory response)
- Database connection initialization: < 2 seconds on app startup
- Ehcache hit rate: > 80% for cached entities after warm-up

**Throughput:**
- Local dev environment: Support 50+ concurrent requests (Tomcat default thread pool)
- Database connections: HikariCP pool size = 10 connections (sufficient for local dev)

**Caching:**
- Heap memory allocation: 100 MB max for all cache regions
- Cache eviction: LRU (Least Recently Used) when capacity reached
- TTL ranges: 30 minutes (users) to 12 hours (lookup data)

### Security

**Authentication/Authorization:**
- Deferred to Epic 2 (Spring Security + JWT)
- Password storage: BCrypt with strength factor 12 (Epic 2)
- Session management: Stateless JWT (Epic 2)

**Data Protection:**
- Sensitive fields: `@JsonIgnore` on User.passwordHash to prevent accidental exposure
- SQL Injection: Prevented by parameterized queries (Spring Data JPA)
- CORS: Restricted to localhost:3000 for dev, configurable for production

**Audit Logging:**
- JPA Auditing: Tracks createdAt, updatedAt for all entities
- AuditorAware: Captures created/modified by user (configured in Epic 2)

### Reliability/Availability

**Local Development:**
- Application startup: < 15 seconds (Spring Boot + Next.js)
- Hot reload: < 2 seconds for code changes
- Database restart recovery: Automatic reconnection via HikariCP

**Error Handling:**
- Global exception handler prevents 500 errors from leaking stack traces
- Hibernate schema validation fails fast on entity-model mismatch
- Database connection failures logged with actionable error messages

**Data Integrity:**
- Optimistic locking: @Version annotation prevents concurrent update conflicts
- Foreign key constraints: Enforced at database level
- NOT NULL constraints: Enforced via JPA validation and database schema

### Observability

**Logging:**
- Framework: SLF4J + Logback (Spring Boot default)
- Levels: DEBUG for dev, INFO for production
- SQL logging: Enabled in dev (`spring.jpa.show-sql=true`)
- Log format: `[timestamp] [level] [class] [method] - message`

**Monitoring:**
- Spring Boot Actuator endpoints: `/actuator/health`, `/actuator/info`, `/actuator/caches`
- Cache statistics: Hit/miss ratios exposed via JMX beans
- Database connection pool metrics: HikariCP exposes via Actuator

**Debugging:**
- Correlation IDs: Generated per request for end-to-end tracing
- Request/response logging: Implemented via Spring interceptors
- Swagger UI: Available at `/swagger-ui.html` for API testing

## Dependencies and Integrations

### Backend Dependencies (Maven)

**Core Framework:**
- `org.springframework.boot:spring-boot-starter-web:3.4.7` (REST API)
- `org.springframework.boot:spring-boot-starter-data-jpa:3.4.7` (ORM)
- `org.springframework.boot:spring-boot-starter-validation:3.4.7` (Bean Validation)
- `org.springframework.boot:spring-boot-starter-cache:3.4.7` (Caching abstraction)

**Database:**
- `org.postgresql:postgresql:42.7.4` (PostgreSQL driver)
- `com.zaxxer:HikariCP:5.1.0` (Connection pooling, included in Spring Boot)

**Caching:**
- `org.ehcache:ehcache:3.10.8` (In-memory cache provider)
- `javax.cache:cache-api:1.1.1` (JSR-107 JCache API)

**Utilities:**
- `org.projectlombok:lombok:1.18.36` (Boilerplate reduction)
- `org.mapstruct:mapstruct:1.6.3` (DTO mapping, added in later stories)

**API Documentation:**
- `org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.4` (Swagger UI)

**Testing:**
- `org.springframework.boot:spring-boot-starter-test:3.4.7` (JUnit 5, Mockito, AssertJ)
- `com.h2database:h2:2.2.224` (In-memory DB for unit tests)

### Frontend Dependencies (npm)

**Core Framework:**
- `next@15.5.0` (React framework with SSR)
- `react@19.2.0` & `react-dom@19.2.0` (UI library)
- `typescript@5.8.0` (Type safety)

**UI Components:**
- `@radix-ui/*` (Accessible primitives, installed via shadcn)
- `tailwindcss@4.0.0` (Utility-first CSS)
- `lucide-react@latest` (Icon library)

**Forms & Validation:**
- `react-hook-form@7.54.2` (Form state management)
- `zod@3.24.1` (Schema validation)
- `@hookform/resolvers@3.10.0` (Form + Zod integration)

**Data Visualization:**
- `recharts@2.15.0` (Charting library)

**HTTP Client:**
- `axios@1.7.9` (API communication)

**Development Tools:**
- `eslint@9.20.0` & `prettier@3.5.1` (Code formatting)
- `husky@9.1.7` (Git hooks)
- `lint-staged@15.3.0` (Pre-commit checks)

### Infrastructure Dependencies

**Docker Compose:**
- `postgres:15-alpine` (PostgreSQL container for local dev)

**Version Control:**
- Git with .editorconfig for consistent formatting

### Integration Points

**Backend ↔ Frontend:**
- HTTP/REST over localhost (backend :8080, frontend :3000)
- CORS enabled for cross-origin requests
- JSON as data interchange format

**Backend ↔ Database:**
- JDBC connection via HikariCP pool
- Hibernate ORM for object-relational mapping
- DDL auto-generation in dev (`hibernate.ddl-auto=update`)

**Future Integrations (Out of Scope for Epic 1):**
- AWS RDS (PostgreSQL in cloud)
- AWS S3 (File storage)
- Gmail API (Email sending)
- Twilio (SMS notifications)

## Acceptance Criteria (Authoritative)

**AC1:** Monorepo initialized with backend/ (Spring Boot 3 + Java 17 + Maven) and frontend/ (Next.js 15 + TypeScript + shadcn/ui) directories, with README.md documenting local setup.

**AC2:** Frontend dev server runs on port 3000 with hot-reload, backend runs on port 8080, CORS allows localhost:3000 origin.

**AC3:** PostgreSQL 15+ runs locally via Docker Compose with database `ultra_bms_dev`, user `ultra_bms_user`, accessible on port 5432.

**AC4:** Spring Boot connects to PostgreSQL with HikariCP pool (max 10 connections), Hibernate auto-generates schema via `ddl-auto=update`.

**AC5:** Ehcache configured with 5 cache regions (userCache, sessionCache, tenantCache, propertyCache, lookupCache) with TTL and LRU eviction.

**AC6:** User, Property, Unit entities created with JPA annotations, UUID primary keys, audit fields (createdAt, updatedAt), and foreign key relationships.

**AC7:** UserRepository, PropertyRepository, UnitRepository extend JpaRepository with standard CRUD methods.

**AC8:** Global exception handler (@RestControllerAdvice) returns standardized error JSON with timestamp, status, message, path, requestId.

**AC9:** Health check API at /api/health returns { "status": "UP" }, Swagger UI accessible at /swagger-ui.html.

**AC10:** Code quality tools configured: ESLint + Prettier (frontend), Checkstyle (backend), pre-commit hooks via Husky.

## Traceability Mapping

| AC | Spec Section | Components/APIs | Test Idea |
|----|--------------|-----------------|-----------|
| AC1 | Project Structure | Monorepo directories, pom.xml, package.json | Verify directory structure exists, build succeeds |
| AC2 | CORS Configuration | CorsConfig.java, Next.js dev server | Start both servers, fetch from frontend to backend |
| AC3 | Database Setup | docker-compose.yml, PostgreSQL container | Connect via psql, verify database and user exist |
| AC4 | Data Models | application.yml, HikariCP, Hibernate | App starts without errors, tables auto-created |
| AC5 | Caching | ehcache.xml, @EnableCaching | Cache stats show entries, hit/miss metrics |
| AC6 | Entity Layer | User.java, Property.java, Unit.java | Unit tests for entity creation and relationships |
| AC7 | Repository Layer | UserRepository, PropertyRepository, UnitRepository | Integration tests for CRUD operations |
| AC8 | Exception Handling | GlobalExceptionHandler.java | Trigger 404/400/500, verify JSON format |
| AC9 | API Foundation | HealthController, SpringDoc config | GET /api/health returns 200, Swagger UI loads |
| AC10 | Code Quality | .eslintrc, .prettierrc, checkstyle.xml | Pre-commit hook rejects unformatted code |

## Risks, Assumptions, Open Questions

**Risks:**
- R1: PostgreSQL installation issues on developer machines (Windows/Mac/Linux variations)
  - **Mitigation:** Provide Docker Compose as default option, document native installation as fallback
- R2: Ehcache memory limits may be insufficient for large datasets in later stories
  - **Mitigation:** Monitor cache hit rates, increase heap allocation or switch to tiered storage if needed
- R3: Hibernate DDL auto-generation may cause schema drift in production
  - **Mitigation:** Use `ddl-auto=validate` in production, introduce Flyway for controlled migrations in later phase
- R4: CORS misconfiguration could block legitimate API requests
  - **Mitigation:** Document CORS setup clearly, provide testing steps in README

**Assumptions:**
- A1: Developers have Java 17+ JDK installed or will install via SDKMAN/Homebrew
- A2: Developers have Node.js 20+ LTS installed for Next.js
- A3: Docker Desktop is available for running PostgreSQL container
- A4: Internet access is available for downloading Maven/npm dependencies
- A5: Git is installed for version control and pre-commit hooks

**Open Questions:**
- Q1: Should we use Flyway migrations from the start or defer until production deployment?
  - **Answer:** Defer to later phase. Hibernate DDL auto-generation is sufficient for rapid local development. Introduce Flyway when deploying to staging/production environments where schema control is critical.
- Q2: Should we implement request rate limiting in Epic 1?
  - **Answer:** No. Rate limiting is a security/performance concern for production. Add in later phase with Spring AOP or API Gateway when deploying to AWS.
- Q3: Should we set up integration tests with TestContainers in Epic 1?
  - **Answer:** Optional. If time permits, add TestContainers for repository layer tests. Otherwise, defer to Epic 2 when authentication logic requires robust integration testing.

## Test Strategy Summary

**Unit Testing:**
- **Backend:** JUnit 5 + Mockito for service layer, repository layer (using H2 in-memory DB)
  - Example: UserServiceTest mocks UserRepository to test business logic
  - Example: UserRepositoryTest uses H2 to verify CRUD operations
- **Frontend:** Vitest + React Testing Library for component unit tests
  - Example: Test shadcn Button component renders correctly
- **Coverage Target:** 70% line coverage for Epic 1 (foundation code)

**Integration Testing:**
- **Backend:** TestContainers with PostgreSQL for repository integration tests (optional in Epic 1)
  - Example: Verify User entity persists to real PostgreSQL container
- **Frontend:** Not applicable in Epic 1 (no UI components beyond structure)

**Manual Testing:**
- **API Testing:** Use Swagger UI at /swagger-ui.html to test health endpoint
- **Database Testing:** Use psql or DBeaver to verify schema generation
- **Cache Testing:** Monitor /actuator/caches endpoint for cache statistics
- **Build Testing:** Run `mvn clean install` (backend) and `npm run build` (frontend) to verify builds

**Test Levels:**
- **L1 (Unit):** Individual methods in services and repositories
- **L2 (Integration):** API endpoints + database interactions
- **L3 (System):** End-to-end flow (deferred to Epic 2 with authentication)

**Frameworks:**
- Backend: JUnit 5, Mockito, AssertJ, TestContainers (optional)
- Frontend: Vitest, React Testing Library
- API: Swagger UI for manual testing

**Edge Cases:**
- Database connection failures: Verify HikariCP reconnects automatically
- Cache eviction: Fill cache beyond capacity, verify LRU eviction
- Invalid entity creation: Test validation annotations throw ConstraintViolationException
- Concurrent updates: Test @Version optimistic locking prevents lost updates
