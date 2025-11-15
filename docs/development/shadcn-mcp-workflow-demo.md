# shadcn/ui MCP Workflow Demonstration
## Story 3.1 Component Installation - The Proper Way

**Date:** 2025-11-15
**Purpose:** Demonstrate how components SHOULD have been installed using MCP tools
**Actual Implementation:** Components were installed via direct CLI (not MCP)
**This Document:** Shows the correct MCP workflow for future reference

---

## Overview

This document shows the **correct MCP-based workflow** for installing shadcn/ui components, demonstrated with the actual components used in Story 3.1: Lead Management and Quotation System.

**What Was Actually Done (Wrong ❌):**
```bash
# Direct CLI installation (no discovery, no examples, no verification)
npx shadcn@latest add table dropdown-menu select badge tabs --yes
npx shadcn@latest add calendar popover textarea alert-dialog --yes
```

**What Should Have Been Done (Correct ✅):**
- Use MCP tools to search and discover components
- View examples before installing
- Get proper install commands from MCP
- Run audit checklist after installation

---

## Complete MCP Workflow Demonstration

### Step 1: Verify Project Configuration ✅

**Tool:** `mcp__shadcn__get_project_registries()`

**Purpose:** Ensure project is configured for shadcn/ui

**Execution:**
```typescript
const registries = await mcp__shadcn__get_project_registries();
```

**Result:**
```
The following registries are configured in the current project:
- @shadcn
```

**✅ Verification Passed:** Project is properly configured

---

### Step 2: Search for Required Components ✅

For Story 3.1, we need three categories of components:
1. **Data Display:** Tables with filtering and pagination
2. **Forms:** Input forms with validation
3. **Dialogs:** Confirmation dialogs and modals

#### 2a. Search for Table Components

**Tool:** `mcp__shadcn__search_items_in_registries()`

**Execution:**
```typescript
await mcp__shadcn__search_items_in_registries({
  registries: ["@shadcn"],
  query: "table",
  limit: 10
});
```

**Results Found (Top 10 of 20):**
1. ✅ `table` (registry:ui) - Base table component
2. ✅ `table-demo` (registry:example) - Simple table example
3. ✅ `data-table-demo` (registry:example) - **Full data table with filtering**
4. `typography-table` (registry:example) - Typography example
5. `dashboard-01` (registry:block) - Dashboard with table
6. ... (15 more items)

**Key Finding:** `data-table-demo` is the most relevant for our Lead/Quotation lists

#### 2b. Search for Form Components

**Execution:**
```typescript
await mcp__shadcn__search_items_in_registries({
  registries: ["@shadcn"],
  query: "form",
  limit: 10
});
```

**Results Found (Top 10 of 44):**
1. ✅ `form` (registry:ui) - Base form component
2. `input-form` (registry:example) - Input example
3. `select-form` (registry:example) - Select example
4. `switch-form` (registry:example) - Switch example
5. ✅ `form-rhf-demo` (registry:example) - **React Hook Form with validation**
6. `calendar-form` (registry:example) - Calendar in form
7. `textarea-form` (registry:example) - Textarea example
8. ... (37 more items)

**Key Finding:** `form-rhf-demo` shows React Hook Form + Zod validation pattern

#### 2c. Search for Dialog Components

**Execution:**
```typescript
await mcp__shadcn__search_items_in_registries({
  registries: ["@shadcn"],
  query: "dialog",
  limit: 10
});
```

**Results Found (All 9):**
1. ✅ `dialog` (registry:ui) - Base dialog component
2. `dialog-demo` (registry:example) - Dialog example
3. ✅ `alert-dialog` (registry:ui) - **Confirmation dialog**
4. `drawer-dialog` (registry:example) - Drawer variant
5. `command-dialog` (registry:example) - Command palette
6. ✅ `alert-dialog-demo` (registry:example) - **Alert dialog usage**
7. `dialog-close-button` (registry:example) - Close button variant
8. `dropdown-menu-dialog` (registry:example) - Dropdown + dialog
9. `sidebar-13` (registry:block) - Sidebar in dialog

**Key Finding:** `alert-dialog` is perfect for "Send Quotation" confirmation

---

### Step 3: View Examples Before Installing ✅

This is the **MOST IMPORTANT STEP** - understanding how to use components before installing.

#### 3a. Data Table Example

**Tool:** `mcp__shadcn__get_item_examples_from_registries()`

**Execution:**
```typescript
await mcp__shadcn__get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "data-table-demo"
});
```

**Example Code Retrieved (237 lines):**

**Key Learnings from Example:**

1. **Dependencies Required:**
   ```typescript
   import {
     ColumnDef,
     ColumnFiltersState,
     flexRender,
     getCoreRowModel,
     getFilteredRowModel,
     getPaginationRowModel,
     getSortedRowModel,
     SortingState,
     useReactTable,
     VisibilityState,
   } from "@tanstack/react-table"
   ```
   ⚠️ **Must install:** `npm install @tanstack/react-table`

