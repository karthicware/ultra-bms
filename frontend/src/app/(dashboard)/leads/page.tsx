'use client';

/**
 * Leads List Page
 * Displays all leads with filters, search, and pagination
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getLeads, deleteLead } from '@/services/leads.service';
import type { Lead } from '@/types';
import { Plus, UserPlus } from 'lucide-react'; // Added UserPlus import
import LeadsDatatable from '@/components/leads/LeadsDatatable';
import { LeadsKPI } from '@/components/leads/LeadsKPI';

export default function LeadsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all leads for client-side filtering
  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getLeads({
        page: 0,
        size: 1000, // Fetch all for client-side filtering
      });
      setLeads(response.data.content);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load leads. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Handlers
  const handleCreateLead = () => {
    router.push('/leads/create');
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await deleteLead(leadId);
      toast({
        title: 'Success',
        description: 'Lead deleted successfully',
        variant: 'success',
      });
      fetchLeads();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete lead',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-[400px] w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3"> {/* Added this div for icon and title */}
          <UserPlus className="h-8 w-8 text-primary" /> {/* Re-added icon */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leads Management</h1>
            <p className="text-muted-foreground mt-1">
              Track potential tenants, manage inquiries, and monitor conversion rates.
            </p>
          </div>
        </div>
        <Button onClick={handleCreateLead} data-testid="btn-create-lead" className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Add New Lead
        </Button>
      </div>

      {/* KPI Dashboard */}
      <LeadsKPI leads={leads} />

      {/* Datatable Section */}
      <Card className="shadow-sm">
        <LeadsDatatable data={leads} onDelete={handleDeleteLead} />
      </Card>
    </div>
  );
}
