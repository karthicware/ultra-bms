'use client';

/**
 * Tenant List Page
 * Displays all tenants with search and pagination
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllTenants } from '@/services/tenant.service';
import type { TenantResponse } from '@/types/tenant';
import { Plus, Users } from 'lucide-react';
import TenantsDatatable from '@/components/tenants/TenantsDatatable';

export default function TenantsPage() {
  const router = useRouter();

  // State
  const [tenants, setTenants] = useState<TenantResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all tenants for client-side filtering
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setIsLoading(true);
        const response = await getAllTenants(0, 1000); // Fetch all for client-side filtering
        setTenants(response.data?.content || []);
      } catch (error) {
        console.error('Failed to fetch tenants:', error);
        setTenants([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenants();
  }, []);

  // Handlers
  const handleCreateTenant = () => {
    router.push('/tenants/create');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
            <p className="text-muted-foreground">
              Manage tenants and view lease information
            </p>
          </div>
        </div>
        <Button
          onClick={handleCreateTenant}
          data-testid="btn-create-tenant"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Tenant
        </Button>
      </div>

      {/* Datatable */}
      <Card className="py-0">
        <TenantsDatatable data={tenants} />
      </Card>
    </div>
  );
}
