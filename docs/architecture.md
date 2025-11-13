# Architecture
# Ultra BMS - Building Maintenance Software Platform

**Version:** 1.0
**Date:** November 13, 2025
**Architect:** Nata
**Status:** In Progress

---

## Executive Summary

Ultra BMS follows a modern full-stack architecture with a Java Spring Boot backend and Next.js frontend. The system is designed as a monolithic application with clear separation of concerns, optimized for AWS UAE region deployment. Key architectural decisions prioritize simplicity, maintainability, and alignment with enterprise best practices while avoiding over-engineering.

---

## Project Initialization

### Backend: Spring Boot 3 + Java 17

**First Story - Backend Initialization:**

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
  --dependencies=web,data-jpa,postgresql,validation,security,cache,mail,actuator \
  --extract \
  ultra-bms-backend
```

**Provided by Spring Initializr:**
- Spring Boot 3.x framework
- Spring Web (REST API)
- Spring Data JPA (ORM)
- PostgreSQL driver
- Spring Validation
- Spring Security
- Spring Cache (Caffeine/EhCache)
- Spring Mail
- Spring Boot Actuator
- Maven build system
- JUnit 5 testing framework

### Frontend: Next.js 15 + TypeScript + shadcn/ui

**First Story - Frontend Initialization:**

```bash
npx create-next-app@latest ultra-bms-frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

**Followed by shadcn/ui setup:**

```bash
cd ultra-bms-frontend
npx shadcn@latest init
```

**Provided by Next.js + shadcn/ui:**
- Next.js 15 with App Router
- React 18+ with TypeScript
- Tailwind CSS 4.0
- ESLint configuration
- shadcn/ui component library
- Automatic code splitting
- Built-in API routes
- Image optimization
- Font optimization

### MCP Server Integration

**shadcn/ui MCP Server (Already Configured):**
- Enables AI agents to query and add shadcn components
- Provides accurate TypeScript props and documentation
- Configuration: `.mcp.json` in project root

---

## Decision Summary

| Category | Decision | Version | Affects Epics | Rationale | Provided by Starter |
| -------- | -------- | ------- | ------------- | --------- | ------------------- |
| Backend Framework | Spring Boot | 3.4.7 | All | Enterprise Java standard, excellent for monoliths | ✓ Spring Initializr |
| Java Version | Java | 17 LTS | All | Long-term support, modern features (records, sealed classes) | ✓ Spring Initializr |
| Frontend Framework | Next.js | 15.5 | All | SSR, API routes, Turbopack, production-ready | ✓ create-next-app |
| Language (Frontend) | TypeScript | 5.8 | All Frontend | Type safety, better IDE support, fewer runtime errors | ✓ create-next-app |
| React Version | React | 19.2.0 | All Frontend | Latest stable with improved hooks and type inference | ✓ create-next-app |
| UI Components | shadcn/ui | Latest | All Frontend | Accessible, customizable, Radix UI primitives | ✓ Manual setup |
| Styling | Tailwind CSS | 4.0 | All Frontend | Utility-first, mobile-first, dark mode support | ✓ create-next-app |
| Database | PostgreSQL | 17.6 | All | ACID compliance, JSON support, proven at scale | ✓ Spring Initializr |
| Database Migration | Flyway | Latest | All | Version-controlled schema changes | Manual |
| ORM | Spring Data JPA | 3.4.x | All | Type-safe queries, repository pattern | ✓ Spring Initializr |
| Caching | Spring Cache + Caffeine | Latest | Performance-critical | In-process caching, no external dependencies | ✓ Spring Initializr |
| Async Processing | Spring @Async + @Scheduled | Built-in | Notifications, Jobs, Reports | Sufficient for monolith, ThreadPoolTaskExecutor | Manual |
| Authentication | Spring Security + JWT | 6.x | All | OAuth 2.0, role-based access control | ✓ Spring Initializr |
| Password Encoding | BCrypt | Built-in | Authentication | Industry standard, secure | Manual |
| API Documentation | SpringDoc OpenAPI | 2.x | All Backend | Auto-generated API docs, Swagger UI | Manual |
| Logging | SLF4J + Logback | Built-in | All | Structured logging, multiple log levels | ✓ Spring Initializr |
| Monitoring | Spring Boot Actuator | Built-in | All | Health checks, metrics, monitoring | ✓ Spring Initializr |
| Testing (Backend) | JUnit 5 + Mockito | Latest | All Backend | Unit and integration testing | ✓ Spring Initializr |
| Testing (Frontend) | Vitest + React Testing Library | Latest | All Frontend | Fast unit tests, component testing | Manual |
| State Management | Redux Toolkit | Latest | All Frontend | Global state, normalized data structure | Manual |
| Form Management | React Hook Form + Zod | Latest | All Frontend | Performance, schema validation | Manual |
| Date Handling | date-fns | Latest | All Frontend | Lightweight, tree-shakeable | Manual |
| HTTP Client (Frontend) | Fetch API + React Query | Latest | All Frontend | Caching, optimistic updates, background sync | Manual |
| Charts | Recharts | Latest | Dashboard, Reports | Composable, customizable React charts | Manual |
| Icons | Lucide React | Latest | All Frontend | Consistent icon library | Manual |
| Currency | AED Only | N/A | Financial Module | Single currency simplifies financial logic | Manual |
| Email Service | Spring Mail + Gmail API | Latest | Notifications | Sending/receiving emails as per PRD | ✓ Spring Initializr |
| SMS Service | Twilio | Latest | Notifications | SMS notifications, OTP | Manual |
| File Storage | AWS S3 | Latest | Documents, Assets | Scalable object storage in UAE region | Manual |
| Payment Gateway | Stripe | Latest | Financials | PCI compliance, subscription support | Manual |
| Build Tool (Backend) | Maven | 3.9+ | All Backend | Dependency management, lifecycle | ✓ Spring Initializr |
| Build Tool (Frontend) | npm/Turbopack | Latest | All Frontend | Package management, fast builds | ✓ create-next-app |

---

## Project Structure

### Monorepo Structure

