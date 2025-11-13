# System-Level Test Design
# Ultra BMS - Building Maintenance Software Platform

**Author:** Murat (Master Test Architect)
**Date:** November 13, 2025
**Project:** ultra-bms
**Phase:** 3 - Solutioning (Testability Review)
**Mode:** System-Level

---

## Executive Summary

This document provides a system-level testability assessment for Ultra BMS before implementation begins. The architecture (Spring Boot + Next.js monolith, PostgreSQL, AWS deployment) is fundamentally testable with clear separation of concerns. Key strengths include RESTful API design, JPA repositories, and React component isolation. Primary testability concerns involve **PDC workflow complexity**, **async notification timing**, and **multi-tenant data isolation**.

**Testability Grade:** ⚠️ **CONCERNS** (see Section 6 for details)

**Critical Recommendations:**
1. Add dependency injection for external services (Email, SMS, Payment gateways)
2. Implement test factories for tenant/lease/PDC data seeding
3. Add observability headers (trace IDs, Server-Timing) to all APIs
4. Create test-specific auth bypass for E2E tests (avoid login overhead)

---

## 1. Testability Assessment

### 1.1 Controllability: ⚠️ CONCERNS

**Definition:** Can we control system state for testing?

**Findings:**

✅ **PASS - Data Seeding:**
- Spring Boot + PostgreSQL supports test containers and in-memory H2
- JPA repositories enable clean data factories via `@Transactional` tests
- API endpoints allow programmatic test data creation

✅ **PASS - External Service Mocking:**
- Architecture specifies Spring dependency injection
- Email (Gmail API), SMS (Twilio), Payment (Stripe) are injectable
- Can use MockBean for unit/integration tests

⚠️ **CONCERNS - Async Job Control:**
- `@Async` and `@Scheduled` jobs (PM schedules, PDC reminders) lack explicit control
- No mention of test-friendly job execution (e.g., manual triggers for tests)
- **Risk:** Tests may need to wait arbitrary time for scheduled jobs
- **Mitigation:** Expose admin endpoints to trigger jobs on-demand for tests

⚠️ **CONCERNS - Multi-Tenant Isolation:**
- Architecture specifies multi-property support but doesn't address test isolation
- **Risk:** Parallel tests may collide on tenant/property data
- **Mitigation:** Use unique property IDs (faker) and parallel-safe factories

**Recommendations:**
1. Add test admin endpoints: `POST /api/test/trigger-pm-scheduler`, `POST /api/test/trigger-pdc-reminder`
2. Implement `TestDataFactory` with unique IDs (faker integration)
3. Add `@ConditionalOnProperty("spring.profiles.active=test")` for test overrides

---

### 1.2 Observability: ✅ PASS with Minor Gaps

**Definition:** Can we inspect system state and validate behavior?

**Findings:**

✅ **PASS - Logging Framework:**
- Spring Boot Actuator + Logback for structured logging
- Architecture specifies SLF4J with log levels (ERROR, WARN, INFO, DEBUG)

✅ **PASS - API Response Format:**
- Consistent response structure documented in architecture
- Error codes (RESOURCE_NOT_FOUND, etc.) enable specific test assertions

✅ **PASS - Health Checks:**
- Spring Boot Actuator provides `/actuator/health` endpoint
- Can validate service dependencies (database, cache)

⚠️ **MINOR GAP - APM Telemetry:**
- Architecture mentions AWS X-Ray but no explicit trace ID headers
- **Impact:** E2E tests can't correlate frontend actions to backend logs
- **Mitigation:** Add `X-Trace-ID` header to all API responses

