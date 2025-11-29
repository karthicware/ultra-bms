/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Create Property Page
 * Form for creating a new property with validation and image upload
 * AC: #1, #17 - Property creation with comprehensive validation
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { useToast } from '@/hooks/use-toast';
import { createProperty } from '@/services/properties.service';
import { getPropertyManagers, type PropertyManager } from '@/services/users.service';
import { createPropertySchema, type CreatePropertyFormData } from '@/lib/validations/properties';
import { PropertyType } from '@/types/properties';
import { Building2, X } from 'lucide-react';

export default function CreatePropertyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amenitiesInput, setAmenitiesInput] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [managers, setManagers] = useState<PropertyManager[]>([]);
  const [isLoadingManagers, setIsLoadingManagers] = useState(true);

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

      toast({
        title: 'Success',
        description: `Property "${property.name}" created successfully`,
      });

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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          value={field.value ?? 1}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 1 : parseInt(e.target.value, 10);
                            field.onChange(isNaN(value) ? 1 : value);
                          }}
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
                      disabled={isLoadingManagers || managers.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-property-manager">
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

          {/* Image Upload Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Property Images</CardTitle>
              <CardDescription>Upload up to 5 images (JPG/PNG, max 5MB each)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                <p>Image upload will be implemented in Task 27</p>
                <p className="text-sm mt-2">
                  Drag-and-drop functionality with preview and delete options
                </p>
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
              {isSubmitting ? 'Creating...' : 'Create Property'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
