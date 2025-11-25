# Ultra BMS - shadcn/ui Component Installation Priority Guide

## Overview

This guide provides a prioritized, phased approach to installing shadcn/ui components for Ultra BMS. Components are organized by implementation phase and mapped to specific features.

---

## Phase 1: Core Primitives (Week 1)
**Priority:** Critical - Required for all subsequent work

### Components to Install

```bash
# Install core UI primitives
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add separator
npx shadcn@latest add skeleton
```

### Usage Mapping

| Component | Used In | Features |
|---|---|---|
| **button** | All modules | Primary actions, secondary actions, destructive actions, ghost buttons |
| **input** | All forms | Email, text, password, search fields |
| **label** | All forms | Form field labels with required indicators |
| **card** | Dashboards, lists | KPI cards, content containers, list items |
| **badge** | Status displays | Work order status, PDC status, tenant status |
| **separator** | Layout | Section dividers, visual grouping |
| **skeleton** | Loading states | Table loading, card loading, form loading |

### Verification

After installation, test these components:

```tsx
// Test page: app/test/page.tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function TestPage() {
  return (
    <div className="p-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Component Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Button variants */}
          <div className="flex gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="ghost">Ghost</Button>
          </div>

          {/* Input with label */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter email" />
          </div>

          {/* Badges */}
          <div className="flex gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## Phase 2: Navigation & Layout (Week 1-2)
**Priority:** High - Required for app shell

### Components to Install

```bash
# Navigation and layout components
npx shadcn@latest add sidebar-01
npx shadcn@latest add breadcrumb
npx shadcn@latest add avatar
npx shadcn@latest add dropdown-menu
npx shadcn@latest add sheet
```

### Usage Mapping

| Component | Used In | Features |
|---|---|---|
| **sidebar-01** | App layout | Main navigation, module navigation |
| **breadcrumb** | All pages (except dashboard) | Navigation trail (Dashboard / Maintenance / Work Orders / WO-12345) |
| **avatar** | Header, user lists | User profile icon, tenant avatars |
| **dropdown-menu** | Header, actions | User menu, action menus, more options |
| **sheet** | Mobile navigation, filters | Mobile sidebar, filter panels |

### Implementation Example

```tsx
// Layout with sidebar
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { Home, Building2, Users, Wrench, Briefcase } from 'lucide-react'

export default function AppLayout({ children }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/dashboard">
                        <Home />
                        <span>Dashboard</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/properties">
                        <Building2 />
                        <span>Properties</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {/* ... more nav items */}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
```

---

## Phase 3: Forms & Data Entry (Week 2-3)
**Priority:** High - Required for CRUD operations

### Components to Install

```bash
# Form components
npx shadcn@latest add form
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group
npx shadcn@latest add switch
npx shadcn@latest add textarea
npx shadcn@latest add calendar
npx shadcn@latest add popover
npx shadcn@latest add command

# Combined components
npx shadcn@latest add date-picker  # Uses calendar + popover
npx shadcn@latest add combobox     # Uses command + popover
```

### Usage Mapping

| Component | Used In | Features |
|---|---|---|
| **form** | All data entry | Form validation, error handling, React Hook Form integration |
| **select** | All forms | Property selection, category dropdowns, status filters |
| **checkbox** | Forms, filters | Terms acceptance, feature toggles, multi-select filters |
| **radio-group** | Forms | Payment method, priority selection, exclusive choices |
| **switch** | Settings, filters | Feature toggles, boolean preferences |
| **textarea** | Forms | Description fields, notes, comments |
| **calendar** | Date pickers | Lease dates, work order scheduling, report date ranges |
| **date-picker** | All date inputs | Start date, end date, due date |
| **combobox** | Searchable selects | Tenant search, vendor search, unit selection |

### Form Example

```tsx
// Tenant form with react-hook-form + zod
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const tenantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  unitId: z.string().min(1, 'Please select a unit')
})

export function TenantForm() {
  const form = useForm({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      unitId: ''
    }
  })

  const onSubmit = (data) => {
    console.log(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="unitId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="unit-101">Unit 101 - Building A</SelectItem>
                  <SelectItem value="unit-102">Unit 102 - Building A</SelectItem>
                  <SelectItem value="unit-201">Unit 201 - Building B</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Add Tenant</Button>
      </form>
    </Form>
  )
}
```

---

## Phase 4: Data Display & Tables (Week 3-4)
**Priority:** High - Required for lists and reports

### Components to Install

```bash
# Data display components
npx shadcn@latest add table
npx shadcn@latest add data-table  # Advanced table with sorting, filtering, pagination
npx shadcn@latest add pagination
npx shadcn@latest add hover-card
npx shadcn@latest add tooltip
npx shadcn@latest add tabs
npx shadcn@latest add accordion
```

### Usage Mapping

| Component | Used In | Features |
|---|---|---|
| **table** | Simple lists | Basic data tables without complex features |
| **data-table** | Complex lists | Tenant list, work order list, vendor list, PDC management |
| **pagination** | All lists | Navigate through large datasets |
| **hover-card** | Inline info | Quick tenant info preview, work order details on hover |
| **tooltip** | Icon buttons, info | Help text, explanatory tooltips |
| **tabs** | Multi-view pages | Tenant details (Info/Lease/Payments), PDC tabs (Pending/Credited/Bounced) |
| **accordion** | Collapsible sections | FAQ, settings sections, advanced filters |

### Data Table Example

```tsx
// Work orders data table with shadcn
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'