⚠️ **MINOR GAP - Database State Inspection:**
- No test utilities for direct database assertions
- **Impact:** Tests rely solely on API responses (can't detect data corruption)
- **Mitigation:** Add `TestDatabaseHelper` with query methods for test assertions

**Recommendations:**
1. Add `X-Trace-ID` and `Server-Timing` headers to all API responses
2. Implement `TestDatabaseHelper.query(sql)` for direct database assertions
3. Expose `/actuator/metrics` for performance test validation (response times, cache hits)

---

### 1.3 Reliability: ✅ PASS

**Definition:** Can we reproduce failures and isolate tests?

**Findings:**

✅ **PASS - Stateless Design:**
- RESTful APIs with JWT authentication (no server-side sessions)
- Tests can run in parallel without session conflicts

✅ **PASS - Database Transactions:**
- JPA `@Transactional` tests with automatic rollback
- Spring Test framework supports isolated test transactions

✅ **PASS - Deterministic Waits:**
- React Query (frontend) enables deterministic data loading
- API-first architecture reduces UI flakiness

✅ **PASS - Component Isolation:**
- shadcn/ui components are independently testable
- Next.js App Router separates page logic from components

**No Concerns** - Architecture supports reliable, reproducible testing.

---

## 2. Architecturally Significant Requirements (ASRs)

These quality requirements drive architecture decisions and pose testability challenges.

### ASR-1: PDC (Post-Dated Cheque) Management - MENA Region Specific

**Risk Score:** 6 (Probability: 2 × Impact: 3)

**Category:** DATA (Data Integrity)

**Description:**
PDC workflow involves complex state transitions (RECEIVED → DEPOSITED → CLEARED/BOUNCED) with scheduled reminders. Bounced cheques require replacement tracking and late fee calculation.

**Testability Challenge:**
- State machine transitions must be validated across weeks/months (cheque_date)
- Scheduled jobs (`@Scheduled`) run daily at 9 AM (hard to test without time manipulation)
- Replacement cheque linking creates circular relationships in database

**Testing Approach:**
- **Unit Tests:** State machine logic in `PDCService` (transition validation)
- **Integration Tests:** Database state after transitions (bounced → replacement linked)
- **E2E Tests:** Critical path only (receive PDC → mark deposited → clear)
- **Time Mocking:** Use Playwright `page.clock.fastForward()` for E2E, Mockito `@MockBean(Clock.class)` for backend

**Tools:** JUnit 5 (unit), TestContainers (integration), Playwright (E2E with clock mocking)

---

### ASR-2: Preventive Maintenance Automation

**Risk Score:** 4 (Probability: 2 × Impact: 2)

**Category:** BUS (Business Logic)

**Description:**
Auto-generate work orders from PM schedules with configurable frequencies (daily, weekly, monthly, quarterly, annual). Must calculate next due dates and assign vendors automatically.

**Testability Challenge:**
- Scheduled execution (`@Scheduled` cron jobs) requires explicit triggering in tests
- Date calculations (next due date) across time zones and daylight saving time
- Vendor assignment algorithm needs mock data with multiple vendors

**Testing Approach:**
- **Unit Tests:** `calculateNextDueDate()` method with edge cases (leap years, DST)
- **Integration Tests:** `generatePMWorkOrders()` with test database and fixed Clock
- **E2E Tests:** Manual PM schedule creation → verify work order appears after trigger

**Tools:** JUnit 5 with `@ParameterizedTest` (date edge cases), TestContainers (integration), Admin trigger endpoint (E2E)

---

### ASR-3: Multi-Channel Notifications (Email, SMS, In-App)

**Risk Score:** 4 (Probability: 2 × Impact: 2)

**Category:** OPS (Operational)

**Description:**
Send notifications via Email (Gmail API), SMS (Twilio), and in-app alerts. Async processing with `@Async` and configurable user preferences.

**Testability Challenge:**
- External service integration (Gmail API, Twilio) requires mocking
- Async execution makes timing non-deterministic
- User preferences add conditional logic (send email only if enabled)

**Testing Approach:**
- **Unit Tests:** Notification logic with mocked Email/SMS services
- **Integration Tests:** Verify notification records saved to database (not sent externally)
- **E2E Tests:** In-app notifications only (avoid external API calls)
- **Contract Tests:** Validate Email/SMS payloads match provider schemas

**Tools:** Mockito `@MockBean` (unit), TestContainers (integration), Playwright (E2E for in-app notifications), Pact (contract testing)

---

### ASR-4: RBAC (Role-Based Access Control) with 6 User Roles

**Risk Score:** 6 (Probability: 2 × Impact: 3)

**Category:** SEC (Security)

**Description:**
6 user roles (SUPER_ADMIN, PROPERTY_MANAGER, MAINTENANCE_SUPERVISOR, FINANCE_MANAGER, TENANT, VENDOR) with granular permissions (resource:action).

**Testability Challenge:**
- Combinatorial explosion: 6 roles × ~50 endpoints = 300 permission tests
- Permission enforcement must cover both controller-level and service-level
- JWT token generation for each role adds test overhead

**Testing Approach:**
- **Unit Tests:** `@PreAuthorize` annotations with mock security context
- **Integration Tests:** API calls with JWT tokens for each role (test 403 Forbidden)
- **E2E Tests:** Critical paths only (admin creates user, tenant views own lease)
- **Permission Matrix:** Generate CSV mapping role → allowed endpoints

**Tools:** Spring Security Test (`@WithMockUser`), JUnit 5 parameterized tests, Playwright (E2E with auth state)

---

### ASR-5: Performance SLO: < 500ms p95 for API Calls

**Risk Score:** 4 (Probability: 2 × Impact: 2)

**Category:** PERF (Performance)

**Description:**
API response time must be < 200ms typical, < 500ms p95. Dashboard APIs < 500ms. Concurrent user support: 10,000+.

**Testability Challenge:**
- Performance tests require production-like data volumes (1000+ tenants, 10K+ work orders)
- k6 load testing needs dedicated test environment (can't run on local)
- SLO validation requires automated threshold checks in CI

**Testing Approach:**
- **Smoke Tests:** k6 with 10 VUs, 30s duration (catches major regressions)
- **Load Tests:** k6 with staged ramp-up (50 → 100 VUs) in staging environment
- **Profiling:** Spring Boot Actuator `/metrics` for database query counts
- **CI Integration:** k6 thresholds block merge if p95 > 500ms

**Tools:** k6 (load testing), Spring Boot Actuator (metrics), GitHub Actions (CI)

---

### ASR-6: Data Retention: 7 Years for Financial Data

**Risk Score:** 3 (Probability: 1 × Impact: 3)

**Category:** DATA (Compliance)

**Description:**
Financial data (invoices, payments, PDCs) must be retained for 7 years per regulatory requirements. Soft deletes (is_deleted flag) instead of hard deletes.

**Testability Challenge:**
- Test data cleanup conflicts with soft delete requirement
- Tests must verify data is marked `is_deleted=true`, not physically removed
- Audit trail validation requires checking `audit_logs` table

**Testing Approach:**
- **Unit Tests:** Verify `delete()` methods set `is_deleted=true`
- **Integration Tests:** Confirm deleted records still queryable with `findDeleted()` methods
- **E2E Tests:** Validate deleted data not shown in UI (filtered out)

**Tools:** JUnit 5 (unit), TestContainers (integration), Playwright (E2E)

---

## 3. Test Levels Strategy

### 3.1 Recommended Test Distribution

Based on architecture (Spring Boot + Next.js monolith), recommended split:

| Test Level | % Coverage | Rationale |
|------------|-----------|-----------|
| **Unit** | 50% | Pure business logic in `*Service` classes, DTOs, mappers |
| **Integration** | 30% | API endpoints, database operations, service → repository flows |
| **E2E** | 15% | Critical user journeys (login, create tenant, complete PM job) |
| **Component** | 5% | shadcn/ui components (Button, Form, Card) in isolation |

**Total:** 100% (balanced pyramid for monolithic architecture)

---

### 3.2 Test Level Selection Guidance

#### When to Use Unit Tests (50% of tests)

**Scenarios:**
- Business logic in `*Service` classes (e.g., `PDCService.calculateNextDueDate()`)
- DTO validation logic (e.g., `TenantRequestDto` field validation)
- Utility functions (e.g., `CurrencyFormatter.formatAED()`)
- State machine transitions (e.g., `WorkOrderStatus` FSM)

**Example:**
```java
@Test
void shouldCalculateNextDueDateForMonthlySchedule() {
    PMSchedule schedule = new PMSchedule(Frequency.MONTHLY);
    LocalDate nextDate = pmScheduleService.calculateNextDueDate(schedule);
    assertEquals(LocalDate.now().plusMonths(1), nextDate);
}
```

**Tools:** JUnit 5, Mockito, AssertJ

---

#### When to Use Integration Tests (30% of tests)

**Scenarios:**
- API endpoint contracts (request → response validation)
- Database operations (JPA repository methods)
- Service → Repository interaction (business logic + persistence)
- Authentication/authorization enforcement (Spring Security)

**Example:**
```java
@SpringBootTest
@AutoConfigureMockMvc
class TenantControllerIntegrationTest {
    @Test
    void shouldCreateTenantViaAPI() {
        TenantRequestDto request = new TenantRequestDto("John Doe", "john@example.com");

        mockMvc.perform(post("/api/v1/tenants")
            .contentType(APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.email").value("john@example.com"));
    }
}
```

**Tools:** Spring Boot Test, MockMvc, TestContainers (PostgreSQL), H2 (in-memory option)

---

#### When to Use E2E Tests (15% of tests)

**Scenarios:**
- Critical user journeys (revenue-impacting, compliance-required)
- Multi-page workflows (login → dashboard → create entity)
- UI/UX validation (form validation, error messages, success states)
- Cross-system integration (frontend → backend → database → external API)

**Example:**
```typescript
test('property manager can create new tenant', async ({ page, apiRequest }) => {
    // Setup: Create property via API (fast)
    const property = await apiRequest.post('/api/properties', {
        data: { name: 'Test Building', address: 'Dubai' }
    }).then(r => r.json());

    // Login as property manager
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'pm@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login"]');

    // Navigate to tenant creation
    await page.goto('/tenants/new');
    await page.fill('[data-testid="first-name"]', 'John');
    await page.fill('[data-testid="last-name"]', 'Doe');
    await page.fill('[data-testid="email"]', 'john@example.com');
    await page.fill('[data-testid="phone"]', '+971501234567');
    await page.selectOption('[data-testid="property"]', property.id);

    await page.click('[data-testid="create-tenant"]');

    await expect(page.getByText('Tenant created successfully')).toBeVisible();
    await expect(page).toHaveURL(/\/tenants\/\d+/);
});
```

**Tools:** Playwright (primary), Cypress (alternative)

---

#### When to Use Component Tests (5% of tests)

**Scenarios:**
- shadcn/ui component behavior (props, events, styling)
- React Hook Form validation logic
- Custom hooks (useAuth, useTenants, etc.)

**Example:**
```typescript
test('TenantCard displays tenant info correctly', async ({ mount }) => {
    const tenant = { id: 1, name: 'John Doe', email: 'john@example.com', status: 'ACTIVE' };

    const component = await mount(<TenantCard tenant={tenant} />);

    await expect(component.getByText('John Doe')).toBeVisible();
    await expect(component.getByText('john@example.com')).toBeVisible();
    await expect(component.getByText('ACTIVE')).toHaveClass('status-active');
});
```

**Tools:** Playwright Component Testing, Cypress Component Testing, React Testing Library

---

### 3.3 Avoiding Duplicate Coverage

**Anti-Pattern:** Testing the same behavior at multiple levels.

**Example - ❌ BAD (Duplicate Coverage):**
- Unit test: `shouldCalculateRentTotal()` tests `calculateRent(1000, 100, 50) == 1150`
- Integration test: API call to `/api/tenants` validates rent calculation
- E2E test: Create tenant form validates rent calculation in UI

**Result:** 3 tests for the same logic (maintenance burden, slow CI)

**Example - ✅ GOOD (Layered Coverage):**
- **Unit test:** `shouldCalculateRentTotal()` covers calculation logic + edge cases
- **Integration test:** Validates API returns correct rent in response (trusts unit test for calculation)
- **E2E test:** Verifies rent is *displayed* in UI (doesn't recalculate, trusts API)

**Principle:** Test behavior once at the lowest appropriate level. Higher levels validate integration, not re-test logic.

---

## 4. NFR Testing Approach

### 4.1 Security Testing

**NFR Target:** OWASP Top 10 compliance, JWT expiry (15 min), role-based access control

**Testing Strategy:**

| Test Type | Tool | Coverage |
|-----------|------|----------|
| **Authentication** | Playwright E2E | Unauthenticated redirect, JWT expiry, password recovery |
| **Authorization** | Spring Security Test | RBAC enforcement (403 for insufficient permissions) |
| **Input Validation** | Playwright E2E | SQL injection, XSS sanitization, file upload validation |
| **Secret Handling** | SonarQube, npm audit | No passwords in logs, no secrets in frontend |
| **Vulnerability Scan** | OWASP ZAP, Snyk | Automated security scanning in CI |

**Example Test:**
```typescript
test('unauthenticated users cannot access dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Please sign in')).toBeVisible();

    // Verify no sensitive data leaked
    const content = await page.content();
    expect(content).not.toContain('user_id');
    expect(content).not.toContain('api_key');
});
```

**CI Integration:** GitHub Actions with OWASP ZAP scan on every PR

---

### 4.2 Performance Testing

**NFR Target:** API response < 200ms typical, < 500ms p95, 10K concurrent users

**Testing Strategy:**

| Test Type | Tool | Coverage |
|-----------|------|----------|
| **Load Testing** | k6 | Sustained load (50-100 VUs), p95/p99 latency |
| **Stress Testing** | k6 | Breaking point identification (increase until failure) |
| **Spike Testing** | k6 | Sudden traffic increase (100 → 500 VUs instantly) |
| **Endurance Testing** | k6 | 24-hour soak test (memory leaks, resource exhaustion) |
| **Profiling** | Spring Boot Actuator | Database query counts, cache hit rates |

**Example k6 Test:**
```javascript
export const options = {
    stages: [
        { duration: '1m', target: 50 },
        { duration: '3m', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '3m', target: 100 },
        { duration: '1m', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],
        errors: ['rate<0.01'],
    },
};

export default function () {
    const response = http.get(`${__ENV.BASE_URL}/api/tenants?limit=10`);
    check(response, {
        'status is 200': (r) => r.status === 200,
        'response time < 500ms': (r) => r.timings.duration < 500,
    });
}
```

**CI Integration:** k6 smoke tests (10 VUs, 30s) on every PR, full load tests nightly

---

### 4.3 Reliability Testing

**NFR Target:** Error handling, retries (3 attempts), health checks, circuit breakers

**Testing Strategy:**

| Test Type | Tool | Coverage |
|-----------|------|----------|
| **Error Handling** | Playwright E2E | 500 error → user-friendly message + retry button |
| **Retry Logic** | Playwright + Mock | 503 transient failure → 3 retries → eventual success |
| **Health Checks** | Playwright API | `/actuator/health` validates database, cache |
| **Circuit Breaker** | Playwright + Mock | 5 failures → circuit opens → fallback UI |
| **Offline Handling** | Playwright | Network disconnection → sync when reconnected |

**Example Test:**
```typescript
test('app remains functional when API returns 500 error', async ({ page, context }) => {
    await context.route('**/api/tenants', route => {
        route.fulfill({ status: 500, body: JSON.stringify({ error: 'Internal Server Error' }) });
    });

    await page.goto('/tenants');

    await expect(page.getByText('Unable to load tenants. Please try again.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();

    // App navigation still works (graceful degradation)
    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page).toHaveURL('/');
});
```

**CI Integration:** Reliability tests run on every PR (mocked failures)

---

### 4.4 Maintainability Testing

**NFR Target:** Test coverage ≥80%, code duplication <5%, no critical vulnerabilities

**Testing Strategy:**

| Test Type | Tool | Coverage |
|-----------|------|----------|
| **Test Coverage** | JaCoCo (backend), Vitest (frontend) | Line coverage, branch coverage |
| **Code Duplication** | jscpd | Duplication percentage <5% |
| **Vulnerability Scan** | npm audit, OWASP Dependency-Check | No critical/high vulnerabilities |
| **Observability** | Playwright E2E | Error tracking (Sentry), telemetry headers (X-Trace-ID) |

**Example CI Job:**
```yaml
test-coverage:
  runs-on: ubuntu-latest
  steps:
    - name: Run backend tests with coverage
      run: ./mvnw test jacoco:report

    - name: Check coverage threshold (80% minimum)
      run: |
        COVERAGE=$(grep -oP '(?<=<counter type="LINE" missed="\d+" covered=")(\d+)' target/site/jacoco/jacoco.xml)
        if [ "$COVERAGE" -lt 80 ]; then
          echo "❌ FAIL: Coverage $COVERAGE% below 80% threshold"
          exit 1
        fi
```

**CI Integration:** Coverage, duplication, and vulnerability checks on every PR

---

## 5. Test Environment Requirements

### 5.1 Local Development Environment

**Purpose:** Fast feedback for developers (unit + integration tests)

**Infrastructure:**
- Java 17 JDK
- PostgreSQL 14+ (Docker container or local install)
- Node.js 18+ with npm
- IntelliJ IDEA / VS Code

**Test Data:**
- H2 in-memory database for unit tests
- TestContainers PostgreSQL for integration tests
- Faker library for test data generation

**Execution Time:** < 5 minutes for full test suite

---

### 5.2 CI/CD Environment (GitHub Actions)

**Purpose:** Automated testing on every PR and merge to main

**Infrastructure:**
- GitHub-hosted runners (ubuntu-latest)
- Docker for TestContainers
- PostgreSQL service container
- k6 for performance smoke tests

**Test Stages:**
1. **PR Checks:** Unit + integration tests, lint, coverage (< 10 min)
2. **Merge to Main:** Full test suite + E2E smoke tests (< 20 min)
3. **Nightly:** Full E2E suite + load tests + security scans (< 60 min)

**Artifacts:** Test reports, coverage reports, Playwright traces

---

### 5.3 Staging Environment

**Purpose:** Pre-production validation (full E2E suite, performance testing)

**Infrastructure:**
- AWS EKS (smaller instance than production)
- Amazon RDS PostgreSQL (db.t3.medium)
- Amazon S3 (test bucket)
- CloudFront CDN
- External services in test mode (Stripe test keys, Twilio sandbox)

**Test Data:**
- Production-like data volumes (100 tenants, 500 work orders)
- Anonymized production data (optional)

**Execution Time:** < 60 minutes for full E2E + load tests

---

### 5.4 Production Environment

**Purpose:** Smoke tests post-deployment (critical path validation)

**Infrastructure:**
- Full AWS production setup (see architecture.md)
- Real external services (Gmail API, Twilio, Stripe production)

**Test Data:**
- Synthetic test accounts (marked as `is_test=true`)
- Isolated test properties (not visible to real users)

**Execution Time:** < 5 minutes for post-deployment smoke tests

---

## 6. Testability Concerns

### ⚠️ CONCERN-1: Async Job Testing Overhead

**Issue:**
`@Scheduled` jobs (PM scheduler, PDC reminders) run at fixed times (e.g., daily at 9 AM). Tests must either:
- Wait for scheduled execution (impractical)
- Mock time with `Clock.fixed()` (complex)
- Manually trigger jobs (requires test endpoints)

**Impact:** HIGH
- E2E tests for PM automation cannot validate scheduled execution
- PDC reminder tests cannot verify 3-day advance notification

**Recommendation:**
```java
@RestController
@RequestMapping("/api/test")
@Profile("test")
public class TestAdminController {

    @Autowired
    private PMScheduleService pmScheduleService;

    @PostMapping("/trigger-pm-scheduler")
    public ResponseEntity<Void> triggerPMScheduler() {
        pmScheduleService.generatePMWorkOrders();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/trigger-pdc-reminder")
    public ResponseEntity<Void> triggerPDCReminder() {
        pdcService.checkUpcomingDeposits();
        return ResponseEntity.ok().build();
    }
}
```

**Status:** Mitigated with test admin endpoints

---

### ⚠️ CONCERN-2: External Service Dependency Injection Missing

**Issue:**
Architecture doesn't explicitly specify dependency injection for:
- Email service (Gmail API)
- SMS service (Twilio)
- Payment gateway (Stripe)

Without DI, tests must call real external services (slow, brittle, costly).

**Impact:** MEDIUM
- Integration tests slower (real API calls)
- E2E tests may incur SMS/email charges
- Rate limiting on external APIs blocks CI

**Recommendation:**
```java
// Bad: Direct instantiation (not testable)
public class NotificationService {
    private final TwilioClient twilioClient = new TwilioClient(API_KEY);
}

// Good: Dependency injection (testable)
@Service
public class NotificationService {
    private final SMSProvider smsProvider; // Interface

    @Autowired
    public NotificationService(SMSProvider smsProvider) {
        this.smsProvider = smsProvider;
    }
}

// Test configuration
@TestConfiguration
public class TestConfig {
    @Bean
    @Primary
    public SMSProvider mockSMSProvider() {
        return new MockSMSProvider(); // In-memory, no external calls
    }
}
```

**Status:** Requires architecture update to specify DI for external services

---

### ⚠️ CONCERN-3: Multi-Tenant Data Isolation in Tests

**Issue:**
Parallel tests may collide on tenant/property data if using hardcoded IDs or emails. No explicit test isolation strategy in architecture.

**Impact:** MEDIUM
- Flaky tests (email already exists, property not found)
- Tests cannot run in parallel (`--workers=4`)
- CI failures due to race conditions

**Recommendation:**
```java
public class TestDataFactory {
    private static final Faker faker = new Faker();

    public static Tenant createTenant() {
        return Tenant.builder()
            .firstName(faker.name().firstName())
            .lastName(faker.name().lastName())
            .email(faker.internet().emailAddress()) // Unique every time
            .phone(faker.phoneNumber().phoneNumber())
            .build();
    }
}
```

**Status:** Mitigated with Faker-based test factories + auto-cleanup fixtures

---

### ℹ️ MINOR GAP: Observability Headers Missing

**Issue:**
Architecture doesn't specify `X-Trace-ID` or `Server-Timing` headers for APM integration.

**Impact:** LOW
- E2E tests can't correlate frontend actions to backend logs
- Performance tests can't measure individual API layer timings

**Recommendation:**
Add Spring interceptor to inject headers:
```java
@Component
public class TraceIdInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String traceId = UUID.randomUUID().toString();
        response.setHeader("X-Trace-ID", traceId);
        MDC.put("traceId", traceId); // For logging
        return true;
    }
}
```

**Status:** Recommended for Sprint 0 observability setup

---

## 7. Recommendations for Sprint 0

Before starting epic implementation, complete these foundational tasks:

### 7.1 Testing Infrastructure Setup

**Backend:**
- [ ] Add TestContainers dependency (`testcontainers-postgresql`)
- [ ] Configure H2 in-memory database for fast unit tests
- [ ] Implement `TestDataFactory` with Faker integration
- [ ] Add test admin endpoints for scheduled job triggers (`@Profile("test")`)
- [ ] Configure JaCoCo for test coverage reports (80% threshold)

**Frontend:**
- [ ] Install Playwright (`npm install -D @playwright/test`)
- [ ] Configure Playwright with multiple browsers (chromium, firefox, webkit)
- [ ] Add fixture for authentication (`playwright/support/fixtures/auth-fixture.ts`)
- [ ] Configure Vitest for component testing
- [ ] Add faker for frontend test data (`npm install -D @faker-js/faker`)

**CI/CD:**
- [ ] GitHub Actions workflow for PR checks (unit + integration tests)
- [ ] k6 load testing workflow (nightly)
- [ ] OWASP ZAP security scanning (weekly)
- [ ] Test report publishing (Allure or HTML reports)

---

### 7.2 Observability Enhancements

**Backend:**
- [ ] Add `X-Trace-ID` header interceptor
- [ ] Add `Server-Timing` header for API layer timings
- [ ] Configure Spring Boot Actuator `/actuator/metrics` endpoint
- [ ] Add Sentry or CloudWatch integration for error tracking

**Frontend:**
- [ ] Configure Sentry SDK for error tracking
- [ ] Add Lighthouse CI for Core Web Vitals monitoring
- [ ] Implement custom performance marks (`performance.mark('api-call-start')`)

---

### 7.3 Architecture Refinements

**Required:**
- [ ] Specify dependency injection for Email, SMS, Payment services
- [ ] Add test configuration profiles (`application-test.yml`)
- [ ] Document soft delete implementation (`is_deleted` flag)
- [ ] Add health check indicators for external services

**Recommended:**
- [ ] Add feature flags for async job control (manual trigger vs scheduled)
- [ ] Implement circuit breaker for external API calls (Resilience4j)
- [ ] Add rate limiting configuration (bucket4j or Spring Cloud Gateway)

---

## 8. Quality Gate Criteria

Before moving to Phase 4 (Implementation), validate:

### Phase 3 Gate Criteria (Solutioning)

- [x] **Testability Assessment Complete:** All 3 dimensions (Controllability, Observability, Reliability) evaluated
- [x] **ASRs Identified:** 6 architecturally significant requirements documented with risk scores
- [x] **Test Levels Defined:** Unit (50%), Integration (30%), E2E (15%), Component (5%)
- [x] **NFR Approach Documented:** Security, Performance, Reliability, Maintainability testing strategies
- [ ] **Test Infrastructure Ready:** Backend + frontend test frameworks configured (Sprint 0 task)
- [x] **Testability Concerns Documented:** 3 concerns + 1 minor gap identified with mitigations
- [x] **Observability Plan:** X-Trace-ID, Server-Timing, /actuator/metrics documented

**Gate Decision:** ⚠️ **CONCERNS**
- Testability concerns are documented with clear mitigations
- Sprint 0 tasks must complete before epic implementation begins
- No critical blockers preventing implementation start

**Next Steps:**
1. Complete Sprint 0 test infrastructure setup (2-3 days)
2. Architect reviews and approves DI changes for external services
3. PM schedules epic kickoff after Sprint 0 completion

---

## 9. References

**Architecture:**
- `docs/architecture.md` - Spring Boot + Next.js architecture
- `docs/prd.md` - Product requirements and NFRs

**Knowledge Base:**
- `test-levels-framework.md` - Unit/Integration/E2E selection guidance
- `nfr-criteria.md` - NFR validation approach (Security, Performance, Reliability, Maintainability)
- `risk-governance.md` - Risk scoring matrix and gate decision rules
- `test-quality.md` - Test quality standards (deterministic, isolated, explicit, fast)

**Tools:**
- JUnit 5, Mockito, AssertJ (backend unit/integration)
- Spring Boot Test, MockMvc, TestContainers (backend integration)
- Playwright (frontend E2E), Cypress (alternative)
- k6 (load/stress testing)
- OWASP ZAP, Snyk (security scanning)

---

**Document Status:** ✅ Complete
**Next Review:** After Sprint 0 completion
**Owner:** Murat (Master Test Architect)
