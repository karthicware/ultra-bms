/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Create Property Page
 * Form for creating a new property with validation and image upload
 * AC: #1, #17 - Property creation with comprehensive validation
 * Updated: Redesigned to match the "Redefined" aesthetic
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
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { createProperty, uploadPropertyImage } from '@/services/properties.service';
import { getPropertyManagers, type PropertyManager } from '@/services/users.service';
import { createPropertySchema, type CreatePropertyFormData } from '@/lib/validations/properties';
import { PropertyType } from '@/types/properties';
import { PropertyImageUpload } from '@/components/properties/PropertyImageUpload';
import {
  Building2,
  X,
  MapPin,
  Hash,
  Calendar,
  Ruler,
  User,
  Sparkles,
  Home,
  Store,
  CheckCircle2,
  ImageIcon,
} from 'lucide-react';
import { PageBackButton } from '@/components/common/PageBackButton';

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
    mode: 'onBlur',
    reValidateMode: 'onChange',
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
            console.error(`Failed to upload image ${i + 1}`);
          }
        }
        if (uploadedCount < selectedImages.length) {
          toast({
            title: 'Partial Success',
            description: `Property created. ${uploadedCount} of ${selectedImages.length} images uploaded.`,
            variant: 'success',
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
    <div className="container max-w-5xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <PageBackButton href="/properties" aria-label="Back to properties" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Property</h1>
          <p className="text-muted-foreground mt-1">Add a new property to your portfolio.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" data-testid="form-property-create">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Card 1: Basic Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <Building2 className="h-5 w-5" />
                    <h3 className="font-semibold">Basic Information</h3>
                  </div>
                  <CardDescription>Essential details about the property.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Property Name <span className="text-destructive">*</span>
                        </FormLabel>
                        <div className="relative">
                          <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Building2 className="size-4" />
                          </div>
                          <FormControl>
                            <Input
                              className="pl-9"
                              placeholder="e.g. Sunset Towers"
                              {...field}
                              data-testid="input-property-name"
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Address <span className="text-destructive">*</span>
                        </FormLabel>
                        <div className="relative">
                          <div className="text-muted-foreground pointer-events-none absolute top-3 left-0 flex items-start pl-3">
                            <MapPin className="size-4" />
                          </div>
                          <FormControl>
                            <Textarea
                              className="pl-9 min-h-[100px] resize-none"
                              placeholder="e.g. 123 Main Street, Downtown, Dubai, UAE"
                              {...field}
                              data-testid="input-property-address"
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="propertyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            Property Type <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-property-type">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={PropertyType.RESIDENTIAL}>
                                <div className="flex items-center gap-2">
                                  <Home className="size-4 text-blue-600" />
                                  <span>Residential</span>
                                </div>
                              </SelectItem>
                              <SelectItem value={PropertyType.COMMERCIAL}>
                                <div className="flex items-center gap-2">
                                  <Store className="size-4 text-purple-600" />
                                  <span>Commercial</span>
                                </div>
                              </SelectItem>
                              <SelectItem value={PropertyType.MIXED_USE}>
                                <div className="flex items-center gap-2">
                                  <Building2 className="size-4 text-orange-600" />
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
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            Total Units <span className="text-destructive">*</span>
                          </FormLabel>
                          <div className="relative">
                            <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <Hash className="size-4" />
                            </div>
                            <FormControl>
                              <NumberInput
                                className="pl-9"
                                min={1}
                                placeholder="e.g. 10"
                                value={field.value ?? 1}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                data-testid="input-total-units"
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Media */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <ImageIcon className="h-5 w-5" />
                    <h3 className="font-semibold">Property Media</h3>
                  </div>
                  <CardDescription>Add high-quality images to showcase the property.</CardDescription>
                </CardHeader>
                <CardContent>
                  <PropertyImageUpload
                    mode="create"
                    onImagesChange={setSelectedImages}
                    maxImages={5}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Additional Details */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Card 3: Specifications */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <Ruler className="h-5 w-5" />
                    <h3 className="font-semibold">Specifications</h3>
                  </div>
                  <CardDescription>Physical details and dimensions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="yearBuilt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year Built</FormLabel>
                        <div className="relative">
                          <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Calendar className="size-4" />
                          </div>
                          <FormControl>
                            <NumberInput
                              className="pl-9"
                              min={1900}
                              max={new Date().getFullYear()}
                              placeholder="e.g. 2020"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              data-testid="input-year-built"
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalSquareFootage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Area (sq ft)</FormLabel>
                        <div className="relative">
                          <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Ruler className="size-4" />
                          </div>
                          <FormControl>
                            <NumberInput
                              className="pl-9"
                              min={0}
                              step={1}
                              placeholder="e.g. 15000"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              data-testid="input-square-footage"
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Card 4: Management & Amenities */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <User className="h-5 w-5" />
                    <h3 className="font-semibold">Management</h3>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="managerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Manager</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoadingManagers || managers.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-property-manager">
                              <SelectValue placeholder={
                                isLoadingManagers
                                  ? "Loading..."
                                  : "Select manager (optional)"
                              } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unassigned">
                              <span className="text-muted-foreground">Unassigned</span>
                            </SelectItem>
                            {managers.map((manager) => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.firstName} {manager.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles className="h-4 w-4" />
                      <h4 className="font-medium text-sm">Amenities</h4>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          placeholder="Add amenity..."
                          value={amenitiesInput}
                          onChange={(e) => setAmenitiesInput(e.target.value)}
                          onKeyDown={handleAmenitiesKeyDown}
                          data-testid="input-amenities"
                          className="h-9 text-sm"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleAddAmenity}
                        disabled={!amenitiesInput.trim()}
                        data-testid="btn-add-amenity"
                      >
                        Add
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[2rem]">
                      {amenities.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">No amenities added yet.</span>
                      )}
                      {amenities.map((amenity) => (
                        <Badge key={amenity} variant="secondary" className="pl-2 pr-1 py-0.5 h-7">
                          {amenity}
                          <button
                            type="button"
                            onClick={() => handleRemoveAmenity(amenity)}
                            className="ml-1 hover:bg-destructive/20 hover:text-destructive rounded-full p-0.5"
                            data-testid={`btn-remove-amenity-${amenity}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
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
              className="min-w-[150px]"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span> Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Create Property
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}