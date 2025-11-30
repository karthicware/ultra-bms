/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Create Property Page
 * Form for creating a new property with validation and image upload
 * AC: #1, #17 - Property creation with comprehensive validation
 * Updated: shadcn-studio form styling (SCP-2025-11-30)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { createProperty, uploadPropertyImage } from '@/services/properties.service';
import { getPropertyManagers, type PropertyManager } from '@/services/users.service';
import { createPropertySchema, type CreatePropertyFormData } from '@/lib/validations/properties';
import { PropertyType } from '@/types/properties';
import { PropertyImageUpload } from '@/components/properties/PropertyImageUpload';
import {
  Building2,
  X,
  MapPinIcon,
  HashIcon,
  CalendarIcon,
  RulerIcon,
  UserIcon,
  SparklesIcon,
  HomeIcon,
  BuildingIcon,
  StoreIcon,
} from 'lucide-react';

export default function CreatePropertyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amenitiesInput, setAmenitiesInput] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [managers, setManagers] = useState<PropertyManager[]>([]);
  const [isLoadingManagers, setIsLoadingManagers] = useState(true);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const form = useForm<CreatePropertyFormData>({
    resolver: zodResolver(createPropertySchema),
    defaultValues: {
      name: '',
      address: '',
      propertyType: PropertyType.RESIDENTIAL,
      totalUnitsCount: 1,
      managerId: undefined,
      yearBuilt: undefined,
      totalSquareFootage: undefined,
      amenities: [],
    },
  });

  // Fetch property managers
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        setIsLoadingManagers(true);
        const response = await getPropertyManagers();
        setManagers(response.content);
      } catch (error) {
        // Silently handle error - property manager assignment is optional
        console.error('Failed to fetch managers:', error);
        setManagers([]);
      } finally {
        setIsLoadingManagers(false);
      }
    };

    fetchManagers();

  }, []);

  const onSubmit = async (data: CreatePropertyFormData) => {
    try {
      setIsSubmitting(true);

      // Include amenities from state (only if not empty)
      const payload: any = {
        ...data,
      };

      if (amenities && amenities.length > 0) {
        payload.amenities = amenities;
      }

      const property = await createProperty(payload);

      // Upload images if any were selected
      if (selectedImages.length > 0) {
        let uploadedCount = 0;
        for (let i = 0; i < selectedImages.length; i++) {
          try {
            await uploadPropertyImage(property.id, selectedImages[i], i);
            uploadedCount++;
          } catch {
            // Continue with other images if one fails
            console.error(`Failed to upload image ${i + 1}`);
          }
        }
        if (uploadedCount < selectedImages.length) {
          toast({
            title: 'Partial Success',
            description: `Property created. ${uploadedCount} of ${selectedImages.length} images uploaded.`,
            variant: 'warning',
          });
        } else {
          toast({
            title: 'Success',
            description: `Property "${property.name}" created with ${uploadedCount} images`,
            variant: 'success',
          });
        }
      } else {
        toast({
          title: 'Success',
          description: `Property "${property.name}" created successfully`,
          variant: 'success',
        });
      }

      router.push(`/properties/${property.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to create property',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAmenity = () => {
    const trimmed = amenitiesInput.trim();
    if (trimmed && !amenities.includes(trimmed)) {
      setAmenities([...amenities, trimmed]);
      setAmenitiesInput('');
    }
  };

  const handleRemoveAmenity = (amenity: string) => {
    setAmenities(amenities.filter((a) => a !== amenity));
  };

  const handleAmenitiesKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddAmenity();
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Create Property</h1>
        </div>
        <p className="text-muted-foreground">Add a new property to the system</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-property-create">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Required property details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-1">
                      Property Name <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Building2 className="size-4" />
                      </div>
                      <FormControl>
                        <Input
                          id="name"
                          className="pl-9"
                          placeholder="Sunset Towers"
                          {...field}
                          data-testid="input-property-name"
                        />
                      </FormControl>
                    </div>
                    <p className="text-muted-foreground text-xs">Maximum 200 characters</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-1">
                      Address <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute top-3 left-0 flex items-start pl-3">
                        <MapPinIcon className="size-4" />
                      </div>
                      <FormControl>
                        <Textarea
                          id="address"
                          className="pl-9 resize-none min-h-[80px]"
                          placeholder="123 Main Street, Dubai, UAE"
                          {...field}
                          data-testid="input-property-address"
                          rows={3}
                        />
                      </FormControl>
                    </div>
                    <p className="text-muted-foreground text-xs">Full address (maximum 500 characters)</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Property Type <span className="text-destructive">*</span>
                      </Label>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-property-type" className="w-full">
                            <SelectValue placeholder="Select property type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={PropertyType.RESIDENTIAL}>
                            <div className="flex items-center gap-2">
                              <HomeIcon className="size-4 text-blue-600" />
                              <span>Residential</span>
                            </div>
                          </SelectItem>
                          <SelectItem value={PropertyType.COMMERCIAL}>
                            <div className="flex items-center gap-2">
                              <StoreIcon className="size-4 text-green-600" />
                              <span>Commercial</span>
                            </div>
                          </SelectItem>
                          <SelectItem value={PropertyType.MIXED_USE}>
                            <div className="flex items-center gap-2">
                              <BuildingIcon className="size-4 text-purple-600" />
                              <span>Mixed Use</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalUnitsCount"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label htmlFor="totalUnitsCount" className="flex items-center gap-1">
                        Total Units <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <HashIcon className="size-4" />
                        </div>
                        <FormControl>
                          <Input
                            id="totalUnitsCount"
                            type="number"
                            className="pl-9"
                            min={1}
                            placeholder="10"
                            {...field}
                            value={field.value ?? 1}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 1 : parseInt(e.target.value, 10);
                              field.onChange(isNaN(value) ? 1 : value);
                            }}
                            data-testid="input-total-units"
                          />
                        </FormControl>
                      </div>
                      <p className="text-muted-foreground text-xs">Minimum 1 unit</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
              <CardDescription>Optional property information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Property Manager */}
              <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <UserIcon className="size-4 mr-1 text-muted-foreground" />
                      Assigned Manager
                    </Label>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoadingManagers || managers.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-property-manager" className="w-full">
                          <SelectValue placeholder={
                            isLoadingManagers
                              ? "Loading managers..."
                              : managers.length === 0
                                ? "No managers available (optional)"
                                : "Select a manager (optional)"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">
                          <div className="flex items-center gap-2">
                            <UserIcon className="size-4 text-gray-400" />
                            <span>Unassigned</span>
                          </div>
                        </SelectItem>
                        {managers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            <div className="flex items-center gap-2">
                              <UserIcon className="size-4 text-blue-600" />
                              <span>{manager.firstName} {manager.lastName}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-muted-foreground text-xs">Assign a property manager to this property</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="yearBuilt"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label htmlFor="yearBuilt" className="flex items-center gap-1">
                        <CalendarIcon className="size-4 mr-1 text-muted-foreground" />
                        Year Built
                      </Label>
                      <div className="relative">
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <CalendarIcon className="size-4" />
                        </div>
                        <FormControl>
                          <Input
                            id="yearBuilt"
                            type="number"
                            className="pl-9"
                            min={1900}
                            max={new Date().getFullYear()}
                            placeholder="2020"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            value={field.value || ''}
                            data-testid="input-year-built"
                          />
                        </FormControl>
                      </div>
                      <p className="text-muted-foreground text-xs">Between 1900 and {new Date().getFullYear()}</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalSquareFootage"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label htmlFor="totalSquareFootage" className="flex items-center gap-1">
                        <RulerIcon className="size-4 mr-1 text-muted-foreground" />
                        Total Square Footage
                      </Label>
                      <div className="relative">
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <RulerIcon className="size-4" />
                        </div>
                        <FormControl>
                          <Input
                            id="totalSquareFootage"
                            type="number"
                            className="pl-9 pr-12"
                            min={0}
                            step="0.01"
                            placeholder="10000"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value || ''}
                            data-testid="input-square-footage"
                          />
                        </FormControl>
                        <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm">
                          sq ft
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs">Total area in square feet</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Amenities */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <SparklesIcon className="size-4 mr-1 text-muted-foreground" />
                  Amenities
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <SparklesIcon className="size-4" />
                    </div>
                    <Input
                      className="pl-9"
                      placeholder="e.g., Pool, Gym, Parking"
                      value={amenitiesInput}
                      onChange={(e) => setAmenitiesInput(e.target.value)}
                      onKeyDown={handleAmenitiesKeyDown}
                      data-testid="input-amenities"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddAmenity}
                    data-testid="btn-add-amenity"
                  >
                    Add
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">Press Enter or click Add to include amenities</p>
                {amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {amenities.map((amenity) => (
                      <Badge key={amenity} variant="secondary" className="gap-1">
                        {amenity}
                        <button
                          type="button"
                          onClick={() => handleRemoveAmenity(amenity)}
                          className="hover:bg-destructive/20 rounded-full p-0.5"
                          data-testid={`btn-remove-amenity-${amenity}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Property Images */}
          <Card>
            <CardHeader>
              <CardTitle>Property Images</CardTitle>
              <CardDescription>Upload up to 5 images (JPG/PNG/WebP, max 10MB each)</CardDescription>
            </CardHeader>
            <CardContent>
              <PropertyImageUpload
                mode="create"
                onImagesChange={setSelectedImages}
                maxImages={5}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="btn-submit-property"
            >
              {isSubmitting ? 'Creating...' : 'Create Property'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
