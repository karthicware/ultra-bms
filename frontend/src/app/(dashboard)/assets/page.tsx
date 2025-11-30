'use client';

/**
 * Asset List Page
 * Story 7.1: Asset Registry and Tracking
 * AC #18: Asset list page with table, filters, and status badges
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { assetService } from '@/services/asset.service';
import { AssetListItem } from '@/types/asset';
import { Plus, Package, AlertTriangle } from 'lucide-react';
import AssetsDatatable from '@/components/assets/AssetsDatatable';

export default function AssetsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [assets, setAssets] = useState<AssetListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all assets for client-side filtering
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setIsLoading(true);
        const response = await assetService.getAssets({
          page: 0,
          size: 1000, // Fetch all for client-side filtering
        });
        setAssets(response.data?.content || []);
      } catch (error) {
        console.error('Failed to fetch assets:', error);
        toast({
          title: 'Error',
          description: 'Failed to load assets',
          variant: 'destructive',
        });
        setAssets([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssets();
  }, [toast]);

  // Handlers
  const handleCreateAsset = () => {
    router.push('/assets/new');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6" data-testid="page-assets">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
    <div className="container mx-auto space-y-6" data-testid="page-assets">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
            <p className="text-gray-500">Manage property assets and equipment</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/assets?warranty=expiring')}
            className="flex items-center"
          >
            <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
            Expiring Warranties
          </Button>
          <Button onClick={handleCreateAsset} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Datatable */}
      <Card>
        <AssetsDatatable data={assets} />
      </Card>
    </div>
  );
}