```
ultra-bms/
├── ultra-bms-backend/          # Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/ultrabms/
│   │   │   │   ├── config/            # Configuration classes
│   │   │   │   ├── controller/        # REST controllers
│   │   │   │   ├── service/           # Business logic
│   │   │   │   ├── repository/        # Data access
│   │   │   │   ├── entity/            # JPA entities
│   │   │   │   ├── dto/               # Data transfer objects
│   │   │   │   ├── mapper/            # Entity-DTO mappers
│   │   │   │   ├── exception/         # Custom exceptions
│   │   │   │   ├── security/          # Security configuration
│   │   │   │   ├── util/              # Utility classes
│   │   │   │   └── UltraBMSApplication.java
│   │   │   └── resources/
│   │   │       ├── application.yml    # App configuration
│   │   │       ├── application-dev.yml
│   │   │       ├── application-prod.yml
│   │   │       └── db/migration/      # Flyway migrations
│   │   └── test/                      # Unit & integration tests
│   ├── pom.xml
│   └── README.md
│
├── ultra-bms-frontend/         # Next.js application
│   ├── src/
│   │   ├── app/                       # App router pages
│   │   │   ├── (auth)/                # Auth route group
│   │   │   │   ├── login/
│   │   │   │   └── forgot-password/
│   │   │   ├── (dashboard)/           # Dashboard route group
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx           # Executive dashboard
│   │   │   │   ├── tenants/
│   │   │   │   ├── maintenance/
│   │   │   │   ├── vendors/
│   │   │   │   ├── finance/
│   │   │   │   ├── assets/
│   │   │   │   ├── parking/
│   │   │   │   ├── documents/
│   │   │   │   ├── reports/
│   │   │   │   └── settings/
│   │   │   ├── api/                   # API routes
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn components
│   │   │   ├── forms/                 # Form components
│   │   │   ├── charts/                # Chart components
│   │   │   ├── tables/                # Table components
│   │   │   └── layout/                # Layout components
│   │   ├── lib/
│   │   │   ├── api.ts                 # API client
│   │   │   ├── utils.ts               # Utilities
│   │   │   └── constants.ts
│   │   ├── hooks/                     # Custom React hooks
│   │   ├── types/                     # TypeScript types
│   │   └── styles/
│   ├── public/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── README.md
│
├── docs/                       # Project documentation
│   ├── prd.md
│   ├── architecture.md         # This document
│   └── bmm-workflow-status.yaml
├── stitch_building_maintenance_software/  # UX designs
└── .mcp.json                   # MCP server config
```

---

## Epic to Architecture Mapping

| Module/Epic | Backend Components | Frontend Routes | Database Tables | External Services |
| ----------- | ------------------ | --------------- | --------------- | ----------------- |
| **Authentication & Access Control** | AuthController, UserService, JwtTokenProvider, SecurityConfig | /login, /forgot-password, /reset-password | users, roles, permissions, user_roles | Email (Gmail API) |
| **Dashboard & Analytics** | DashboardController, MetricsService, ReportService | /(dashboard), /api/dashboard | All tables (aggregations) | None |
| **Tenant Management** | TenantController, TenantService, LeaseService, DocumentService | /tenants, /tenants/[id], /tenants/new | tenants, leases, tenant_documents, parking_allocations | Email, Document Storage (S3) |
| **Maintenance Management** | MaintenanceController, WorkOrderService, PMScheduleService | /maintenance, /maintenance/jobs/[id], /maintenance/pm | work_orders, pm_schedules, job_history, job_photos | SMS (Twilio), Email |
| **Vendor Management** | VendorController, VendorService, PerformanceService | /vendors, /vendors/[id], /vendors/performance | vendors, vendor_services, vendor_certifications, vendor_ratings | Email, SMS |
| **Financial Management** | FinanceController, InvoiceService, PaymentService, PDCService | /finance, /finance/invoices, /finance/pdc | invoices, payments, pdcs, transactions, expenses | Payment Gateway (Stripe), Email |
| **Asset Management** | AssetController, AssetService, MaintenanceHistoryService | /assets, /assets/[id], /assets/registry | assets, asset_specifications, maintenance_history, warranties | None |
| **Document & Compliance** | DocumentController, ComplianceService, AuditService | /documents, /compliance, /documents/upload | documents, compliance_requirements, audit_logs | Document Storage (S3) |
| **Parking Management** | ParkingController, ParkingService, AllocationService | /parking, /parking/allocations | parking_spots, parking_allocations, visitor_passes | None |
| **Reporting & Analytics** | ReportController, AnalyticsService, CustomReportService | /reports, /reports/custom, /reports/builder | All tables (custom queries) | None |
| **Communication & Notifications** | NotificationController, EmailService, SMSService, AnnouncementService | /announcements, /api/notifications | announcements, notifications, notification_preferences | Email (Gmail API), SMS (Twilio) |

---

## Technology Stack Details

### Core Technologies

**Backend Stack:**
- **Framework:** Spring Boot 3.x
- **Language:** Java 17 LTS
- **Build Tool:** Maven
- **Database:** PostgreSQL (latest stable)
- **ORM:** Spring Data JPA with Hibernate
- **Caching:** Spring Cache with Caffeine
- **Security:** Spring Security with JWT
- **API Documentation:** SpringDoc OpenAPI
- **Testing:** JUnit 5, Mockito, TestContainers

**Frontend Stack:**
- **Framework:** Next.js 15
- **Language:** TypeScript 5.x
- **UI Library:** React 18+
- **Component Library:** shadcn/ui
- **Styling:** Tailwind CSS 4.0
- **State Management:** TBD
- **Forms:** React Hook Form
- **Charts:** Recharts
- **Icons:** Lucide React
- **Testing:** Vitest, React Testing Library

**Infrastructure:**
- **Cloud Provider:** AWS (me-central-1 UAE Region)
- **Compute:** Amazon EKS (Kubernetes)
- **Database:** Amazon RDS PostgreSQL
- **Storage:** Amazon S3
- **CDN:** CloudFront
- **Load Balancer:** Application Load Balancer
- **Monitoring:** CloudWatch

### Integration Points

**External Services:**
- **Payment Gateways:** Stripe, PayPal
- **SMS:** Twilio or regional provider
- **Email:** Gmail API via Spring Mail
- **Calendar:** Google Calendar API

---

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents and developers.

### Backend Implementation Patterns (Java/Spring Boot)

#### Code Organization
- **Package Structure:** `com.ultrabms.{module}.{layer}`
  - `controller` - REST endpoints
  - `service` - Business logic
  - `repository` - Data access
  - `entity` - JPA entities
  - `dto` - Data transfer objects
  - `mapper` - Entity-DTO conversion
  - `exception` - Custom exceptions
  - `config` - Configuration classes

#### Naming Conventions
- **Classes:** PascalCase (e.g., `UserController`, `TenantService`)
- **Methods:** camelCase (e.g., `findTenantById`, `calculateRent`)
- **Variables:** camelCase (e.g., `tenantId`, `totalAmount`)
- **Constants:** ALL_CAPS (e.g., `MAX_FILE_SIZE`, `DEFAULT_PAGE_SIZE`)
- **REST Endpoints:** kebab-case (e.g., `/api/v1/work-orders`, `/api/v1/pdc-management`)