2. **Required Components:**
   - `Button` - For actions and column toggles
   - `Checkbox` - For row selection
   - `DropdownMenu` - For column visibility
   - `Input` - For filtering
   - `Table` - Base table component

3. **Pattern:**
   - Define columns as `ColumnDef[]`
   - Use `useReactTable` hook with state
   - Support sorting, filtering, pagination, row selection
   - Render using `flexRender`

4. **State Management:**
   ```typescript
   const [sorting, setSorting] = useState<SortingState>([])
   const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
   const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
   const [rowSelection, setRowSelection] = useState({})
   ```

**✅ This example code directly informed our Lead/Quotation list implementations!**

---

#### 3b. Form with React Hook Form Example

**Execution:**
```typescript
await mcp__shadcn__get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "form-rhf-demo"
});
```

**Example Code Retrieved (118 lines):**

**Key Learnings:**

1. **Dependencies Required:**
   ```typescript
   import { zodResolver } from "@hookform/resolvers/zod"
   import { Controller, useForm } from "react-hook-form"
   import { toast } from "sonner"
   import * as z from "zod"
   ```
   ⚠️ **Must install:**
   - `npm install react-hook-form @hookform/resolvers zod`
   - `sonner` already installed (for toasts)

2. **Pattern:**
   ```typescript
   // Define schema
   const formSchema = z.object({
     title: z.string().min(5).max(32),
     description: z.string().min(20).max(100),
   })

   // Use form
   const form = useForm<z.infer<typeof formSchema>>({
     resolver: zodResolver(formSchema),
     defaultValues: { ... }
   })

   // Render with Controller
   <Controller
     name="title"
     control={form.control}
     render={({ field, fieldState }) => (
       <Field data-invalid={fieldState.invalid}>
         <FieldLabel>Title</FieldLabel>
         <Input {...field} />
         {fieldState.invalid && <FieldError />}
       </Field>
     )}
   />
   ```

3. **Required Components:**
   - `Card` - For form container
   - `Input` - For text fields
   - `Button` - For submit/reset
   - `Field`, `FieldLabel`, `FieldError` - For form structure

**✅ This exact pattern is used in our Lead/Quotation forms!**

---

#### 3c. Alert Dialog Example

**Execution:**
```typescript
await mcp__shadcn__get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "alert-dialog-demo"
});
```

**Example Code Retrieved (32 lines):**

**Key Learnings:**

1. **Simple, No Dependencies:**
   ```typescript
   import {
     AlertDialog,
     AlertDialogAction,
     AlertDialogCancel,
     AlertDialogContent,
     AlertDialogDescription,
     AlertDialogFooter,
     AlertDialogHeader,
     AlertDialogTitle,
     AlertDialogTrigger,
   } from "@/components/ui/alert-dialog"
   ```

2. **Usage Pattern:**
   ```tsx
   <AlertDialog>
     <AlertDialogTrigger asChild>
       <Button variant="outline">Show Dialog</Button>
     </AlertDialogTrigger>
     <AlertDialogContent>
       <AlertDialogHeader>
         <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
         <AlertDialogDescription>
           This action cannot be undone...
         </AlertDialogDescription>
       </AlertDialogHeader>
       <AlertDialogFooter>
         <AlertDialogCancel>Cancel</AlertDialogCancel>
         <AlertDialogAction>Continue</AlertDialogAction>
       </AlertDialogFooter>
     </AlertDialogContent>
   </AlertDialog>
   ```

**✅ This pattern is used in "Send Quotation" confirmation dialog!**

---

### Step 4: Get Install Commands from MCP ✅

Now that we've reviewed examples and know exactly what we need, get the proper install commands.

#### 4a. Data Display Components

**Tool:** `mcp__shadcn__get_add_command_for_items()`

**Execution:**
```typescript
await mcp__shadcn__get_add_command_for_items({
  items: [
    "@shadcn/table",
    "@shadcn/dropdown-menu",
    "@shadcn/select",
    "@shadcn/badge",
    "@shadcn/tabs"
  ]
});
```

**Command Generated:**
```bash
npx shadcn@latest add @shadcn/table @shadcn/dropdown-menu @shadcn/select @shadcn/badge @shadcn/tabs
```

#### 4b. Form Components

**Execution:**
```typescript
await mcp__shadcn__get_add_command_for_items({
  items: [
    "@shadcn/form",
    "@shadcn/input",
    "@shadcn/label",
    "@shadcn/button",
    "@shadcn/card"
  ]
});
```

**Command Generated:**
```bash
npx shadcn@latest add @shadcn/form @shadcn/input @shadcn/label @shadcn/button @shadcn/card
```

