'use client';

/**
 * Unit Form Modal Component
 * Modal dialog for creating a new unit with comprehensive validation
 * AC: #3, #17 - Unit creation with validation and features
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { createUnit } from '@/services/units.service';
import { createUnitSchema, type CreateUnitFormData } from '@/lib/validations/units';
import { UnitStatus } from '@/types/units';
import { Plus, X } from 'lucide-react';

interface UnitFormModalProps {
  propertyId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function UnitFormModal({ propertyId, onSuccess, trigger }: UnitFormModalProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [featureKey, setFeatureKey] = useState('');
  const [featureValue, setFeatureValue] = useState('');
  const [features, setFeatures] = useState<Record<string, any>>({});

  const form = useForm<CreateUnitFormData>({
    resolver: zodResolver(createUnitSchema),
    defaultValues: {
      unitNumber: '',
      floor: 0,
      bedroomCount: 1,
      bathroomCount: 1,
      squareFootage: undefined,
      monthlyRent: 0,
      status: UnitStatus.AVAILABLE,
      features: {},
    },
  });

  const onSubmit = async (data: CreateUnitFormData) => {
    try {
      setIsSubmitting(true);

      // Include features from state
      const payload = {
        ...data,
        features,
      };

      const unit = await createUnit({ ...payload, propertyId } as any);

      toast({
        title: 'Success',
        description: `Unit ${unit.unitNumber} created successfully`,
      });

      form.reset();
      setFeatures({});
      setOpen(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to create unit';

      // Handle unit number uniqueness error
      if (errorMessage.includes('already exists') || errorMessage.includes('unique')) {
        form.setError('unitNumber', {
          message: 'This unit number already exists in the property',
        });
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddFeature = () => {
    const trimmedKey = featureKey.trim();
    const trimmedValue = featureValue.trim();

    if (trimmedKey && trimmedValue) {
      // Try to parse as number or boolean
      let parsedValue: any = trimmedValue;
      if (trimmedValue === 'true') parsedValue = true;
      else if (trimmedValue === 'false') parsedValue = false;
      else if (!isNaN(Number(trimmedValue))) parsedValue = Number(trimmedValue);

      setFeatures({ ...features, [trimmedKey]: parsedValue });
      setFeatureKey('');
      setFeatureValue('');
    }
  };

  const handleRemoveFeature = (key: string) => {
    const newFeatures = { ...features };
    delete newFeatures[key];
    setFeatures(newFeatures);
  };

  const handleFeatureKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddFeature();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Unit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Unit</DialogTitle>
          <DialogDescription>
            Add a new unit to this property
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-unit-create">
            {/* Basic Info */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unitNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Number *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="101"
                            {...field}
                            data-testid="input-unit-number"
                          />
                        </FormControl>
                        <FormDescription>
                          Must be unique within property
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="floor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Floor</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-floor"
                          />
                        </FormControl>
                        <FormDescription>
                          Can be negative for basement (-1, -2)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bedroomCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bedrooms *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            min={0}
                            max={10}
                            placeholder="2"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-bedrooms"
                          />
                        </FormControl>
                        <FormDescription>
                          Can be decimal (e.g., 2.5 for studio with den)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bathroomCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bathrooms *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            min={0}
                            max={10}
                            placeholder="1.5"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-bathrooms"
                          />
                        </FormControl>
                        <FormDescription>
                          Can be decimal (e.g., 1.5 for half bath)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="squareFootage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Square Footage</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            placeholder="1200"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value || ''}
                            data-testid="input-square-footage"
                          />
                        </FormControl>
                        <FormDescription>
                          Unit area in square feet
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="monthlyRent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Rent (AED) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            placeholder="5000"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-monthly-rent"
                          />
                        </FormControl>
                        <FormDescription>
                          Base monthly rent amount
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-unit-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={UnitStatus.AVAILABLE}>Available</SelectItem>
                          <SelectItem value={UnitStatus.RESERVED}>Reserved</SelectItem>
                          <SelectItem value={UnitStatus.UNDER_MAINTENANCE}>Under Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Initial unit status (default: Available)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <FormLabel>Unit Features</FormLabel>
                  <FormDescription className="mb-3">
                    Add custom features like balcony, view, floor plan type, parking spots, etc.
                  </FormDescription>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Feature name (e.g., balcony)"
                      value={featureKey}
                      onChange={(e) => setFeatureKey(e.target.value)}
                      onKeyDown={handleFeatureKeyDown}
                      data-testid="input-feature-key"
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Value (e.g., true, sea, 2)"
                        value={featureValue}
                        onChange={(e) => setFeatureValue(e.target.value)}
                        onKeyDown={handleFeatureKeyDown}
                        data-testid="input-feature-value"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddFeature}
                        data-testid="btn-add-feature"
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {Object.keys(features).length > 0 && (
                    <div className="mt-3 space-y-2">
                      {Object.entries(features).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <div className="flex gap-2">
                            <Badge variant="outline">{key}</Badge>
                            <span className="text-sm">{String(value)}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFeature(key)}
                            data-testid={`btn-remove-feature-${key}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
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
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="btn-submit-unit"
              >
                {isSubmitting ? 'Creating...' : 'Create Unit'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
