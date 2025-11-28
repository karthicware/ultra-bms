# Story 2.7: Admin Theme Settings & System Theme Support

Status: ready-for-dev

## Story

As an Admin or Super Admin,
I want to configure the application theme (dark/light mode),
So that users can customize their viewing experience and reduce eye strain.

## Acceptance Criteria

1. **AC1 - Theme Mode Toggle:** Settings > Appearance page provides three theme options: System (default), Light, Dark. Theme changes apply immediately without page refresh.

2. **AC2 - Theme Provider Setup:** Application wrapped with ThemeProvider component using next-themes library. ThemeProvider configured with `attribute="class"` for Tailwind CSS dark mode compatibility.

3. **AC3 - User Preference Persistence:** Theme preference stored in `users.theme_preference` column (enum: SYSTEM, LIGHT, DARK, default: SYSTEM). Preference synced to database on change for authenticated users.

4. **AC4 - LocalStorage Fallback:** For non-authenticated users (login page), theme preference stored in localStorage. On login, localStorage preference migrated to database.

5. **AC5 - System Theme Detection:** "System" option respects OS-level `prefers-color-scheme` media query. Real-time response to OS theme changes.

6. **AC6 - Backend API Endpoints:** GET /api/v1/settings/appearance returns current theme preference. PUT /api/v1/settings/appearance updates user theme preference.

7. **AC7 - Database Migration:** Flyway migration V39__add_user_theme_preference.sql adds theme_preference column to users table with default 'SYSTEM'.

8. **AC8 - Tailwind Dark Mode Configuration:** tailwind.config.ts configured with `darkMode: 'class'` strategy. All existing components must render correctly in both light and dark modes.

9. **AC9 - Smooth Theme Transition:** Theme transitions use 200ms CSS transition for smooth visual experience. No flash of incorrect theme on page load (FOUC prevention).

10. **AC10 - useTheme Hook:** Custom useTheme hook provides: theme (current), setTheme (setter), resolvedTheme (actual applied theme for System mode), systemTheme (OS preference).

11. **AC11 - RBAC Restrictions:** All authenticated users can view and change their personal theme preference. No admin-only restrictions for personal theme settings.

12. **AC12 - Appearance Settings Page:** /settings/appearance page with theme selection UI. Live preview area showing theme changes in real-time.

13. **AC13 - Frontend Integration:** Theme toggle accessible from Settings sidebar navigation. Existing shadcn/ui components already support dark mode via CSS variables.

14. **AC14 - Unit Tests (Backend):** Unit tests for theme preference retrieval and update endpoints. Verify migration adds column correctly.

15. **AC15 - Unit Tests (Frontend):** Tests for ThemeProvider, useTheme hook, and Appearance settings page component.

16. **AC16 - Build Verification:** Backend (mvn compile) and frontend (npm run build) complete with zero errors.

## Tasks / Subtasks

