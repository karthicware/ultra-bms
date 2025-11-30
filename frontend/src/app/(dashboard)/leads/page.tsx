'use client';

/**
 * Leads List Page
 * Displays all leads with filters, search, and pagination
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getLeads } from '@/services/leads.service';
import type { Lead } from '@/types';
import { Plus, UserPlus } from 'lucide-react';
import LeadsDatatable from '@/components/leads/LeadsDatatable';

export default function LeadsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all leads for client-side filtering
  useEffect(() => {
    const fetchLeads = async () => {
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
    };

    fetchLeads();
  }, [toast]);

  // Handlers
  const handleCreateLead = () => {
    router.push('/leads/create');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
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
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <UserPlus className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
            <p className="text-muted-foreground">
              Manage potential tenant leads and track conversion
            </p>
          </div>
        </div>
        <Button onClick={handleCreateLead} data-testid="btn-create-lead">
          <Plus className="mr-2 h-4 w-4" />
          Create Lead
        </Button>
      </div>

      {/* Datatable */}
      <Card>
        <LeadsDatatable data={leads} />
      </Card>
    </div>
  );
}
