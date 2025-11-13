# Story 1.1: Project Initialization and Repository Structure

Status: done

## Story

As a developer,
I want a standardized monolithic project structure with build tooling configured,
so that I can develop features with consistent patterns and automated quality checks.

## Acceptance Criteria

1. **AC1 - Monorepo Structure:** Monorepo initialized with `backend/` (Spring Boot 3 + Java 17 + Maven) and `frontend/` (Next.js 15 + TypeScript + shadcn/ui) directories, with shared `.editorconfig` and `.gitignore` files, plus `README.md` documenting local setup.

2. **AC2 - Frontend Dependencies:** Frontend includes Next.js 14+ with App Router, TypeScript 5+, shadcn/ui component library, Tailwind CSS 4+ (dark theme default), React Hook Form + Zod, Recharts, Lucide React, and Axios.

3. **AC3 - Backend Dependencies:** Backend includes Spring Boot 3.x (Web, Data JPA, Security, Validation, Cache), PostgreSQL driver, Ehcache 3.x, Lombok, MapStruct, SpringDoc OpenAPI, and BCrypt support.

4. **AC4 - Code Quality Tools:** ESLint + Prettier configured for frontend, Checkstyle for backend, pre-commit hooks via Husky for format checking.

5. **AC5 - Development Configuration:** Frontend dev server runs on port 3000, backend on port 8080, CORS enabled for localhost:3000, hot reload enabled for both, Next.js configured as frontend-only (no API routes).

6. **AC6 - Build Verification:** Both frontend (`npm run build`) and backend (`./mvnw clean install`) build successfully without errors.

## Tasks / Subtasks

