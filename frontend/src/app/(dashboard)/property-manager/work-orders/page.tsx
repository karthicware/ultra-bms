'use client';

/**
 * Work Orders List Page
 * Story 4.1: Work Order Creation and Management
 * Displays all work orders with filters, search, and pagination
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getWorkOrders } from '@/services/work-orders.service';
import { WorkOrderListItem } from '@/types/work-orders';
import { Plus, Wrench } from 'lucide-react';
import WorkOrdersDatatable from '@/components/work-orders/WorkOrdersDatatable';

export default function WorkOrdersPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [workOrders, setWorkOrders] = useState<WorkOrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all work orders for client-side filtering
  const fetchWorkOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getWorkOrders({
        page: 0,
        size: 1000, // Fetch all for client-side filtering
      });
      setWorkOrders(response.data || []);
    } catch (error) {
      console.error('Failed to fetch work orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load work orders. Please try again.',
        variant: 'destructive',
      });
      setWorkOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  // Handlers
  const handleCreateWorkOrder = () => {
    router.push('/property-manager/work-orders/new');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-40" />
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
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wrench className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Work Orders</h1>
            <p className="text-muted-foreground">Manage maintenance work orders for your properties</p>
          </div>
        </div>
        <Button onClick={handleCreateWorkOrder} data-testid="btn-create-work-order">
          <Plus className="mr-2 h-4 w-4" />
          Create Work Order
        </Button>
      </div>

      {/* Datatable */}
      <Card>
        <WorkOrdersDatatable data={workOrders} />
      </Card>
    </div>
  );
}