type WorkOrder = {
  id: string
  title: string
  property: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed'
  createdAt: Date
}

const columns: ColumnDef<WorkOrder>[] = [
  {
    accessorKey: 'id',
    header: 'ID'
  },
  {
    accessorKey: 'title',
    header: 'Title'
  },
  {
    accessorKey: 'property',
    header: 'Property'
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: ({ row }) => {
      const priority = row.getValue('priority')
      return (
        <Badge variant={priority === 'high' ? 'destructive' : 'default'}>
          {priority}
        </Badge>
      )
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status')
      return <Badge variant="outline">{status}</Badge>
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return (
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      )
    }
  }
]

export function WorkOrderList({ data }: { data: WorkOrder[] }) {
  return <DataTable columns={columns} data={data} />
}
```

---

## Phase 5: Dialogs & Overlays (Week 4-5)
**Priority:** Medium - Required for modals and confirmations

### Components to Install

```bash
# Dialog and overlay components
npx shadcn@latest add dialog
npx shadcn@latest add alert-dialog
npx shadcn@latest add toast
npx shadcn@latest add sonner  # Alternative toast library (optional)
npx shadcn@latest add alert
```

### Usage Mapping

| Component | Used In | Features |
|---|---|---|
| **dialog** | Forms, details | Add tenant modal, work order creation, edit forms |
| **alert-dialog** | Confirmations | Delete confirmations, unsaved changes warning |
| **toast** | Notifications | Success messages, error notifications, info alerts |
| **alert** | Page-level messages | Warning banners, info boxes, error displays |

### Dialog Example

```tsx
// Create work order dialog
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { WorkOrderForm } from './work-order-form'

export function CreateWorkOrderDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Create Work Order</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Work Order</DialogTitle>
          <DialogDescription>
            Fill in the details to create a maintenance work order.
          </DialogDescription>
        </DialogHeader>
        <WorkOrderForm />
      </DialogContent>
    </Dialog>
  )
}
```

### Alert Dialog Example

```tsx
// Delete confirmation
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