#### Controller Pattern
```java
@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
public class TenantController {
    private final TenantService tenantService;

    @GetMapping("/{id}")
    public ResponseEntity<TenantDto> getTenantById(@PathVariable Long id) {
        return ResponseEntity.ok(tenantService.findById(id));
    }
}
```

#### Service Pattern
- Use constructor injection (never field injection)
- Annotate with `@Service`
- Keep business logic in services, not controllers
- Use `@Transactional` for database operations
- Implement proper exception handling

#### Repository Pattern
- Extend `JpaRepository<Entity, ID>`
- Use Spring Data JPA query methods
- Custom queries use `@Query` annotation
- Repository names: `{Entity}Repository` (e.g., `TenantRepository`)

#### DTO Pattern
- Use records for immutable DTOs (Java 17+)
- Separate DTOs for request and response
- Use MapStruct for entity-DTO mapping
- Naming: `{Entity}Dto`, `{Entity}RequestDto`, `{Entity}ResponseDto`

#### Exception Handling
```java
@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(ex.getMessage(), "RESOURCE_NOT_FOUND"));
    }
}
```

#### Validation
- Use Bean Validation annotations (`@Valid`, `@NotNull`, `@Size`)
- Create custom validators when needed
- Validate in controllers, enforce in services

#### Async Processing
```java
@Async
public CompletableFuture<Void> sendEmailNotification(String email, String subject, String body) {
    // Email sending logic
    return CompletableFuture.completedFuture(null);
}
```

### Frontend Implementation Patterns (Next.js/React/TypeScript)

#### File and Folder Naming
- **Components:** PascalCase files (e.g., `TenantCard.tsx`)
- **Pages:** kebab-case directories (e.g., `tenants/[id]/page.tsx`)
- **Utilities:** kebab-case files (e.g., `format-currency.ts`)
- **Hooks:** camelCase with `use` prefix (e.g., `useAuth.ts`)

#### Component Pattern
```typescript
interface TenantCardProps {
  tenant: Tenant
  onEdit: (id: string) => void
}

export function TenantCard({ tenant, onEdit }: TenantCardProps) {
  const handleEdit = useCallback(() => {
    onEdit(tenant.id)
  }, [tenant.id, onEdit])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tenant.name}</CardTitle>
      </CardHeader>
      <CardContent>{/* Content */}</CardContent>
    </Card>
  )
}
```

#### Server Component Pattern (Default)
- Fetch data directly in server components
- Use async/await for data fetching
- Pass data to client components as props

```typescript
// app/(dashboard)/tenants/page.tsx
export default async function TenantsPage() {
  const tenants = await fetchTenants()
  return <TenantList tenants={tenants} />
}
```

#### Client Component Pattern
- Use `'use client'` directive when needed
- For event handlers, browser APIs, state management
- Keep client components small and focused

```typescript
'use client'

export function TenantForm() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: TenantFormData) => {
    setIsLoading(true)
    // Submit logic
  }

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>
}
```

#### State Management Pattern
```typescript
// store/slices/tenantSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchTenants = createAsyncThunk(
  'tenants/fetchAll',
  async () => {
    const response = await apiClient.get('/api/v1/tenants')
    return response.data
  }
)

const tenantSlice = createSlice({
  name: 'tenants',
  initialState: { data: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTenants.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchTenants.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
      })
  }
})
```

#### Form Pattern with React Hook Form + Zod
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const tenantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^\+?[0-9]{10,}$/, 'Invalid phone')
})

type TenantFormData = z.infer<typeof tenantSchema>

export function TenantForm() {
  const form = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema)
  })

  const onSubmit = form.handleSubmit(async (data) => {
    // Submit logic
  })

  return <form onSubmit={onSubmit}>{/* Form fields */}</form>
}
```

#### API Client Pattern
```typescript
// lib/api.ts
export const apiClient = {
  async get<T>(url: string): Promise<T> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    if (!response.ok) throw new Error('API Error')
    return response.json()
  }
}
```

#### Custom Hook Pattern
```typescript
export function useTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchTenants()
      .then(setTenants)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [])

  return { tenants, isLoading, error }
}
```

---

## Consistency Rules

### Backend Consistency Rules

#### API Response Format
**ALL APIs must return consistent response structure:**

```json
{
  "success": true,
  "data": { /* response payload */ },
  "message": "Operation successful",
  "timestamp": "2025-11-13T10:30:00Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Tenant with ID 123 not found",
    "field": "tenantId"
  },
  "timestamp": "2025-11-13T10:30:00Z"
}
```

#### REST API Conventions
- **Base URL:** `/api/v1`
- **Endpoints:** Plural nouns, kebab-case (e.g., `/api/v1/work-orders`)
- **HTTP Methods:**
  - `GET` - Retrieve resources
  - `POST` - Create resources
  - `PUT` - Full update
  - `PATCH` - Partial update
  - `DELETE` - Delete resources

#### Status Codes
- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Business logic conflict
- `500 Internal Server Error` - Server errors

#### Database Naming
- **Tables:** snake_case, plural (e.g., `work_orders`, `tenants`)
- **Columns:** snake_case (e.g., `first_name`, `created_at`)
- **Foreign Keys:** `{table}_id` (e.g., `tenant_id`, `property_id`)
- **Indexes:** `idx_{table}_{column}` (e.g., `idx_tenants_email`)
- **Constraints:** `uq_{table}_{column}` for unique, `fk_{table}_{ref}` for foreign keys

#### Date and Time Handling
- **Storage:** UTC timezone in database
- **API:** ISO 8601 format (`2025-11-13T10:30:00Z`)
- **Display:** Convert to user's timezone in frontend
- **Date Library:** Java 17 `java.time` (LocalDateTime, ZonedDateTime)

#### Logging Pattern
```java
@Slf4j
public class TenantService {
    public TenantDto createTenant(TenantRequestDto request) {
        log.info("Creating tenant: {}", request.getName());
        try {
            // Business logic
            log.debug("Tenant created successfully: {}", tenant.getId());
            return tenantDto;
        } catch (Exception e) {
            log.error("Failed to create tenant: {}", request.getName(), e);
            throw new TenantCreationException("Failed to create tenant", e);
        }
    }
}
```

**Log Levels:**
- `ERROR` - Errors requiring attention
- `WARN` - Warning conditions
- `INFO` - Important events (user actions, system events)
- `DEBUG` - Detailed debugging information

#### Error Message Format
- **User-facing:** Clear, actionable, non-technical
  - ✓ "Email address already exists. Please use a different email."
  - ✗ "Duplicate key violation on unique constraint uq_users_email"

- **Internal logs:** Technical details with context
  - `log.error("Database constraint violation: {}, User: {}", exception, userId)`

### Frontend Consistency Rules

#### Component Naming
- **Components:** PascalCase (e.g., `TenantCard`, `MaintenanceForm`)
- **Props interfaces:** `{Component}Props` (e.g., `TenantCardProps`)
- **Event handlers:** `handle{Action}` (e.g., `handleSubmit`, `handleDelete`)
- **Boolean variables:** `is/has/can` prefix (e.g., `isLoading`, `hasError`, `canEdit`)

#### File Organization
```
components/
  ├── ui/              # shadcn components
  ├── forms/           # Form components
  ├── tables/          # Table components
  ├── charts/          # Chart components
  └── layout/          # Layout components
