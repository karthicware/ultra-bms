# Story 1.2: Local PostgreSQL Database Setup

Status: ready_for_dev

## Story

As a backend developer,
I want a local PostgreSQL database configured for development,
so that I can develop and test database operations without cloud dependencies.

## Acceptance Criteria

1. **AC1 - PostgreSQL Installation:** PostgreSQL 15+ running locally with database name `ultra_bms_dev`, username `ultra_bms_user`, password configured via environment variable or application.yml, accessible on port 5432 (default).

2. **AC2 - Spring Boot Database Configuration:** Spring Boot configured with:
   - `spring.datasource.url=jdbc:postgresql://localhost:5432/ultra_bms_dev`
   - `spring.datasource.username` from configuration
   - `spring.datasource.password` from configuration or environment
   - `spring.jpa.hibernate.ddl-auto=update` for dev (creates/updates schema automatically)
   - `spring.jpa.show-sql=true` for dev (log SQL statements)
   - `spring.jpa.properties.hibernate.format_sql=true` for formatted SQL output
   - HikariCP connection pool with max 10 connections

3. **AC3 - Docker Compose Configuration:** docker-compose.yml includes PostgreSQL 15-alpine service with database `ultra_bms_dev`, user `ultra_bms_user`, port 5432, persistent volume for data.

4. **AC4 - Database Initialization:** Optional data.sql for seed data, schema.sql for initial schema (Hibernate can auto-generate), Flyway or Liquibase consideration documented for future use.

5. **AC5 - Documentation:** README.md documents PostgreSQL installation for Windows/Mac/Linux, docker-compose usage, manual database creation steps, connection string format, and access via psql or GUI tools (pgAdmin, DBeaver).

6. **AC6 - Connection Verification:** Application starts successfully, connects to PostgreSQL, logs connection pool initialization, and can be verified via actuator health endpoint showing database UP status.

## Tasks / Subtasks

