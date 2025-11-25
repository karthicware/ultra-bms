# Sprint Change Proposal: Epic 2 Critical Fixes

**Date:** 2025-11-24
**Proposer:** Antigravity (AI Agent)
**Status:** Approved (User Directive)

## Problem Statement
A validation of Epic 2 revealed critical missing components in Story 2.5 that compromise security and user experience:
1.  **Missing `middleware.ts`:** No server-side route protection for dashboard routes.
2.  **Missing `SessionExpiryWarning.tsx`:** No UI warning for impending session timeout.
3.  **Incomplete `Sidebar.tsx`:** Navigation items are not filtered by user permissions.

## Proposed Changes
Implement the missing components immediately to complete the scope of Epic 2.

### 1. Create `middleware.ts`
Implement Next.js middleware to:
*   Protect all `/(dashboard)` routes.
*   Redirect unauthenticated users to `/login` with a `returnUrl`.
*   Redirect authenticated users away from `/(auth)` pages to `/dashboard`.

### 2. Create `SessionExpiryWarning.tsx`
Implement a modal component that:
*   Tracks session expiration time (from JWT `exp` claim).
*   Shows a warning 5 minutes before expiry.
*   Allows the user to "Stay Logged In" (refresh token) or "Logout".
*   Auto-logs out if no action is taken.

### 3. Update `Sidebar.tsx`
*   Integrate the `usePermission` hook.
*   Filter navigation items based on the `requiredPermission` property.

## Implementation Plan

### Task 1: Middleware
*   **File:** `frontend/src/middleware.ts`
*   **Logic:** Check `accessToken` cookie (if available) or rely on client-side checks if cookies aren't HTTP-only readable (Note: The architecture uses HTTP-only cookies for refresh tokens, but access tokens are in memory. However, for middleware to work, we might need a cookie or rely on the client-side `ProtectedRoute` which is also missing/needs verification. Wait, AC6 says "Check for valid access token in cookies". If access tokens are memory-only, middleware can't check them unless we also set a cookie or if the architecture allows.
*   *Correction:* The architecture (Story 2.5 AC13) says "Store access token in React Context state (memory only)". This makes standard Next.js middleware protection difficult because the server request won't have the token.
*   *Refined Plan:* We will implement the `middleware.ts` to check for the *refresh token* cookie (which is HTTP-only and sent with requests) as a proxy for "likely authenticated", OR we rely on the `ProtectedRoute` component for strict security and use middleware for basic redirection if possible.
*   *Actually*, looking at AC6: "Check for valid access token in cookies or Authorization header." If we aren't storing access token in cookies, middleware can't see it on navigation requests.
*   *Alternative:* We will implement the `ProtectedRoute` component (AC6 also mentions this) for client-side protection, which is compatible with memory-only tokens. We will *also* implement a basic middleware that checks for the presence of the refresh token cookie if possible, or we might have to skip strict middleware protection if we strictly follow "memory-only access token".
*   *Decision:* I will check if `ProtectedRoute.tsx` exists (I tried `ls` before and it failed). I will implement `ProtectedRoute.tsx` as the primary guard. I will also implement `middleware.ts` to redirect if the `refreshToken` cookie is missing (if possible) or just to handle `/(auth)` vs `/(dashboard)` redirection based on best-effort.

### Task 2: Session Expiry Warning
*   **File:** `frontend/src/components/auth/session-expiry-warning.tsx`
*   **Integration:** Add to `frontend/src/app/(dashboard)/layout.tsx`.

### Task 3: Sidebar Permissions
*   **File:** `frontend/src/components/layout/Sidebar.tsx`
*   **Logic:** Filter `navItems` using `hasPermission`.

## Verification
*   Manual verification of route protection.
*   Manual verification of session expiry warning (by setting a short timeout).
*   Manual verification of sidebar filtering.