```

#### Import Order
1. React and Next.js imports
2. Third-party libraries
3. UI components (shadcn/ui)
4. Local components
5. Utilities and types
6. Styles

```typescript
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { TenantCard } from '@/components/tenants/tenant-card'
import { formatCurrency } from '@/lib/utils'
import type { Tenant } from '@/types'
```

#### TypeScript Strict Mode
- Enable strict mode in `tsconfig.json`
- Define explicit types for all props, state, and functions
- Use interfaces for object shapes
- Use type for unions and primitives
- Avoid `any` - use `unknown` if type is truly unknown

#### Currency Formatting
```typescript
// ALWAYS use AED
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2
  }).format(amount)
}
```

#### Date Formatting
```typescript
import { format } from 'date-fns'

// Display dates
format(date, 'dd MMM yyyy') // "13 Nov 2025"
format(date, 'dd/MM/yyyy')  // "13/11/2025"

// Time
format(date, 'hh:mm a')     // "10:30 AM"
```

#### Styling Conventions
- Use Tailwind utility classes
- Mobile-first responsive design
- Consistent spacing: `gap-4`, `space-y-4`, `px-4`, `py-2`
- Dark theme support via CSS variables
- Color palette: Blue/teal accents on dark background

#### Form Validation Messages
```typescript
const validationMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number (+971XXXXXXXXX)',
  minLength: (min: number) => `Minimum ${min} characters required`,
  maxLength: (max: number) => `Maximum ${max} characters allowed`
}
```

#### Loading States
```typescript
// Always show loading indicators
{isLoading ? (
  <div className="flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
) : (
  <DataTable data={data} />
)}
```

#### Error Handling
```typescript
// Display user-friendly errors
{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{error.message}</AlertDescription>
  </Alert>
)}
```

---

## Data Architecture

### Database Schema Overview

#### Core Entities

**Users & Authentication**
```sql
users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  role_id BIGINT REFERENCES roles(id),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

roles (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL, -- SUPER_ADMIN, PROPERTY_MANAGER, etc.
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)

permissions (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(50),
  action VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
)

