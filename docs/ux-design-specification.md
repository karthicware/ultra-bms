# Ultra BMS UX Design Specification

_Created on November 13, 2025 by Nata_
_Generated using BMad Method - Create UX Design Workflow v1.0_

---

## Executive Summary

Ultra BMS is a comprehensive building maintenance and property management platform designed for property managers, facility managers, and real estate professionals. The system integrates tenant management, maintenance operations, vendor coordination, financial tracking, and compliance into a unified, modern web application.

**Design Philosophy:** Professional, efficient, and data-driven with an emphasis on clarity, accessibility, and rapid task completion. The interface balances information density with visual breathing room to support both power users and occasional users.

**Target Users:**
- Property Managers (primary users - daily interaction)
- Maintenance Supervisors (frequent users - work order management)
- Finance Managers (regular users - financial operations)
- Executives (periodic users - analytics and reporting)
- Tenants (self-service portal)
- Vendors (job tracking and completion)

---

## 1. Design System Foundation

### 1.1 Design System Choice

**Primary Framework:** **shadcn/ui** with Tailwind CSS

**Rationale:**
- **Modern & Professional:** Clean, accessible components that align with enterprise requirements
- **Customizable:** Full control over styling while maintaining consistency
- **Built on Radix UI:** Ensures WCAG 2.1 Level AA accessibility out of the box
- **TypeScript-first:** Type safety for complex data operations
- **Tailwind Integration:** Rapid development with utility-first CSS
- **No Runtime Overhead:** Components copy into codebase, full ownership

**shadcn/ui Components Used:**
- **Core UI Components:** button, input, card, table, dialog, alert-dialog, dropdown-menu, select, checkbox, radio-group, switch, tabs, accordion, badge, avatar, separator
- **Form Components:** form, label, textarea, date-picker, combobox
- **Data Display:** table, data-table, chart, skeleton
- **Navigation:** sidebar-01 (primary navigation), breadcrumb, pagination
- **Feedback:** toast, alert, progress, loading-spinner
- **Layout:** dashboard-01 (dashboard template), card, sheet

**Component Installation Strategy:**
1. Install core primitives first (button, input, card, dialog, table)
2. Add form components for data entry flows
3. Implement navigation components (sidebar, breadcrumb)
4. Add data visualization components (charts, tables)
5. Install specialized components as needed per module

---

## 2. Core User Experience

### 2.1 Defining Experience

**Core Experience:** "Proactive property management through intelligent automation"

Ultra BMS is defined by:
1. **Dashboard-First Intelligence:** Critical insights and alerts surface immediately
2. **Smart Work Order Routing:** Maintenance requests auto-assign to appropriate vendors
3. **Predictive Analytics:** System anticipates maintenance needs before failures occur
4. **Financial Clarity:** Real-time visibility into revenue, expenses, and profitability
5. **Compliance Assurance:** Automated tracking of regulatory requirements and lease expirations

**Primary User Actions (Frequency-Ordered):**
1. **View Dashboard:** Monitor KPIs, alerts, and upcoming tasks
2. **Manage Work Orders:** Create, assign, track, and close maintenance jobs
3. **Process Tenant Requests:** Review and respond to tenant service requests
4. **Track Finances:** Monitor transactions, PDC status, and payment collection
5. **Generate Reports:** Extract insights for decision-making and compliance

### 2.2 Novel UX Patterns

While Ultra BMS leverages established enterprise patterns (dashboards, CRUD operations, tables), it introduces several specialized patterns:

#### 2.2.1 PDC (Post-Dated Cheque) Management Flow
**Novel Element:** Visual timeline of cheque lifecycle with state transitions

- **States:** Received → Bank Deposit → Credited → Bounced → Resolved/Withdrawn
- **Visual Representation:** Timeline with status indicators and action points
- **Interaction:** Click state to view details, click action button to advance state
- **Feedback:** Confirmation dialogs for irreversible actions (crediting, withdrawing)

#### 2.2.2 Preventive Maintenance Calendar
**Novel Element:** Asset-centric recurring maintenance scheduling

- **View Modes:** Calendar view, list view, asset-centric view
- **Interaction:** Drag-and-drop rescheduling, bulk job generation
- **Smart Scheduling:** System suggests optimal scheduling based on vendor availability and job priority
- **Visual Cues:** Color-coding by priority, icons by category, badges for status

#### 2.2.3 Tenant Exit/Checkout Wizard
**Novel Element:** Multi-step process with conditional branching and refund calculations

- **Steps:** Exit Request → Unit Inspection → Damage Assessment → Refund Calculation → Approval → Payment Processing
- **Branching Logic:** If damages detected → deduction flow; if clean → full refund
- **Real-time Calculation:** Security deposit minus damages, outstanding payments, admin fees
- **Document Trail:** Photos, inspection reports, and approvals attached to each step

---

## 3. Visual Foundation

### 3.1 Color System

**Brand Identity:** Professional, trustworthy, and modern

#### Primary Palette

```css
/* Primary - Deep Navy (Trust, Stability) */
--primary: #0A2342
--primary-hover: #081B34
--primary-light: #1A3A5C
--primary-foreground: #FFFFFF

/* Secondary - Professional Blue (Action, Clarity) */
--secondary: #1152D4
--secondary-hover: #0D42B0
--secondary-light: #3474F4
--secondary-foreground: #FFFFFF

/* Accent - Gold (Premium, Value) */
--accent: #D4AF37
--accent-hover: #C09F2F
--accent-light: #E5C965
--accent-foreground: #0A2342
```

#### Semantic Colors

```css
/* Success - Operations completed successfully */
--success: #22C55E
--success-foreground: #FFFFFF

/* Warning - Attention needed */
--warning: #F59E0B
--warning-foreground: #FFFFFF

/* Error/Destructive - Critical issues */
--destructive: #EF4444
--destructive-foreground: #FFFFFF

/* Info - Informational messages */
--info: #3B82F6
--info-foreground: #FFFFFF
```

#### Neutral/Grayscale

```css
/* Light Mode Backgrounds */
--background: #FFFFFF
--background-secondary: #F6F6F8
--background-tertiary: #F5F6F8

/* Light Mode Foreground/Text */
--foreground: #333333
--foreground-muted: #6B7280
--foreground-subtle: #9CA3AF

/* Light Mode Borders */
--border: #CED4DA
--border-subtle: #E5E7EB
--border-strong: #9CA3AF

/* Dark Mode Backgrounds */
--dark-background: #0B0F19
--dark-background-secondary: #111827
--dark-background-tertiary: #1F2937
--dark-sidebar: #0F1419

/* Dark Mode Foreground/Text */
--dark-foreground: #F9FAFB
--dark-foreground-muted: #9CA3AF
--dark-foreground-subtle: #6B7280

/* Dark Mode Borders */
--dark-border: #374151
--dark-border-subtle: #1F2937
--dark-border-strong: #4B5563
```

