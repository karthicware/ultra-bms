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

### E2E Tests

Run the comprehensive authentication test suite:

```bash
# Run all auth tests
npm run test:e2e -- tests/auth.spec.ts

# Watch mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

Test coverage includes:
- Login flow with validation
- Registration with password requirements
- Password reset flow
- Token validation
- Accessibility (keyboard navigation, ARIA labels)
- Error handling

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
