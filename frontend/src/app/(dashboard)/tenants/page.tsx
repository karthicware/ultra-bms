'use client';

/**
 * Tenant List Page
 * Displays all tenants with search and pagination
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllTenants } from '@/services/tenant.service';
import type { TenantResponse } from '@/types/tenant';
import { Plus, Calendar } from 'lucide-react';
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

  // Date for header
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-8 max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-6 rounded-xl border shadow-sm">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card className="border-none shadow-sm">
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between bg-card p-6 rounded-xl border shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tenants</h1>
          <div className="flex items-center text-muted-foreground text-sm gap-2">
            <Calendar className="h-4 w-4" />
            <span>{today}</span>
            <span className="text-border">|</span>
            <span>Manage tenants and view lease information</span>
          </div>
        </div>
        <Button
          onClick={handleCreateTenant}
          data-testid="btn-create-tenant"
          className="gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Tenant
        </Button>
      </div>

      {/* Datatable */}
      <Card className="shadow-sm border">
        <TenantsDatatable data={tenants} />
      </Card>
    </div>
  );
}