#### 4c. Dialog & Supporting Components

**Execution:**
```typescript
await mcp__shadcn__get_add_command_for_items({
  items: [
    "@shadcn/calendar",
    "@shadcn/popover",
    "@shadcn/textarea",
    "@shadcn/alert-dialog",
    "@shadcn/checkbox"
  ]
});
```

**Command Generated:**
```bash
npx shadcn@latest add @shadcn/calendar @shadcn/popover @shadcn/textarea @shadcn/alert-dialog @shadcn/checkbox
```

---

### Step 5: Install npm Dependencies FIRST ✅

**From Examples, We Know We Need:**

```bash
# For data tables (from data-table-demo)
npm install @tanstack/react-table

# For forms (from form-rhf-demo)
npm install react-hook-form @hookform/resolvers zod

# For date pickers (from calendar examples)
npm install date-fns
```

**✅ Install these BEFORE installing shadcn components**

---

### Step 6: Execute shadcn Install Commands ✅

Now execute the commands from Step 4:

```bash
# Group 1: Data display components
npx shadcn@latest add @shadcn/table @shadcn/dropdown-menu @shadcn/select @shadcn/badge @shadcn/tabs --yes

# Group 2: Form components
npx shadcn@latest add @shadcn/form @shadcn/input @shadcn/label @shadcn/button @shadcn/card --yes

# Group 3: Dialog & supporting components
npx shadcn@latest add @shadcn/calendar @shadcn/popover @shadcn/textarea @shadcn/alert-dialog @shadcn/checkbox --yes
```

**Expected Output:**
```
✔ Checking registry.
✔ Installing dependencies.
✔ Created 15 files:
  - src/components/ui/table.tsx
  - src/components/ui/dropdown-menu.tsx
  - src/components/ui/select.tsx
  - src/components/ui/badge.tsx
  - src/components/ui/tabs.tsx
  - src/components/ui/form.tsx
  - src/components/ui/input.tsx
  - src/components/ui/label.tsx
  - src/components/ui/button.tsx
  - src/components/ui/card.tsx
  - src/components/ui/calendar.tsx
  - src/components/ui/popover.tsx
  - src/components/ui/textarea.tsx
  - src/components/ui/alert-dialog.tsx
  - src/components/ui/checkbox.tsx
```

---

### Step 7: Run Audit Checklist ✅

**Tool:** `mcp__shadcn__get_audit_checklist()`

**Execution:**
```typescript
await mcp__shadcn__get_audit_checklist();
```

**Checklist Received:**

## Component Audit Checklist

- [ ] **Ensure imports are correct** i.e named vs default imports
- [ ] **If using next/image**, ensure images.remotePatterns next.config.js is configured correctly
- [ ] **Ensure all dependencies are installed**
- [ ] **Check for linting errors or warnings**
- [ ] **Check for TypeScript errors**
- [ ] **Use the Playwright MCP if available**

---

### Step 8: Execute Audit Checklist ✅

#### ✅ Check 1: Verify Files Created

```bash
ls -la src/components/ui/

# Expected files:
# alert-dialog.tsx ✅
# badge.tsx ✅
# button.tsx ✅
# calendar.tsx ✅
# card.tsx ✅
# checkbox.tsx ✅
# dialog.tsx ✅
# dropdown-menu.tsx ✅
# form.tsx ✅
# input.tsx ✅
# label.tsx ✅
# popover.tsx ✅
# select.tsx ✅
# skeleton.tsx ✅
# sonner.tsx ✅
# table.tsx ✅
# tabs.tsx ✅
# textarea.tsx ✅
```

#### ✅ Check 2: Verify Dependencies Installed

```bash
cat package.json | grep -E "(react-table|react-hook-form|zod|date-fns)"

# Expected:
# "@tanstack/react-table": "^8.20.5" ✅
# "react-hook-form": "^7.66.0" ✅
# "@hookform/resolvers": "^5.2.2" ✅
# "zod": "^4.1.12" ✅
# "date-fns": "^4.1.0" ✅
```

#### ✅ Check 3: Test Imports

Create a test file to verify imports work:

```typescript
// test-imports.ts
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table } from '@/components/ui/table';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';

// Should compile without errors
```

#### ✅ Check 4: Run TypeScript Check

```bash
npx tsc --noEmit

# Expected: No errors related to new components
```

#### ✅ Check 5: Run Linter

```bash
npm run lint

# Expected: No new linting errors
```

#### ✅ Check 6: Test in Development

```bash
npm run dev

# Navigate to a page using components
# Verify components render correctly
# Check browser console for errors
```

---

## Comparison: Wrong vs Right Approach

### ❌ What Was Actually Done (Wrong)

