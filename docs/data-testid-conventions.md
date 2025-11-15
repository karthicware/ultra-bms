# data-testid Naming Conventions

**Project:** Ultra BMS
**Version:** 1.0
**Status:** ✅ MANDATORY from Epic 3 onwards
**Last Updated:** November 15, 2025

---

## Overview

Every interactive element in the Ultra BMS frontend **MUST** have a `data-testid` attribute. This enables reliable E2E testing and prevents test failures due to DOM structure changes.

---

## Why data-testid?

### ❌ Epic 2 Problem
- Components lacked test selectors
- E2E tests failed due to inability to find elements
- Wasted time retrofitting test attributes after implementation

### ✅ Epic 3+ Solution
- Add `data-testid` during initial development
- Testability built-in from the start
- Tests are stable and maintainable

---

## Naming Convention

### Pattern
```
data-testid="{component}-{element}-{action}"
```

### Rules
1. **Use kebab-case** (lowercase with hyphens)
2. **Be specific** but concise
3. **Include context** when multiple similar elements exist
4. **Use consistent prefixes** for element types
5. **Avoid dynamic values** - use semantic names, not IDs

### ✅ Good Examples
```tsx
data-testid="btn-submit"           // Clear, specific
data-testid="form-login"           // Identifies the form
data-testid="input-email"          // Describes the input
data-testid="modal-confirm-delete" // Context + action
data-testid="nav-dashboard"        // Navigation link
```

### ❌ Bad Examples
```tsx
data-testid="button"               // Too generic
data-testid="user-123"             // Dynamic ID
data-testid="submitButton"         // camelCase instead of kebab-case
data-testid="btn_submit"           // Underscores instead of hyphens
```

---

## Component-Specific Conventions

### 1. Buttons

**Pattern:** `btn-{action}` or `btn-{context}-{action}`

```tsx
// Primary actions
<button data-testid="btn-submit">Submit</button>
<button data-testid="btn-save">Save</button>
<button data-testid="btn-cancel">Cancel</button>
<button data-testid="btn-delete">Delete</button>

// Context-specific actions
<button data-testid="btn-tenant-create">Create Tenant</button>
<button data-testid="btn-tenant-edit">Edit</button>
<button data-testid="btn-user-invite">Invite User</button>
<button data-testid="btn-password-reset">Reset Password</button>

// Icon buttons
<button data-testid="btn-icon-menu">
  <MenuIcon />
</button>

// Loading states (keep same testid)
<button data-testid="btn-submit" disabled={loading}>
  {loading ? "Submitting..." : "Submit"}
</button>
```

---

### 2. Forms

**Pattern:** `form-{name}` or `form-{entity}-{action}`

```tsx
// Authentication forms
<form data-testid="form-login">...</form>
<form data-testid="form-register">...</form>
<form data-testid="form-forgot-password">...</form>

// Entity forms
<form data-testid="form-tenant-create">...</form>
<form data-testid="form-user-edit">...</form>
<form data-testid="form-property-create">...</form>

// Multi-step forms
<form data-testid="form-onboarding-step-1">...</form>
<form data-testid="form-onboarding-step-2">...</form>
```

---

### 3. Input Fields

**Pattern:** `input-{field}` or `input-{context}-{field}`

```tsx
// Basic inputs
<input data-testid="input-email" type="email" />
<input data-testid="input-password" type="password" />
<input data-testid="input-username" type="text" />
<input data-testid="input-phone" type="tel" />

// Context-specific inputs
<input data-testid="input-tenant-name" />
<input data-testid="input-property-address" />
<input data-testid="input-lease-start-date" type="date" />

// Checkboxes and radios
<input data-testid="checkbox-agree-terms" type="checkbox" />
<input data-testid="radio-payment-monthly" type="radio" />
<input data-testid="radio-payment-annual" type="radio" />

// Select dropdowns
<select data-testid="select-country">...</select>
<select data-testid="select-role">...</select>

// Textareas
<textarea data-testid="textarea-description">...</textarea>
<textarea data-testid="textarea-notes">...</textarea>
```

---

### 4. Links