export function DeleteTenantDialog({ tenantName, onConfirm }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete Tenant</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Tenant?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete {tenantName}
            and remove all associated lease data and payment history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

---

## Phase 6: Advanced Components (Week 5-6)
**Priority:** Medium - Enhances user experience

### Components to Install

```bash
# Advanced UI components
npx shadcn@latest add progress
npx shadcn@latest add slider
npx shadcn@latest add scroll-area
npx shadcn@latest add resizable
npx shadcn@latest add context-menu
npx shadcn@latest add menubar
```

### Usage Mapping

| Component | Used In | Features |
|---|---|---|
| **progress** | Loading states | File upload progress, report generation progress |
| **slider** | Filters, settings | Price range filters, date range sliders |
| **scroll-area** | Long lists | Scrollable notification list, log viewers |
| **resizable** | Layouts | Resizable sidebar, split pane views |
| **context-menu** | Right-click actions | Table row actions, quick actions |
| **menubar** | Desktop app | Top menu bar (if desktop app) |

---

## Phase 7: Specialized Components (Week 6+)
**Priority:** Low - Nice to have, project-specific

### Components to Install

```bash
# Specialized components
npx shadcn@latest add carousel
npx shadcn@latest add collapsible
npx shadcn@latest add navigation-menu
npx shadcn@latest add aspect-ratio
npx shadcn@latest add toggle
npx shadcn@latest add toggle-group
```

### Usage Mapping

| Component | Used In | Features |
|---|---|---|
| **carousel** | Image galleries | Property photos, unit images, document previews |
| **collapsible** | Expandable sections | Advanced filters, detailed information sections |
| **navigation-menu** | Complex navigation | Mega menu (if needed for large navigation) |
| **aspect-ratio** | Images | Maintain image aspect ratios in cards |
| **toggle** | Filters, views | Toggle features on/off, view mode toggles |
| **toggle-group** | View switchers | Grid/List view toggle, chart type selector |

---

## Phase 8: Dashboard & Blocks (Optional)
**Priority:** Optional - Pre-built templates

### Components to Install

```bash
# Complete dashboard blocks
npx shadcn@latest add dashboard-01  # Complete dashboard with sidebar, charts, tables
npx shadcn@latest add dashboard-02  # Alternative dashboard layout
npx shadcn@latest add dashboard-03  # Another variant
```

### Usage Mapping

These are complete page templates that combine multiple components. Use as reference or starting points for:
- Executive Summary Dashboard
- Financial Dashboard
- Maintenance Dashboard
- Module-specific dashboards

**Note:** These are large blocks. Review them first, then adapt to Ultra BMS needs rather than using as-is.

---

## Installation Script

Create a bash script to install all Phase 1-5 components at once:

```bash
#!/bin/bash
# install-shadcn-components.sh

echo "Installing shadcn/ui components for Ultra BMS..."

# Phase 1: Core Primitives
echo "Phase 1: Installing core primitives..."
npx shadcn@latest add button input label card badge separator skeleton

# Phase 2: Navigation & Layout
echo "Phase 2: Installing navigation and layout..."
npx shadcn@latest add sidebar-01 breadcrumb avatar dropdown-menu sheet

# Phase 3: Forms & Data Entry
echo "Phase 3: Installing forms and data entry..."
npx shadcn@latest add form select checkbox radio-group switch textarea calendar popover command date-picker combobox

# Phase 4: Data Display & Tables
echo "Phase 4: Installing data display and tables..."
npx shadcn@latest add table data-table pagination hover-card tooltip tabs accordion

# Phase 5: Dialogs & Overlays
echo "Phase 5: Installing dialogs and overlays..."
npx shadcn@latest add dialog alert-dialog toast alert

echo "✅ Core components installed!"
echo "Run phases 6-8 manually as needed."
```

Make it executable:
```bash
chmod +x install-shadcn-components.sh
./install-shadcn-components.sh
```

---

## Post-Installation Checklist

After installing each phase:

### 1. Run Linter
```bash
npm run lint
```

### 2. Check TypeScript
```bash
npm run type-check
```

### 3. Test in Development
```bash
npm run dev
```

### 4. Verify Dark Mode
- Toggle dark mode
- Check all new components adapt correctly
- Verify contrast ratios

### 5. Test Accessibility
```bash
npm run lighthouse  # or use Chrome DevTools
```

### 6. Update Storybook (if using)
```bash
# Create stories for new components
```

---

## Component Customization Guide

### Customizing Existing Components

All shadcn components are in `components/ui/`. You can modify them directly.

**Example: Customize button sizes**

```tsx
// components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3",
        lg: "h-12 rounded-md px-8",
        xl: "h-14 rounded-lg px-10 text-base",  // Add new size
        icon: "h-10 w-10"
      }
    }
  }
)
```

### Creating Custom Variants

```tsx
// Add new button variant for accent color
const buttonVariants = cva(
  // ... base classes
  {
    variants: {
      variant: {
        // ... existing variants
        accent: "bg-accent text-accent-foreground hover:bg-accent/90 dark:bg-accent-dark"
      }
    }
  }
)
```

---

## Feature-to-Component Mapping

Quick reference for which components to use for each Ultra BMS feature:

### Authentication
- `input`, `label`, `button`, `card`, `form`

### Dashboard
- `card`, `badge`, `separator`, `skeleton`, `tabs`

### Tenant Management
- `data-table`, `dialog`, `form`, `select`, `date-picker`, `combobox`, `tabs`

### Work Orders
- `data-table`, `dialog`, `badge`, `select`, `textarea`, `alert-dialog`, `toast`

### Finance / PDC
- `tabs`, `data-table`, `dialog`, `badge`, `date-picker`, `alert-dialog`

### Vendors
- `data-table`, `dialog`, `form`, `avatar`, `badge`, `hover-card`

### Reports
- `select`, `date-picker`, `checkbox`, `button`, `progress`, `data-table`

### Settings
- `tabs`, `form`, `switch`, `select`, `accordion`, `separator`

---

## Resources

- **shadcn/ui Documentation:** https://ui.shadcn.com
- **Component Examples:** Browse registry at https://ui.shadcn.com/examples
- **GitHub Repository:** https://github.com/shadcn-ui/ui
- **Discord Community:** Join for support and tips

---

## Troubleshooting

### Issue: Component not found after installation

**Solution:** Restart dev server
```bash
# Kill dev server (Ctrl+C)
npm run dev
```

### Issue: TypeScript errors after installation

**Solution:** Check imports and rebuild
```bash
npm run type-check
# Fix import paths if needed
```

### Issue: Styles not applying

**Solution:** Verify Tailwind config includes component paths
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ]
}
```

### Issue: Dark mode not working for new component

**Solution:** Add `dark:` prefix to all color utilities in the component

---

**Last Updated:** November 13, 2025
**Version:** 1.0
**Next Steps:** Start with Phase 1, test thoroughly, then proceed to Phase 2.
