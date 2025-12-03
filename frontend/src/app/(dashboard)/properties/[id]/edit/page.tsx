/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Edit Property Page
 * Form for updating an existing property with validation
 * AC: #1, #17 - Property updates with validation
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { NumberInput } from '@/components/ui/number-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getPropertyById, updateProperty, getPropertyImages } from '@/services/properties.service';
import { getPropertyManagers, type PropertyManager } from '@/services/users.service';
import { updatePropertySchema, type UpdatePropertyFormData } from '@/lib/validations/properties';
import { PropertyType, type PropertyImage } from '@/types/properties';
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
  LayersIcon,
} from 'lucide-react';

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const propertyId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amenitiesInput, setAmenitiesInput] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [managers, setManagers] = useState<PropertyManager[]>([]);
  const [isLoadingManagers, setIsLoadingManagers] = useState(true);
  const [existingImages, setExistingImages] = useState<PropertyImage[]>([]);
  const [imagesRefetchTrigger, setImagesRefetchTrigger] = useState(0);

  const form = useForm<UpdatePropertyFormData>({
    resolver: zodResolver(updatePropertySchema),
    defaultValues: {
      name: '',
      address: '',
      propertyType: PropertyType.RESIDENTIAL,
      totalUnitsCount: 1,
      managerId: undefined,
      yearBuilt: undefined,
      totalSquareFootage: undefined,
    },
  });

  // Load property data
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setIsLoading(true);
        const property = await getPropertyById(propertyId);

        // Set form values
        form.reset({
          name: property.name,
          address: property.address,
          propertyType: property.propertyType,
          totalUnitsCount: property.totalUnitsCount,
          managerId: property.managerId,
          yearBuilt: property.yearBuilt,
          totalSquareFootage: property.totalSquareFootage,
        });

        // Set amenities
        if (property.amenities) {
          setAmenities(property.amenities);
        }
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load property data',
          variant: 'destructive',
        });
        router.push('/properties');
      } finally {
        setIsLoading(false);
      }
    };

    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId, form, toast, router]);

  // Fetch property managers
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        setIsLoadingManagers(true);
        const response = await getPropertyManagers();
        setManagers(response.content);
      } catch (error) {
        console.error('Failed to fetch managers:', error);
      } finally {
        setIsLoadingManagers(false);
      }
    };

    fetchManagers();
  }, []);

  // Fetch property images
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const images = await getPropertyImages(propertyId);
        setExistingImages(images);
      } catch {
        // Silently fail - images are optional
        console.error('Failed to fetch property images');
      }
    };

    if (propertyId) {
      fetchImages();
    }
  }, [propertyId, imagesRefetchTrigger]);

  const handleImagesUpdate = () => {
    setImagesRefetchTrigger((prev) => prev + 1);
  };

  const onSubmit = async (data: UpdatePropertyFormData) => {
    try {
      setIsSubmitting(true);

      // Include amenities from state (only if not empty)
      const payload: any = {
        ...data,
      };

      if (amenities && amenities.length > 0) {
        payload.amenities = amenities;
      }

      const property = await updateProperty(propertyId, payload);

      toast({
        title: 'Success',
        description: `Property "${property.name}" updated successfully`,
        variant: 'success',
      });

      router.push(`/properties/${propertyId}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to update property',
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

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-6 space-y-6">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Edit Property</h1>
        </div>
        <p className="text-muted-foreground">Update property information</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-property-edit">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Required property details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Property Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-1">
                      Property Name <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3">
                        <Building2 className="size-4" />
                      </div>
                      <FormControl>
                        <Input
                          id="name"
                          placeholder="Sunset Towers"
                          className="pl-9"
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

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-1">
                      Address <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute top-3 left-0 flex items-start justify-center pl-3">
                        <MapPinIcon className="size-4" />
                      </div>
                      <FormControl>
                        <Textarea
                          id="address"
                          placeholder="123 Main Street, Dubai, UAE"
                          className="pl-9 resize-none min-h-[80px]"
                          rows={3}
                          {...field}
                          data-testid="input-property-address"
                        />
                      </FormControl>
                    </div>
                    <p className="text-muted-foreground text-xs">Full address (maximum 500 characters)</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Property Type */}
                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Property Type <span className="text-destructive">*</span>
                      </Label>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                              <BuildingIcon className="size-4 text-purple-600" />
                              <span>Commercial</span>
                            </div>
                          </SelectItem>
                          <SelectItem value={PropertyType.MIXED_USE}>
                            <div className="flex items-center gap-2">
                              <LayersIcon className="size-4 text-orange-600" />
                              <span>Mixed Use</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Total Units */}
                <FormField
                  control={form.control}
                  name="totalUnitsCount"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label htmlFor="totalUnitsCount" className="flex items-center gap-1">
                        Total Units <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3">
                          <HashIcon className="size-4" />
                        </div>
                        <FormControl>
                          <NumberInput
                            id="totalUnitsCount"
                            min={1}
                            placeholder="10"
                            className="pl-9"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
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
                      disabled={isLoadingManagers}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-property-manager" className="w-full">
                          <SelectValue placeholder={isLoadingManagers ? "Loading managers..." : "Select a manager (optional)"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {managers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.firstName} {manager.lastName} ({manager.email})
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
                {/* Year Built */}
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
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3">
                          <CalendarIcon className="size-4" />
                        </div>
                        <FormControl>
                          <NumberInput
                            id="yearBuilt"
                            min={1900}
                            max={new Date().getFullYear()}
                            placeholder="2020"
                            className="pl-9"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            data-testid="input-year-built"
                          />
                        </FormControl>
                      </div>
                      <p className="text-muted-foreground text-xs">Between 1900 and {new Date().getFullYear()}</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Total Square Footage */}
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
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3">
                          <RulerIcon className="size-4" />
                        </div>
                        <FormControl>
                          <NumberInput
                            id="totalSquareFootage"
                            min={0}
                            step={1}
                            placeholder="10000"
                            className="pl-9"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            data-testid="input-square-footage"
                          />
                        </FormControl>
                        <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center pr-3 text-sm">
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
                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3">
                      <SparklesIcon className="size-4" />
                    </div>
                    <Input
                      placeholder="e.g., Pool, Gym, Parking"
                      value={amenitiesInput}
                      onChange={(e) => setAmenitiesInput(e.target.value)}
                      onKeyDown={handleAmenitiesKeyDown}
                      className="pl-9"
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
                      <Badge key={amenity} variant="secondary" className="gap-1 px-3 py-1">
                        {amenity}
                        <button
                          type="button"
                          onClick={() => handleRemoveAmenity(amenity)}
                          className="hover:bg-destructive/20 rounded-full p-0.5 ml-1"
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
              <CardDescription>Manage property images (JPG/PNG/WebP, max 10MB each)</CardDescription>
            </CardHeader>
            <CardContent>
              <PropertyImageUpload
                propertyId={propertyId}
                existingImages={existingImages}
                mode="edit"
                onImagesUpdate={handleImagesUpdate}
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
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