**Pattern:** `link-{destination}` or `link-{action}`

```tsx
// Navigation links
<Link data-testid="link-dashboard" href="/dashboard">Dashboard</Link>
<Link data-testid="link-tenants" href="/tenants">Tenants</Link>
<Link data-testid="link-properties" href="/properties">Properties</Link>

// Action links
<Link data-testid="link-register" href="/register">
  Don't have an account? Register
</Link>
<Link data-testid="link-forgot-password" href="/forgot-password">
  Forgot Password?
</Link>
<Link data-testid="link-back" href="/previous">
  ← Back
</Link>

// External links
<a data-testid="link-external-docs" href="https://docs.example.com" target="_blank">
  Documentation
</a>
```

---

### 5. Modals & Dialogs

**Pattern:** `modal-{purpose}` or `dialog-{action}`

```tsx
// Confirmation modals
<Dialog data-testid="modal-confirm-delete">...</Dialog>
<Dialog data-testid="modal-confirm-logout">...</Dialog>

// Action dialogs
<Dialog data-testid="dialog-create-tenant">...</Dialog>
<Dialog data-testid="dialog-edit-user">...</Dialog>

// Information modals
<Dialog data-testid="modal-welcome">...</Dialog>
<Dialog data-testid="modal-session-expired">...</Dialog>

// Modal components
<DialogTitle data-testid="modal-title">...</DialogTitle>
<DialogContent data-testid="modal-content">...</DialogContent>
<DialogFooter data-testid="modal-footer">...</DialogFooter>
```

---

### 6. Navigation

**Pattern:** `nav-{location}` or `navbar-{element}`

```tsx
// Main navigation
<nav data-testid="navbar-main">
  <a data-testid="nav-home" href="/">Home</a>
  <a data-testid="nav-dashboard" href="/dashboard">Dashboard</a>
  <a data-testid="nav-settings" href="/settings">Settings</a>
</nav>

// Sidebar navigation
<aside data-testid="sidebar">
  <nav data-testid="nav-sidebar">
    <a data-testid="nav-tenants" href="/tenants">Tenants</a>
    <a data-testid="nav-properties" href="/properties">Properties</a>
  </nav>
</aside>

// Breadcrumbs
<nav data-testid="breadcrumbs">
  <a data-testid="breadcrumb-home" href="/">Home</a>
  <a data-testid="breadcrumb-tenants" href="/tenants">Tenants</a>
  <span data-testid="breadcrumb-current">Create Tenant</span>
</nav>

// User menu
<DropdownMenu data-testid="dropdown-user-menu">
  <DropdownMenuItem data-testid="menu-item-profile">Profile</DropdownMenuItem>
  <DropdownMenuItem data-testid="menu-item-logout">Logout</DropdownMenuItem>
</DropdownMenu>
```

---

### 7. Tables & Lists

**Pattern:** `table-{name}`, `row-{context}`, `cell-{field}`

```tsx
// Table
<table data-testid="table-tenants">
  <thead data-testid="table-header">
    <tr>
      <th data-testid="header-name">Name</th>
      <th data-testid="header-email">Email</th>
      <th data-testid="header-actions">Actions</th>
    </tr>
  </thead>
  <tbody data-testid="table-body">
    {/* Use index or unique identifier for rows */}
    <tr data-testid="row-tenant-1">
      <td data-testid="cell-name">John Doe</td>
      <td data-testid="cell-email">john@example.com</td>
      <td data-testid="cell-actions">
        <button data-testid="btn-edit-tenant-1">Edit</button>
        <button data-testid="btn-delete-tenant-1">Delete</button>
      </td>
    </tr>
  </tbody>
</table>

// Lists
<ul data-testid="list-notifications">
  <li data-testid="notification-item-1">...</li>
  <li data-testid="notification-item-2">...</li>
</ul>
```

---

### 8. Cards & Panels

**Pattern:** `card-{content}` or `panel-{purpose}`