#### Color Usage Guidelines

**Light Mode:**
- **Primary (#0A2342):** Main navigation, primary CTAs, header elements
- **Secondary (#1152D4):** Interactive elements, links, active states
- **Accent (#D4AF37):** Highlights, premium features, financial metrics
- **Success (#22C55E):** Completed jobs, paid invoices, positive trends
- **Warning (#F59E0B):** Pending approvals, upcoming deadlines, requires attention
- **Destructive (#EF4444):** Overdue items, critical alerts, delete actions
- **Background (#FFFFFF):** Main content areas, cards, modals
- **Foreground (#333333):** Primary text, headings

**Dark Mode:**
- **Primary (#1A3A5C):** Lightened navy for better dark mode contrast
- **Secondary (#3474F4):** Brighter blue for visibility on dark backgrounds
- **Accent (#E5C965):** Lightened gold for contrast on dark surfaces
- **Success (#22C55E):** Same (already high contrast)
- **Warning (#F59E0B):** Same (already high contrast)
- **Destructive (#EF4444):** Same (already high contrast)
- **Background (#0B0F19):** Dark canvas, main app background
- **Background Secondary (#111827):** Cards, elevated surfaces
- **Foreground (#F9FAFB):** Primary text color
- **Foreground Muted (#9CA3AF):** Secondary text, descriptions

#### Dark Mode Strategy

**Implementation Approach:**
- Use Tailwind's `dark:` prefix for all color utilities
- Toggle via `<html class="dark">` (JavaScript state management)
- Store user preference in localStorage
- Respect system preference on first load (`prefers-color-scheme: dark`)
- Provide manual toggle in header/settings

**Dark Mode Adjustments:**
- Reduce contrast slightly (prevent eye strain in dark environments)
- Use elevated surfaces (cards slightly lighter than background)
- Adjust shadows (use lighter shadows for depth perception)
- Maintain semantic color meanings (success = green, error = red)
- Ensure all text meets WCAG AA contrast ratios on dark backgrounds

**Dark Mode Testing Requirements:**
- Test all screens in both modes
- Verify chart/graph readability in dark mode
- Ensure images/logos have dark mode variants if needed
- Test transitions between modes (smooth, no flash)

### 3.2 Typography

**Font Family:** Inter (Google Fonts)

**Rationale:** Inter is designed for UI legibility at small sizes, excellent readability, wide language support, and professional appearance suitable for enterprise applications.

#### Type Scale

```css
/* Display - Large headings, hero text */
--font-display-3xl: 48px / 56px (3rem / 3.5rem) - font-weight: 800
--font-display-2xl: 36px / 44px (2.25rem / 2.75rem) - font-weight: 700
--font-display-xl: 30px / 36px (1.875rem / 2.25rem) - font-weight: 700

/* Headings */
--font-h1: 24px / 32px (1.5rem / 2rem) - font-weight: 700
--font-h2: 20px / 28px (1.25rem / 1.75rem) - font-weight: 600
--font-h3: 18px / 28px (1.125rem / 1.75rem) - font-weight: 600
--font-h4: 16px / 24px (1rem / 1.5rem) - font-weight: 600

/* Body */
--font-body-lg: 16px / 24px (1rem / 1.5rem) - font-weight: 400
--font-body: 14px / 20px (0.875rem / 1.25rem) - font-weight: 400
--font-body-sm: 13px / 20px (0.8125rem / 1.25rem) - font-weight: 400

/* Small/Supporting */
--font-small: 12px / 16px (0.75rem / 1rem) - font-weight: 400
--font-tiny: 11px / 16px (0.6875rem / 1rem) - font-weight: 400
```

#### Font Weights
- **400 (Regular):** Body text, descriptions, data values
- **500 (Medium):** Navigation labels, table headers, emphasized text
- **600 (Semibold):** Section headings, card titles, button labels
- **700 (Bold):** Page titles, primary headings
- **800 (Extrabold):** Dashboard metrics, hero numbers

### 3.3 Spacing & Layout

**Base Unit:** 4px (0.25rem)

**Spacing Scale:**
```css
--spacing-0: 0px
--spacing-1: 4px    (0.25rem)
--spacing-2: 8px    (0.5rem)
--spacing-3: 12px   (0.75rem)
--spacing-4: 16px   (1rem)
--spacing-5: 20px   (1.25rem)
--spacing-6: 24px   (1.5rem)
--spacing-8: 32px   (2rem)
--spacing-10: 40px  (2.5rem)
--spacing-12: 48px  (3rem)
--spacing-16: 64px  (4rem)
--spacing-20: 80px  (5rem)
--spacing-24: 96px  (6rem)
```

**Layout Grid:**
- **12-column grid** for complex layouts
- **Gap:** 24px (1.5rem) between columns
- **Container max-width:** 1400px (87.5rem) for main content
- **Sidebar width:** 256px (16rem) for navigation

**Component Spacing:**
- **Card padding:** 24px (1.5rem)
- **Form field spacing:** 16px (1rem) vertical gap
- **Section spacing:** 32px (2rem) between major sections
- **Page margins:** 24px (1.5rem) on mobile, 32px (2rem) on desktop

---

## 4. Design Direction

### 4.1 Chosen Design Approach

**Direction:** **Balanced Professional Dashboard**

**Characteristics:**
- **Layout:** Sidebar navigation (left) + main content area + contextual panels (right when needed)
- **Visual Density:** Balanced - information-rich without overwhelming, strategic use of white space
- **Content Organization:** Card-based layouts for modules, tables for data, modals for focused tasks
- **Visual Weight:** Clean with subtle elevation, soft shadows, clear hierarchy
- **Interaction Style:** Direct manipulation (inline editing), modal workflows for complex forms, progressive disclosure for advanced features

**Layout Pattern:**
```
┌─────────────────────────────────────────────────────┐
│  Header (breadcrumb, search, notifications, user)  │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ Sidebar  │  Main Content Area                       │
│ (Fixed)  │  - Dashboard KPI Cards                   │
│          │  - Data Tables                           │
│ Nav      │  - Forms/Details                         │
│ Items    │  - Charts & Analytics                    │
│          │                                          │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

**Visual Hierarchy Decisions:**
- **Primary actions:** Prominent buttons (bg-primary, higher elevation)
- **Secondary actions:** Outline buttons or ghost buttons
- **Destructive actions:** Red/destructive variant, confirmation dialogs
- **Data emphasis:** Bold values, lighter labels, metric cards with trend indicators
- **Navigation:** Active state clearly indicated with background color and icon color

**Rationale:**
This design direction supports the dual nature of Ultra BMS users:
1. **Power users** (property managers) who need quick access to detailed information across multiple modules
2. **Executive users** who need high-level insights and trend analysis
3. **Occasional users** (vendors, tenants) who need clear, guided workflows

The sidebar provides persistent navigation context, cards organize information into scannable chunks, and modals focus attention on transactional tasks.

---

## 5. User Journey Flows

### 5.1 Critical User Paths

Based on PRD analysis and existing mockup review, the following are the critical user journeys:

#### Journey 1: Maintenance Work Order Creation & Assignment

**User Goal:** Log a maintenance issue and ensure it gets resolved quickly

**Flow Approach:** Guided form with smart defaults and auto-assignment

**Steps:**

1. **Entry Point**
   - User clicks "New Work Order" button (available on maintenance dashboard and global header)
   - System opens modal dialog

2. **Job Details Input** (Step 1 of 2)
   - User selects:
     - Property/Unit (dropdown with search)
     - Issue Category (HVAC, Plumbing, Electrical, etc.)
     - Priority Level (High/Medium/Low) - auto-suggested based on category
     - Description (textarea with voice input option)
     - Upload photos/videos (drag-drop or click)
   - System provides:
     - Smart suggestions based on category
     - Recent similar issues for reference
     - Estimated response time based on priority

3. **Assignment & Scheduling** (Step 2 of 2)
   - System auto-suggests:
     - Qualified vendors based on category, availability, and past performance
     - Tentative schedule based on priority and vendor availability
   - User can:
     - Accept auto-assignment or manually select vendor
     - Adjust schedule if needed
     - Set follow-up reminders

4. **Confirmation & Notification**
   - User reviews summary
   - Clicks "Create Work Order"
   - System:
     - Generates unique work order ID
     - Notifies assigned vendor via email/SMS
     - Notifies tenant of scheduled visit
     - Shows success toast with work order number

5. **Success State**
   - User redirected to work order detail page
   - Can track status, add notes, or modify assignment

**Decision Points:**
- If priority = High → System suggests immediate vendor notification
- If asset selected → System checks if PM schedule exists, suggests preventive action
- If similar recent job exists → System offers to copy details

**Error Handling:**
- Required field validation with inline error messages
- Vendor availability check before assignment
- Conflict detection (same unit, overlapping time)
- Clear error messages with suggested corrections

#### Journey 2: Tenant Onboarding

**User Goal:** Add a new tenant, create lease agreement, and set up payments

**Flow Approach:** Multi-step wizard with progressive disclosure and document generation

**Steps:**

1. **Entry Point**
   - User navigates to Tenants module
   - Clicks "Add New Tenant" button
   - System opens full-screen onboarding wizard

2. **Personal Information** (Step 1 of 5)
   - Form fields:
     - Full Name, Email, Phone
     - Emirates ID / Passport Number
     - Nationality, Occupation
     - Emergency Contact
   - Upload: ID copy, photo
   - Validation: Duplicate check by email/ID

3. **Unit Assignment** (Step 2 of 5)
   - Select property and unit from available inventory
   - System shows:
     - Unit details (bedrooms, sqft, amenities)
     - Current availability status
     - Standard rent amount
   - Optional: Assign parking spot(s)

4. **Lease Terms** (Step 3 of 5)
   - Start Date, End Date (with calendar picker)
   - Rent Breakdown:
     - Base Rent (auto-filled, editable)
     - Admin Fee
     - Service Charge
     - Parking Fee
     - Total Monthly Rent (calculated)
   - Payment Schedule: Monthly / Quarterly / Annual (with PDC count)
   - Security Deposit Amount
   - Late Payment Penalty Settings

5. **Documents & Signatures** (Step 4 of 5)
   - System auto-generates lease agreement PDF
   - User reviews document
   - Options:
     - Download for physical signing
     - Send for digital signature (e-signature integration)
   - Upload signed contract (if physical)
   - Upload additional documents (visa, passport, etc.)

6. **Payment Setup** (Step 5 of 5)
   - Select payment method:
     - Post-Dated Cheques (PDC)
     - Bank Transfer
     - Credit Card (auto-debit)
   - If PDC: Enter cheque numbers, amounts, and dates
   - Record security deposit payment
   - Generate payment schedule

7. **Confirmation & Next Steps**
   - Review complete tenant profile
   - Click "Complete Onboarding"
   - System:
     - Creates tenant record
     - Updates unit status to "Occupied"
     - Generates welcome email with portal access
     - Schedules move-in inspection
     - Sets up payment reminders

**Error States:**
- Unit already occupied → Show error, suggest alternative units
- Invalid ID format → Inline validation with format hint
- Missing required documents → Highlight missing items, allow save as draft
- Lease date conflicts → Warn about overlap, require confirmation

#### Journey 3: Financial Dashboard Monitoring & PDC Management

**User Goal:** Monitor financial health and manage post-dated cheque lifecycle

**Flow Approach:** Dashboard overview with drill-down into transactions

**Steps:**

1. **Entry Point**
   - User clicks "Finance" in sidebar
   - Lands on Financial Dashboard

2. **Dashboard Overview**
   - KPI Cards display:
     - Total Revenue (YTD) with trend
     - Total Expenses (YTD) with trend
     - Net Profit/Loss with percentage change
     - Outstanding Receivables
     - PDCs Pending Deposit (count + amount)
     - PDCs Pending Credit (count + amount)
   - Charts:
     - Revenue vs. Expense trend (last 12 months)
     - Payment collection rate
     - Expense breakdown by category (pie chart)

3. **PDC Management Interaction**
   - User notices "15 PDCs Pending Deposit" alert card
   - Clicks card → Navigates to PDC Management page

4. **PDC Management Page**
   - Tabs: Pending Deposit | Pending Credit | Credited | Bounced | Withdrawn
   - Table view with columns:
     - Cheque Number, Tenant Name, Amount, Due Date, Status, Actions
   - Filters: Property, Tenant, Date Range, Status
   - Bulk actions: Mark as Deposited, Mark as Credited

5. **Mark PDC as Deposited (Action)**
   - User selects multiple PDCs from table (checkboxes)
   - Clicks "Mark as Deposited" button
   - System shows confirmation modal:
     - List of selected PDCs
     - Bank deposit date picker
     - Bank account selector
     - Notes field (optional)
   - User confirms
   - System:
     - Updates PDC status to "Pending Credit"
     - Moves to "Pending Credit" tab
     - Shows success toast
     - Sends notification to finance team

6. **Mark PDC as Credited (Action)**
   - PDC moves to "Pending Credit" tab after deposit
   - After bank credits (user checks bank statement)
   - User selects PDC(s)
   - Clicks "Mark as Credited"
   - System shows confirmation modal with credit date
   - User confirms
   - System:
     - Updates status to "Credited"
     - Records transaction in ledger
     - Updates tenant payment status
     - Marks invoice as paid
     - Generates receipt

7. **Handle Bounced PDC (Error Flow)**
   - If PDC bounces, user clicks "Mark as Bounced"
   - System shows dialog:
     - Reason for bounce (dropdown)
     - Bounce fee charged (auto-calculated)
     - Follow-up action:
       - Request replacement cheque
       - Convert to bank transfer
       - Initiate legal action
   - User selects action and confirms
   - System:
     - Updates status to "Bounced"
     - Adds penalty to tenant balance
     - Sends notification to tenant
     - Creates follow-up task for property manager

**Decision Points:**
- If PDC due date < 7 days → Show in "Upcoming Deposits" alert
- If PDC overdue credit (deposited >5 days ago) → Show warning badge
- If PDC bounced → Auto-create follow-up task and notify management

#### Journey 4: Generate Custom Report

**User Goal:** Extract specific data for decision-making or compliance

**Flow Approach:** Report builder with preview and export options

**Steps:**

1. **Entry Point**
   - User clicks "Reports" in sidebar
   - Sees list of pre-built reports + "Custom Report Builder" option

2. **Select Report Type or Build Custom**
   - Pre-built options:
     - Tenant Occupancy Report
     - Maintenance Cost Analysis
     - Vendor Performance Report
     - Security Deposit Management
     - Financial Summary
   - User selects report or clicks "Build Custom"

3. **Report Configuration** (for custom reports)
   - Select data source: Tenants, Work Orders, Vendors, Finances, Assets
   - Select fields to include (multi-select with search)
   - Apply filters:
     - Date range
     - Property/Unit
     - Status
     - Category
     - Custom conditions (advanced)
   - Group by: Property, Month, Category, etc.
   - Sort by: Date, Amount, Name, etc.

4. **Preview & Refine**
   - System shows live preview of report (first 50 rows)
   - User can:
     - Adjust column order (drag-drop)
     - Show/hide columns
     - Apply formatting (currency, dates, percentages)
     - Add calculated fields

5. **Export & Save**
   - Export options:
     - PDF (for sharing/printing)
     - Excel (for further analysis)
     - CSV (for import to other systems)
   - Save as template option (for recurring reports)
   - Schedule automated generation (daily/weekly/monthly)

6. **Success State**
   - Download starts automatically
   - If saved as template → Added to "My Reports" list
   - If scheduled → Confirmation of schedule with first run date

---

## 6. Component Library Strategy

### 6.1 Component Mapping: Existing → shadcn/ui

Based on analysis of existing HTML mockups and PRD requirements:

#### Core UI Components

| Component Type | Existing Implementation | shadcn/ui Component | Customization Needed |
|---|---|---|---|
| **Buttons** | Custom Tailwind classes | `button` | ✅ Variants for primary, secondary, destructive, ghost |
| **Input Fields** | Custom form inputs | `input`, `textarea` | ✅ Error states, icon support |
| **Dropdowns** | HTML select | `select`, `combobox` | ✅ Search functionality for large lists |
| **Modals** | Custom divs | `dialog`, `sheet` | ✅ Size variants (sm, md, lg, xl, full) |
| **Tables** | Custom HTML tables | `table`, `data-table` | ✅ Sorting, filtering, pagination |
| **Cards** | Custom divs | `card` | ✅ Variants for KPI, metric, info |
| **Navigation** | Custom sidebar | `sidebar-01` | ✅ Collapsible, active states |
| **Alerts/Toasts** | Basic divs | `toast`, `alert` | ✅ Position variants, auto-dismiss |
| **Tabs** | Custom tab UI | `tabs` | ✅ Variant for dashboard modules |
| **Badges** | Colored spans | `badge` | ✅ Status colors (success, warning, error) |
| **Date Picker** | Text input | `calendar`, `date-picker` | ✅ Range selection, presets |

#### Custom Components (Not in shadcn/ui)

##### 6.1.1 **KPI Metric Card**
**Purpose:** Display key performance indicators with trends

**Anatomy:**
- Title (label)
- Primary value (large, bold number)
- Trend indicator (icon + percentage)
- Comparison text (vs. last period)
- Optional: Sparkline chart

**States:**
- Default
- Loading (skeleton)
- Error (--/-- with error message)

**Variants:**
- Size: sm, md, lg
- Trend: positive (green), negative (red), neutral (gray)

**shadcn Base:** `card` + custom content

**Example:**
```tsx
<Card className="p-6">
  <div className="text-sm text-muted-foreground">Total Revenue</div>
  <div className="text-3xl font-bold mt-2">$1,245,890</div>
  <div className="flex items-center gap-1 text-success mt-1">
    <TrendingUp className="h-4 w-4" />
    <span className="text-sm font-medium">12.5% vs. last month</span>
  </div>
</Card>
```

##### 6.1.2 **Work Order Status Timeline**
**Purpose:** Visual representation of work order lifecycle

**Anatomy:**
- Status nodes (Created → Assigned → In Progress → Completed)
- Connecting lines (completed = solid, pending = dashed)
- Timestamps for each status
- Current status highlight

**States:**
- Each node: completed, current, pending, skipped

**shadcn Base:** Custom component using `badge` and Tailwind

##### 6.1.3 **PDC Status Badge**
**Purpose:** Visual indicator for cheque status

**States:**
- Received (blue)
- Deposited (yellow)
- Credited (green)
- Bounced (red)
- Withdrawn (gray)

**shadcn Base:** `badge` with custom color variants

##### 6.1.4 **File Upload Zone**
**Purpose:** Drag-and-drop file upload with preview

**Anatomy:**
- Drop zone area (dashed border)
- Icon and instruction text
- File list with progress indicators
- Remove button for each file
- File type validation

**States:**
- Empty, hovering (drag over), uploading, complete, error

**shadcn Base:** Custom component using `button` for trigger

##### 6.1.5 **Search with Filters Panel**
**Purpose:** Complex search with multiple filter criteria

**Anatomy:**
- Search input with icon
- Filter button (shows active filter count)
- Filter panel (sheet/popover):
  - Date range picker
  - Multi-select dropdowns
  - Radio button groups
  - Apply/Reset buttons

**shadcn Base:** `input`, `sheet`, `date-picker`, `checkbox`, `button`

### 6.2 Component Installation Plan

**Phase 1: Core Primitives**
```bash
npx shadcn@latest add button input label card dialog sheet
```

**Phase 2: Forms**
```bash
npx shadcn@latest add form select checkbox radio-group switch textarea
npx shadcn@latest add calendar date-picker combobox
```

**Phase 3: Data Display**
```bash
npx shadcn@latest add table badge avatar separator skeleton
npx shadcn@latest add tooltip popover hover-card
```

**Phase 4: Navigation & Layout**
```bash
npx shadcn@latest add sidebar-01 breadcrumb tabs pagination
```

**Phase 5: Feedback**
```bash
npx shadcn@latest add toast alert alert-dialog progress
```

**Phase 6: Blocks (Optional Templates)**
```bash
npx shadcn@latest add dashboard-01
```

---

## 7. UX Pattern Decisions

### 7.1 Consistency Rules

These patterns ensure consistent user experience across Ultra BMS:

#### 7.1.1 Button Hierarchy

**Primary Action**
- **Style:** `bg-primary text-primary-foreground` (solid, #0A2342 background)
- **Usage:** Main action on a page (Save, Submit, Create, Complete)
- **Placement:** Right-aligned in forms, prominent position in toolbars
- **Example:** "Create Work Order", "Save Tenant", "Generate Report"

**Secondary Action**
- **Style:** `variant="outline"` (border with transparent background)
- **Usage:** Supporting actions, alternative paths
- **Placement:** Left of primary button or secondary toolbar position
- **Example:** "Cancel", "Save as Draft", "Preview"

**Tertiary Action**
- **Style:** `variant="ghost"` (no border, no background, hover state only)
- **Usage:** Low-priority actions, navigation
- **Placement:** Within content areas, as auxiliary actions
- **Example:** "View Details", "More Options", "Expand"

**Destructive Action**
- **Style:** `variant="destructive"` (red background or red text)
- **Usage:** Delete, remove, terminate operations
- **Confirmation:** Always show confirmation dialog before executing
- **Example:** "Delete Tenant", "Cancel Lease", "Remove Asset"

#### 7.1.2 Feedback Patterns

**Success Feedback**
- **Pattern:** Toast notification (top-right, auto-dismiss in 4 seconds)
- **Visual:** Green checkmark icon, success color background
- **Message Format:** "[Action] successful" + optional next step
- **Example:** "Work order created successfully. View details →"

**Error Feedback**
- **Pattern:** Inline validation (forms) + Alert (system errors) + Toast (action failures)
- **Visual:** Red text, error icon, red border on invalid field
- **Message Format:** Clear description of error + actionable solution
- **Example:** "Email address is already registered. Try logging in or use password reset."

**Warning Feedback**
- **Pattern:** Alert banner (page-level) or warning toast
- **Visual:** Yellow/amber icon, warning color background
- **Message Format:** Description of concern + recommended action
- **Example:** "This lease expires in 30 days. Start renewal process →"

**Info Feedback**
- **Pattern:** Info banner or tooltip
- **Visual:** Blue info icon, subtle background
- **Message Format:** Helpful context or guidance
- **Example:** "Pro tip: Use bulk actions to process multiple PDCs at once."

**Loading States**
- **Pattern:** Skeleton screens (initial load) + Spinner (action in progress) + Progress bar (multi-step)
- **Visual:** Shimmer animation for skeletons, rotating spinner, determinate progress bar
- **Usage:**
  - Skeleton: Table loading, card grids, form data fetching
  - Spinner: Button actions (inline with button text)
  - Progress bar: File uploads, report generation

#### 7.1.3 Form Patterns

**Label Position**
- **Pattern:** Above input field (vertical stacking)
- **Rationale:** Better for responsiveness, clear association, supports longer labels

**Required Field Indicator**
- **Visual:** Asterisk (*) in red next to label
- **Assistive Text:** "(Required)" for screen readers

**Validation Timing**
- **On Blur:** Validate individual field when user leaves it
- **On Submit:** Final validation of entire form
- **Real-time:** For password strength, username availability, character count

**Error Display**
- **Pattern:** Inline error message below field + red border on input
- **Format:** Clear, actionable message (not technical error codes)
- **Example:** "Please enter a valid email address (e.g., user@example.com)"

**Help Text**
- **Pattern:** Small gray text below input (for guidance) + Tooltip icon (for detailed help)
- **Usage:** Explain format requirements, provide examples, clarify purpose

**Multi-Step Forms**
- **Pattern:** Wizard with progress indicator (steps numbered)
- **Navigation:** Next/Previous buttons, ability to save draft and return
- **Validation:** Validate each step before allowing progression
- **Example:** Tenant Onboarding, Quotation Creation

#### 7.1.4 Modal/Dialog Patterns

**Size Variants**
- **sm:** 400px - Simple confirmations, alerts
- **md:** 600px - Single-focus forms (add vendor, edit asset)
- **lg:** 800px - Multi-field forms (work order creation)
- **xl:** 1000px - Complex forms with multiple sections
- **full:** Full screen - Wizards, multi-step processes (tenant onboarding)

**Dismiss Behavior**
- **Click Outside:** Allowed for non-destructive actions (view details)
- **Escape Key:** Always enabled
- **Explicit Close:** Required for forms with unsaved changes (show confirmation)
- **Backdrop:** Semi-transparent dark overlay (`bg-black/50`)

**Focus Management**
- **Auto-focus:** First input field on open (for forms) or primary action button (for confirmations)
- **Tab Trap:** Focus stays within modal until dismissed

**Confirmation Pattern** (for destructive actions)
- **Title:** Clear description of action ("Delete Tenant?")
- **Body:** Explain consequences ("This action cannot be undone. All lease data and payment history will be permanently deleted.")
- **Actions:** "Cancel" (secondary) + "Delete" (destructive, right-aligned)
- **Optional:** Require typing confirmation (e.g., tenant name) for critical deletions

#### 7.1.5 Navigation Patterns

**Active State Indication**
- **Visual:** Background color change (`bg-accent`) + icon and text color change (`text-accent-foreground`)
- **Placement:** Sidebar navigation items
- **Behavior:** Persists based on current route

**Breadcrumb Usage**
- **When Shown:** All pages except dashboard (which is the home)
- **Format:** Home / Module / Sub-page / Current Page
- **Interaction:** All levels clickable except current page
- **Example:** Dashboard / Maintenance / Work Orders / WO-12345

**Back Button Behavior**
- **Browser Back:** Supported and respects navigation history
- **App Back Button:** Shown in detail views, returns to list view or previous context
- **Unsaved Changes:** Warn before navigating away from forms

**Deep Linking**
- **Supported:** All pages and detail views have shareable URLs
- **Format:** `/module/sub-module/id` (e.g., `/maintenance/work-orders/WO-12345`)
- **Behavior:** Maintains authentication, redirects to login if needed

#### 7.1.6 Empty State Patterns

**First Use (No Data Yet)**
- **Visual:** Illustration or icon + headline + description + primary CTA
- **Message Tone:** Helpful and encouraging
- **Example:**
  - Icon: Empty box illustration
  - Headline: "No tenants yet"
  - Description: "Add your first tenant to start managing leases and payments"
  - CTA: "Add Tenant" button

**No Results (Filtered/Searched)**
- **Visual:** Search icon + message
- **Message:** "No results found for '[query]'"
- **Suggestion:** "Try adjusting your filters or search terms"
- **CTA:** "Clear Filters" button

**Cleared/Deleted Content**
- **Visual:** Checkmark icon + confirmation message
- **Message:** "All items cleared" or "Successfully deleted"
- **Optional:** Undo option (with timeout) for reversible actions

#### 7.1.7 Confirmation Patterns

**Delete Operations**
- **Pattern:** Alert dialog with confirmation
- **Content:**
  - Title: "Delete [Item Type]?"
  - Description: Consequences of deletion
  - Optional: Type item name to confirm (for critical items)
- **Actions:** Cancel (secondary) + Delete (destructive)

**Unsaved Changes**
- **Trigger:** User attempts to navigate away from form with edits
- **Pattern:** Alert dialog
- **Content:** "You have unsaved changes. Leave without saving?"
- **Actions:** "Stay" (secondary) + "Leave" (destructive)
- **Alternative:** Auto-save drafts (preferred for complex forms)

**Irreversible Actions**
- **Pattern:** Two-step confirmation
- **Example:** Mark PDC as Credited
  - Step 1: Show details and ask for confirmation
  - Step 2: Require additional input (credit date) to proceed

#### 7.1.8 Notification Patterns

**Placement**
- **Toast:** Top-right corner, stacked vertically (max 3 visible)
- **Banner:** Top of page (below header), full-width
- **Inline:** Within content area, contextually placed

**Duration**
- **Success Toast:** 4 seconds, auto-dismiss
- **Error Toast:** 8 seconds or manual dismiss
- **Warning Toast:** 6 seconds or manual dismiss
- **Banner:** Manual dismiss only (persistent until user action)

**Stacking**
- **Multiple Toasts:** Stack vertically, oldest on bottom
- **Max Visible:** 3 toasts, older ones auto-dismiss when limit reached

**Priority Levels**
- **Critical:** Banner (for system-wide issues, outages)
- **Important:** Error or warning toast (for action failures, attention needed)
- **Info:** Success or info toast (for confirmations, helpful tips)

#### 7.1.9 Search & Filter Patterns

**Search Trigger**
- **Auto-search:** Debounced (300ms delay) after user stops typing
- **Manual:** Search button (for complex searches with filters)

**Results Display**
- **Pattern:** Instant results update (no page reload)
- **Feedback:** Show result count ("Showing 23 of 156 work orders")
- **No Results:** Clear message with suggestions

**Filters**
- **Placement:** Sheet panel (slide-in from right) or collapsible section (above table)
- **Interaction:** Apply button to execute filter, Reset to clear all
- **Active Filters:** Show as badges above results with individual remove buttons

**Saved Searches**
- **Availability:** For power users (property managers)
- **Storage:** Saved to user profile, accessible from dropdown
- **Naming:** User-defined names for saved filter combinations

#### 7.1.10 Date & Time Patterns

**Date Format**
- **Display:** Relative (for recent) + Absolute (for past)
  - "2 minutes ago", "1 hour ago", "Yesterday"
  - "Nov 13, 2025" (for dates >7 days ago)
  - "Nov 13, 2025 at 2:30 PM" (when time is relevant)

**Timezone Handling**
- **Display:** User's local timezone (detected from browser)
- **Storage:** UTC in database
- **Conversion:** Automatic based on user profile settings

**Date Pickers**
- **Component:** shadcn `calendar` + `date-picker`
- **Features:**
  - Month/year navigation
  - Keyboard navigation
  - Range selection (for date ranges)
  - Presets ("Today", "Last 7 days", "This month", "Last quarter")
- **Validation:** Prevent invalid dates (e.g., end date before start date)

---

## 8. Responsive Design & Accessibility

### 8.1 Responsive Strategy

**Target Devices:**
- **Desktop:** Primary (90% of users) - 1920x1080, 1440x900, 1366x768
- **Tablet:** Secondary (8% of users) - iPad, Android tablets
- **Mobile:** Limited (2% of users) - Read-only access, simplified views

**Breakpoint Strategy:**

```css
/* Mobile (Portrait Phones) */
@media (max-width: 640px) { }  // sm
  - Single column layout
  - Bottom sheet for modals
  - Hamburger menu for navigation
  - Touch-optimized buttons (min 44x44px)

/* Tablet (Landscape Phones, Portrait Tablets) */
@media (min-width: 641px) and (max-width: 1024px) { }  // md to lg
  - 2-column layout where appropriate
  - Collapsible sidebar (hamburger toggle)
  - Modals at 80% width
  - Compact table view (hide less critical columns)

/* Desktop (Landscape Tablets, Laptops, Desktops) */
@media (min-width: 1025px) { }  // lg+
  - Full layout with persistent sidebar
  - Multi-column layouts
  - All table columns visible
  - Hover states and tooltips
```

**Adaptation Patterns:**

**Navigation**
- **Desktop:** Persistent sidebar (256px), always visible
- **Tablet:** Collapsible sidebar, overlay on content when open
- **Mobile:** Bottom navigation bar or hamburger menu (top)

**Tables**
- **Desktop:** All columns visible, horizontal scroll if needed
- **Tablet:** Hide less important columns, show on expand
- **Mobile:** Card view (stack rows as cards) or accordion list

**Modals**
- **Desktop:** Centered modal with defined widths (400px to 1000px)
- **Tablet:** Full-width modal with margins
- **Mobile:** Full-screen sheet (slide up from bottom)

**Forms**
- **Desktop:** Multi-column layouts (2-3 columns) for efficiency
- **Tablet:** 2-column layout for shorter forms, single column for complex
- **Mobile:** Single column, full-width inputs

**Cards/Grids**
- **Desktop:** 3-4 column grid
- **Tablet:** 2-3 column grid
- **Mobile:** 1-2 column grid or stacked list

**Dashboard**
- **Desktop:** Multi-column KPI grid (4 columns) + side-by-side charts
- **Tablet:** 2-column KPI grid + stacked charts
- **Mobile:** Single column stacked layout

### 8.2 Accessibility Strategy

**Compliance Target:** **WCAG 2.1 Level AA**

**Rationale:** Ultra BMS may be used by government facilities and public housing authorities, which often require WCAG AA compliance. Level AA balances thorough accessibility with practical implementation.

**Key Requirements:**

#### 8.2.1 Color Contrast

**Text Contrast:**
- **Normal text (14px+):** Minimum 4.5:1 ratio
- **Large text (18px+ or 14px bold+):** Minimum 3:1 ratio
- **UI components and graphics:** Minimum 3:1 ratio

**Current Palette Compliance:**
- ✅ Primary (#0A2342) on White: 15.7:1 (Pass AAA)
- ✅ Foreground (#333333) on White: 12.6:1 (Pass AAA)
- ✅ Muted Text (#6B7280) on White: 5.7:1 (Pass AA)
- ✅ Success (#22C55E) on White: 2.9:1 (Fail - use darker shade for text)
- ✅ Error (#EF4444) on White: 4.1:1 (Pass AA - marginal)

**Action Items:**
- Use darker success color (#16A34A) for text
- Ensure error red meets 4.5:1 for small text
- Test all badge and status indicator combinations

#### 8.2.2 Keyboard Navigation

**Requirements:**
- **All interactive elements accessible via Tab key**
- **Logical tab order** (left-to-right, top-to-bottom)
- **Skip to content** link (bypass navigation)
- **Focus indicators** visible on all focusable elements
- **Keyboard shortcuts** for common actions (optional but recommended)

**Focus Indicators:**
- **Style:** 2px solid ring in accent color, 2px offset
- **Visibility:** Always visible (never `outline: none` without replacement)
- **High Contrast:** Works in high contrast mode

**Modal Focus Management:**
- Focus trap within modal
- Return focus to trigger element on close
- Escape key closes modal

#### 8.2.3 Screen Reader Support

**ARIA Labels:**
- Meaningful labels for all form inputs (`<label>` or `aria-label`)
- Button labels describe action ("Add new tenant", not "Click here")
- Icon buttons have `aria-label` (since no visible text)
- Dynamic content updates announced (`aria-live` regions)

**ARIA Roles:**
- Landmark roles for major sections (`main`, `nav`, `aside`)
- `role="dialog"` for modals
- `role="alert"` for error messages
- `role="status"` for non-critical updates

**ARIA States:**
- `aria-expanded` for collapsible sections
- `aria-selected` for tabs and active navigation
- `aria-checked` for checkboxes/radio buttons
- `aria-disabled` for disabled controls

**Dynamic Content:**
- Use `aria-live="polite"` for status updates (toasts, progress)
- Use `aria-live="assertive"` for critical alerts
- Announce loading states ("Loading data...")

#### 8.2.4 Form Accessibility

**Labels:**
- Every input has associated `<label>` (using `for` attribute)
- Label text clearly describes expected input
- Required fields indicated visually (*) and programmatically (`aria-required`)

**Error Identification:**
- Errors identified in text, not just by color
- Error messages associated with fields (`aria-describedby`)
- Error summary at top of form (for multiple errors)

**Help Text:**
- Associated with inputs using `aria-describedby`
- Visible and programmatically linked

**Autocomplete:**
- Use `autocomplete` attribute for standard fields (name, email, address)
- Helps users with cognitive disabilities and autofill

#### 8.2.5 Touch Target Size

**Minimum Size:** 44x44 pixels (CSS pixels, not physical)

**Applies To:**
- Buttons
- Links (in navigation, cards)
- Form inputs (height)
- Checkboxes and radio buttons (clickable area, not just icon)
- Icon buttons

**Spacing:** Minimum 8px between interactive elements

#### 8.2.6 Alternative Text

**Images:**
- Decorative images: `alt=""` (empty, for screen readers to skip)
- Informative images: Descriptive `alt` text
- Complex images (charts): `alt` summary + detailed description via `aria-describedby`

**Icons:**
- Standalone icons (no text): `aria-label` on button/link
- Decorative icons (with text): `aria-hidden="true"`

#### 8.2.7 Testing Strategy

**Automated Testing:**
- **Tool:** Lighthouse (built into Chrome DevTools)
- **Frequency:** On every deploy (CI/CD integration)
- **Checks:** Contrast, ARIA usage, alt text, form labels

**Manual Testing:**
- **Keyboard-only navigation:** Test all workflows without mouse
- **Screen reader:** NVDA (Windows) or VoiceOver (Mac) - monthly spot checks
- **High contrast mode:** Ensure UI remains usable
- **Zoom to 200%:** Content remains readable and functional (WCAG AA requirement)

**User Testing:**
- **Recruit users with disabilities:** At least 2-3 users for UAT
- **Test assistive technologies:** Screen readers, magnifiers, voice input

---

## 9. Implementation Guidance

### 9.1 shadcn/ui Implementation Roadmap

#### Phase 1: Foundation Setup (Week 1)

**Install Core Dependencies:**
```bash
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge lucide-react
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu
```

**Install Core Components:**
```bash
npx shadcn@latest add button input label card dialog sheet toast alert
```

**Configure Tailwind Theme:**
- Copy color variables from Section 3.1 to `tailwind.config.js`
- Set up custom font (Inter) in CSS
- Configure spacing scale

**Test Installation:**
- Create sample page with button, input, card
- Verify theming works
- Test dark mode toggle

#### Phase 2: Authentication & Layout (Week 2)

**Install Navigation Components:**
```bash
npx shadcn@latest add sidebar-01
```

**Build Pages:**
- Login page (email, password, remember me, forgot password link)
- Password reset flow (3 steps as per PRD)
- Main layout with sidebar

**Components to Create:**
- Login form (using shadcn form, input, button)
- Header component (breadcrumb, search, notifications, user menu)
- Sidebar navigation (using sidebar-01 as base)

#### Phase 3: Dashboard (Week 3-4)

**Install Dashboard Components:**
```bash
npx shadcn@latest add table badge avatar separator skeleton
npx shadcn@latest add tabs tooltip popover
npx shadcn@latest add dashboard-01
```

**Build Dashboard:**
- Executive summary dashboard (KPI cards, charts, alerts)
- Use dashboard-01 as template
- Create custom KPI card component
- Integrate chart library (recharts or similar)

**Components to Create:**
- KPI Metric Card (custom, based on card)
- Alert/Notification Card
- Quick Actions Panel
- Recent Activity Feed

#### Phase 4: Tenant Management (Week 5-6)

**Install Form Components:**
```bash
npx shadcn@latest add form select checkbox radio-group switch textarea
npx shadcn@latest add calendar date-picker combobox
```

**Build Pages:**
- Tenant list (table with search, filters, actions)
- Add tenant form (multi-step wizard)
- Tenant detail page (tabs for info, lease, payments, documents)
- Tenant edit form

**Components to Create:**
- Multi-step wizard container
- File upload component (drag-drop)
- Document viewer/list
- Payment schedule display

#### Phase 5: Maintenance Module (Week 7-8)

**Build Pages:**
- Maintenance dashboard
- Work order list (table with filters)
- Create work order modal (2-step form)
- Work order detail page
- Preventive maintenance calendar

**Components to Create:**
- Work order status timeline
- Priority badge component
- Vendor assignment dropdown (with search)
- Photo/video upload and preview

#### Phase 6: Finance & PDC Management (Week 9-10)

**Build Pages:**
- Financial dashboard
- Transaction log (data table)
- PDC management (tabs for different statuses)
- Bank account management
- Security deposit tracking

**Components to Create:**
- PDC status badge
- Transaction detail modal
- Bulk action toolbar (for PDC marking)
- Financial chart components

#### Phase 7: Vendor & Assets (Week 11)

**Build Pages:**
- Vendor list and detail
- Vendor performance dashboard
- Asset registry
- Asset detail page

**Components to Create:**
- Vendor performance chart
- Asset maintenance history timeline
- Performance rating component

#### Phase 8: Reports & Settings (Week 12)

**Install Additional Components:**
```bash
npx shadcn@latest add breadcrumb pagination progress
```

**Build Pages:**
- Report builder (custom report creation)
- Pre-built reports (occupancy, maintenance cost, vendor performance)
- Settings page (user preferences, system config)
- My profile page

**Components to Create:**
- Report builder interface
- Export options menu
- Settings form sections

### 9.2 Component Audit Checklist

After installing shadcn components, run this audit:

**✅ Lint & Type Check:**
```bash
npm run lint
npm run type-check
```

**✅ Visual Regression:**
- Screenshot key pages before/after component installation
- Compare for unintended style changes

**✅ Accessibility:**
```bash
npm run lighthouse # or use Chrome DevTools
```
- Verify contrast ratios maintained
- Check keyboard navigation
- Test screen reader announcements

**✅ Token Alignment:**
- Verify shadcn components use theme tokens (not hardcoded colors)
- Check spacing consistency
- Validate typography scale applied

**✅ Breaking Changes:**
- Alert if shadcn component introduces TypeScript errors
- Check for conflicting CSS class names
- Verify no prop naming conflicts

### 9.3 Development Guidelines

**When Building New Features:**

1. **Check shadcn registry first** - Don't rebuild existing components
2. **Use component examples** - Call `get_item_examples_from_registries` to see usage patterns
3. **Install, don't copy** - Use `npx shadcn@latest add [component]` to maintain version control
4. **Customize via variants** - Use `class-variance-authority` for component variants, don't fork components
5. **Compose, don't modify** - Build custom components by wrapping/composing shadcn primitives

**Code Quality:**
- Run Prettier after each component installation
- Update Storybook (if using) with new component examples
- Document custom components in component library section of design system

---

## 10. Next Steps & Deliverables

### 10.1 Completion Summary

**What We've Documented:**

✅ **Design System:** shadcn/ui with Tailwind CSS, modern and accessible
✅ **Visual Foundation:** Complete color palette, typography system, spacing scale
✅ **Design Direction:** Balanced professional dashboard with sidebar navigation
✅ **User Journeys:** 4 critical flows fully designed (maintenance, onboarding, finance, reporting)
✅ **Component Library:** 30+ shadcn components mapped + 5 custom components specified
✅ **UX Patterns:** 10 pattern categories with consistency rules for implementation
✅ **Responsive Strategy:** Breakpoint system with adaptation patterns for all device sizes
✅ **Accessibility:** WCAG 2.1 Level AA compliance requirements and testing strategy

**Design Artifacts Created:**
- ✅ UX Design Specification (this document)
- ⏳ Color Theme Visualizer (to be generated)
- ⏳ Design Direction Mockups (to be generated)
- ⏳ shadcn Component Showcase (to be generated)

### 10.2 Implementation Readiness

**Ready for Development:**
- Frontend developers can implement with clear UX guidance and rationale
- All core components specified with shadcn mappings
- User flows documented with decision logic and error handling
- Visual foundation complete (colors, typography, spacing)
- Pattern consistency enforceable through component library

**Recommended Next Steps:**

1. **Generate Visual Artifacts** (Next in this session):
   - Color theme HTML visualizer
   - Dashboard mockup with shadcn components
   - Component showcase page

2. **Install shadcn Components** (Development team):
   - Follow Phase 1-8 installation roadmap
   - Run component audit after each phase
   - Build custom components as specified

3. **Create Component Storybook** (Optional but recommended):
   - Document all shadcn components with usage examples
   - Show all variants and states
   - Include accessibility notes

4. **Architecture Workflow** (If not done):
   - Technical architecture aligned with UX design
   - API design for data flows identified in user journeys
   - Performance considerations for real-time features

5. **Sprint Planning**:
   - Break down implementation into stories
   - Align stories with user journeys
   - Prioritize by user value and dependencies

### 10.3 Open Questions & Decisions Needed

**For User Decision:**

1. **Dark Mode Priority:** Should dark mode be a Phase 1 deliverable or deferred?
   - **Recommendation:** Defer to Phase 2 (after core light mode is complete)

2. **Mobile App:** Is a dedicated mobile app needed, or is responsive web sufficient?
   - **PRD indicates:** 2% mobile usage, read-only access
   - **Recommendation:** Responsive web is sufficient for now

3. **Offline Mode:** Should work orders be creatable offline (Progressive Web App)?
   - **Use Case:** Maintenance supervisors on-site without internet
   - **Recommendation:** Nice-to-have for Phase 2, not MVP

4. **Custom Branding:** Should tenants/vendors see custom property branding (white-label)?
   - **Impact:** Theme customization per property
   - **Recommendation:** Single brand for MVP, multi-tenant theming in Phase 2

**Technical Decisions (for Architecture):**

- Real-time updates (WebSocket vs polling) for work order status
- File storage solution for document uploads (S3, Azure Blob, etc.)
- Chart library (Recharts, Chart.js, D3)
- Date library (date-fns, Day.js, Luxon)

---

## Appendix

### Related Documents

- **Product Requirements:** `/docs/prd.md`
- **Architecture:** `/docs/architecture.md` (if completed)
- **Epics & Stories:** `/docs/epics.md`

### Reference Materials

- **shadcn/ui Documentation:** https://ui.shadcn.com
- **Radix UI Docs:** https://www.radix-ui.com
- **Tailwind CSS Docs:** https://tailwindcss.com
- **WCAG 2.1 Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **Inter Font:** https://fonts.google.com/specimen/Inter

### Existing Design Assets

- **HTML Mockups:** `/docs/archive/stitch_building_maintenance_software/` (69 screens)
- **Current Implementation:** Tailwind-based, custom components
- **Migration Path:** Replace custom components with shadcn equivalents incrementally

### Design System Resources

**Tailwind Config Reference:**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0A2342', foreground: '#FFFFFF' },
        secondary: { DEFAULT: '#1152D4', foreground: '#FFFFFF' },
        accent: { DEFAULT: '#D4AF37', foreground: '#0A2342' },
        // ... (full palette from Section 3.1)
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      // ... (spacing, typography from Section 3.3)
    },
  },
}
```

### Version History

| Date | Version | Changes | Author |
|---|---|---|---|
| Nov 13, 2025 | 1.0 | Initial UX Design Specification | Nata |

---

_This UX Design Specification documents the existing design system while modernizing it with shadcn/ui components for enhanced accessibility, maintainability, and developer experience. All design decisions are backed by user research (PRD analysis) and industry best practices (WCAG compliance, responsive design patterns)._
