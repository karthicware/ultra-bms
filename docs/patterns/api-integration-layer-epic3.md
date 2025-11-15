# API Integration Layer Design - Epic 3 (Tenant Management)

**Epic:** Epic 3 - Tenant Management & Portal
**Version:** 1.0
**Status:** 📋 Design Document (Ready for Implementation)
**Last Updated:** November 15, 2025

---

## Overview

This document defines the API integration layer structure for Epic 3 (Tenant Management), following patterns established in Epic 2 (Authentication). The design ensures consistency, type safety, and maintainability across all frontend-to-backend communications.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   React Components                       │
│            (TenantList, TenantForm, etc.)               │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ import { tenantService }
                   │
┌──────────────────▼──────────────────────────────────────┐
│              services/tenant.service.ts                  │
│  • createTenant()   • deleteTenant()                    │
│  • updateTenant()   • getTenantById()                   │
│  • getTenants()     • searchTenants()                   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ uses
                   │
┌──────────────────▼──────────────────────────────────────┐
│                lib/api-client.ts                         │
│  • Axios instance with interceptors                     │
│  • Auto token refresh                                    │
│  • CSRF protection                                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ HTTP calls
                   │
┌──────────────────▼──────────────────────────────────────┐
│              Backend REST API                            │
│            /api/tenants/* endpoints                      │
└─────────────────────────────────────────────────────────┘
```

---

## 1. Type Definitions

**File:** `frontend/src/types/tenant.ts`

```typescript
// Enums
export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  TERMINATED = 'TERMINATED',
}

export enum LeaseType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  SHORT_TERM = 'SHORT_TERM',
}

// Core tenant interface (matches backend DTO)
export interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  propertyId: string;
  propertyName?: string;  // Populated in list views
  unitId: string;
  unitNumber?: string;    // Populated in list views
  leaseStartDate: string; // ISO date
  leaseEndDate: string;   // ISO date
  monthlyRent: number;
  securityDeposit: number;
  status: TenantStatus;
  leaseType: LeaseType;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  moveInDate?: string;
  moveOutDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Create request (subset of Tenant)
export interface CreateTenantRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  propertyId: string;
  unitId: string;
  leaseStartDate: string;
  leaseEndDate: string;
  monthlyRent: number;
  securityDeposit: number;
  leaseType: LeaseType;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
}

// Update request (partial)
export interface UpdateTenantRequest extends Partial<CreateTenantRequest> {
  status?: TenantStatus;
}

// List response with pagination
export interface TenantListResponse {
  content: Tenant[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// Search/filter parameters
export interface TenantSearchParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
  propertyId?: string;
  status?: TenantStatus;
  searchTerm?: string; // Search in name, email
}
```

---

## 2. Validation Schemas

**File:** `frontend/src/lib/validations/tenant.ts`

```typescript
import { z } from 'zod';
import { TenantStatus, LeaseType } from '@/types/tenant';

// Reusable field schemas
const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

const currencySchema = z
  .number()
  .positive('Amount must be positive')
  .max(1000000, 'Amount too large');

// Create tenant schema
export const createTenantSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email format'),
  phone: phoneSchema,
  propertyId: z.string().uuid('Invalid property'),
  unitId: z.string().uuid('Invalid unit'),
  leaseStartDate: z.date(),
  leaseEndDate: z.date(),
  monthlyRent: currencySchema,
  securityDeposit: currencySchema,
  leaseType: z.nativeEnum(LeaseType),
  emergencyContactName: z.string().max(100).optional(),
  emergencyContactPhone: phoneSchema.optional(),
  notes: z.string().max(500).optional(),
}).refine((data) => data.leaseEndDate > data.leaseStartDate, {
  message: 'Lease end date must be after start date',
  path: ['leaseEndDate'],
});

export type CreateTenantFormData = z.infer<typeof createTenantSchema>;

// Update tenant schema (all fields optional except validation rules)
export const updateTenantSchema = createTenantSchema.partial().extend({
  status: z.nativeEnum(TenantStatus).optional(),
});

export type UpdateTenantFormData = z.infer<typeof updateTenantSchema>;

// Search params schema
export const tenantSearchSchema = z.object({
  page: z.number().min(0).optional(),
  size: z.number().min(1).max(100).optional(),
  sort: z.string().optional(),
  direction: z.enum(['ASC', 'DESC']).optional(),
  propertyId: z.string().uuid().optional(),
  status: z.nativeEnum(TenantStatus).optional(),
  searchTerm: z.string().min(2).max(100).optional(),
});

export type TenantSearchFormData = z.infer<typeof tenantSearchSchema>;
```

---

## 3. API Service Layer

**File:** `frontend/src/services/tenant.service.ts`

```typescript
import apiClient from '@/lib/api-client';
import { handleApiError } from '@/lib/errors';
import type {
  Tenant,
  CreateTenantRequest,
  UpdateTenantRequest,
  TenantListResponse,
  TenantSearchParams,
} from '@/types/tenant';

const BASE_PATH = '/api/tenants';

export const tenantService = {
  /**
   * Get paginated list of tenants
   */
  async getTenants(params?: TenantSearchParams): Promise<TenantListResponse> {
    try {
      const response = await apiClient.get<TenantListResponse>(BASE_PATH, {
        params,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get single tenant by ID
   */
  async getTenantById(id: string): Promise<Tenant> {
    try {
      const response = await apiClient.get<Tenant>(`${BASE_PATH}/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Create new tenant
   */
  async createTenant(data: CreateTenantRequest): Promise<Tenant> {
    try {
      const response = await apiClient.post<Tenant>(BASE_PATH, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update existing tenant
   */
  async updateTenant(
    id: string,
    data: UpdateTenantRequest
  ): Promise<Tenant> {
    try {
      const response = await apiClient.put<Tenant>(`${BASE_PATH}/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete tenant (soft delete)
   */
  async deleteTenant(id: string): Promise<void> {
    try {
      await apiClient.delete(`${BASE_PATH}/${id}`);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Search tenants by name or email
   */
  async searchTenants(searchTerm: string): Promise<Tenant[]> {
    try {
      const response = await apiClient.get<Tenant[]>(`${BASE_PATH}/search`, {
        params: { q: searchTerm },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get tenants by property
   */
  async getTenantsByProperty(propertyId: string): Promise<Tenant[]> {
    try {
      const response = await apiClient.get<Tenant[]>(
        `${BASE_PATH}/by-property/${propertyId}`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get tenants with expiring leases
   */
  async getExpiringLeases(daysAhead: number = 30): Promise<Tenant[]> {
    try {
      const response = await apiClient.get<Tenant[]>(
        `${BASE_PATH}/expiring-leases`,
        {
          params: { days: daysAhead },
        }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
```

---

## 4. React Query Integration (Recommended)

**File:** `frontend/src/hooks/useTenants.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantService } from '@/services/tenant.service';
import type {
  CreateTenantRequest,
  UpdateTenantRequest,
  TenantSearchParams,
} from '@/types/tenant';
import { toast } from 'sonner';

// Query keys for cache management
export const tenantKeys = {
  all: ['tenants'] as const,
  lists: () => [...tenantKeys.all, 'list'] as const,
  list: (params?: TenantSearchParams) =>
    [...tenantKeys.lists(), params] as const,
  details: () => [...tenantKeys.all, 'detail'] as const,
  detail: (id: string) => [...tenantKeys.details(), id] as const,
  search: (term: string) => [...tenantKeys.all, 'search', term] as const,
};

/**
 * Hook for fetching paginated tenant list
 */
export function useTenants(params?: TenantSearchParams) {
  return useQuery({
    queryKey: tenantKeys.list(params),
    queryFn: () => tenantService.getTenants(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching single tenant
 */
export function useTenant(id: string) {
  return useQuery({
    queryKey: tenantKeys.detail(id),
    queryFn: () => tenantService.getTenantById(id),
    enabled: !!id,
  });
}

/**
 * Hook for creating tenant
 */
export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTenantRequest) =>
      tenantService.createTenant(data),
    onSuccess: () => {
      // Invalidate tenant lists to refetch
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
      toast.success('Tenant created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create tenant');
    },
  });
}

/**
 * Hook for updating tenant
 */
export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantRequest }) =>
      tenantService.updateTenant(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific tenant and lists
      queryClient.invalidateQueries({
        queryKey: tenantKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
      toast.success('Tenant updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update tenant');
    },
  });
}

/**
 * Hook for deleting tenant
 */
export function useDeleteTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tenantService.deleteTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
      toast.success('Tenant deleted successfully');
    },
    onError: (error: Error) {
      toast.error(error.message || 'Failed to delete tenant');
    },
  });
}
```

---

## 5. Component Usage Examples

### Tenant List Component

**File:** `frontend/src/app/(dashboard)/tenants/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useTenants } from '@/hooks/useTenants';
import { TenantTable } from '@/components/tenants/TenantTable';
import { TenantSearchForm } from '@/components/tenants/TenantSearchForm';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { TenantSearchParams } from '@/types/tenant';

export default function TenantsPage() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<TenantSearchParams>({
    page: 0,
    size: 10,
  });

  const { data, isLoading, error } = useTenants(searchParams);

  return (
    <div className="container mx-auto p-6" data-testid="page-tenants">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tenants</h1>
        <Button
          data-testid="btn-create-tenant"
          onClick={() => router.push('/tenants/create')}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Tenant
        </Button>
      </div>

      <TenantSearchForm onSearch={setSearchParams} />

      {isLoading && <div data-testid="loading-tenants">Loading...</div>}

      {error && (
        <div data-testid="error-tenants" className="text-red-600">
          Error: {error.message}
        </div>
      )}

      {data && (
        <TenantTable
          tenants={data.content}
          totalPages={data.totalPages}
          currentPage={data.currentPage}
          onPageChange={(page) => setSearchParams({ ...searchParams, page })}
        />
      )}
    </div>
  );
}
```

### Tenant Create Form

**File:** `frontend/src/components/tenants/TenantCreateForm.tsx`

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateTenant } from '@/hooks/useTenants';
import { createTenantSchema, type CreateTenantFormData } from '@/lib/validations/tenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { LeaseType } from '@/types/tenant';
import { useRouter } from 'next/navigation';

export function TenantCreateForm() {
  const router = useRouter();
  const createTenant = useCreateTenant();

  const form = useForm<CreateTenantFormData>({
    resolver: zodResolver(createTenantSchema),
  });

  async function onSubmit(data: CreateTenantFormData) {
    await createTenant.mutateAsync(data);
    router.push('/tenants');
  }

  return (
    <form
      data-testid="form-tenant-create"
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            data-testid="input-tenant-first-name"
            {...form.register('firstName')}
          />
          {form.formState.errors.firstName && (
            <p data-testid="error-first-name" className="text-red-600">
              {form.formState.errors.firstName.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            data-testid="input-tenant-last-name"
            {...form.register('lastName')}
          />
          {form.formState.errors.lastName && (
            <p data-testid="error-last-name" className="text-red-600">
              {form.formState.errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      {/* ... other fields ... */}

      <div className="flex justify-end gap-2">
        <Button
          data-testid="btn-cancel"
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>

        <Button
          data-testid="btn-save-tenant"
          type="submit"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Creating...' : 'Create Tenant'}
        </Button>
      </div>
    </form>
  );
}
```

---

## 6. Backend API Endpoints (Expected)

The frontend expects these endpoints to be implemented in Epic 3:

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/tenants` | Get paginated tenant list | Query params | `TenantListResponse` |
| GET | `/api/tenants/{id}` | Get tenant by ID | - | `Tenant` |
| POST | `/api/tenants` | Create new tenant | `CreateTenantRequest` | `Tenant` |
| PUT | `/api/tenants/{id}` | Update tenant | `UpdateTenantRequest` | `Tenant` |
| DELETE | `/api/tenants/{id}` | Delete tenant (soft) | - | 204 No Content |
| GET | `/api/tenants/search` | Search tenants | `?q=search` | `Tenant[]` |
| GET | `/api/tenants/by-property/{id}` | Get by property | - | `Tenant[]` |
| GET | `/api/tenants/expiring-leases` | Get expiring leases | `?days=30` | `Tenant[]` |

---

## 7. Testing Strategy

### Unit Tests (Jest)

```typescript
import { tenantService } from '@/services/tenant.service';
import apiClient from '@/lib/api-client';
import { mockTenant } from '@/tests/fixtures/tenants';

jest.mock('@/lib/api-client');

describe('tenantService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTenants', () => {
    it('should fetch tenants with pagination', async () => {
      const mockResponse = {
        content: [mockTenant],
        totalElements: 1,
        totalPages: 1,
        currentPage: 0,
        pageSize: 10,
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await tenantService.getTenants({ page: 0, size: 10 });

      expect(apiClient.get).toHaveBeenCalledWith('/api/tenants', {
        params: { page: 0, size: 10 },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createTenant', () => {
    it('should create a new tenant', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockTenant });

      const createData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        // ... other fields
      };

      const result = await tenantService.createTenant(createData);

      expect(apiClient.post).toHaveBeenCalledWith('/api/tenants', createData);
      expect(result).toEqual(mockTenant);
    });
  });
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Tenant Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByTestId('input-email').fill('admin@example.com');
    await page.getByTestId('input-password').fill('password');
    await page.getByTestId('btn-submit').click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create a new tenant', async ({ page }) => {
    await page.goto('/tenants');
    await page.getByTestId('btn-create-tenant').click();

    await page.getByTestId('input-tenant-first-name').fill('John');
    await page.getByTestId('input-tenant-last-name').fill('Doe');
    await page.getByTestId('input-tenant-email').fill('john@example.com');
    await page.getByTestId('input-tenant-phone').fill('+1234567890');
    // ... fill other fields

    await page.getByTestId('btn-save-tenant').click();

    await expect(page.getByTestId('toast-success')).toBeVisible();
    await expect(page).toHaveURL('/tenants');
    await expect(page.getByTestId('table-tenants')).toContainText('John Doe');
  });
});
```

---

## Summary

### Files to Create for Epic 3

1. **Types:** `frontend/src/types/tenant.ts`
2. **Validation:** `frontend/src/lib/validations/tenant.ts`
3. **Service:** `frontend/src/services/tenant.service.ts`
4. **Hooks:** `frontend/src/hooks/useTenants.ts`
5. **Components:**
   - `frontend/src/app/(dashboard)/tenants/page.tsx`
   - `frontend/src/components/tenants/TenantTable.tsx`
   - `frontend/src/components/tenants/TenantCreateForm.tsx`
   - `frontend/src/components/tenants/TenantEditForm.tsx`
   - `frontend/src/components/tenants/TenantSearchForm.tsx`

### Key Patterns Applied

- ✅ **Same API client** as Epic 2 (automatic token refresh)
- ✅ **Same validation pattern** (Zod schemas)
- ✅ **Same error handling** (handleApiError utility)
- ✅ **Same form pattern** (React Hook Form + Zod)
- ✅ **React Query** for caching and state management
- ✅ **data-testid attributes** on all interactive elements
- ✅ **Type-safe** TypeScript throughout

---

**Ready for Implementation in Epic 3!**
