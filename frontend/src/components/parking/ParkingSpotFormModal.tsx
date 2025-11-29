/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Parking Spot Form Modal Component
 * Story 3.8: Parking Spot Inventory Management
 * AC#5, AC#6, AC#7: Add/Edit modal with validation
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, Car } from 'lucide-react';
import type { ParkingSpot } from '@/types/parking';
import type { Property } from '@/types/properties';
import {
  createParkingSpotSchema,
  updateParkingSpotSchema,
  type CreateParkingSpotFormData,
  type UpdateParkingSpotFormData,
} from '@/lib/validations/parking';
import { useCreateParkingSpot, useUpdateParkingSpot } from '@/hooks/useParkingSpots';

interface ParkingSpotFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parkingSpot: ParkingSpot | null;
  onSuccess: () => void;
  properties: Property[];
}

export function ParkingSpotFormModal({
  open,
  onOpenChange,
  parkingSpot,
  onSuccess,
  properties,
}: ParkingSpotFormModalProps) {
  const isEditing = !!parkingSpot;
  const { mutate: createSpot, isPending: isCreating } = useCreateParkingSpot();
  const { mutate: updateSpot, isPending: isUpdating } = useUpdateParkingSpot();
  const isSubmitting = isCreating || isUpdating;

  const form = useForm<CreateParkingSpotFormData | UpdateParkingSpotFormData>({
    resolver: zodResolver(isEditing ? updateParkingSpotSchema : createParkingSpotSchema),
    defaultValues: {
      propertyId: '',
      spotNumber: '',
      defaultFee: 0,
      notes: '',
    },
  });

  // Reset form when modal opens/closes or parkingSpot changes
  useEffect(() => {
    if (open) {
      if (parkingSpot) {
        form.reset({
          propertyId: parkingSpot.propertyId,
          spotNumber: parkingSpot.spotNumber,
          defaultFee: parkingSpot.defaultFee,
          notes: parkingSpot.notes || '',
        });
      } else {
        form.reset({
          propertyId: '',
          spotNumber: '',
          defaultFee: 0,
          notes: '',
        });
      }
    }
  }, [open, parkingSpot, form]);

  const handleSubmit = (data: CreateParkingSpotFormData | UpdateParkingSpotFormData) => {
    if (isEditing && parkingSpot) {
      updateSpot(
        {
          id: parkingSpot.id,
          data: {
            spotNumber: data.spotNumber,
            defaultFee: data.defaultFee,
            notes: data.notes || undefined,
          },
        },
        {
          onSuccess: () => {
            onSuccess();
          },
        }
      );
    } else {
      // For create mode, propertyId is required (validated by createParkingSpotSchema)
      createSpot(
        {
          propertyId: data.propertyId!,
          spotNumber: data.spotNumber!,
          defaultFee: data.defaultFee!,
          notes: data.notes || undefined,
        },
        {
          onSuccess: () => {
            onSuccess();
          },
        }
      );
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md"
        aria-describedby="parking-spot-form-description"
        data-testid="dialog-parking-spot-form"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            {isEditing ? 'Edit Parking Spot' : 'Add Parking Spot'}
          </DialogTitle>
          <DialogDescription id="parking-spot-form-description">
            {isEditing
              ? `Update parking spot ${parkingSpot?.spotNumber}`
              : 'Add a new parking spot to a property'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Property Selection (only for create) */}
            {!isEditing && (
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-property">
                          <SelectValue placeholder="Select a property" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the property for this parking spot
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Show property name for edit mode */}
            {isEditing && parkingSpot && (
              <div className="rounded-lg border p-3 bg-muted/50">
                <p className="text-sm text-muted-foreground">Property</p>
                <p className="font-medium">
                  {parkingSpot.propertyName ||
                    properties.find((p) => p.id === parkingSpot.propertyId)?.name ||
                    'Unknown Property'}
                </p>
              </div>
            )}

            {/* Spot Number */}
            <FormField
              control={form.control}
              name="spotNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spot Number *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., P1-001, B2-015"
                      {...field}
                      disabled={isSubmitting}
                      data-testid="input-spot-number"
                    />
                  </FormControl>
                  <FormDescription>
                    Unique identifier for this parking spot (1-20 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Default Monthly Fee */}
            <FormField
              control={form.control}
              name="defaultFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Fee (AED) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="99999.99"
                      placeholder="e.g., 500.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      disabled={isSubmitting}
                      data-testid="input-default-fee"
                    />
                  </FormControl>
                  <FormDescription>
                    Default monthly rental fee for this spot (0 - 99,999.99)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about this parking spot..."
                      className="min-h-[80px] resize-none"
                      {...field}
                      value={field.value ?? ''}
                      disabled={isSubmitting}
                      data-testid="textarea-notes"
                    />
                  </FormControl>
                  <FormDescription>
                    {(field.value ?? '').length}/500 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} data-testid="btn-submit-form">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : isEditing ? (
                  'Update Parking Spot'
                ) : (
                  'Add Parking Spot'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
