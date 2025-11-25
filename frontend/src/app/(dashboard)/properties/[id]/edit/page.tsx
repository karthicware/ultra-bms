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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getPropertyById, updateProperty } from '@/services/properties.service';
import { getPropertyManagers, type PropertyManager } from '@/services/users.service';
import { updatePropertySchema, type UpdatePropertyFormData } from '@/lib/validations/properties';
import { PropertyType } from '@/types/properties';
import { Building2, X } from 'lucide-react';

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
      } catch (error) {
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
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Sunset Towers"
                        {...field}
                        data-testid="input-property-name"
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum 200 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="123 Main Street, Dubai, UAE"
                        {...field}
                        data-testid="input-property-address"
                        className="resize-none"
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Full address (maximum 500 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-property-type">
                            <SelectValue placeholder="Select property type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={PropertyType.RESIDENTIAL}>Residential</SelectItem>
                          <SelectItem value={PropertyType.COMMERCIAL}>Commercial</SelectItem>
                          <SelectItem value={PropertyType.MIXED_USE}>Mixed Use</SelectItem>
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
                    <FormItem>
                      <FormLabel>Total Units *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="10"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          data-testid="input-total-units"
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum 1 unit
                      </FormDescription>
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
            <CardContent className="space-y-4">
              {/* Property Manager */}
              <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Manager</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoadingManagers}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-property-manager">
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
                    <FormDescription>
                      Assign a property manager to this property
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="yearBuilt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year Built</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1900}
                          max={new Date().getFullYear()}
                          placeholder="2020"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          value={field.value || ''}
                          data-testid="input-year-built"
                        />
                      </FormControl>
                      <FormDescription>
                        Between 1900 and {new Date().getFullYear()}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalSquareFootage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Square Footage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="10000"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value || ''}
                          data-testid="input-square-footage"
                        />
                      </FormControl>
                      <FormDescription>
                        Total area in square feet
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Amenities */}
              <div className="space-y-2">
                <FormLabel>Amenities</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Pool, Gym, Parking"
                    value={amenitiesInput}
                    onChange={(e) => setAmenitiesInput(e.target.value)}
                    onKeyDown={handleAmenitiesKeyDown}
                    data-testid="input-amenities"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddAmenity}
                    data-testid="btn-add-amenity"
                  >
                    Add
                  </Button>
                </div>
                <FormDescription>
                  Press Enter or click Add to include amenities
                </FormDescription>
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
