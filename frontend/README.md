# Ultra BMS Frontend

Next.js 16 frontend for Ultra Building Maintenance System with comprehensive authentication and session management.

## Prerequisites

- Node.js 18+ or 20+
- npm or pnpm
- Backend API running on port 8080

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Run development server
npm run dev

# Open http://localhost:3000
```

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Code Quality

```bash
# Lint
npm run lint
npm run lint:fix

# Format
npm run format
npm run format:check
```

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Authentication

Ultra BMS implements a comprehensive JWT-based authentication system with:

- ✅ Login / Registration
- ✅ Password Reset Flow
- ✅ Role-Based Access Control (RBAC)
- ✅ Session Management
- ✅ Active Sessions Monitoring
- ✅ Change Password
- ✅ Session Expiry Warning
- ✅ CSRF Protection
- ✅ Automatic Token Refresh
- ✅ Password Strength Validation (zxcvbn)
- ✅ Server & Client Route Protection

### Quick Auth Usage

```typescript
// In any component
import { useAuth, usePermission } from '@/contexts/auth-context';

// Get auth state
const { user, isAuthenticated, login, logout } = useAuth();

// Check permissions
const { hasRole, hasPermission } = usePermission();

if (hasRole('SUPER_ADMIN')) {
  // Show admin features
}

// Protect routes
import { ProtectedRoute } from '@/components/auth';

<ProtectedRoute requiredRole="PROPERTY_MANAGER">
  <PropertyManagement />
</ProtectedRoute>
```

**📖 Full Authentication Documentation:** [docs/AUTHENTICATION.md](./docs/AUTHENTICATION.md)

## Project Structure

```
src/
├── app/                      # App router pages
│   ├── (auth)/               # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (dashboard)/          # Protected dashboard pages
│   │   └── settings/
│   │       └── security/     # Security settings
│   ├── 403/                  # Forbidden page
│   ├── layout.tsx            # Root layout with AuthProvider
│   └── middleware.ts         # Route protection middleware
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── auth/                 # Auth components (ProtectedRoute)
│   ├── forms/                # Reusable form components
│   │   ├── password-input.tsx
│   │   ├── password-strength-meter.tsx
│   │   └── submit-button.tsx
│   └── layout/               # Layout components
│       └── auth-layout.tsx
├── contexts/
│   └── auth-context.tsx      # Authentication context & hooks
├── lib/
│   ├── api.ts                # Axios client with interceptors
│   ├── auth-api.ts           # Authentication API service
│   ├── jwt-utils.ts          # JWT helper functions
│   └── utils.ts              # General utilities
├── schemas/
│   └── authSchemas.ts        # Zod validation schemas
├── types/
│   ├── index.ts              # Common types
│   └── auth.ts               # Authentication types
├── hooks/                    # Custom React hooks
└── tests/
    └── auth.spec.ts          # E2E authentication tests
