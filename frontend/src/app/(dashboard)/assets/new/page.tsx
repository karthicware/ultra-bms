/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Create Asset Page
 * Story 7.1: Asset Registry and Tracking
 * AC #20: Asset create form with validation
 */

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
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
import { useCreateAsset } from '@/hooks/useAssets';
import { assetCreateSchema, type AssetCreateInput } from '@/lib/validations/asset';
import { ASSET_CATEGORY_OPTIONS, type AssetCreateRequest, AssetCategory } from '@/types/asset';
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
import { useEffect, useState } from 'react';
import { getProperties } from '@/services/properties.service';

interface PropertyOption {
  id: string;
  name: string;
}

export default function NewAssetPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createAsset = useCreateAsset();
  const [properties, setProperties] = useState<PropertyOption[]>([]);

  const form = useForm({
    resolver: zodResolver(assetCreateSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
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
        toast({
          title: 'Error',
          description: 'Failed to load properties',
          variant: 'destructive',
        });
      }
    };
    fetchProperties();
  }, [toast]);

  const onSubmit = async (data: AssetCreateInput) => {
    try {
      // Transform form data to API request format
      const requestData: AssetCreateRequest = {
        assetName: data.assetName,
        category: data.category as AssetCategory,
        propertyId: data.propertyId,
        location: data.location,
        manufacturer: data.manufacturer || undefined,
        modelNumber: data.modelNumber || undefined,
        serialNumber: data.serialNumber || undefined,
        installationDate: data.installationDate || undefined,
        warrantyExpiryDate: data.warrantyExpiryDate || undefined,
        purchaseCost: data.purchaseCost ?? undefined,
        estimatedUsefulLife: data.estimatedUsefulLife ?? undefined,
      };

      await createAsset.mutateAsync(requestData);
      toast({
        title: 'Success',
        description: 'Asset created successfully',
        variant: 'success',
      });
      router.push('/assets');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.response?.data?.error?.message || 'Failed to create asset';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/assets')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Asset</h1>
          <p className="text-gray-500">Register a new property asset or equipment</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-asset-create">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Enter the asset details</CardDescription>
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
                          <Input id="assetName" className="pl-9" placeholder="e.g., Main HVAC Unit" {...field} />
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
                      <Select onValueChange={field.onChange} value={field.value || ''}>
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
                      <Select onValueChange={field.onChange} value={field.value || ''}>
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
                          <Input id="location" className="pl-9" placeholder="e.g., Rooftop, Basement Level 2" {...field} />
                        </FormControl>
                      </div>
                      <p className="text-muted-foreground text-xs">Physical location within the property</p>
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
              <CardDescription>Manufacturer and model information (optional)</CardDescription>
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
                          <Input id="manufacturer" className="pl-9" placeholder="e.g., Carrier, Trane" {...field} value={field.value || ''} />
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
                          <Input id="modelNumber" className="pl-9" placeholder="e.g., XYZ-1000" {...field} value={field.value || ''} />
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
                          <Input id="serialNumber" className="pl-9" placeholder="e.g., SN123456789" {...field} value={field.value || ''} />
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
                          <Input
                            id="installationDate"
                            className="pl-9"
                            type="date"
                            {...field}
                            value={field.value || ''}
                          />
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
                          <Input
                            id="warrantyExpiryDate"
                            className="pl-9"
                            type="date"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                      </div>
                      <p className="text-muted-foreground text-xs">Leave empty if no warranty</p>
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
              <CardDescription>Cost and depreciation details (optional)</CardDescription>
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
                          <NumberInput
                            id="purchaseCost"
                            className="pl-9 pr-14"
                            step={1}
                            min={0}
                            placeholder="0.00"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
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
                          <NumberInput
                            id="estimatedUsefulLife"
                            className="pl-9 pr-16"
                            min={1}
                            max={100}
                            placeholder="e.g., 10"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
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
            <Button type="button" variant="outline" onClick={() => router.push('/assets')}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAsset.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {createAsset.isPending ? 'Creating...' : 'Create Asset'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