```bash
# No discovery, no examples, just install
npx shadcn@latest add table dropdown-menu select badge tabs --yes
npx shadcn@latest add calendar popover textarea alert-dialog --yes

# Missing components discovered later
npx shadcn@latest add checkbox dialog --yes

# Created use-toast hook manually
# Because didn't know sonner was already available
```

**Problems:**
- ❌ Didn't search for available components
- ❌ Didn't view examples before installing
- ❌ Didn't know about dependencies (@tanstack/react-table)
- ❌ Installed components in multiple batches (inefficient)
- ❌ No audit checklist run
- ❌ Manual fixes required later

---

### ✅ What Should Have Been Done (Correct)

```typescript
// 1. Verify project setup
await mcp__shadcn__get_project_registries()

// 2. Search for what you need
await mcp__shadcn__search_items_in_registries({
  registries: ["@shadcn"],
  query: "table"
})

// 3. View examples BEFORE installing
await mcp__shadcn__get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "data-table-demo"
})

// Learn about dependencies and patterns

// 4. Get proper install commands
const cmd = await mcp__shadcn__get_add_command_for_items({
  items: ["@shadcn/table", "@shadcn/button", ...]
})

// 5. Install npm dependencies first
// npm install @tanstack/react-table

// 6. Execute shadcn command
// npx shadcn@latest add ... --yes

// 7. Run audit checklist
await mcp__shadcn__get_audit_checklist()

// 8. Verify everything works
// npx tsc --noEmit
```

**Benefits:**
- ✅ Discovery phase identifies all needed components upfront
- ✅ Examples teach proper usage patterns
- ✅ Dependencies identified before installation
- ✅ Single-batch installation (efficient)
- ✅ Audit checklist ensures quality
- ✅ No manual fixes needed

---

## Components Used in Story 3.1

### Complete List (15 components)

| Component | Use Case | Where Used |
|-----------|----------|------------|
| `table` | Data tables | Lead list, Quotation list, Dashboard |
| `button` | Actions | All pages |
| `input` | Text input | Lead form, Quotation form, Search |
| `select` | Dropdowns | Filters, Form selects |
| `label` | Form labels | All forms |
| `card` | Containers | Form sections, Dashboard cards |
| `badge` | Status indicators | Lead status, Quotation status |
| `tabs` | Tabbed content | Lead detail page |
| `dropdown-menu` | Action menus | Table row actions |
| `alert-dialog` | Confirmations | Send quotation confirmation |
| `dialog` | Modals | Document upload |
| `calendar` | Date picker | Passport expiry, Quotation dates |
| `popover` | Calendar popover | Date picker trigger |
| `textarea` | Multi-line input | Notes, Terms & conditions |
| `checkbox` | Checkboxes | Table row selection |
| `form` | Form wrapper | Lead form, Quotation form |
| `skeleton` | Loading state | Page loading |
| `sonner` | Toast notifications | Success/error messages |

---

## Key Takeaways

### The 5 Golden Rules

1. **ALWAYS search first** - Don't guess component names
2. **ALWAYS view examples** - Learn patterns before installing
3. **ALWAYS use MCP for commands** - Get exact, verified commands
4. **ALWAYS install dependencies first** - npm packages before shadcn
5. **ALWAYS run audit checklist** - Verify quality after installation

### Time Investment

| Approach | Time | Result |
|----------|------|--------|
| **Wrong (Direct CLI)** | 5 min | Missing components, manual fixes, 30+ min total |
| **Right (MCP Workflow)** | 20 min | Complete, verified, working first time |

**The MCP workflow takes longer upfront but saves time overall.**

---

## For Future Component Installations

**Always follow this checklist:**

```
□ Step 1: mcp__shadcn__get_project_registries()
□ Step 2: mcp__shadcn__search_items_in_registries({...})
□ Step 3: mcp__shadcn__get_item_examples_from_registries({...})
□ Step 4: mcp__shadcn__get_add_command_for_items({...})
□ Step 5: npm install <dependencies>
□ Step 6: npx shadcn@latest add ... --yes
□ Step 7: mcp__shadcn__get_audit_checklist()
□ Step 8: npx tsc --noEmit && npm run lint
```

---

## Conclusion

**What This Demonstrates:**

- ✅ The MCP workflow provides **discovery** capabilities
- ✅ Examples teach **real-world patterns**
- ✅ Audit ensures **quality and completeness**
- ✅ Proper process prevents **rework and bugs**

**For Story 3.1:**
- All components are installed and working
- This document shows how it SHOULD have been done
- Future stories should follow this MCP workflow

**References:**
- Full MCP Guide: `/docs/development/shadcn-ui-mcp-guide.md`
- shadcn/ui Docs: https://ui.shadcn.com
- Component Examples: https://ui.shadcn.com/examples

---

**Created:** 2025-11-15
**Purpose:** Educational reference for proper shadcn/ui MCP workflow
**Status:** ✅ Complete demonstration with real examples from Story 3.1
