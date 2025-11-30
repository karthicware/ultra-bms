/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Unit Form Modal Component
 * Modal dialog for creating or editing a unit with comprehensive validation
 * AC: #3, #17 - Unit creation/editing with validation and features
 * Updated: shadcn-studio form styling (SCP-2025-11-30)
 */

import { useState, useEffect } from 'react';
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
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { createUnit, updateUnit } from '@/services/units.service';
import { createUnitSchema, type CreateUnitFormData } from '@/lib/validations/units';
import { UnitStatus, type Unit } from '@/types/units';
import {
  Plus,
  X,
  Pencil,
  HashIcon,
  LayersIcon,
  BedDoubleIcon,
  BathIcon,
  RulerIcon,
  DollarSignIcon,
  CheckCircleIcon,
  WrenchIcon,
  CircleDotIcon,
  TagIcon,
  SparklesIcon,
} from 'lucide-react';

interface UnitFormModalProps {
  propertyId: string;
  /** Existing unit data for edit mode */
  unit?: Unit;
  /** Form mode - defaults to 'create' */
  mode?: 'create' | 'edit';
  /** Controlled open state */
  isOpen?: boolean;
  /** Controlled open change handler */
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function UnitFormModal({
  propertyId,
  unit,
  mode = 'create',
  isOpen,
  onOpenChange,
  onSuccess,
  trigger,
}: UnitFormModalProps) {
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [featureKey, setFeatureKey] = useState('');
  const [featureValue, setFeatureValue] = useState('');
  const [features, setFeatures] = useState<Record<string, any>>({});

  // Use controlled or uncontrolled open state
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const isEditMode = mode === 'edit' && unit;

  const form = useForm<CreateUnitFormData>({
    resolver: zodResolver(createUnitSchema),
    defaultValues: {
      propertyId,
      unitNumber: '',
      floor: 0,
      bedroomCount: 1,
      bathroomCount: 1,
      squareFootage: undefined as unknown as number,
      monthlyRent: 0,
      status: UnitStatus.AVAILABLE,
      features: {},
    },
  });

  // Reset form when unit changes (for edit mode)
  useEffect(() => {
    if (isEditMode && unit) {
      form.reset({
        unitNumber: unit.unitNumber,
        floor: unit.floor ?? 0,
        bedroomCount: unit.bedroomCount,
        bathroomCount: unit.bathroomCount,
        squareFootage: unit.squareFootage,
        monthlyRent: unit.monthlyRent,
        status: unit.status,
        features: unit.features || {},
      });
      setFeatures(unit.features || {});
    }
  }, [unit, isEditMode, form]);

  const onSubmit = async (data: CreateUnitFormData) => {
    try {
      setIsSubmitting(true);

      // Include features from state
      const payload = {
        ...data,
        features,
      };

      if (isEditMode && unit) {
        // Update existing unit - convert null to undefined for optional fields
        const updatePayload = {
          ...payload,
          floor: payload.floor ?? undefined,
          squareFootage: payload.squareFootage ?? undefined,
        };
        const updatedUnit = await updateUnit(unit.id, updatePayload);

        toast({
          title: 'Success',
          description: `Unit ${updatedUnit.unitNumber} updated successfully`,
          variant: 'success',
        });
      } else {
        // Create new unit
        const newUnit = await createUnit({ ...payload, propertyId } as any);

        toast({
          title: 'Success',
          description: `Unit ${newUnit.unitNumber} created successfully`,
          variant: 'success',
        });

        form.reset();
        setFeatures({});
      }

      setOpen(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || `Failed to ${isEditMode ? 'update' : 'create'} unit`;

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
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger || (
            <Button className="gap-2">
              {isEditMode ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isEditMode ? 'Edit Unit' : 'Add Unit'}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Unit' : 'Create New Unit'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? `Update unit ${unit?.unitNumber} details` : 'Add a new unit to this property'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid={isEditMode ? 'form-unit-edit' : 'form-unit-create'}>
            {/* Basic Info */}
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="unitNumber"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <Label htmlFor="unitNumber" className="flex items-center gap-1">
                          Unit Number <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <HashIcon className="size-4" />
                          </div>
                          <FormControl>
                            <Input
                              id="unitNumber"
                              className="pl-9"
                              placeholder="101"
                              {...field}
                              data-testid="input-unit-number"
                            />
                          </FormControl>
                        </div>
                        <p className="text-muted-foreground text-xs">Must be unique within property</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="floor"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <Label htmlFor="floor">Floor</Label>
                        <div className="relative">
                          <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <LayersIcon className="size-4" />
                          </div>
                          <FormControl>
                            <Input
                              id="floor"
                              type="number"
                              className="pl-9"
                              placeholder="1"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-floor"
                            />
                          </FormControl>
                        </div>
                        <p className="text-muted-foreground text-xs">Can be negative for basement (-1, -2)</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="bedroomCount"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <Label htmlFor="bedroomCount" className="flex items-center gap-1">
                          Bedrooms <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <BedDoubleIcon className="size-4" />
                          </div>
                          <FormControl>
                            <Input
                              id="bedroomCount"
                              type="number"
                              className="pl-9"
                              step="0.5"
                              min={0}
                              max={10}
                              placeholder="2"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-bedrooms"
                            />
                          </FormControl>
                        </div>
                        <p className="text-muted-foreground text-xs">Can be decimal (e.g., 2.5 for studio with den)</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bathroomCount"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <Label htmlFor="bathroomCount" className="flex items-center gap-1">
                          Bathrooms <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <BathIcon className="size-4" />
                          </div>
                          <FormControl>
                            <Input
                              id="bathroomCount"
                              type="number"
                              className="pl-9"
                              step="0.5"
                              min={0}
                              max={10}
                              placeholder="1.5"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-bathrooms"
                            />
                          </FormControl>
                        </div>
                        <p className="text-muted-foreground text-xs">Can be decimal (e.g., 1.5 for half bath)</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="squareFootage"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <Label htmlFor="squareFootage" className="flex items-center gap-1">
                          Square Footage <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <RulerIcon className="size-4" />
                          </div>
                          <FormControl>
                            <Input
                              id="squareFootage"
                              type="number"
                              className="pl-9 pr-14"
                              step="0.01"
                              min={0}
                              placeholder="1200"
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
                        <p className="text-muted-foreground text-xs">Unit area in square feet</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="monthlyRent"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <Label htmlFor="monthlyRent" className="flex items-center gap-1">
                          Monthly Rent <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <DollarSignIcon className="size-4" />
                          </div>
                          <FormControl>
                            <Input
                              id="monthlyRent"
                              type="number"
                              className="pl-9 pr-14"
                              step="0.01"
                              min={0}
                              placeholder="5000"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-monthly-rent"
                            />
                          </FormControl>
                          <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm">
                            AED
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs">Base monthly rent amount</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label>Status</Label>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-unit-status" className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={UnitStatus.AVAILABLE}>
                            <div className="flex items-center gap-2">
                              <CheckCircleIcon className="size-4 text-green-600" />
                              <span>Available</span>
                            </div>
                          </SelectItem>
                          <SelectItem value={UnitStatus.RESERVED}>
                            <div className="flex items-center gap-2">
                              <CircleDotIcon className="size-4 text-yellow-600" />
                              <span>Reserved</span>
                            </div>
                          </SelectItem>
                          <SelectItem value={UnitStatus.UNDER_MAINTENANCE}>
                            <div className="flex items-center gap-2">
                              <WrenchIcon className="size-4 text-orange-600" />
                              <span>Under Maintenance</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-muted-foreground text-xs">Initial unit status (default: Available)</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <SparklesIcon className="size-4 mr-1 text-muted-foreground" />
                    Unit Features
                  </Label>
                  <p className="text-muted-foreground text-xs mb-3">
                    Add custom features like balcony, view, floor plan type, parking spots, etc.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <TagIcon className="size-4" />
                      </div>
                      <Input
                        className="pl-9"
                        placeholder="Feature name (e.g., balcony)"
                        value={featureKey}
                        onChange={(e) => setFeatureKey(e.target.value)}
                        onKeyDown={handleFeatureKeyDown}
                        data-testid="input-feature-key"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <SparklesIcon className="size-4" />
                        </div>
                        <Input
                          className="pl-9"
                          placeholder="Value (e.g., true, sea, 2)"
                          value={featureValue}
                          onChange={(e) => setFeatureValue(e.target.value)}
                          onKeyDown={handleFeatureKeyDown}
                          data-testid="input-feature-value"
                        />
                      </div>
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
                {isSubmitting ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Unit')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
