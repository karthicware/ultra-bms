 'use client';

/**
 * Parking Spot Form Modal Component
 * Story 3.8: Parking Spot Inventory Management
 * AC#5, AC#6, AC#7: Add/Edit modal with validation
 * Updated: shadcn-studio form styling (SCP-2025-11-30)
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
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
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
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  Loader2,
  Car,
  Building2,
  HashIcon,
  DollarSignIcon,
  MessageSquareIcon,
} from 'lucide-react';
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
  /** Pre-selected property ID for new parking spots */
  defaultPropertyId?: string;
}

export function ParkingSpotFormModal({
  open,
  onOpenChange,
  parkingSpot,
  onSuccess,
  properties,
  defaultPropertyId,
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
        // Pre-select property if defaultPropertyId is provided
        form.reset({
          propertyId: defaultPropertyId || '',
          spotNumber: '',
          defaultFee: 0,
          notes: '',
        });
      }
    }
  }, [open, parkingSpot, form, defaultPropertyId]);

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
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Property Selection (only for create) */}
            {!isEditing && (
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Property <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-property" className="w-full">
                          <SelectValue placeholder="Select a property" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="size-4 text-muted-foreground" />
                              <span>{property.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-muted-foreground text-xs">
                      Select the property for this parking spot
                    </p>
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
                <FormItem className="space-y-2">
                  <Label htmlFor="spotNumber" className="flex items-center gap-1">
                    Spot Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <HashIcon className="size-4" />
                    </div>
                    <FormControl>
                      <Input
                        id="spotNumber"
                        className="pl-9"
                        placeholder="e.g., P1-001, B2-015"
                        {...field}
                        disabled={isSubmitting}
                        data-testid="input-spot-number"
                      />
                    </FormControl>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Unique identifier for this parking spot (1-20 characters)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Default Monthly Fee - Optional (0 = free parking) */}
            <FormField
              control={form.control}
              name="defaultFee"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label htmlFor="defaultFee" className="flex items-center gap-1">
                    Monthly Fee (AED)
                  </Label>
                  <FormControl>
                    <NumberInput
                      id="defaultFee"
                      step={1}
                      min={0}
                      max={99999.99}
                      placeholder="0 for free parking"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={isSubmitting}
                      data-testid="input-default-fee"
                    />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">
                    Enter 0 for free parking or set a monthly rental fee (0 - 99,999.99)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label htmlFor="notes" className="flex items-center gap-1">
                    <MessageSquareIcon className="size-4 mr-1 text-muted-foreground" />
                    Notes
                  </Label>
                  <div className="relative">
                    <div className="text-muted-foreground pointer-events-none absolute top-3 left-0 flex items-start pl-3">
                      <MessageSquareIcon className="size-4" />
                    </div>
                    <FormControl>
                      <Textarea
                        id="notes"
                        placeholder="Add any additional notes about this parking spot..."
                        className="pl-9 min-h-[80px] resize-none"
                        {...field}
                        value={field.value ?? ''}
                        disabled={isSubmitting}
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {(field.value ?? '').length}/500 characters
                  </p>
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
