/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Unit Form Modal Component
 * Modal dialog for creating or editing a unit with comprehensive validation
 * AC: #3, #17 - Unit creation/editing with validation and features
 * Updated: Redesigned layout for better UX
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
  DialogFooter,
} from '@/components/ui/dialog';
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
import { NumberInput } from '@/components/ui/number-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { createUnit, updateUnit } from '@/services/units.service';
import { createUnitSchema, type CreateUnitFormData } from '@/lib/validations/units';
import { UnitStatus, type Unit } from '@/types/units';
import {
  Plus,
  X,
  Pencil,
  Hash,
  Layers,
  BedDouble,
  Bath,
  Ruler,
  DollarSign,
  CheckCircle2,
  Wrench,
  Clock,
  Tag,
  Sparkles,
  Home,
  Building2,
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
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      propertyId,
      unitNumber: '',
      floor: undefined as unknown as number,
      bedroomCount: undefined as unknown as number,
      bathroomCount: undefined as unknown as number,
      squareFootage: undefined as unknown as number, // Required field - validation will catch empty
      monthlyRent: undefined as unknown as number,
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isEditMode ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
            {isEditMode ? 'Edit Unit' : 'Create New Unit'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? `Update unit ${unit?.unitNumber} details` : 'Add a new unit to this property. Fill in the details below.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4" data-testid={isEditMode ? 'form-unit-edit' : 'form-unit-create'}>
            
            {/* Section 1: Unit Identification */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Home className="h-4 w-4" />
                <h3>Identification & Location</h3>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="unitNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground" /> Unit Number <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 101, A-12"
                          {...field}
                          data-testid="input-unit-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="floor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-muted-foreground" /> Floor Number
                      </FormLabel>
                      <FormControl>
                        <NumberInput
                          min={-99}
                          placeholder="e.g. 1, 2, -1"
                          value={field.value ?? undefined}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          data-testid="input-floor"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section 2: Specifications */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Building2 className="h-4 w-4" />
                <h3>Specifications</h3>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="bedroomCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <BedDouble className="h-3.5 w-3.5 text-muted-foreground" /> Bedrooms <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <NumberInput
                          step={1}
                          min={0}
                          max={10}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          data-testid="input-bedrooms"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bathroomCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                         <Bath className="h-3.5 w-3.5 text-muted-foreground" /> Bathrooms <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <NumberInput
                          step={1}
                          min={0}
                          max={10}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          data-testid="input-bathrooms"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="squareFootage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Ruler className="h-3.5 w-3.5 text-muted-foreground" /> Size (sq ft) <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <NumberInput
                          step={1}
                          min={100}
                          placeholder="e.g. 1200"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          data-testid="input-square-footage"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section 3: Status & Financials */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <DollarSign className="h-4 w-4" />
                <h3>Status & Financials</h3>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="monthlyRent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                         <DollarSign className="h-3.5 w-3.5 text-muted-foreground" /> Monthly Rent (AED) <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <NumberInput
                          step={100}
                          min={0}
                          placeholder="e.g. 5000"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          data-testid="input-monthly-rent"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-unit-status" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={UnitStatus.AVAILABLE}>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="size-4 text-green-600" />
                              <span>Available</span>
                            </div>
                          </SelectItem>
                          <SelectItem value={UnitStatus.RESERVED}>
                            <div className="flex items-center gap-2">
                              <Clock className="size-4 text-purple-600" />
                              <span>Reserved</span>
                            </div>
                          </SelectItem>
                          <SelectItem value={UnitStatus.UNDER_MAINTENANCE}>
                            <div className="flex items-center gap-2">
                              <Wrench className="size-4 text-orange-600" />
                              <span>Under Maintenance</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section 4: Features */}
            <div className="space-y-4 bg-muted/30 p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                <h3>Additional Features</h3>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
                  <div className="space-y-2">
                     <FormLabel className="text-xs text-muted-foreground">Feature Name</FormLabel>
                     <div className="relative">
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Tag className="size-3.5" />
                        </div>
                        <Input
                          className="pl-8 h-9 text-sm"
                          placeholder="e.g. Balcony"
                          value={featureKey}
                          onChange={(e) => setFeatureKey(e.target.value)}
                          onKeyDown={handleFeatureKeyDown}
                          data-testid="input-feature-key"
                        />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <FormLabel className="text-xs text-muted-foreground">Value</FormLabel>
                     <Input
                        className="h-9 text-sm"
                        placeholder="e.g. Yes, Sea View"
                        value={featureValue}
                        onChange={(e) => setFeatureValue(e.target.value)}
                        onKeyDown={handleFeatureKeyDown}
                        data-testid="input-feature-value"
                      />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddFeature}
                    disabled={!featureKey.trim() || !featureValue.trim()}
                    data-testid="btn-add-feature"
                    className="h-9"
                  >
                    Add
                  </Button>
                </div>

                {Object.keys(features).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(features).map(([key, value]) => (
                      <Badge key={key} variant="outline" className="pl-2 pr-1 py-1 bg-background">
                        <span className="font-medium mr-1">{key}:</span>
                        <span className="text-muted-foreground mr-2">{String(value)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 rounded-full hover:bg-destructive/20 hover:text-destructive"
                          onClick={() => handleRemoveFeature(key)}
                          data-testid={`btn-remove-feature-${key}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="btn-submit-unit"
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span> 
                    {isEditMode ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  isEditMode ? 'Save Changes' : 'Create Unit'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}