```

## Tech Stack

### Core
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type safety

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS
- **shadcn/ui** - Accessible component library
- **Radix UI** - Headless UI primitives
- **Lucide React** - Icon library

### Forms & Validation
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **@hookform/resolvers** - RHF + Zod integration
- **zxcvbn** - Password strength estimation

### API & State
- **Axios** - HTTP client with interceptors
- **React Context API** - Global auth state
- **jwt-decode** - JWT token parsing

### Data Visualization
- **Recharts** - Charts and graphs
- **date-fns** - Date formatting

### Testing
- **Playwright** - E2E testing
- **@faker-js/faker** - Test data generation

### Developer Experience
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit linting

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Run E2E tests with UI |
| `npm run test:e2e:headed` | Run E2E tests in headed mode |
| `npm run test:e2e:debug` | Debug E2E tests |

## Key Features

### Authentication & Security
- JWT-based authentication
- Access tokens (1 hour) + Refresh tokens (7 days)
- HTTP-only cookies for refresh tokens
- Automatic token refresh
- CSRF protection
- Session management with device tracking
- Password strength validation
- Rate limiting support

### User Management
- User registration with email verification
- Login with "Remember me"
- Password reset via email
- Change password
- Active session management
- Multi-device logout

### Route Protection
- Server-side middleware protection
- Client-side ProtectedRoute component
- Role-based access control
- Permission-based access control
- 403 Forbidden page

### UI/UX
- Responsive design (mobile, tablet, desktop)
- Dark mode ready (design system in place)
- Loading states and skeletons
- Toast notifications (Sonner)
- Form validation with real-time feedback
- Password strength meter
- Session expiry warnings
- Accessibility (WCAG AA compliant)

## Testing

Ultra BMS has comprehensive E2E test coverage for all authentication and authorization flows.

**📊 [View Detailed Testing Status Report](./TESTING-STATUS.md)** - Current test results, known issues, and fix guide

### Test Suite Overview

**Total Test Files:** 6
**Total Test Cases:** ~117 (Chrome-only, 3x faster)
**Framework:** Playwright
**Browser:** Chrome (Chromium) only

| Test Suite | File | Test Cases | Type | Status |
|------------|------|-----------|------|--------|
| **UI Only** | `tests/e2e/ui-only.spec.ts` | 17 | No Backend | ✅ **100% passing** |
| Login Flow | `tests/e2e/login.spec.ts` | ~20 | Integration | ⚠️ Needs Backend |
| Registration | `tests/e2e/registration.spec.ts` | ~25 | Integration | ⚠️ Needs Backend |
| Password Reset | `tests/e2e/password-reset.spec.ts` | ~15 | Integration | ⚠️ Needs Backend |
| Session Management | `tests/e2e/session-management.spec.ts` | ~20 | Integration | ⚠️ Needs Backend |
| Protected Routes & RBAC | `tests/e2e/protected-routes.spec.ts` | ~20 | Integration | ⚠️ Needs Backend |

**Legend:**
- ✅ **No Backend** - Tests run with just `npm run dev`
- ⚠️ **Needs Backend** - Requires Spring Boot API + PostgreSQL
- 🚀 **Chrome-Only** - Tests run only in Chrome for 3x faster execution

### Quick Start - Run Tests Now

**IMPORTANT:** You MUST start the frontend before running tests!

**Without Backend (UI Tests Only):**
```bash
# Terminal 1: Start frontend (REQUIRED!)
npm run dev
# Wait for: ✓ Ready in Xs

# Terminal 2: Run UI tests
npm run test:e2e -- ui-only.spec.ts

# Expected: 17 passing ✅ (Chrome-only)
```

**With Backend (All Tests):**
```bash
# Terminal 1: Start PostgreSQL (ensure running)

# Terminal 2: Start backend
cd ../backend
./mvnw spring-boot:run

# Terminal 3: Start frontend (REQUIRED!)
cd ../frontend
npm run dev
# Wait for: ✓ Ready in Xs

# Terminal 4: Run all tests
npm run test:e2e

# Expected: ~110+ passing (Chrome-only, 3x faster)
```

### Running Specific Test Suites

```bash
# UI-only tests (no backend needed)
npm run test:e2e -- ui-only.spec.ts

# Integration tests (backend required)
npm run test:e2e -- login.spec.ts
npm run test:e2e -- registration.spec.ts
npm run test:e2e -- password-reset.spec.ts
npm run test:e2e -- session-management.spec.ts
npm run test:e2e -- protected-routes.spec.ts

# Interactive mode with UI
npm run test:e2e:ui

# Watch test execution in browser
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug -- ui-only.spec.ts