role_permissions (
  role_id BIGINT REFERENCES roles(id),
  permission_id BIGINT REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
)
```

**Properties & Units**
```sql
properties (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  total_units INTEGER,
  property_manager_id BIGINT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

units (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT REFERENCES properties(id),
  unit_number VARCHAR(50) NOT NULL,
  floor INTEGER,
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  area_sqft DECIMAL(10,2),
  unit_type VARCHAR(50), -- APARTMENT, VILLA, OFFICE
  status VARCHAR(50) DEFAULT 'VACANT', -- VACANT, OCCUPIED, MAINTENANCE
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(property_id, unit_number)
)
```

**Tenants & Leases**
```sql
tenants (
  id BIGSERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) NOT NULL,
  alternate_phone VARCHAR(20),
  id_number VARCHAR(50), -- Emirates ID / Passport
  id_expiry DATE,
  visa_number VARCHAR(50),
  visa_expiry DATE,
  nationality VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

leases (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT REFERENCES tenants(id),
  unit_id BIGINT REFERENCES units(id),
  lease_number VARCHAR(50) UNIQUE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rent_amount DECIMAL(12,2) NOT NULL,
  admin_fee DECIMAL(12,2),
  service_charge DECIMAL(12,2),
  parking_fee DECIMAL(12,2),
  security_deposit DECIMAL(12,2),
  payment_frequency VARCHAR(20), -- MONTHLY, QUARTERLY, ANNUAL
  status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, TERMINATED
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

tenant_documents (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT REFERENCES tenants(id),
  document_type VARCHAR(100), -- ID_COPY, VISA_COPY, CONTRACT, etc.
  file_name VARCHAR(255),
  file_path VARCHAR(500), -- S3 path
  file_size BIGINT,
  uploaded_by BIGINT REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
)
```

**Maintenance Management**
```sql
work_orders (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT REFERENCES properties(id),
  unit_id BIGINT REFERENCES units(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- PLUMBING, ELECTRICAL, HVAC, etc.
  priority VARCHAR(20) DEFAULT 'MEDIUM', -- HIGH, MEDIUM, LOW
  status VARCHAR(50) DEFAULT 'OPEN', -- OPEN, ASSIGNED, IN_PROGRESS, COMPLETED
  assigned_to BIGINT REFERENCES vendors(id),
  requested_by BIGINT REFERENCES users(id),
  scheduled_date TIMESTAMP,
  completed_date TIMESTAMP,
  estimated_cost DECIMAL(12,2),
  actual_cost DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

pm_schedules (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  frequency VARCHAR(50), -- DAILY, WEEKLY, MONTHLY, QUARTERLY, ANNUAL
  next_due_date DATE NOT NULL,
  asset_id BIGINT REFERENCES assets(id),
  property_id BIGINT REFERENCES properties(id),
  assigned_vendor_id BIGINT REFERENCES vendors(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

job_history (
  id BIGSERIAL PRIMARY KEY,
  work_order_id BIGINT REFERENCES work_orders(id),
  action VARCHAR(100), -- STATUS_CHANGED, ASSIGNED, COMMENT_ADDED
  performed_by BIGINT REFERENCES users(id),
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)
```

**Vendor Management**
```sql
vendors (
  id BIGSERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  trade_license VARCHAR(100),
  license_expiry DATE,
  insurance_number VARCHAR(100),
  insurance_expiry DATE,
  bank_name VARCHAR(100),
  account_number VARCHAR(50),
  iban VARCHAR(50),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  rating DECIMAL(3,2), -- Average rating out of 5
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

vendor_services (
  id BIGSERIAL PRIMARY KEY,
  vendor_id BIGINT REFERENCES vendors(id),
  service_category VARCHAR(100),
  hourly_rate DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
)

vendor_ratings (
  id BIGSERIAL PRIMARY KEY,
  vendor_id BIGINT REFERENCES vendors(id),
  work_order_id BIGINT REFERENCES work_orders(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  quality_score INTEGER,
  timeliness_score INTEGER,
  communication_score INTEGER,
  comments TEXT,
  rated_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
)
```

**Financial Management**
```sql
invoices (
  id BIGSERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  tenant_id BIGINT REFERENCES tenants(id),
  lease_id BIGINT REFERENCES leases(id),
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PAID, OVERDUE, CANCELLED
  invoice_type VARCHAR(50), -- RENT, SERVICE_CHARGE, UTILITY, LATE_FEE
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

payments (
  id BIGSERIAL PRIMARY KEY,
  invoice_id BIGINT REFERENCES invoices(id),
  payment_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50), -- CASH, BANK_TRANSFER, CARD, PDC
  transaction_reference VARCHAR(100),
  notes TEXT,
  received_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
)

-- PDC (Post-Dated Cheque) Management - NOVEL PATTERN for MENA region
pdcs (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT REFERENCES tenants(id),
  lease_id BIGINT REFERENCES leases(id),
  cheque_number VARCHAR(50) NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  cheque_date DATE NOT NULL,
  deposit_date DATE,
  status VARCHAR(50) DEFAULT 'RECEIVED', -- RECEIVED, DEPOSITED, CLEARED, BOUNCED, WITHDRAWN
  bounce_reason TEXT,
  replacement_pdc_id BIGINT REFERENCES pdcs(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

transactions (
  id BIGSERIAL PRIMARY KEY,
  transaction_date DATE NOT NULL,
  transaction_type VARCHAR(50), -- INCOME, EXPENSE
  category VARCHAR(100),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  property_id BIGINT REFERENCES properties(id),
  vendor_id BIGINT REFERENCES vendors(id),
  invoice_id BIGINT REFERENCES invoices(id),
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
)

expenses (
  id BIGSERIAL PRIMARY KEY,
  expense_date DATE NOT NULL,
  category VARCHAR(100), -- MAINTENANCE, UTILITY, SALARY, etc.
  amount DECIMAL(12,2) NOT NULL,
  vendor_id BIGINT REFERENCES vendors(id),
  property_id BIGINT REFERENCES properties(id),
  description TEXT,
  receipt_path VARCHAR(500), -- S3 path
  approved_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
)
```

**Asset Management**
```sql
assets (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT REFERENCES properties(id),
  unit_id BIGINT REFERENCES units(id),
  asset_tag VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100), -- HVAC, ELEVATOR, GENERATOR, etc.
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  purchase_date DATE,
  purchase_cost DECIMAL(12,2),
  warranty_expiry DATE,
  status VARCHAR(50) DEFAULT 'OPERATIONAL',
  location_details TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

maintenance_history (
  id BIGSERIAL PRIMARY KEY,
  asset_id BIGINT REFERENCES assets(id),
  work_order_id BIGINT REFERENCES work_orders(id),
  maintenance_date DATE NOT NULL,
  maintenance_type VARCHAR(50), -- PREVENTIVE, CORRECTIVE, INSPECTION
  cost DECIMAL(12,2),
  notes TEXT,
  performed_by BIGINT REFERENCES vendors(id),
  created_at TIMESTAMP DEFAULT NOW()
)
```

**Parking Management**
```sql
parking_spots (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT REFERENCES properties(id),
  spot_number VARCHAR(50) NOT NULL,
  spot_type VARCHAR(50), -- RESIDENT, VISITOR, RESERVED, DISABLED
  floor_level VARCHAR(50),
  status VARCHAR(50) DEFAULT 'AVAILABLE', -- AVAILABLE, OCCUPIED, RESERVED
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(property_id, spot_number)
)

parking_allocations (
  id BIGSERIAL PRIMARY KEY,
  parking_spot_id BIGINT REFERENCES parking_spots(id),
  tenant_id BIGINT REFERENCES tenants(id),
  lease_id BIGINT REFERENCES leases(id),
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_plate VARCHAR(50),
  allocation_date DATE NOT NULL,
  release_date DATE,
  monthly_fee DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
)

visitor_passes (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT REFERENCES properties(id),
  parking_spot_id BIGINT REFERENCES parking_spots(id),
  visitor_name VARCHAR(100),
  vehicle_plate VARCHAR(50),
  visit_date DATE NOT NULL,
  entry_time TIMESTAMP,
  exit_time TIMESTAMP,
  approved_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
)
```

**Documents & Compliance**
```sql
documents (
  id BIGSERIAL PRIMARY KEY,
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(100),
  category VARCHAR(100), -- CONTRACT, LICENSE, CERTIFICATE, REPORT
  file_path VARCHAR(500), -- S3 path
  file_size BIGINT,
  version INTEGER DEFAULT 1,
  expiry_date DATE,
  property_id BIGINT REFERENCES properties(id),
  uploaded_by BIGINT REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
)

compliance_requirements (
  id BIGSERIAL PRIMARY KEY,
  requirement_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- SAFETY, REGULATORY, INSURANCE
  frequency VARCHAR(50), -- ANNUAL, QUARTERLY, etc.
  next_due_date DATE NOT NULL,
  property_id BIGINT REFERENCES properties(id),
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT NOW()
)

audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100), -- TENANT, INVOICE, WORK_ORDER, etc.
  entity_id BIGINT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  details JSONB, -- Additional context
  created_at TIMESTAMP DEFAULT NOW()
)
```

**Communication & Notifications**
```sql
announcements (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  property_id BIGINT REFERENCES properties(id),
  target_audience VARCHAR(50), -- ALL, TENANTS, VENDORS, STAFF
  priority VARCHAR(20) DEFAULT 'NORMAL', -- URGENT, NORMAL
  published_by BIGINT REFERENCES users(id),
  published_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
)

notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  notification_type VARCHAR(100), -- EMAIL, SMS, IN_APP
  subject VARCHAR(255),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP
)

notification_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  event_type VARCHAR(100), -- LEASE_EXPIRY, PAYMENT_DUE, WORK_ORDER_UPDATE
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  in_app_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, event_type)
)
```

### Key Indexes

```sql
-- Performance-critical indexes
CREATE INDEX idx_tenants_email ON tenants(email);
CREATE INDEX idx_leases_tenant_id ON leases(tenant_id);
CREATE INDEX idx_leases_status ON leases(status);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_property_id ON work_orders(property_id);
CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_pdcs_status ON pdcs(status);
CREATE INDEX idx_pdcs_cheque_date ON pdcs(cheque_date);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### Data Relationships

- **One-to-Many:** Property → Units, Property → Tenants, Tenant → Leases
- **Many-to-Many:** Roles ↔ Permissions (via role_permissions)
- **Self-Referencing:** PDCs (replacement_pdc_id for bounced cheque replacements)

### Data Integrity Rules

1. **Cascade Deletes:** Disabled by default - use soft deletes via `is_deleted` flag
2. **Referential Integrity:** All foreign keys enforced at database level
3. **Unique Constraints:** Email (users, tenants), invoice_number, cheque_number
4. **Check Constraints:** Ratings (1-5), positive amounts, valid date ranges

---

## Novel Architectural Patterns

### PDC (Post-Dated Cheque) Management - MENA Region Specific

#### Pattern Overview
PDC management is unique to the MENA region where tenants provide post-dated cheques for future rent payments. This requires specialized tracking and workflow automation.

#### Components
```
PDCService → PDCRepository → pdcs table
     ↓
PDCScheduler (@Scheduled)
     ↓
NotificationService (reminders before deposit date)
     ↓
BankDepositWorkflow (manual confirmation)
     ↓
PDCStatusTransitions (RECEIVED → DEPOSITED → CLEARED/BOUNCED)
```

#### State Machine
```
RECEIVED → User receives PDC from tenant
    ↓
DEPOSITED → PDC submitted to bank on cheque_date
    ↓
CLEARED → Bank confirms payment
    OR
BOUNCED → Payment failed
        ↓
REPLACEMENT_REQUESTED → Link to new PDC
```

#### Implementation Guide

**Backend Service:**
```java
@Service
@RequiredArgsConstructor
public class PDCService {
    private final PDCRepository pdcRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 9 * * *") // Daily at 9 AM
    public void checkUpcomingDeposits() {
        LocalDate threeDaysFromNow = LocalDate.now().plusDays(3);
        List<PDC> upcomingPDCs = pdcRepository.findByChequeDateAndStatus(
            threeDaysFromNow, PDCStatus.RECEIVED
        );

        upcomingPDCs.forEach(pdc -> {
            notificationService.sendPDCReminder(pdc);
        });
    }

    @Transactional
    public void handleBouncedPDC(Long pdcId, String bounceReason) {
        PDC pdc = pdcRepository.findById(pdcId)
            .orElseThrow(() -> new ResourceNotFoundException("PDC not found"));

        pdc.setStatus(PDCStatus.BOUNCED);
        pdc.setBounceReason(bounceReason);
        pdcRepository.save(pdc);

        // Notify tenant and property manager
        notificationService.sendBouncedPDCAlert(pdc);

        // Apply late fees
        invoiceService.applyLateFee(pdc.getLeaseId());
    }
}
```

**Frontend Component:**
```typescript
export function PDCDashboard() {
  const { pdcs, isLoading } = usePDCs({ status: 'RECEIVED' })
  const dueSoon = pdcs.filter(pdc =>
    differenceInDays(new Date(pdc.chequeDate), new Date()) <= 3
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>PDCs Due for Deposit</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {dueSoon.map(pdc => (
              <TableRow key={pdc.id}>
                <TableCell>{pdc.tenant Name}</TableCell>
                <TableCell>{formatCurrency(pdc.amount)}</TableCell>
                <TableCell>{format(new Date(pdc.chequeDate), 'dd MMM yyyy')}</TableCell>
                <TableCell>
                  <Button onClick={() => markAsDeposited(pdc.id)}>
                    Mark Deposited
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
```

### Preventive Maintenance Automation

#### Pattern Overview
Automatically generate work orders based on PM schedules with configurable frequencies.

#### Components
```
PMScheduleService → PMScheduleRepository
     ↓
PMScheduler (@Scheduled - daily check)
     ↓
WorkOrderService (auto-create work orders)
     ↓
VendorAssignmentService (auto-assign based on service category)
     ↓
NotificationService (notify vendors)
```

#### Implementation
```java
@Service
@RequiredArgsConstructor
public class PMScheduleService {
    private final PMScheduleRepository pmScheduleRepository;
    private final WorkOrderService workOrderService;

    @Scheduled(cron = "0 0 8 * * *") // Daily at 8 AM
    public void generatePMWorkOrders() {
        List<PMSchedule> dueSchedules = pmScheduleRepository
            .findByNextDueDateLessThanEqualAndIsActiveTrue(LocalDate.now());

        dueSchedules.forEach(schedule -> {
            // Create work order
            WorkOrder workOrder = workOrderService.createFromPMSchedule(schedule);

            // Update next due date based on frequency
            schedule.setNextDueDate(calculateNextDueDate(schedule));
            pmScheduleRepository.save(schedule);

            log.info("Generated PM work order {} for schedule {}",
                workOrder.getId(), schedule.getId());
        });
    }

    private LocalDate calculateNextDueDate(PMSchedule schedule) {
        return switch (schedule.getFrequency()) {
            case DAILY -> LocalDate.now().plusDays(1);
            case WEEKLY -> LocalDate.now().plusWeeks(1);
            case MONTHLY -> LocalDate.now().plusMonths(1);
            case QUARTERLY -> LocalDate.now().plusMonths(3);
            case ANNUAL -> LocalDate.now().plusYears(1);
        };
    }
}
```

### Vendor Performance Scoring

#### Pattern Overview
Aggregate vendor ratings across multiple dimensions to generate overall performance scores.

#### Algorithm
```
Overall Rating = (Quality * 0.4) + (Timeliness * 0.3) + (Communication * 0.2) + (Cost * 0.1)

Where:
- Quality: Average of quality_score from vendor_ratings
- Timeliness: % of jobs completed on/before scheduled_date
- Communication: Average of communication_score
- Cost: Ratio of actual_cost to estimated_cost (lower is better)
```

#### Implementation
```java
@Service
public class VendorPerformanceService {
    public VendorPerformanceDto calculatePerformance(Long vendorId) {
        List<VendorRating> ratings = vendorRatingRepository
            .findByVendorId(vendorId);

        double qualityScore = ratings.stream()
            .mapToInt(VendorRating::getQualityScore)
            .average()
            .orElse(0.0);

        double timelinessScore = calculateTimelinessScore(vendorId);
        double communicationScore = ratings.stream()
            .mapToInt(VendorRating::getCommunicationScore)
            .average()
            .orElse(0.0);

        double overallScore = (qualityScore * 0.4) +
                              (timelinessScore * 0.3) +
                              (communicationScore * 0.2) +
                              (calculateCostScore(vendorId) * 0.1);

        return new VendorPerformanceDto(
            vendorId, overallScore, qualityScore,
            timelinessScore, communicationScore
        );
    }
}
```

---

## API Contracts

### Authentication APIs

**POST /api/v1/auth/login**
```json
Request:
{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response (200):
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600,
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "PROPERTY_MANAGER"
    }
  },
  "timestamp": "2025-11-13T10:30:00Z"
}
```

**POST /api/v1/auth/refresh**
**POST /api/v1/auth/logout**
**POST /api/v1/auth/forgot-password**
**POST /api/v1/auth/reset-password**

### Tenant APIs

**GET /api/v1/tenants** - List tenants (paginated)
**GET /api/v1/tenants/{id}** - Get tenant details
**POST /api/v1/tenants** - Create tenant
**PUT /api/v1/tenants/{id}** - Update tenant
**DELETE /api/v1/tenants/{id}** - Soft delete tenant

**GET /api/v1/tenants/{id}/leases** - Get tenant leases
**GET /api/v1/tenants/{id}/invoices** - Get tenant invoices
**GET /api/v1/tenants/{id}/documents** - Get tenant documents

### Work Order APIs

**GET /api/v1/work-orders** - List work orders (with filters)
```
Query params:
  status: OPEN,ASSIGNED,IN_PROGRESS,COMPLETED
  priority: HIGH,MEDIUM,LOW
  propertyId: Long
  page: int (default 0)
  size: int (default 20)
```

**POST /api/v1/work-orders** - Create work order
**PATCH /api/v1/work-orders/{id}/status** - Update status
**POST /api/v1/work-orders/{id}/assign** - Assign to vendor

### Financial APIs

**GET /api/v1/invoices** - List invoices
**POST /api/v1/invoices** - Generate invoice
**POST /api/v1/invoices/{id}/payments** - Record payment

**GET /api/v1/pdcs** - List PDCs
**POST /api/v1/pdcs** - Register PDC
**PATCH /api/v1/pdcs/{id}/deposit** - Mark as deposited
**PATCH /api/v1/pdcs/{id}/bounce** - Mark as bounced

### Dashboard APIs

**GET /api/v1/dashboard/executive** - Executive dashboard metrics
```json
Response:
{
  "success": true,
  "data": {
    "netProfitLoss": 125000.00,
    "occupancyRate": 92.5,
    "overdueMaintenance": 12,
    "leadToLeaseConversion": 68.5,
    "upcomingPMJobs": [
      { "category": "HVAC", "count": 5 },
      { "category": "ELECTRICAL", "count": 3 }
    ],
    "leaseExpirations": [
      { "month": "Dec 2025", "count": 8 },
      { "month": "Jan 2026", "count": 12 }
    ]
  }
}
```

---

## Security Architecture

### Authentication & Authorization

#### JWT-Based Authentication
- **Access Token:** 1 hour expiry
- **Refresh Token:** 7 days expiry
- **Token Storage:** HttpOnly cookies (frontend)
- **Algorithm:** HS256 (HMAC with SHA-256)

#### Spring Security Configuration
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("SUPER_ADMIN")
                .requestMatchers("/api/v1/**").authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(authEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            );
        return http.build();
    }
}
```

### Role-Based Access Control (RBAC)

#### Roles
1. **SUPER_ADMIN** - Full system access
2. **PROPERTY_MANAGER** - Property-specific management
3. **MAINTENANCE_SUPERVISOR** - Work orders, vendors
4. **FINANCE_MANAGER** - Financial operations only
5. **TENANT** - Self-service portal
6. **VENDOR** - Job view and updates

#### Permission Model
```
Permission = Resource + Action
Examples:
- tenants:create
- work-orders:view
- invoices:edit
- pdcs:delete
```

### Data Security

#### Encryption
- **At Rest:** AES-256 encryption for sensitive fields (passwords, documents)
- **In Transit:** TLS 1.3 for all API communications
- **Password Storage:** BCrypt with salt (cost factor 12)

#### Sensitive Data Handling
```java
@Entity
public class User {
    @Convert(converter = EncryptionConverter.class)
    private String phoneNumber;

    @Convert(converter = EncryptionConverter.class)
    private String idNumber;
}
```

### API Security

#### Rate Limiting
- **Per IP:** 100 requests/minute
- **Per User:** 1000 requests/hour
- **Authentication endpoints:** 5 attempts/15 minutes

#### CORS Configuration
```yaml
cors:
  allowed-origins:
    - https://ultrabms.com
    - https://app.ultrabms.com
  allowed-methods: GET,POST,PUT,PATCH,DELETE
  allowed-headers: Authorization,Content-Type
  max-age: 3600
```

### Audit Logging
- All user actions logged to `audit_logs` table
- Includes: user_id, action, entity, IP address, timestamp
- Retention: 7 years (compliance requirement)
- Log sensitive operations: login, data access, modifications

---

## Performance Considerations

### Caching Strategy

#### Application-Level Caching (Caffeine)
```java
@Configuration
@EnableCaching
public class CacheConfig {
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
            "users", "properties", "tenants", "vendors"
        );
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterWrite(10, TimeUnit.MINUTES)
            .recordStats());
        return cacheManager;
    }
}