- [ ] **Task 1: Install next-themes library** (AC: #2)
  - [ ] Run `npm install next-themes` in frontend directory
  - [ ] Verify package.json includes next-themes dependency
  - [ ] Check compatibility with Next.js 15 App Router

- [ ] **Task 2: Configure Tailwind Dark Mode** (AC: #8)
  - [ ] Update tailwind.config.ts to set `darkMode: 'class'`
  - [ ] Verify CSS variables in globals.css support dark mode colors
  - [ ] Test existing shadcn/ui components render in dark mode

- [ ] **Task 3: Create ThemeProvider Component** (AC: #2, #9)
  - [ ] Create components/theme-provider.tsx wrapping next-themes ThemeProvider
  - [ ] Configure attributes: attribute="class", defaultTheme="system", enableSystem=true
  - [ ] Add storageKey for localStorage persistence
  - [ ] Implement suppressHydrationWarning to prevent FOUC

- [ ] **Task 4: Integrate ThemeProvider in Root Layout** (AC: #2)
  - [ ] Update app/layout.tsx to wrap children with ThemeProvider
  - [ ] Place ThemeProvider inside body tag
  - [ ] Ensure provider wraps both auth and dashboard layouts

- [ ] **Task 5: Backend - User Entity Update** (AC: #3, #7)
  - [ ] Create ThemePreference enum (SYSTEM, LIGHT, DARK)
  - [ ] Add themePreference field to User entity with default SYSTEM
  - [ ] Create Flyway migration V39__add_user_theme_preference.sql
  - [ ] Update UserRepository if needed

- [ ] **Task 6: Backend - Settings DTOs** (AC: #6)
  - [ ] Create AppearanceSettingsResponse DTO (themePreference)
  - [ ] Create AppearanceSettingsRequest DTO (themePreference)
  - [ ] Add validation for theme preference values

- [ ] **Task 7: Backend - Settings Service** (AC: #6)
  - [ ] Create SettingsService interface in com.ultrabms.service
  - [ ] Create SettingsServiceImpl with getAppearanceSettings and updateAppearanceSettings methods
  - [ ] Inject UserRepository to fetch/update current user preferences

- [ ] **Task 8: Backend - Settings Controller** (AC: #6)
  - [ ] Create SettingsController with @RequestMapping("/api/v1/settings")
  - [ ] GET /appearance endpoint to retrieve current theme preference
  - [ ] PUT /appearance endpoint to update theme preference
  - [ ] Add @PreAuthorize("isAuthenticated()") for security

- [ ] **Task 9: Frontend - Types and Validation** (AC: #6, #10)
  - [ ] Create types/settings.ts with ThemePreference type (system | light | dark)
  - [ ] Create lib/validations/settings.ts with Zod schema for appearance settings
  - [ ] Define AppearanceSettings interface

- [ ] **Task 10: Frontend - Settings Service** (AC: #6)
  - [ ] Create services/settings.service.ts
  - [ ] Implement getAppearanceSettings() to fetch from API
  - [ ] Implement updateAppearanceSettings(theme) to update via API
  - [ ] Handle error responses appropriately

- [ ] **Task 11: Frontend - useTheme Hook Enhancement** (AC: #10, #4)
  - [ ] Create hooks/useThemeSync.ts to sync theme with backend
  - [ ] On mount, fetch user's theme preference from API (if authenticated)
  - [ ] On theme change, persist to backend for authenticated users
  - [ ] Handle localStorage migration on login

- [ ] **Task 12: Frontend - Appearance Settings Page** (AC: #12, #1)
  - [ ] Create app/(dashboard)/settings/appearance/page.tsx
  - [ ] Implement theme selection with RadioGroup or ToggleGroup component
  - [ ] Show current selection (System/Light/Dark) with icons
  - [ ] Add live preview section showing theme effect
  - [ ] Display "Follows OS setting" helper text for System option

- [ ] **Task 13: Frontend - Theme Toggle UI Component** (AC: #1, #13)
  - [ ] Create components/theme-toggle.tsx with dropdown or segmented control
  - [ ] Include Sun, Moon, Monitor icons from lucide-react
  - [ ] Apply immediate theme change on selection
  - [ ] Show toast notification on successful save

- [ ] **Task 14: Frontend - Sidebar Navigation Update** (AC: #13)
  - [ ] Add "Appearance" menu item under Settings section in Sidebar.tsx
  - [ ] Use Palette or Paintbrush icon from lucide-react
  - [ ] Path: /settings/appearance
  - [ ] No permission restriction (all authenticated users)

- [ ] **Task 15: Testing & Validation** (AC: #14, #15, #16)
  - [ ] Write backend unit tests for SettingsService (get/update appearance)
  - [ ] Write backend integration tests for SettingsController endpoints
  - [ ] Write frontend tests for ThemeProvider integration
  - [ ] Write frontend tests for Appearance settings page
  - [ ] Execute backend test suite: `mvn test` — ALL tests must pass
  - [ ] Execute frontend test suite: `npm test` — ALL tests must pass
  - [ ] Execute backend build: `mvn compile` — must succeed with 0 errors
  - [ ] Execute frontend build: `npm run build` — must succeed with 0 errors

## Final Validation Requirements

**MANDATORY:** These requirements apply to ALL stories and MUST be completed after all implementation tasks are done. The dev agent CANNOT mark a story complete without passing all validations.

### FV-1: Test Execution (Backend)
Execute full backend test suite: `mvn test`
- ALL tests must pass (zero failures)
- Fix any failing tests before proceeding
- Document test results in Completion Notes

### FV-2: Test Execution (Frontend)
Execute full frontend test suite: `npm test`
- ALL tests must pass (zero failures)
- Fix any failing tests before proceeding
- Excludes E2E tests (run separately if story includes E2E)

### FV-3: Build Verification (Backend)
Execute backend compilation: `mvn compile`
- Zero compilation errors required
- Zero Checkstyle violations (if configured)

### FV-4: Build Verification (Frontend)
Execute frontend build: `npm run build`
- Zero TypeScript compilation errors
- Zero lint errors
- Build must complete successfully

### FV-5: Lint Check (Frontend)
Execute lint check: `npm run lint`
- Zero lint errors required
- Fix any errors before marking story complete

## Dev Notes

### Architecture Alignment

- Uses existing User entity from Story 2.1 (JWT authentication)
- Follows established patterns: DTOs, Service layer, Controller
- Extends User entity with themePreference field
- Leverages Tailwind CSS dark mode with class strategy
- shadcn/ui components already support dark mode via CSS variables

### Key Design Decisions

1. **next-themes Library:** Industry-standard solution for Next.js theme management, handles SSR hydration correctly
2. **Class-based Dark Mode:** Tailwind `darkMode: 'class'` allows programmatic theme control vs OS-only
3. **System as Default:** Respects user's OS preference out of the box, reducing configuration needed
4. **Database Persistence:** Theme preference stored in users table for cross-device consistency
5. **LocalStorage Bridge:** Non-authenticated pages use localStorage until user logs in

### Dependencies

- Story 2.1 (JWT Auth) - COMPLETED - provides User entity and authentication context
- Story 2.5 (Frontend Auth) - COMPLETED - provides auth context integration
- Story 2.6 (Admin User Management) - COMPLETED - Settings section in sidebar already exists

### Database Changes

```sql
-- Migration: V39__add_user_theme_preference.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(20) DEFAULT 'SYSTEM';

-- Constraint for valid values
ALTER TABLE users ADD CONSTRAINT chk_theme_preference
  CHECK (theme_preference IN ('SYSTEM', 'LIGHT', 'DARK'));
```

### API Endpoints Summary

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | /api/v1/settings/appearance | isAuthenticated | Get user's theme preference |
| PUT | /api/v1/settings/appearance | isAuthenticated | Update theme preference |

### Frontend Component Structure

```
components/
  └── theme-provider.tsx    # ThemeProvider wrapper
  └── theme-toggle.tsx      # Dropdown/toggle for theme selection

app/(dashboard)/settings/
  └── appearance/
      └── page.tsx          # Appearance settings page
```

### CSS Variables Reference

next-themes works with shadcn/ui CSS variables already defined in globals.css:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... other light theme variables */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark theme variables */
}
```

### Project Structure Notes

- Alignment with unified project structure (paths, modules, naming)
- Settings pages located under app/(dashboard)/settings/
- Services follow established pattern in services/ directory
- Types follow established pattern in types/ directory

### Learnings from Previous Story

**From Story 2-6-admin-user-management (Status: done)**

- **Settings Section Exists**: Sidebar already has Settings section with "User Management" menu item at /settings/users
- **Permission Pattern**: Use `isAuthenticated()` for endpoints all users can access, not role-specific permissions
- **Toast Notifications**: Use existing toast pattern for success/error feedback
- **Form Validation**: Follow Zod schema patterns established in adminUserSchemas.ts
- **API Service Pattern**: Follow admin-users.service.ts structure for API calls

[Source: docs/sprint-artifacts/epic-2/2-6-admin-user-management.md#Dev-Agent-Record]

### References

- [Source: docs/epics/epic-2-authentication-user-management.md#Story-2.7]
- [Source: docs/architecture.md#Frontend-Stack]
- [Source: next-themes documentation](https://github.com/pacocoursey/next-themes)
- [Source: Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- Reference design: docs/archive/stitch_building_maintenance_software/settings_page_1/

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/epic-2/2-7-admin-theme-settings-and-system-theme-support.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change History

| Date | Change | Author |
|------|--------|--------|
| 2025-11-28 | Story drafted via *create-story workflow | SM (Bob) |
