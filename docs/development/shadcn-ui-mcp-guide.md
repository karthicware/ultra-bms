# shadcn/ui MCP Server Guide

**Purpose:** Complete guide for using the shadcn/ui MCP (Model Context Protocol) server to discover, install, and manage UI components.

**Version:** 1.0
**Last Updated:** 2025-11-15
**Project:** Ultra BMS

---

## Table of Contents

1. [Overview](#overview)
2. [Available MCP Tools](#available-mcp-tools)
3. [Standard Workflow](#standard-workflow)
4. [Common Patterns](#common-patterns)
5. [Best Practices](#best-practices)
6. [Examples](#examples)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### What is the shadcn/ui MCP Server?

The shadcn/ui MCP server provides programmatic access to the shadcn/ui component registry, allowing you to:

- Search for components by name or description
- View component details and source code
- Get usage examples and demos
- Generate installation commands
- Run post-installation audit checklists

### Why Use MCP Tools Instead of Direct CLI?

| Aspect | MCP Tools ✅ | Direct CLI ❌ |
|--------|-------------|--------------|
| **Discovery** | Search and browse components | Must know exact names |
| **Examples** | View demo code before installing | No preview available |
| **Verification** | Audit checklist after install | Manual verification |
| **Documentation** | Integrated with AI workflow | Separate process |
| **Consistency** | Tool-tracked operations | Manual tracking needed |

---

## Available MCP Tools

### 1. `mcp__shadcn__get_project_registries`

**Purpose:** Get list of configured registries in your project.

**Parameters:** None

**Returns:** List of registry names (e.g., `["@shadcn"]`)

**When to Use:**
- At the start of any component installation workflow
- To verify project is configured for shadcn/ui

**Example:**
```typescript
mcp__shadcn__get_project_registries()
// Returns: ["@shadcn"]
```

---

### 2. `mcp__shadcn__list_items_in_registries`

**Purpose:** List all available components in specified registries.

**Parameters:**
- `registries` (required): Array of registry names, e.g., `["@shadcn"]`
- `limit` (optional): Max number of items to return
- `offset` (optional): Number of items to skip (for pagination)

**Returns:** List of all components with names and descriptions

**When to Use:**
- To browse all available components
- To discover new components you might need
- For general exploration

**Example:**
```typescript
mcp__shadcn__list_items_in_registries({
  registries: ["@shadcn"],
  limit: 50,
  offset: 0
})
```

---

### 3. `mcp__shadcn__search_items_in_registries`

**Purpose:** Search for components using fuzzy matching on names and descriptions.

**Parameters:**
- `registries` (required): Array of registry names
- `query` (required): Search term (e.g., "table", "form", "dialog")
- `limit` (optional): Max results
- `offset` (optional): Pagination offset

**Returns:** Matching components sorted by relevance

**When to Use:**
- When you know roughly what you need but not the exact name
- To find related components (e.g., search "date" to find calendar, date-picker)
- Before installation to verify component exists

**Example:**
```typescript
mcp__shadcn__search_items_in_registries({
  registries: ["@shadcn"],
  query: "table"
})
// Returns: table, data-table-demo, etc.
```

---

### 4. `mcp__shadcn__view_items_in_registries`

**Purpose:** View detailed information about specific components including source code.

**Parameters:**
- `items` (required): Array of component names with registry prefix
  - Format: `["@shadcn/button", "@shadcn/card"]`

**Returns:** Complete component details including:
- Name and description
- Component type (ui, example, block)
- Full source code for all files
- Dependencies
- Registry metadata

**When to Use:**
- To inspect component code before installation
- To understand component structure
- To verify component matches your needs
- For code review and quality checks

**Example:**
```typescript
mcp__shadcn__view_items_in_registries({
  items: ["@shadcn/table", "@shadcn/badge"]
})
```

---

### 5. `mcp__shadcn__get_item_examples_from_registries`

**Purpose:** Find usage examples and demo code for components.

**Parameters:**
- `registries` (required): Array of registry names
- `query` (required): Search for examples
  - Common patterns: `"{component}-demo"`, `"{component} example"`
  - Examples: `"button-demo"`, `"table example"`, `"accordion-demo"`

**Returns:** Complete demo/example code with all dependencies

**When to Use:**
- ALWAYS before installing a new component type
- To see real-world usage patterns
- To understand component API
- To get starter code for your implementation

**Common Example Patterns:**
- `accordion-demo` → Accordion usage
- `button-demo` → Button variants
- `data-table-demo` → Full data table implementation
- `form-demo` → Form with validation
- `dialog-demo` → Modal dialog usage

**Example:**
```typescript
mcp__shadcn__get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "data-table-demo"
})
// Returns full implementation with imports, types, and usage
```

---

### 6. `mcp__shadcn__get_add_command_for_items`

**Purpose:** Get the exact CLI command to install specific components.

**Parameters:**
- `items` (required): Array of component names with registry prefix
  - Format: `["@shadcn/button", "@shadcn/table"]`

**Returns:** The complete `npx shadcn@latest add` command ready to execute

**When to Use:**
- ALWAYS before running any installation command
- To verify the exact command with correct component names
- To avoid typos in component names
- To ensure registry prefix is correct

**Example:**
```typescript
mcp__shadcn__get_add_command_for_items({
  items: ["@shadcn/table", "@shadcn/dropdown-menu", "@shadcn/select"]
})
// Returns: "npx shadcn@latest add @shadcn/table @shadcn/dropdown-menu @shadcn/select"
```

---

### 7. `mcp__shadcn__get_audit_checklist`

**Purpose:** Get post-installation checklist to verify everything is working.

**Parameters:** None

**Returns:** Comprehensive checklist including:
- File creation verification
- Import path checks
- TypeScript compilation
- Build validation
- Common issues to watch for

**When to Use:**
- ALWAYS after installing new components
- After major component updates
- When debugging component issues
- As final verification step

**Example:**
```typescript
mcp__shadcn__get_audit_checklist()
// Returns step-by-step verification checklist
```

---

## Standard Workflow

### Complete Component Installation Workflow

Follow these steps **EVERY TIME** you need to add shadcn/ui components:

#### Step 1: Verify Project Configuration

```typescript
// Check that project is set up for shadcn/ui
const registries = await mcp__shadcn__get_project_registries();
// Expected: ["@shadcn"]
// If empty or error: Run `npx shadcn@latest init` first
```

#### Step 2: Search for Components

```typescript
// Search for what you need
const searchResults = await mcp__shadcn__search_items_in_registries({
  registries: ["@shadcn"],
  query: "table" // or "form", "dialog", etc.
});

// Review results and identify exact component names
```

#### Step 3: View Examples (Recommended)

```typescript
// BEFORE installing, see how it's used
const examples = await mcp__shadcn__get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "data-table-demo" // Component name + "-demo"
});

// Study the example code to understand:
// - Required imports
// - Props and API
// - Common patterns
// - Dependencies
```

#### Step 4: View Component Details (Optional)

```typescript
// If you need to see the actual component source
const details = await mcp__shadcn__view_items_in_registries({
  items: ["@shadcn/table", "@shadcn/badge"]
});

// Review source code for:
// - Implementation details
// - Customization options
// - TypeScript types
```

#### Step 5: Get Installation Command

```typescript
// Get the exact command to run
const command = await mcp__shadcn__get_add_command_for_items({
  items: ["@shadcn/table", "@shadcn/dropdown-menu", "@shadcn/select"]
});

// Returns: "npx shadcn@latest add @shadcn/table @shadcn/dropdown-menu @shadcn/select"
```

#### Step 6: Execute Installation

```bash
# Run the command from Step 5
npx shadcn@latest add @shadcn/table @shadcn/dropdown-menu @shadcn/select --yes

# Or if the command includes multiple components:
npx shadcn@latest add table dropdown-menu select --yes
```

#### Step 7: Run Audit Checklist

```typescript
// Verify installation was successful
const checklist = await mcp__shadcn__get_audit_checklist();

// Follow the checklist to verify:
// ✅ Files created in src/components/ui/
// ✅ No TypeScript errors
// ✅ Imports work correctly
// ✅ Build succeeds
```

#### Step 8: Verify with TypeScript

```bash
# Always run TypeScript check after installation
npx tsc --noEmit

# Should have no errors related to new components
```

---

## Common Patterns

### Pattern 1: Adding Form Components

```typescript
// 1. Search for form-related components
const formComponents = await mcp__shadcn__search_items_in_registries({
  registries: ["@shadcn"],
  query: "form"
});

// 2. View form example
const formExample = await mcp__shadcn__get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "form-demo"
});

// 3. Get install command for all form-related components
const cmd = await mcp__shadcn__get_add_command_for_items({
  items: [
    "@shadcn/form",
    "@shadcn/input",
    "@shadcn/label",
    "@shadcn/button",
    "@shadcn/select",
    "@shadcn/textarea"
  ]
});

// 4. Install
// npx shadcn@latest add form input label button select textarea --yes

// 5. Audit
const audit = await mcp__shadcn__get_audit_checklist();
```

---

### Pattern 2: Adding Data Display Components

```typescript
// 1. Search for table/data components
const dataComponents = await mcp__shadcn__search_items_in_registries({
  registries: ["@shadcn"],
  query: "table"
});

// 2. View data-table example (complex component)
const tableExample = await mcp__shadcn__get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "data-table-demo"
});

// 3. Get install command
const cmd = await mcp__shadcn__get_add_command_for_items({
  items: [
    "@shadcn/table",
    "@shadcn/dropdown-menu", // Often used with tables
    "@shadcn/checkbox",      // For row selection
    "@shadcn/button"         // For actions
  ]
});

// 4. Install @tanstack/react-table dependency
// npm install @tanstack/react-table

// 5. Install shadcn components
// npx shadcn@latest add table dropdown-menu checkbox button --yes

// 6. Audit
const audit = await mcp__shadcn__get_audit_checklist();
```

---

### Pattern 3: Adding Dialog/Modal Components

```typescript
// 1. Search for dialog components
const dialogComponents = await mcp__shadcn__search_items_in_registries({
  registries: ["@shadcn"],
  query: "dialog"
});

// 2. View examples for both dialog and alert-dialog
const dialogExample = await mcp__shadcn__get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "dialog-demo"
});

const alertDialogExample = await mcp__shadcn__get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "alert-dialog-demo"
});

// 3. Get install command
const cmd = await mcp__shadcn__get_add_command_for_items({
  items: [
    "@shadcn/dialog",
    "@shadcn/alert-dialog",
    "@shadcn/button" // For dialog actions
  ]
});

// 4. Install
// npx shadcn@latest add dialog alert-dialog button --yes

// 5. Audit
const audit = await mcp__shadcn__get_audit_checklist();
```

---

### Pattern 4: Adding Date/Time Components

```typescript
// 1. Search for calendar/date components
const dateComponents = await mcp__shadcn__search_items_in_registries({
  registries: ["@shadcn"],
  query: "calendar"
});

// 2. View calendar example
const calendarExample = await mcp__shadcn__get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "calendar-demo"
});

// 3. Get install command
const cmd = await mcp__shadcn__get_add_command_for_items({
  items: [
    "@shadcn/calendar",
    "@shadcn/popover", // Calendar often used in popover
    "@shadcn/button"   // For trigger button
  ]
});

// 4. Install date-fns dependency (if not already installed)
// npm install date-fns

// 5. Install shadcn components
// npx shadcn@latest add calendar popover button --yes

// 6. Audit
const audit = await mcp__shadcn__get_audit_checklist();
```

---

## Best Practices

### DO ✅

1. **Always Search First**
   ```typescript
   // Good: Search to find all related components
   await mcp__shadcn__search_items_in_registries({
     registries: ["@shadcn"],
     query: "form"
   });
   ```

2. **View Examples Before Installing**
   ```typescript
   // Good: Understand usage before installation
   await mcp__shadcn__get_item_examples_from_registries({
     registries: ["@shadcn"],
     query: "data-table-demo"
   });
   ```

3. **Use MCP to Get Install Command**
   ```typescript
   // Good: Get exact command from MCP
   const cmd = await mcp__shadcn__get_add_command_for_items({
     items: ["@shadcn/table"]
   });
   ```

4. **Run Audit After Installation**
   ```typescript
   // Good: Verify installation
   await mcp__shadcn__get_audit_checklist();
   ```

5. **Install Related Components Together**
   ```typescript
   // Good: Install all related components at once
   items: ["@shadcn/form", "@shadcn/input", "@shadcn/label", "@shadcn/button"]
   ```

6. **Check TypeScript After Installation**
   ```bash
   # Good: Verify no type errors
   npx tsc --noEmit
   ```

### DON'T ❌

1. **Don't Skip Examples**
   ```typescript
   // Bad: Installing without seeing usage
   npx shadcn@latest add table
   // No idea how to use it!
   ```

2. **Don't Guess Component Names**
   ```bash
   # Bad: Guessing the component name
   npx shadcn@latest add data-table  # Might not exist

   # Good: Search first
   await mcp__shadcn__search_items_in_registries({...})
   ```

3. **Don't Install Without Registry Prefix**
   ```typescript
   // Bad: Missing registry prefix
   items: ["table", "form"]

   // Good: Include registry prefix
   items: ["@shadcn/table", "@shadcn/form"]
   ```

4. **Don't Skip Audit Checklist**
   ```bash
   # Bad: Just install and move on
   npx shadcn@latest add table
   # (No verification)

   # Good: Run audit after
   await mcp__shadcn__get_audit_checklist()
   ```

5. **Don't Install One at a Time**
   ```bash
   # Bad: Multiple separate installations
   npx shadcn@latest add table
   npx shadcn@latest add dropdown-menu
   npx shadcn@latest add checkbox

   # Good: Install together
   npx shadcn@latest add table dropdown-menu checkbox
   ```

---

## Examples

### Example 1: Adding Components for a Lead Management Page

**Requirement:** Need to create a page with a data table, filters, and create button.

```typescript
// Step 1: Verify project setup
const registries = await mcp__shadcn__get_project_registries();
console.log(registries); // ["@shadcn"]

// Step 2: Search for table components
const tableResults = await mcp__shadcn__search_items_in_registries({
  registries: ["@shadcn"],
  query: "table"
});
// Found: table, data-table-demo

// Step 3: View data table example
const tableExample = await mcp__shadcn__get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "data-table-demo"
});
// Study the example code...

// Step 4: Identify all needed components
const neededComponents = [
  "@shadcn/table",
  "@shadcn/button",
  "@shadcn/input",        // For search
  "@shadcn/select",       // For filters
  "@shadcn/dropdown-menu", // For row actions
  "@shadcn/checkbox",     // For row selection
  "@shadcn/badge"         // For status indicators
];

// Step 5: Get install command
const cmd = await mcp__shadcn__get_add_command_for_items({
  items: neededComponents
});
console.log(cmd);
// "npx shadcn@latest add @shadcn/table @shadcn/button @shadcn/input @shadcn/select @shadcn/dropdown-menu @shadcn/checkbox @shadcn/badge"

// Step 6: Install @tanstack/react-table dependency
// npm install @tanstack/react-table

// Step 7: Run the command
// npx shadcn@latest add table button input select dropdown-menu checkbox badge --yes

// Step 8: Run audit
const audit = await mcp__shadcn__get_audit_checklist();
// Follow checklist...

// Step 9: Verify TypeScript
// npx tsc --noEmit
```

---

### Example 2: Adding Form Components

**Requirement:** Create a lead creation form with validation.

```typescript
// Step 1: Search for form components
const formResults = await mcp__shadcn__search_items_in_registries({
  registries: ["@shadcn"],
  query: "form"
});

// Step 2: View form example with validation
const formExample = await mcp__shadcn__get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "form-demo"
});

// Step 3: Search for date picker (for passport expiry)
const dateResults = await mcp__shadcn__search_items_in_registries({
  registries: ["@shadcn"],
  query: "calendar"
});

// Step 4: View calendar example
const calendarExample = await mcp__shadcn__get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "calendar-demo"
});

// Step 5: Get install command for all form components
const cmd = await mcp__shadcn__get_add_command_for_items({
  items: [
    "@shadcn/form",
    "@shadcn/input",
    "@shadcn/label",
    "@shadcn/select",
    "@shadcn/textarea",
    "@shadcn/calendar",
    "@shadcn/popover",
    "@shadcn/button",
    "@shadcn/card"  // For form sections
  ]
});

// Step 6: Install dependencies
// npm install react-hook-form @hookform/resolvers zod date-fns

// Step 7: Install shadcn components
// npx shadcn@latest add form input label select textarea calendar popover button card --yes

// Step 8: Audit
const audit = await mcp__shadcn__get_audit_checklist();
```

---

### Example 3: Adding Components for Quotation Management

**Requirement:** Quotation list with send confirmation dialog.

```typescript
// Step 1: Search for dialog components
const dialogResults = await mcp__shadcn__search_items_in_registries({
  registries: ["@shadcn"],
  query: "dialog"
});
// Found: dialog, alert-dialog

// Step 2: View alert-dialog example (for confirmation)
const alertExample = await mcp__shadcn__get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "alert-dialog-demo"
});

// Step 3: Get install command
const cmd = await mcp__shadcn__get_add_command_for_items({
  items: [
    "@shadcn/table",
    "@shadcn/button",
    "@shadcn/badge",
    "@shadcn/alert-dialog",  // For send confirmation
    "@shadcn/dropdown-menu"   // For row actions
  ]
});

// Step 4: Install
// npx shadcn@latest add table button badge alert-dialog dropdown-menu --yes

// Step 5: Audit
const audit = await mcp__shadcn__get_audit_checklist();
```

---

## Troubleshooting

### Issue: Component Not Found

**Error:** `The item at https://ui.shadcn.com/r/styles/.../toast.json was not found`

**Solution:**
```typescript
// Don't guess names, search first
const results = await mcp__shadcn__search_items_in_registries({
  registries: ["@shadcn"],
  query: "toast"
});
// Check what's actually available
// Might be "sonner" instead of "toast"
```

---

### Issue: Missing Dependencies

**Error:** `Cannot find module '@tanstack/react-table'`

**Solution:**
```typescript
// Always check example code for dependencies
const example = await mcp__shadcn__get_item_examples_from_registries({
  registries: ["@shadcn"],
  query: "data-table-demo"
});
// Look at imports to see what packages are needed
// Install: npm install @tanstack/react-table
```

---

### Issue: TypeScript Errors After Installation

**Error:** `Cannot find name 'Component'`

**Solution:**
```bash
# 1. Check if files were created
ls -la src/components/ui/

# 2. Run audit checklist
# (via MCP tool)

# 3. Restart TypeScript server
# In VSCode: Cmd+Shift+P > "TypeScript: Restart TS Server"

# 4. Check tsconfig.json paths
# Ensure @/components/* is mapped correctly
```

---

### Issue: Component Styling Not Working

**Error:** Components render but look unstyled

**Solution:**
```bash
# 1. Check if Tailwind CSS is configured
cat tailwind.config.js

# 2. Check if globals.css imports are correct
cat src/app/globals.css

# 3. Verify components.json configuration
cat components.json

# 4. Restart dev server
npm run dev
```

---

## Quick Reference

### Most Common Components

| Component | Use Case | Dependencies | MCP Search Query |
|-----------|----------|--------------|------------------|
| `table` | Data tables | @tanstack/react-table | "table" |
| `form` | Forms | react-hook-form, zod | "form" |
| `button` | Buttons | None | "button" |
| `input` | Text input | None | "input" |
| `select` | Dropdowns | None | "select" |
| `dialog` | Modals | None | "dialog" |
| `alert-dialog` | Confirmations | None | "alert-dialog" |
| `calendar` | Date picker | date-fns | "calendar" |
| `popover` | Popovers | None | "popover" |
| `badge` | Status indicators | None | "badge" |
| `card` | Cards | None | "card" |
| `tabs` | Tabbed content | None | "tabs" |
| `dropdown-menu` | Menus | None | "dropdown-menu" |
| `checkbox` | Checkboxes | None | "checkbox" |
| `textarea` | Multi-line input | None | "textarea" |

### Example Search Queries

| What You Need | Search Query | Example Query |
|---------------|--------------|---------------|
| Component itself | Component name | "table", "button" |
| Usage example | "{component}-demo" | "table-demo", "form-demo" |
| Complex examples | "example {component}" | "example booking-form" |
| Pattern-specific | Pattern name | "dashboard", "authentication" |

---

## Checklist Template

Use this checklist for EVERY component installation:

```
Component Installation Checklist
================================

Pre-Installation:
□ Run mcp__shadcn__get_project_registries()
□ Search for components with mcp__shadcn__search_items_in_registries()
□ View examples with mcp__shadcn__get_item_examples_from_registries()
□ Review component details (optional) with mcp__shadcn__view_items_in_registries()
□ Get install command with mcp__shadcn__get_add_command_for_items()

Installation:
□ Install npm dependencies (if needed)
□ Run shadcn add command from MCP tool
□ Verify files created in src/components/ui/

Post-Installation:
□ Run mcp__shadcn__get_audit_checklist()
□ Run npx tsc --noEmit (no errors)
□ Test import in a component file
□ Verify styling works
□ Restart dev server if needed
```

---

## Summary

### Golden Rules

1. **ALWAYS use MCP tools**, not direct CLI commands
2. **ALWAYS view examples** before installing
3. **ALWAYS get the install command** from MCP
4. **ALWAYS run the audit checklist** after installation
5. **ALWAYS verify TypeScript** compilation

### Standard MCP Workflow

```typescript
// 1. Verify setup
await mcp__shadcn__get_project_registries()

// 2. Search for components
await mcp__shadcn__search_items_in_registries({...})

// 3. View examples
await mcp__shadcn__get_item_examples_from_registries({...})

// 4. Get install command
await mcp__shadcn__get_add_command_for_items({...})

// 5. Execute command (from terminal)
npx shadcn@latest add ... --yes

// 6. Run audit
await mcp__shadcn__get_audit_checklist()
```

### Remember

- MCP tools provide **discovery** capabilities
- Examples show **real-world usage**
- Audit checklist ensures **quality**
- TypeScript verification catches **errors early**

---

**For Questions or Issues:**
- Check this guide first
- Review the troubleshooting section
- Consult shadcn/ui documentation: https://ui.shadcn.com
- Check component examples on the website

**Last Updated:** 2025-11-15 by Claude Code AI Agent