# Generate HTML report
npm run test:e2e:report
```

### Test Coverage Details

#### ✅ Login Flow (20+ tests)
- Form validation (empty fields, invalid email)
- Successful authentication with valid credentials
- "Remember Me" functionality and token persistence
- Error handling (invalid credentials, network errors, server errors)
- Password visibility toggle
- Redirect to intended page after login
- Loading states and keyboard accessibility
- CSRF token inclusion
- Rate limiting enforcement

#### ✅ Registration (25+ tests)
- All form elements rendering
- Password strength meter (weak/medium/strong/very strong)
- Password requirements checklist with real-time updates
- Form validation (email format, name length, phone format)
- Password validation (uppercase, lowercase, number, special char, min length)
- Passwords match validation
- Terms acceptance requirement
- Duplicate email detection
- Server error handling
- Loading states and UI polish

#### ✅ Password Reset (15+ tests)
- Complete password reset flow end-to-end
- Token validation (valid/invalid/expired)
- Non-existent email handling (security: no email reveal)
- Weak password rejection
- Password mismatch error
- Rate limiting (3 requests per hour)
- Token invalidation after use
- Prevent token reuse
- Countdown timer (15-minute expiry)
- UI/UX features (loading states, password toggle)

#### ✅ Session Management (20+ tests)
- Automatic access token refresh
- Refresh token expiration handling
- Session persistence across page refreshes
- Session expiry warning modal (5 min before timeout)
- Active sessions list display
- Current session badge
- Revoke specific session
- Logout from all other devices
- Auto-refresh session list (30s interval)
- Change password successfully
- Validate current password
- Password requirements enforcement
- Complete logout (clear cookies, redirect, block access)
- CSRF token inclusion in requests

#### ✅ Protected Routes & RBAC (20+ tests)
- Redirect unauthenticated users to login
- Preserve intended URL with redirect parameter
- Allow public route access
- Redirect authenticated users from auth pages
- Server-side middleware protection
- No content flash before redirect
- SUPER_ADMIN access to admin pages
- TENANT denied admin access
- 403 Forbidden page display
- PROPERTY_MANAGER property access
- VENDOR denied financial reports
- Permission-based access control
- Conditional UI rendering based on permissions
- Multiple roles/permissions handling
- Edge cases (invalid tokens, concurrent requests, cross-tab auth)

### Test Infrastructure

**Playwright Configuration:**
- Browser: Chromium, Firefox, WebKit
- Headless by default
- Screenshot on failure
- Video recording on retry
- Parallel execution

**Custom Fixtures:**
- `userFactory` - Create test users with roles/permissions
- `authHelper` - Login/logout helpers
- `waitHelper` - Smart waiting utilities

**Test Data:**
- `@faker-js/faker` for realistic data generation
- Isolated test users per test case
- Automatic cleanup after tests

### Best Practices

✅ **Isolation** - Each test creates its own data
✅ **Cleanup** - Automatic cleanup of test users and sessions
✅ **Realistic Data** - Faker for emails, names, phone numbers
✅ **Accessibility** - Keyboard navigation, ARIA labels, screen readers
✅ **Error Scenarios** - Both happy paths and error cases
✅ **Security** - CSRF tokens, secure storage, rate limiting
✅ **Performance** - Efficient waits, parallel execution

### Debugging Tests

```bash
# Run with headed browser to watch execution
npm run test:e2e:headed

# Debug mode with Playwright Inspector
npm run test:e2e:debug -- tests/e2e/login.spec.ts

# Run specific test by name
npm run test:e2e -- -g "should login with valid credentials"

# Generate and view HTML report
npm run test:e2e:report
```

### CI/CD Integration

Tests are configured for CI/CD pipelines:

```yaml
# Example: GitHub Actions
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

**📖 Complete Testing Documentation:** [docs/AUTHENTICATION.md#testing](./docs/AUTHENTICATION.md#testing)

## Troubleshooting

### Common Issues

**CSRF Token Missing**
- Ensure backend is sending `X-XSRF-TOKEN` header

**Token Refresh Loop**
- Check refresh token cookie is HTTP-only
- Verify backend `/v1/auth/refresh` endpoint

**Protected Routes Not Working**
- Check middleware configuration
- Verify AuthProvider wraps your app
- Check user permissions in JWT payload

**Session Warning Appearing Immediately**
- Verify JWT `exp` claim format
- Check system time synchronization

See [docs/AUTHENTICATION.md](./docs/AUTHENTICATION.md) for detailed troubleshooting.

## Documentation

- **[Authentication Guide](./docs/AUTHENTICATION.md)** - Complete auth system documentation
- **[API Integration](./docs/AUTHENTICATION.md#api-integration)** - API client usage
- **[Route Protection](./docs/AUTHENTICATION.md#route-protection)** - Protecting routes
- **[Security Features](./docs/AUTHENTICATION.md#security-features)** - Security implementation

## Contributing

1. Follow the established code style (ESLint + Prettier)
2. Write E2E tests for new features
3. Update documentation
4. Use conventional commits
5. Test accessibility

## License

Proprietary - Ultra BMS

---

**Version**: 1.0.0
**Last Updated**: November 15, 2025