- [ ] **Task 1: Configure Docker Compose for PostgreSQL** (AC: #3)
  - [ ] Create or update docker-compose.yml in project root
  - [ ] Define PostgreSQL 15-alpine service with environment variables (POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD)
  - [ ] Map port 5432:5432 for local access
  - [ ] Configure persistent volume mount: postgres_data:/var/lib/postgresql/data
  - [ ] Add container name: ultra-bms-postgres
  - [ ] Test: Run `docker-compose up -d` and verify container starts successfully

- [ ] **Task 2: Configure Spring Boot Database Connection** (AC: #2)
  - [ ] Update backend/src/main/resources/application-dev.yml with datasource configuration
  - [ ] Set `spring.datasource.url=jdbc:postgresql://localhost:5432/ultra_bms_dev`
  - [ ] Set `spring.datasource.username=ultra_bms_user`
  - [ ] Set `spring.datasource.password` (use placeholder or environment variable reference)
  - [ ] Configure `spring.jpa.hibernate.ddl-auto=update` for automatic schema management
  - [ ] Enable SQL logging: `spring.jpa.show-sql=true` and `spring.jpa.properties.hibernate.format_sql=true`
  - [ ] Configure HikariCP pool: `spring.datasource.hikari.maximum-pool-size=10`
  - [ ] Add PostgreSQL driver dependency to pom.xml if not already present (should be from Story 1.1)

- [ ] **Task 3: Create Environment Configuration Template** (AC: #2, #5)
  - [ ] Create .env.example file at project root with database credentials template
  - [ ] Document environment variables: DB_USERNAME, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME
  - [ ] Add .env to .gitignore (should already be there from Story 1.1)
  - [ ] Update application-dev.yml to reference environment variables using ${DB_PASSWORD:default_password} syntax
  - [ ] Document in README how to create local .env file from .env.example

- [ ] **Task 4: Setup Database Initialization Scripts** (AC: #4)
  - [ ] Create backend/src/main/resources/db/ directory
  - [ ] Create schema.sql (optional, for explicit DDL if needed, note that Hibernate can auto-generate)
  - [ ] Create data.sql (optional, for seed data like initial admin user - defer to Epic 2)
  - [ ] Document Flyway/Liquibase integration plan for future production migrations
  - [ ] Configure `spring.jpa.hibernate.ddl-auto` strategy documentation:
    - `update` for dev (auto-updates schema)
    - `validate` for production (only validates, doesn't modify)
    - Future: Introduce Flyway for versioned migrations before production deployment

- [ ] **Task 5: Update README with PostgreSQL Setup Instructions** (AC: #5)
  - [ ] Add "Database Setup" section to README.md
  - [ ] Document Docker Compose approach (recommended):
    - Prerequisites: Docker Desktop installed
    - Command: `docker-compose up -d`
    - Verification: `docker ps` to see running container
  - [ ] Document native installation approach:
    - Windows: PostgreSQL installer or Chocolatey
    - Mac: Homebrew (`brew install postgresql@15`)
    - Linux: apt/yum package manager
  - [ ] Document manual database creation via psql:
    ```sql
    CREATE DATABASE ultra_bms_dev;
    CREATE USER ultra_bms_user WITH PASSWORD 'your_password';
    GRANT ALL PRIVILEGES ON DATABASE ultra_bms_dev TO ultra_bms_user;
    ```
  - [ ] Document connection string format: `jdbc:postgresql://localhost:5432/ultra_bms_dev`
  - [ ] Document GUI tools: pgAdmin, DBeaver, DataGrip for database exploration
  - [ ] Add troubleshooting section: Common connection errors and solutions

- [ ] **Task 6: Configure Actuator Health Check for Database** (AC: #6)
  - [ ] Verify Spring Boot Actuator dependency in pom.xml (should be from Story 1.1)
  - [ ] Configure `management.endpoint.health.show-details=always` in application-dev.yml
  - [ ] Enable database health indicator (enabled by default when datasource configured)
  - [ ] Test: Start application, access /actuator/health, verify "db" component shows "UP" status
  - [ ] Test: Stop PostgreSQL, restart app, verify health check shows "DOWN" and logs connection error

- [ ] **Task 7: Test Database Connection and Schema Generation** (AC: #1, #6)
  - [ ] Start PostgreSQL via docker-compose: `docker-compose up -d`
  - [ ] Verify PostgreSQL is running: `docker logs ultra-bms-postgres`
  - [ ] Start Spring Boot application: `cd backend && ./mvnw spring-boot:run`
  - [ ] Verify application logs show HikariCP pool initialization
  - [ ] Verify application logs show Hibernate schema creation/update (if entities exist from Story 1.4)
  - [ ] Access /actuator/health endpoint, confirm database status is UP
  - [ ] Connect to database via psql: `psql -h localhost -U ultra_bms_user -d ultra_bms_dev`
  - [ ] Verify schema exists: `\dt` to list tables (may be empty until Story 1.4 entities are added)
  - [ ] Test connection persistence: Stop and restart application, verify reconnection

- [ ] **Task 8: Configure HikariCP Connection Pool** (AC: #2)
  - [ ] Add HikariCP specific configuration to application-dev.yml:
    - `spring.datasource.hikari.maximum-pool-size=10` (sufficient for local dev)
    - `spring.datasource.hikari.minimum-idle=5` (keep 5 connections ready)
    - `spring.datasource.hikari.connection-timeout=30000` (30 seconds)
    - `spring.datasource.hikari.idle-timeout=600000` (10 minutes)
    - `spring.datasource.hikari.max-lifetime=1800000` (30 minutes)
  - [ ] Enable HikariCP metrics via Actuator
  - [ ] Test: Monitor connection pool via /actuator/metrics endpoints
  - [ ] Document connection pool sizing strategy for different environments (dev: 10, staging: 20, prod: 50+)

## Dev Notes

### Architecture Alignment

This story implements database connectivity as specified in the Architecture Document and Tech Spec for Epic 1:

**Database Configuration:**
- PostgreSQL 15+ as RDBMS (Decision Summary: Database)
- HikariCP for connection pooling (Decision Summary: Default with Spring Boot)
- Spring Data JPA with Hibernate for ORM (Decision Summary: ORM)
- Database naming: snake_case for tables/columns (Consistency Rules: Database Naming)

**Development Strategy:**
- Local-first development with docker-compose for consistency across developer machines
- Hibernate DDL auto-generation (`ddl-auto=update`) for rapid iteration in development
- Future migration to AWS RDS with minimal configuration changes (Infrastructure section)
- Flyway migrations planned for production schema management (Tech Spec: Open Questions)

**Connection Pool Configuration:**
- HikariCP (Spring Boot default) with 10 max connections for local development
- Sufficient for single-developer workload with typical CRUD operations
- Production will scale to 50+ connections based on load (Performance Considerations)

### Project Structure Notes

**Database Configuration Files:**
```
backend/
├── src/main/resources/
│   ├── application.yml (shared config)
│   ├── application-dev.yml (dev-specific database config)
│   ├── application-prod.yml (production config, created later)
│   └── db/
│       ├── schema.sql (optional, Hibernate can generate)
│       └── data.sql (optional seed data)
├── pom.xml (includes PostgreSQL driver)
```

**Docker Compose:**
```
ultra-bms/
├── docker-compose.yml (PostgreSQL service definition)
└── .env (local credentials, gitignored)
```

### Learnings from Previous Story

**From Story 1-1-project-initialization-and-repository-structure (Status: done):**

The previous story established the foundational project structure:

- **Monorepo Structure:** backend/ and frontend/ directories initialized with build tools configured
- **Backend Stack:** Spring Boot 3.4.7 + Java 17 + Maven with Spring Web, Data JPA, PostgreSQL driver, Validation, Security, Cache, Actuator dependencies
- **Package Structure:** com.ultrabms.{config, controller, service, repository, entity, dto, mapper, exception, security, util} created
- **Configuration Files:** application.yml and application-dev.yml templates created
- **Development Ports:** Backend on 8080, frontend on 3000, CORS configured
- **Code Quality:** ESLint, Prettier, Checkstyle, Husky pre-commit hooks set up

**Key Takeaway:** The project structure and dependencies from Story 1.1 provide the foundation for database integration. This story builds on that by configuring the actual database connection that will be used by JPA repositories and entities in upcoming stories.

[Source: docs/sprint-artifacts/1-1-project-initialization-and-repository-structure.md]

### Testing Strategy

- **Configuration Testing:** Verify application.yml values are correctly loaded via ConfigurationProperties
- **Connection Testing:** Use Actuator health endpoint to verify database connectivity
- **Integration Testing:** Defer full integration tests to Story 1.4 when entities exist to persist
- **Manual Testing:** Connect via psql/pgAdmin to verify database creation and schema

**Test Levels:**
- **L1 (Unit):** Not applicable for database setup story
- **L2 (Integration):** Verify Spring Boot can connect to PostgreSQL and initialize connection pool
- **L3 (Manual):** Developer runs docker-compose, starts application, confirms no connection errors

### Implementation Notes

1. **Docker Compose PostgreSQL Service:**
```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: ultra-bms-postgres
    environment:
      POSTGRES_DB: ultra_bms_dev
      POSTGRES_USER: ultra_bms_user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-dev_password}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ultra_bms_user -d ultra_bms_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

2. **Spring Boot Database Configuration (application-dev.yml):**
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/ultra_bms_dev
    username: ${DB_USERNAME:ultra_bms_user}
    password: ${DB_PASSWORD:dev_password}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000

  jpa:
    hibernate:
      ddl-auto: update # Auto-creates/updates schema in dev
    show-sql: true # Log all SQL statements
    properties:
      hibernate:
        format_sql: true # Format SQL for readability
        dialect: org.hibernate.dialect.PostgreSQLDialect

management:
  endpoint:
    health:
      show-details: always # Show database health status
```

3. **Environment Variables (.env.example):**
```
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ultra_bms_dev
DB_USERNAME=ultra_bms_user
DB_PASSWORD=your_secure_password_here
```

4. **Manual Database Creation via psql:**
```bash
# Connect to PostgreSQL
psql -h localhost -U postgres

# Create database and user
CREATE DATABASE ultra_bms_dev;
CREATE USER ultra_bms_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ultra_bms_dev TO ultra_bms_user;

# Connect to new database
\c ultra_bms_dev

# Verify connection
\dt
```

### Risks and Mitigations

- **R1:** Developers may have different PostgreSQL versions or configurations
  - **Mitigation:** Standardize on docker-compose to ensure consistent PostgreSQL 15 environment
- **R2:** Connection pool exhaustion if too many simultaneous requests
  - **Mitigation:** Set reasonable pool size (10 for dev), monitor via Actuator, adjust in production
- **R3:** Hibernate DDL auto-generation may cause unintended schema changes
  - **Mitigation:** Use `ddl-auto=update` carefully, review generated DDL in logs, introduce Flyway before production
- **R4:** Database credentials may be committed to Git
  - **Mitigation:** Use .env file (gitignored), document environment variable usage, never commit passwords in YAML
- **R5:** PostgreSQL may not start on some machines due to port conflicts
  - **Mitigation:** Document how to change default port in docker-compose.yml and application.yml

### References

- [Tech Spec Epic 1: Database Service](docs/sprint-artifacts/tech-spec-epic-1.md#services-and-modules)
- [Tech Spec Epic 1: Dependencies - Backend](docs/sprint-artifacts/tech-spec-epic-1.md#backend-dependencies-maven)
- [Architecture: Data Architecture - Database Schema Overview](docs/architecture.md#data-architecture)
- [Architecture: Performance Considerations - Database Optimization](docs/architecture.md#database-optimization)
- [Architecture: Consistency Rules - Database Naming](docs/architecture.md#database-naming)
- [Epics: Story 1.2](docs/epics.md#story-12-local-postgresql-database-setup)
- [PRD: Technical Architecture - Database](docs/prd.md#51-system-architecture)

## Dev Agent Record

### Context Reference

**Story Context XML Generated:** 2025-11-13

Location: `stories/1-2-local-postgresql-database-setup-context.xml`

The comprehensive Story Context document includes:
- Complete acceptance criteria and task breakdown
- Relevant excerpts from PRD, Tech Spec, Architecture, and Epics
- Analysis of existing codebase (docker-compose.yml, application-dev.yml, pom.xml)
- Detailed implementation guidance with 6 prioritized tasks
- Gap analysis: Configuration 80% complete, documentation needs expansion
- Testing strategy with 6 manual and automated test scenarios
- Acceptance criteria validation and Definition of Done checklist

**Key Findings:**
- Most database configuration already exists from Story 1.1
- Primary work needed: HikariCP tuning, Hibernate dialect, README documentation
- Docker Compose PostgreSQL service fully configured (postgres:17.6-alpine)
- Verification testing required to confirm connectivity

### Agent Model Used

<!-- Will be populated by dev agent -->

### Debug Log References

<!-- Will be populated by dev agent during implementation -->

### Completion Notes List

<!-- Will be populated by dev agent after story completion -->

### File List

<!-- Will be populated by dev agent tracking all file changes -->