```tsx
// Cards
<Card data-testid="card-tenant-summary">
  <CardHeader data-testid="card-header">...</CardHeader>
  <CardContent data-testid="card-content">...</CardContent>
  <CardFooter data-testid="card-footer">...</CardFooter>
</Card>

// Dashboard widgets
<div data-testid="widget-revenue">...</div>
<div data-testid="widget-occupancy">...</div>

// Panels
<aside data-testid="panel-filters">...</aside>
<section data-testid="panel-details">...</section>
```

---

### 9. Alerts & Notifications

**Pattern:** `alert-{type}` or `notification-{context}`

```tsx
// Alerts
<Alert data-testid="alert-error">Error occurred!</Alert>
<Alert data-testid="alert-success">Saved successfully!</Alert>
<Alert data-testid="alert-warning">Warning message</Alert>
<Alert data-testid="alert-info">Info message</Alert>

// Toast notifications
<Toast data-testid="toast-login-success">Welcome back!</Toast>
<Toast data-testid="toast-save-error">Save failed</Toast>

// Inline validation messages
<span data-testid="error-email">Invalid email format</span>
<span data-testid="error-password">Password too weak</span>
```

---

### 10. Loading States & Skeletons

**Pattern:** `loading-{context}` or `skeleton-{content}`

```tsx
// Loading indicators
<Spinner data-testid="loading-page" />
<Spinner data-testid="loading-tenants" />

// Skeletons
<Skeleton data-testid="skeleton-table" />
<Skeleton data-testid="skeleton-card" />

// Progress indicators
<Progress data-testid="progress-upload" value={50} />
```

---

## Context-Specific Naming

### Authentication Pages

```tsx
// Login page
<form data-testid="form-login">
  <input data-testid="input-email" />
  <input data-testid="input-password" />
  <button data-testid="btn-login">Login</button>
  <Link data-testid="link-forgot-password">Forgot?</Link>
  <Link data-testid="link-register">Register</Link>
</form>

// Register page
<form data-testid="form-register">
  <input data-testid="input-name" />
  <input data-testid="input-email" />
  <input data-testid="input-password" />
  <input data-testid="input-confirm-password" />
  <input data-testid="checkbox-agree-terms" type="checkbox" />
  <button data-testid="btn-register">Create Account</button>
</form>
```

---

### Tenant Management

```tsx
// Tenant list page
<div data-testid="page-tenants">
  <button data-testid="btn-create-tenant">Create</button>
  <input data-testid="input-search-tenants" />
  <select data-testid="select-filter-status" />

  <table data-testid="table-tenants">
    <tr data-testid="row-tenant-1">
      <td data-testid="cell-name">John Doe</td>
      <button data-testid="btn-view-tenant-1">View</button>
      <button data-testid="btn-edit-tenant-1">Edit</button>
      <button data-testid="btn-delete-tenant-1">Delete</button>
    </tr>
  </table>
</div>

// Tenant create/edit form
<form data-testid="form-tenant-create">
  <input data-testid="input-tenant-name" />
  <input data-testid="input-tenant-email" />
  <input data-testid="input-tenant-phone" />
  <select data-testid="select-property" />
  <input data-testid="input-lease-start" type="date" />
  <input data-testid="input-lease-end" type="date" />
  <button data-testid="btn-save-tenant">Save</button>
  <button data-testid="btn-cancel">Cancel</button>
</form>
```

---

## Implementation Examples

### React Component with TypeScript

```tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  return (
    <form
      data-testid="form-login"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(email, password);
      }}
    >
      <Input
        data-testid="input-email"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Input
        data-testid="input-password"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button
        data-testid="btn-submit"
        type="submit"
      >
        Login
      </Button>
    </form>
  );
}
```

---

### shadcn/ui Components