// Usage
@Cacheable(value = "tenants", key = "#id")
public TenantDto findById(Long id) { ... }

@CacheEvict(value = "tenants", key = "#id")
public void updateTenant(Long id, TenantDto dto) { ... }
```

#### Frontend Caching (React Query)
```typescript
export function useTenants() {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: fetchTenants,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  })
}
```

### Database Optimization

#### Query Optimization
- Use indexed columns in WHERE clauses
- Fetch only required columns (SELECT specific fields)
- Use JOIN FETCH for N+1 query prevention
- Implement pagination for large result sets

#### Connection Pooling
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

### API Performance

#### Response Time Targets
- **Dashboard APIs:** < 500ms
- **CRUD APIs:** < 200ms
- **Report APIs:** < 2 seconds
- **Search APIs:** < 300ms

#### Optimization Techniques
1. **Database Indexing:** All frequently queried columns
2. **Pagination:** Default page size 20, max 100
3. **Async Operations:** Email, SMS, file uploads
4. **Lazy Loading:** Load related entities on demand
5. **DTO Projections:** Return only necessary data

### Frontend Performance

#### Code Splitting
```typescript
// Route-based code splitting
const TenantsPage = lazy(() => import('@/app/(dashboard)/tenants/page'))
const MaintenancePage = lazy(() => import('@/app/(dashboard)/maintenance/page'))
```

#### Image Optimization
- Use Next.js Image component
- WebP format with fallbacks
- Lazy loading for images
- Responsive image sizes

#### Bundle Optimization
- Tree shaking enabled
- Dead code elimination
- Minification in production
- Gzip compression

---

## Deployment Architecture

### AWS Infrastructure (UAE Region)

#### Compute
```
Application Load Balancer (ALB)
    ↓