- [x] **Task 1: Initialize Backend Project** (AC: #1, #3)
  - [x] Run Spring Initializr with Java 17, Spring Boot 3.4.7, Maven, dependencies: web, data-jpa, postgresql, validation, security, cache, actuator
  - [x] Extract to `backend/` directory
  - [x] Add Ehcache 3.10.8, Lombok 1.18.36, MapStruct 1.6.3, SpringDoc OpenAPI 2.8.4 to pom.xml
  - [x] Configure Maven wrapper (`./mvnw`)
  - [x] Create `application.yml` and `application-dev.yml` in `src/main/resources`
  - [x] Verify build: `./mvnw clean install`

- [x] **Task 2: Initialize Frontend Project** (AC: #1, #2)
  - [x] Run `npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
  - [x] Initialize shadcn/ui: `cd frontend && npx shadcn@latest init` (select defaults, dark theme)
  - [x] Install additional dependencies: react-hook-form, zod, @hookform/resolvers, recharts, lucide-react, axios
  - [x] Configure `tsconfig.json` with strict mode and path aliases (@/components, @/lib, @/hooks, @/types)
  - [x] Update `tailwind.config.ts` to ensure dark theme is default
  - [x] Verify build: `npm run build`

- [x] **Task 3: Configure Code Quality Tools** (AC: #4)
  - [x] Frontend: Extend `.eslintrc.json` with recommended rules, create `.prettierrc` with formatting rules
  - [x] Backend: Add `checkstyle.xml` to project root with Google Java Style configuration
  - [x] Install Husky: `npx husky install`, create pre-commit hook script
  - [x] Configure `lint-staged` in package.json for frontend
  - [x] Add Maven Checkstyle plugin to backend pom.xml
  - [x] Test: Make intentional formatting error, verify pre-commit hook rejects it

- [x] **Task 4: Configure Development Servers** (AC: #5)
  - [x] Backend: Set `server.port=8080` in application-dev.yml
  - [x] Backend: Configure CORS in new `CorsConfig.java` to allow `http://localhost:3000` with credentials
  - [x] Frontend: Update `next.config.js` to proxy `/api/*` requests to `http://localhost:8080`
  - [x] Frontend: Set dev server port to 3000 in package.json scripts (default)
  - [x] Create environment variable template: `.env.example` for frontend
  - [x] Test: Start both servers, verify frontend can reach backend health endpoint

- [x] **Task 5: Setup Project Documentation** (AC: #1)
  - [x] Create comprehensive `README.md` at project root with:
    - Project overview and tech stack summary
    - Prerequisites (Java 17, Node.js 20+, Docker optional)
    - Setup instructions (clone, install dependencies, start servers)
    - Development workflow guide
    - Project structure explanation
    - Common commands (build, test, lint)
    - Troubleshooting section
  - [x] Create `.editorconfig` with consistent formatting rules (indent_style, indent_size, charset, trim_trailing_whitespace)
  - [x] Create comprehensive `.gitignore` covering Node.js, Java/Maven, IDE files, OS files

- [x] **Task 6: Setup Docker Compose (Optional PostgreSQL)** (AC: #1)
  - [x] Create `docker-compose.yml` at project root with PostgreSQL 15-alpine service
  - [x] Configure: database `ultra_bms_dev`, user `ultra_bms_user`, port 5432, persistent volume
  - [x] Document in README.md: `docker-compose up -d` to start PostgreSQL
  - [x] Add docker-compose files to .gitignore (docker-compose.override.yml)

- [x] **Task 7: Create Initial Backend Package Structure** (AC: #1, #3)
  - [x] Create base package structure:
    - `com.ultrabms.config` - Configuration classes
    - `com.ultrabms.controller` - REST controllers
    - `com.ultrabms.service` - Business logic
    - `com.ultrabms.repository` - Data access
    - `com.ultrabms.entity` - JPA entities
    - `com.ultrabms.dto` - Data transfer objects
    - `com.ultrabms.mapper` - Entity-DTO mappers
    - `com.ultrabms.exception` - Custom exceptions
    - `com.ultrabms.security` - Security configuration
    - `com.ultrabms.util` - Utility classes
  - [x] Create placeholder classes in each package with JavaDoc

- [x] **Task 8: Create Initial Frontend Directory Structure** (AC: #1, #2)
  - [x] Organize `src/app/` with route groups:
    - `(auth)/` - Login, forgot-password routes
    - `(dashboard)/` - Main application routes (placeholder)
    - `layout.tsx`, `page.tsx` - Root layout and homepage
  - [x] Create `src/components/`:
    - `ui/` - shadcn components (initially empty)
    - `forms/` - Form components (placeholder)
    - `layout/` - Layout components (placeholder)
  - [x] Create `src/lib/`:
    - `api.ts` - API client setup
    - `utils.ts` - Utility functions
    - `constants.ts` - App constants
  - [x] Create `src/hooks/` - Custom React hooks (placeholder)
  - [x] Create `src/types/` - TypeScript type definitions (placeholder)

- [x] **Task 9: Verify End-to-End Setup** (AC: #6)
  - [x] Start backend: `cd backend && ./mvnw spring-boot:run`
  - [x] Verify backend accessible at http://localhost:8080
  - [x] Start frontend: `cd frontend && npm run dev`
  - [x] Verify frontend accessible at http://localhost:3000
  - [x] Verify hot reload: Make change to frontend component, confirm auto-reload
  - [x] Verify hot reload: Make change to backend controller, confirm auto-restart (Spring DevTools)
  - [x] Run backend build: `./mvnw clean install` - verify success
  - [x] Run frontend build: `npm run build` - verify success
  - [x] Commit initial project structure to Git

## Dev Notes

### Architecture Alignment

This story implements the foundation specified in the Architecture Document and Tech Spec for Epic 1:

**Backend Setup:**
- Spring Boot 3.4.7 with Java 17 LTS (Decision Summary: Backend Framework)
- Maven as build tool (Decision Summary: Build Tool Backend)
- Layered architecture pattern: Controller → Service → Repository → Entity (Implementation Patterns)
- Constructor injection pattern (no field injection) as per Architecture best practices
- Package structure: `com.ultrabms.{module}.{layer}` (Code Organization)

**Frontend Setup:**
- Next.js 15.5 with App Router (Decision Summary: Frontend Framework)
- TypeScript 5.8 strict mode (Decision Summary: Language Frontend)
- React 19.2.0 (Decision Summary: React Version)
- shadcn/ui component library (Decision Summary: UI Components)
- Tailwind CSS 4.0 with dark theme default (Decision Summary: Styling)
- Project structure: `src/app/` for pages, `src/components/` for reusable components, `src/lib/` for utilities

**Development Configuration:**
- Frontend: http://localhost:3000 (Next.js dev server)
- Backend: http://localhost:8080 (Spring Boot embedded Tomcat)
- CORS: Allow localhost:3000 with credentials (Technical Stack Details: Integration Points)

**Code Quality:**
- ESLint + Prettier (frontend linting/formatting)
- Checkstyle (backend code style enforcement)
- Husky pre-commit hooks (prevent unformatted commits)

### Project Structure Notes

This story establishes the monorepo structure as defined in Architecture Document Section "Project Structure":

```
ultra-bms/
├── backend/                    # Spring Boot application
│   ├── src/main/java/com/ultrabms/
│   │   ├── config/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── entity/
│   │   ├── dto/
│   │   ├── mapper/
│   │   ├── exception/
│   │   ├── security/
│   │   ├── util/
│   │   └── UltraBMSApplication.java
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   ├── application-dev.yml
│   ├── pom.xml
│   └── README.md
├── frontend/                   # Next.js application
│   ├── src/app/                # App Router pages
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── src/components/         # Reusable components
│   ├── src/lib/                # Utilities and API client
│   ├── src/hooks/              # Custom React hooks
│   ├── src/types/              # TypeScript types
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── docs/                       # Project documentation
├── docker-compose.yml          # PostgreSQL container
├── .editorconfig
├── .gitignore
└── README.md
```

### Testing Strategy

- **Unit Tests (Backend):** JUnit 5 + Mockito - Defer to Story 1.5 when service layer exists
- **Unit Tests (Frontend):** Vitest + React Testing Library - Defer to Epic 2 when UI components exist
- **Build Verification:** Ensure `mvn clean install` and `npm run build` pass
- **Manual Testing:** Start both servers, verify hot reload functionality

### Implementation Notes

1. **Spring Initializr Command:**
```bash
spring init \
  --java-version=17 \
  --build=maven \
  --type=maven-project \
  --packaging=jar \
  --group-id=com.ultrabms \
  --artifact-id=ultra-bms-backend \
  --name=UltraBMS \
  --description="Ultra Building Maintenance System" \
  --package-name=com.ultrabms \
  --dependencies=web,data-jpa,postgresql,validation,security,cache,actuator \
  --extract \
  backend
```

2. **create-next-app Command:**
```bash
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

3. **shadcn/ui Initialization:**
```bash
cd frontend
npx shadcn@latest init
# Select: New York style, Zinc color, Dark mode default
```

4. **CORS Configuration (CorsConfig.java):**
```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:3000")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
            .allowCredentials(true)
            .allowedHeaders("*");
    }
}
```

5. **Next.js API Proxy (next.config.js):**
```javascript
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*'
      }
    ]
  }
}
```

### Risks and Mitigations

- **R1:** Developers may not have Java 17 or Node.js 20+ installed
  - **Mitigation:** Document installation instructions for multiple platforms (Windows/Mac/Linux) in README
- **R2:** CORS misconfiguration could block API requests
  - **Mitigation:** Test CORS immediately after configuration, provide clear error messages
- **R3:** Pre-commit hooks may slow down commits
  - **Mitigation:** Optimize lint-staged to only check staged files, not entire codebase

### References

- [Tech Spec Epic 1: Overview](docs/sprint-artifacts/tech-spec-epic-1.md#overview)
- [Tech Spec Epic 1: Dependencies](docs/sprint-artifacts/tech-spec-epic-1.md#dependencies-and-integrations)
- [Architecture: Project Structure](docs/architecture.md#project-structure)
- [Architecture: Decision Summary](docs/architecture.md#decision-summary)
- [Architecture: Implementation Patterns](docs/architecture.md#implementation-patterns)
- [Epics: Story 1.1](docs/epics.md#story-11-project-initialization-and-repository-structure)
- [PRD: Technical Architecture](docs/prd.md#5-technical-architecture)

## Dev Agent Record

### Context Reference

**Story Context XML:** [1-1-project-initialization-and-repository-structure-context.xml](./stories/1-1-project-initialization-and-repository-structure-context.xml)

**Generated:** 2025-11-13
**Version:** 1.0

This comprehensive Story Context document contains:
- Complete architecture decisions and implementation patterns
- All dependencies and framework configurations
- Detailed testing strategy and test ideas
- Step-by-step initialization commands
- Configuration examples for backend and frontend
- Integration points and CORS setup
- Risk mitigation strategies
- Implementation sequence (9 steps)

The Dev Agent should load this context file before implementation to ensure alignment with PRD, Architecture, Tech Spec, and UX Design specifications.

### Agent Model Used

<!-- Will be populated by dev agent -->

### Debug Log References

<!-- Will be populated by dev agent during implementation -->

### Completion Notes List

<!-- Will be populated by dev agent after story completion -->

### File List

<!-- Will be populated by dev agent tracking all file changes -->
