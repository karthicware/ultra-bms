/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Edit Asset Page
 * Story 7.1: Asset Registry and Tracking
 * AC #21: Asset edit page with pre-populated form
 */

import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAsset, useUpdateAsset } from '@/hooks/useAssets';
import { assetUpdateSchema } from '@/lib/validations/asset';
import { ASSET_CATEGORY_OPTIONS } from '@/types/asset';
import {
  ArrowLeft,
  Save,
  Package,
  Building2,
  MapPinIcon,
  FactoryIcon,
  HashIcon,
  CalendarIcon,
  DollarSignIcon,
  ClockIcon,
  TagIcon,
} from 'lucide-react';
import { getProperties } from '@/services/properties.service';

interface PropertyOption {
  id: string;
  name: string;
}

export default function EditAssetPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const assetId = params.id as string;

  const { data: asset, isLoading: isLoadingAsset } = useAsset(assetId);
  const updateAsset = useUpdateAsset();
  const [properties, setProperties] = useState<PropertyOption[]>([]);

  const form = useForm({
    resolver: zodResolver(assetUpdateSchema),
    defaultValues: {
      assetName: '',
      category: undefined as any,
      propertyId: '',
      location: '',
      manufacturer: '',
      modelNumber: '',
      serialNumber: '',
      installationDate: undefined as string | undefined,
      warrantyExpiryDate: undefined as string | undefined,
      purchaseCost: undefined as number | undefined,
      estimatedUsefulLife: undefined as number | undefined,
    },
  });

  // Fetch properties for dropdown
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await getProperties({ page: 0, size: 100 });
        setProperties(response.content || []);
      } catch (error) {
        console.error('Failed to fetch properties:', error);
      }
    };
    fetchProperties();
  }, []);

  // Populate form when asset loads
  useEffect(() => {
    if (asset) {
      form.reset({
        assetName: asset.assetName,
        category: asset.category,
        propertyId: asset.propertyId,
        location: asset.location,
        manufacturer: asset.manufacturer || '',
        modelNumber: asset.modelNumber || '',
        serialNumber: asset.serialNumber || '',
        installationDate: asset.installationDate || undefined,
        warrantyExpiryDate: asset.warrantyExpiryDate || undefined,
        purchaseCost: asset.purchaseCost || undefined,
        estimatedUsefulLife: asset.estimatedUsefulLife || undefined,
      });
    }
  }, [asset, form]);

  const onSubmit = async (data: Record<string, any>) => {
    try {
      await updateAsset.mutateAsync({ id: assetId, data: data as any });
      toast({
        title: 'Success',
        description: 'Asset updated successfully',
        variant: 'success',
      });
      router.push(`/assets/${assetId}`);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update asset',
        variant: 'destructive',
      });
    }
  };

  if (isLoadingAsset) {
    return (
      <div className="container mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center h-64">
        <Package className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">Asset not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/assets')}>
          Back to Assets
        </Button>
      </div>
    );
  }

  if (!asset.editable) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center h-64">
        <Package className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">This asset cannot be edited</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push(`/assets/${assetId}`)}>
          Back to Asset
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/assets/${assetId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Asset</h1>
          <p className="text-gray-500">{asset.assetNumber}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-asset-edit">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="assetName"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label htmlFor="assetName" className="flex items-center gap-1">
                        Asset Name <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <TagIcon className="size-4" />
                        </div>
                        <FormControl>
                          <Input id="assetName" className="pl-9" {...field} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Category <span className="text-destructive">*</span>
                      </Label>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <div className="flex items-center gap-2">
                              <Package className="size-4 text-muted-foreground" />
                              <SelectValue placeholder="Select category" />
                            </div>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ASSET_CATEGORY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Property <span className="text-destructive">*</span>
                      </Label>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <div className="flex items-center gap-2">
                              <Building2 className="size-4 text-muted-foreground" />
                              <SelectValue placeholder="Select property" />
                            </div>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {properties.map((property) => (
                            <SelectItem key={property.id} value={property.id}>
                              <div className="flex items-center gap-2">
                                <Building2 className="size-4" />
                                {property.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label htmlFor="location" className="flex items-center gap-1">
                        Location <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <MapPinIcon className="size-4" />
                        </div>
                        <FormControl>
                          <Input id="location" className="pl-9" {...field} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Equipment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Equipment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label htmlFor="manufacturer">Manufacturer</Label>
                      <div className="relative">
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <FactoryIcon className="size-4" />
                        </div>
                        <FormControl>
                          <Input id="manufacturer" className="pl-9" {...field} value={field.value || ''} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="modelNumber"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label htmlFor="modelNumber">Model Number</Label>
                      <div className="relative">
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <HashIcon className="size-4" />
                        </div>
                        <FormControl>
                          <Input id="modelNumber" className="pl-9" {...field} value={field.value || ''} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label htmlFor="serialNumber">Serial Number</Label>
                      <div className="relative">
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <HashIcon className="size-4" />
                        </div>
                        <FormControl>
                          <Input id="serialNumber" className="pl-9" {...field} value={field.value || ''} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="installationDate"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label htmlFor="installationDate">Installation Date</Label>
                      <div className="relative">
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <CalendarIcon className="size-4" />
                        </div>
                        <FormControl>
                          <Input id="installationDate" className="pl-9" type="date" {...field} value={field.value || ''} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="warrantyExpiryDate"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label htmlFor="warrantyExpiryDate">Warranty Expiry Date</Label>
                      <div className="relative">
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <CalendarIcon className="size-4" />
                        </div>
                        <FormControl>
                          <Input id="warrantyExpiryDate" className="pl-9" type="date" {...field} value={field.value || ''} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="purchaseCost"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label htmlFor="purchaseCost">Purchase Cost</Label>
                      <div className="relative">
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <DollarSignIcon className="size-4" />
                        </div>
                        <FormControl>
                          <Input
                            id="purchaseCost"
                            className="pl-9 pr-14"
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm">
                          AED
                        </span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedUsefulLife"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label htmlFor="estimatedUsefulLife">Estimated Useful Life</Label>
                      <div className="relative">
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <ClockIcon className="size-4" />
                        </div>
                        <FormControl>
                          <Input
                            id="estimatedUsefulLife"
                            className="pl-9 pr-16"
                            type="number"
                            min="1"
                            max="100"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm">
                          years
                        </span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.push(`/assets/${assetId}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateAsset.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {updateAsset.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