Amazon EKS Cluster (Kubernetes)
    ├── Backend Pods (Spring Boot) - Auto-scaling 2-10 instances
    └── Frontend Pods (Next.js) - Auto-scaling 2-10 instances
```

#### Database
- **Primary:** Amazon RDS PostgreSQL 17.6
- **Instance:** db.r6g.xlarge (4 vCPU, 32 GB RAM)
- **Multi-AZ:** Enabled for high availability
- **Automated Backups:** Daily, 7-day retention
- **Read Replicas:** 1 replica for reporting queries

#### Storage
- **Application Storage:** Amazon S3 (UAE region)
- **CDN:** CloudFront for static assets
- **Bucket Structure:**
  - `ultra-bms-documents` - Tenant/vendor documents
  - `ultra-bms-assets` - Property photos, assets
  - `ultra-bms-backups` - Database backups

#### Monitoring & Logging
- **Application Logs:** CloudWatch Logs
- **Metrics:** CloudWatch Metrics
- **Alarms:** CPU > 80%, Memory > 85%, Error rate > 1%
- **APM:** AWS X-Ray for distributed tracing

### CI/CD Pipeline

```
GitHub Repository
    ↓
GitHub Actions (CI)
    ├── Run Tests
    ├── Build Docker Images
    └── Push to ECR
    ↓
