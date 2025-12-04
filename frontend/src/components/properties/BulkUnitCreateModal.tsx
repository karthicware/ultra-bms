/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Bulk Unit Creation Modal Component
 * Modal dialog for creating multiple units at once with pattern-based numbering
 * AC: #4 - Bulk unit creation with patterns and progress tracking
 */

import { useState, useMemo } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { NumberInput } from '@/components/ui/number-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { bulkCreateUnits } from '@/services/units.service';
import { bulkCreateUnitsSchema, type BulkCreateUnitsFormData } from '@/lib/validations/units';
import { IncrementPattern } from '@/types/units';
import { Plus, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface BulkUnitCreateModalProps {
  propertyId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function BulkUnitCreateModal({ propertyId, onSuccess, trigger }: BulkUnitCreateModalProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creationProgress, setCreationProgress] = useState(0);
  const [result, setResult] = useState<{ success: number; failed: number; errors: Array<{ unitNumber: string; reason: string; }> } | null>(null);

  const form = useForm<BulkCreateUnitsFormData>({
    resolver: zodResolver(bulkCreateUnitsSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      startingUnitNumber: '',
      count: 1,
      floor: 0,
      incrementPattern: IncrementPattern.SEQUENTIAL,
      bedroomCount: 1,
      bathroomCount: 1,
      squareFootage: undefined,
      monthlyRent: 0,
      features: {},
    },
  });

  // Generate preview of unit numbers
  const unitNumbersPreview = useMemo(() => {
    const startingUnit = form.watch('startingUnitNumber');
    const count = form.watch('count');
    const pattern = form.watch('incrementPattern');
    const floor = form.watch('floor');

    if (!startingUnit || !count) return [];

    const numbers: string[] = [];
    const numericPart = parseInt(startingUnit.replace(/\D/g, '')) || 0;
    const prefix = startingUnit.replace(/\d/g, '');

    for (let i = 0; i < Math.min(count, 10); i++) { // Preview max 10
      switch (pattern) {
        case IncrementPattern.SEQUENTIAL:
          numbers.push(`${prefix}${numericPart + i}`);
          break;
        case IncrementPattern.FLOOR_BASED:
          numbers.push(`${floor}${String(numericPart + i).padStart(2, '0')}`);
          break;
        case IncrementPattern.CUSTOM:
          numbers.push(`${prefix}${numericPart + i}`);
          break;
      }
    }

    if (count > 10) {
      numbers.push('...');
    }

    return numbers;
  }, [form.watch('startingUnitNumber'), form.watch('count'), form.watch('incrementPattern'), form.watch('floor')]);

  const handleFormSubmit = form.handleSubmit(() => {
    setShowConfirmDialog(true);
  });

  const handleConfirmedSubmit = async () => {
    const data = form.getValues();
    setShowConfirmDialog(false);

    try {
      setIsSubmitting(true);
      setCreationProgress(0);
      setResult(null);

      // Simulate progress updates (in real scenario, backend would provide progress)
      const progressInterval = setInterval(() => {
        setCreationProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await bulkCreateUnits({ ...data, propertyId } as any);

      clearInterval(progressInterval);
      setCreationProgress(100);

      const successCount = result.successCount || 0;
      const failedCount = result.failureCount || 0;
      const errors = result.failures || [];

      setResult({
        success: successCount,
        failed: failedCount,
        errors,
      });

      if (failedCount === 0) {
        toast({
          title: 'Success',
          description: `Created ${successCount} units successfully`,
          variant: 'success',
        });

        setTimeout(() => {
          form.reset();
          setOpen(false);
          setResult(null);

          if (onSuccess) {
            onSuccess();
          }
        }, 2000);
      } else {
        toast({
          title: 'Partial Success',
          description: `Created ${successCount} of ${data.count} units`,
          variant: 'warning',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to create units',
        variant: 'destructive',
      });
      setResult({
        success: 0,
        failed: form.getValues('count'),
        errors: [error.response?.data?.error?.message || 'Unknown error'],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Bulk Add Units
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="modal-bulk-create">
          <DialogHeader>
            <DialogTitle>Bulk Create Units</DialogTitle>
            <DialogDescription>
              Create multiple units at once with pattern-based numbering
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Unit Numbering */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="startingUnitNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Starting Unit Number *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="101"
                              {...field}
                              data-testid="input-starting-unit"
                            />
                          </FormControl>
                          <FormDescription>
                            First unit number
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Units *</FormLabel>
                          <FormControl>
                            <NumberInput
                              min={1}
                              max={100}
                              placeholder="10"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              data-testid="input-unit-count"
                            />
                          </FormControl>
                          <FormDescription>
                            1-100 units
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
                          <FormLabel>Floor *</FormLabel>
                          <FormControl>
                            <NumberInput
                              min={-99}
                              placeholder="1"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              data-testid="input-floor-bulk"
                            />
                          </FormControl>
                          <FormDescription>
                            All units on this floor
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="incrementPattern"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Increment Pattern *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-increment-pattern">
                              <SelectValue placeholder="Select pattern" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={IncrementPattern.SEQUENTIAL}>
                              Sequential (101, 102, 103...)
                            </SelectItem>
                            <SelectItem value={IncrementPattern.FLOOR_BASED}>
                              Floor-Based (0101, 0102, 0201, 0202...)
                            </SelectItem>
                            <SelectItem value={IncrementPattern.CUSTOM}>
                              Custom Pattern
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Preview */}
                  {unitNumbersPreview.length > 0 && (
                    <div className="p-4 bg-muted rounded-lg">
                      <FormLabel className="mb-2 block">Preview</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {unitNumbersPreview.map((num, idx) => (
                          <Badge key={idx} variant="outline">
                            {num}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Unit Details */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bedroomCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bedrooms *</FormLabel>
                          <FormControl>
                            <NumberInput
                              step={1}
                              min={0}
                              max={10}
                              placeholder="2"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              data-testid="input-bedrooms-bulk"
                            />
                          </FormControl>
                          <FormDescription>
                            Applied to all units
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
                            <NumberInput
                              step={1}
                              min={0}
                              max={10}
                              placeholder="2"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              data-testid="input-bathrooms-bulk"
                            />
                          </FormControl>
                          <FormDescription>
                            Applied to all units
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="squareFootage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Square Footage</FormLabel>
                          <FormControl>
                            <NumberInput
                              step={1}
                              min={0}
                              placeholder="1200"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              data-testid="input-square-footage-bulk"
                            />
                          </FormControl>
                          <FormDescription>
                            Optional, applied to all
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
                            <NumberInput
                              step={1}
                              min={0}
                              placeholder="5000"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              data-testid="input-monthly-rent-bulk"
                            />
                          </FormControl>
                          <FormDescription>
                            Applied to all units
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Progress */}
              {isSubmitting && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Creating units...</span>
                        <span>{creationProgress}%</span>
                      </div>
                      <Progress value={creationProgress} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Results */}
              {result && (
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center gap-2">
                      {result.failed === 0 ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      )}
                      <span className="font-semibold">
                        Created {result.success} of {result.success + result.failed} units
                      </span>
                    </div>

                    {result.errors.length > 0 && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            <p className="font-semibold">{result.failed} units failed:</p>
                            <ul className="list-disc list-inside text-sm">
                              {result.errors.slice(0, 5).map((error, idx) => (
                                <li key={idx}>Unit {error.unitNumber}: {error.reason}</li>
                              ))}
                              {result.errors.length > 5 && (
                                <li>...and {result.errors.length - 5} more</li>
                              )}
                            </ul>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Form Actions */}
              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                >
                  {result ? 'Close' : 'Cancel'}
                </Button>
                {!result && (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    data-testid="btn-create-bulk-units"
                  >
                    Create Units
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Creation</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to create {form.watch('count')} units starting from{' '}
              {form.watch('startingUnitNumber')}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedSubmit}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