```tsx
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function DeleteConfirmDialog({ open, onConfirm, onCancel }: Props) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent data-testid="modal-confirm-delete">
        <DialogTitle data-testid="modal-title">
          Confirm Deletion
        </DialogTitle>

        <p data-testid="modal-message">
          Are you sure you want to delete this tenant?
        </p>

        <div data-testid="modal-actions">
          <Button
            data-testid="btn-cancel"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>

          <Button
            data-testid="btn-confirm-delete"
            variant="destructive"
            onClick={onConfirm}
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Testing with data-testid

### Playwright E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('user can login successfully', async ({ page }) => {
  await page.goto('/login');

  // Fill login form using data-testid
  await page.getByTestId('input-email').fill('user@example.com');
  await page.getByTestId('input-password').fill('password123');
  await page.getByTestId('btn-submit').click();

  // Verify redirect to dashboard
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByTestId('page-dashboard')).toBeVisible();
});

test('user can create a new tenant', async ({ page }) => {
  await page.goto('/tenants');

  // Click create button
  await page.getByTestId('btn-create-tenant').click();

  // Fill form
  await page.getByTestId('input-tenant-name').fill('John Doe');
  await page.getByTestId('input-tenant-email').fill('john@example.com');
  await page.getByTestId('input-tenant-phone').fill('1234567890');

  // Submit
  await page.getByTestId('btn-save-tenant').click();

  // Verify success
  await expect(page.getByTestId('toast-success')).toBeVisible();
  await expect(page.getByTestId('table-tenants')).toContainText('John Doe');
});
```

---

## Code Review Checklist

When reviewing code, verify:

- [ ] **All interactive elements have data-testid**
- [ ] **Naming follows the convention** (`{component}-{element}-{action}`)
- [ ] **Test IDs are semantic** (not based on dynamic IDs)
- [ ] **Test IDs are unique** within the component/page
- [ ] **Consistent with existing patterns** in the codebase

---

## Common Mistakes to Avoid

### ❌ Don't use dynamic IDs
```tsx
// Bad
<button data-testid={`btn-${userId}`}>Edit</button>

// Good
<button data-testid="btn-edit-user">Edit</button>
```

### ❌ Don't be too generic
```tsx
// Bad
<button data-testid="button">Click</button>

// Good
<button data-testid="btn-submit">Click</button>
```

### ❌ Don't use camelCase or snake_case
```tsx
// Bad
<button data-testid="submitButton">Submit</button>
<button data-testid="submit_button">Submit</button>

// Good
<button data-testid="btn-submit">Submit</button>
```

### ❌ Don't forget context when needed
```tsx
// Bad (when multiple similar forms exist)
<button data-testid="btn-submit">Submit</button>

// Good
<button data-testid="btn-submit-login">Submit</button>
```

---

## Quick Reference

| Element Type | Prefix | Example |
|--------------|--------|---------|
| Button | `btn-` | `btn-submit`, `btn-cancel` |
| Form | `form-` | `form-login`, `form-register` |
| Input | `input-` | `input-email`, `input-password` |
| Select | `select-` | `select-country`, `select-role` |
| Link | `link-` | `link-register`, `link-dashboard` |
| Modal/Dialog | `modal-` or `dialog-` | `modal-confirm`, `dialog-create` |
| Navigation | `nav-` | `nav-dashboard`, `nav-settings` |
| Table | `table-` | `table-tenants`, `table-properties` |
| Row | `row-` | `row-tenant-1`, `row-property-2` |
| Cell | `cell-` | `cell-name`, `cell-email` |
| Card | `card-` | `card-summary`, `card-details` |
| Alert | `alert-` | `alert-error`, `alert-success` |
| Checkbox | `checkbox-` | `checkbox-agree-terms` |
| Radio | `radio-` | `radio-payment-monthly` |

---

## Enforcement

### During Development
- Developer adds `data-testid` as they create components
- Tests written using these test IDs
- Self-review before submitting PR

### During Code Review
- Reviewer checks for `data-testid` on all interactive elements
- Verifies naming convention is followed
- Blocks PR if missing (P0 requirement)

### Definition of Done
- "All interactive elements have data-testid attributes" ✅
- Part of mandatory DoD checklist from Epic 3 onwards

---

## Resources

- **Definition of Done:** `docs/definition-of-done.md`
- **Epic 2 Retrospective:** `docs/retrospectives/epic-2-retrospective.md`
- **Playwright Docs:** https://playwright.dev/docs/locators#locate-by-test-id

---

**Remember:** Adding `data-testid` takes 5 seconds during development but saves hours in debugging failed tests. Make it a habit!
