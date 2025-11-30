'use client';

/**
 * Property List Page
 * Displays all properties with filters, search, and pagination
 * AC: #1, #10 - Property list with search, filters, and occupancy display
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getProperties } from '@/services/properties.service';
import type { Property, PropertyType } from '@/types/properties';
import { PropertyDeleteDialog } from '@/components/properties/PropertyDeleteDialog';
import PropertyDatatable from '@/components/properties/PropertyDatatable';
import { Plus, Search, Building2 } from 'lucide-react';

export default function PropertiesPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<{ id: string; name: string } | null>(null);

  // Fetch all properties (client-side filtering via datatable)
  const fetchProperties = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getProperties({
        page: 0,
        size: 1000, // Load all for client-side filtering
        search: searchTerm || undefined,
      });

      setProperties(response.content || []);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load properties. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  // Debounced search (300ms as per Story 3.1 pattern)
  const debouncedFetchProperties = useMemo(
    () => debounce(fetchProperties, 300),
    [fetchProperties]
  );

  useEffect(() => {
    debouncedFetchProperties();
    return () => debouncedFetchProperties.cancel();
  }, [debouncedFetchProperties]);

  // Handlers
  const handleCreateProperty = () => {
    router.push('/properties/create');
  };

  const handleDeleteProperty = (id: string, name: string) => {
    setPropertyToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = () => {
    // Refresh the property list after successful deletion
    fetchProperties();
  };

  const handleSearch = () => {
    setSearchTerm(pendingSearch);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
            <p className="text-muted-foreground">
              Manage properties and track occupancy rates
            </p>
          </div>
        </div>
        <Button
          onClick={handleCreateProperty}
          data-testid="btn-create-property"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Property
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or address..."
              value={pendingSearch}
              onChange={(e) => setPendingSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-9"
              data-testid="input-search-property"
            />
          </div>
          <Button onClick={handleSearch} className="gap-2" data-testid="btn-search">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>
      </Card>

      {/* Properties Table */}
      <Card className="py-0">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <PropertyDatatable
            data={properties}
            onDelete={handleDeleteProperty}
            pageSize={10}
          />
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      {propertyToDelete && (
        <PropertyDeleteDialog
          propertyId={propertyToDelete.id}
          propertyName={propertyToDelete.name}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}