ArgoCD (CD)
    ├── Deploy to Staging
    ├── Run Integration Tests
    └── Deploy to Production
```

### Environment Configuration

#### Development
- Local PostgreSQL
- Local file storage
- Mock external services

#### Staging
- AWS RDS (smaller instance)
- S3 storage
- Real external services (test mode)

#### Production
- Full AWS infrastructure
- Multi-AZ deployment
- Real external services
- Auto-scaling enabled

### Disaster Recovery

#### Backup Strategy
- **Database:** Automated daily backups, 7-day retention
- **Documents:** S3 versioning enabled, 30-day retention
- **Application Config:** Git-based, versioned

#### Recovery Objectives
- **RPO (Recovery Point Objective):** < 1 hour
- **RTO (Recovery Time Objective):** < 4 hours

#### Failover Process
1. Detect failure via health checks
2. Promote read replica to primary (if database failure)
3. Route traffic to standby region (if regional failure)
4. Notify operations team

---

## Development Environment

### Prerequisites

- **Java:** JDK 17 or higher
- **Node.js:** 18.x or higher
- **npm/pnpm:** Latest version
- **PostgreSQL:** 14+ for local development
- **IDE:** IntelliJ IDEA / VS Code
- **Git:** Latest version

### Setup Commands

```bash
# Clone repository
git clone <repository-url>
cd ultra-bms

# Backend setup
cd ultra-bms-backend
./mvnw clean install
./mvnw spring-boot:run

# Frontend setup
cd ultra-bms-frontend
npm install
npm run dev
```

---

## Architecture Decision Records (ADRs)

### ADR-001: Use Next.js Instead of Vite + React

**Status:** Accepted
**Date:** 2025-11-13
**Decision:** Use Next.js 15 for frontend instead of Vite + React

**Context:**
Initial plan was to use Vite + React + TypeScript. However, Next.js provides significant advantages for enterprise applications.

**Decision:**
Adopt Next.js 15 with App Router for the frontend framework.

**Rationale:**
- Built-in SSR and SSG capabilities
- API routes eliminate need for separate BFF layer
- Automatic code splitting and optimization
- Better SEO support
- Production-ready out of the box
- Excellent TypeScript support
- Strong ecosystem and community

**Consequences:**
- Learning curve for team members unfamiliar with Next.js
- Server-side rendering considerations for components
- Slightly more complex deployment than SPA

---

### ADR-002: No Redis, Use Spring Cache with Caffeine

**Status:** Accepted
**Date:** 2025-11-13
**Decision:** Use Spring Cache with Caffeine instead of Redis

**Context:**
PRD specified Redis for caching, but for a monolithic application, this adds operational complexity.

**Decision:**
Use Spring Boot's built-in caching with Caffeine as the cache provider.

**Rationale:**
- Simplifies deployment (no external cache server)
- Sufficient for monolithic architecture
- Lower operational overhead
- Good performance for application-level caching
- Easy to migrate to Redis later if needed

**Consequences:**
- Cache is not shared across instances (acceptable for now)
- Limited to JVM memory constraints
- May need Redis in future for distributed caching

---

### ADR-003: No RabbitMQ, Use Spring @Async

**Status:** Accepted
**Date:** 2025-11-13
**Decision:** Use Spring @Async and @Scheduled instead of RabbitMQ

**Context:**
PRD specified RabbitMQ for async processing. For a single backend service, this adds complexity.

**Decision:**
Use Spring's built-in async capabilities (@Async, @Scheduled, ThreadPoolTaskExecutor).

**Rationale:**
- Simpler architecture for monolith
- No external message broker to manage
- Sufficient for email, SMS, scheduled jobs
- Lower operational complexity
- Can add message queue later if scaling requires it

**Consequences:**
- No persistent message queue
- Limited to single application instance for scheduled jobs
- May need distributed job scheduler in future

---

### ADR-004: AED Currency Only

**Status:** Accepted
**Date:** 2025-11-13
**Decision:** Support only AED currency

**Context:**
PRD mentioned multi-currency support, but business operates primarily in UAE.

**Decision:**
Single currency (AED) support only.

**Rationale:**
- Simplifies financial calculations
- No exchange rate management needed
- Simpler reporting and analytics
- Easier compliance and tax handling
- Can add multi-currency later if needed

**Consequences:**
- Cannot support international properties initially
- Future expansion may require significant refactoring

---

### ADR-005: shadcn/ui MCP Server Integration

**Status:** Accepted
**Date:** 2025-11-13
**Decision:** Use shadcn/ui MCP server for AI-assisted component development

**Context:**
AI agents need accurate component documentation and props for consistent UI development.

**Decision:**
Configure shadcn/ui MCP server to provide component context to AI agents.

**Rationale:**
- Eliminates AI hallucinations about component APIs
- Provides accurate TypeScript prop definitions
- Speeds up development with AI assistance
- Ensures component usage consistency
- Direct access to shadcn/ui registry

**Consequences:**
- Requires MCP server to be running
- AI agents dependent on MCP availability
- Team needs to understand MCP workflow

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: November 13, 2025_
_For: Nata_
