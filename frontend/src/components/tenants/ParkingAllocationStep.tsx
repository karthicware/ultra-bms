/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Step 4: Parking Allocation (Optional)
 * Story 3.8 Integration: Select from available parking spots in inventory
 * AC#14: Integration with tenant onboarding - parking allocation dropdown
 * Updated: SCP-2025-12-02 - Changed to single parking spot selection with editable fee
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoIcon, Upload, X, Car, AlertTriangle } from 'lucide-react';

import { parkingAllocationSchema, formatFileSize, type ParkingAllocationFormData } from '@/lib/validations/tenant';
import { useAvailableParkingSpots } from '@/hooks/useParkingSpots';
import type { ParkingSpot } from '@/types/parking';
import { formatParkingFee } from '@/types/parking';
import type { LeaseType } from '@/types/tenant';

interface ParkingAllocationStepProps {
  data: ParkingAllocationFormData;
  onComplete: (data: ParkingAllocationFormData) => void;
  onBack: () => void;
  propertyId?: string;
  // SCP-2025-12-07: Lease type for annual-only parking restriction
  leaseType?: LeaseType;
}

export function ParkingAllocationStep({ data, onComplete, onBack, propertyId, leaseType }: ParkingAllocationStepProps) {
  // SCP-2025-12-07: Parking is only available for annual (YEARLY) leases
  const isAnnualLease = leaseType === 'YEARLY';
  const [selectedFile, setSelectedFile] = useState<File | null>(data.mulkiyaFile ?? null);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(data.parkingSpotId ?? null);
  const [parkingFee, setParkingFee] = useState<number>(data.parkingFeePerSpot ?? 0);

  // Fetch available parking spots for the property
  const {
    data: availableSpots,
    isLoading: isLoadingSpots,
    error: spotsError,
  } = useAvailableParkingSpots(propertyId || '', !!propertyId);

  const form = useForm<ParkingAllocationFormData>({
    resolver: zodResolver(parkingAllocationSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: data,
  });

  // Get selected spot details
  const selectedSpot = availableSpots?.find((spot: ParkingSpot) => spot.id === selectedSpotId) ?? null;

  // Handle parking spot selection - auto-populate fee
  const handleSpotChange = (spotId: string | null) => {
    setSelectedSpotId(spotId);
    if (spotId && spotId !== 'none') {
      const spot = availableSpots?.find((s: ParkingSpot) => s.id === spotId);
      if (spot) {
        setParkingFee(spot.defaultFee);
      }
    } else {
      setSelectedSpotId(null);
      setParkingFee(0);
    }
  };

  // Update form values when selection changes
  useEffect(() => {
    form.setValue('parkingSpotId' as any, selectedSpotId);
    form.setValue('parkingFeePerSpot', parkingFee);
    form.setValue('spotNumbers', selectedSpot?.spotNumber ?? '');
    form.setValue('parkingSpots', selectedSpotId ? 1 : 0);
  }, [selectedSpotId, parkingFee, selectedSpot, form]);

  const onSubmit = (values: ParkingAllocationFormData) => {
    // Build form data for backend
    const formData = {
      ...values,
      parkingSpotId: selectedSpotId,
      parkingSpots: selectedSpotId ? 1 : 0,
      parkingFeePerSpot: parkingFee,
      spotNumbers: selectedSpot?.spotNumber ?? '',
      mulkiyaFile: selectedFile,
      spotIds: selectedSpotId ? [selectedSpotId] : [],
    };
    onComplete(formData as ParkingAllocationFormData);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      form.setValue('mulkiyaFile', file);
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    form.setValue('mulkiyaFile', null);
  };

  const handleSkip = () => {
    // Skip parking allocation
    onComplete({
      parkingSpotId: null,
      parkingSpots: 0,
      parkingFeePerSpot: 0,
      spotNumbers: '',
      mulkiyaFile: null,
    } as ParkingAllocationFormData);
  };

  return (
    <Card data-testid="step-parking-allocation">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Parking Allocation
            </CardTitle>
            <CardDescription>
              Select available parking spots from the property inventory (optional)
            </CardDescription>
          </div>
          <Badge variant="secondary">Optional</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                Parking can be allocated during onboarding or added later from tenant management.
                Only available spots from the property's parking inventory are shown.
              </AlertDescription>
            </Alert>

            {/* SCP-2025-12-07: Annual-Only Parking Restriction Warning */}
            {!isAnnualLease && leaseType && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Parking allocation is only available for annual (yearly) lease tenants.
                  The current lease type is <strong>{leaseType.toLowerCase()}</strong>.
                  Please skip this step or change the lease type in the previous step.
                </AlertDescription>
              </Alert>
            )}

            {/* Property Required Warning */}
            {!propertyId && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Please select a property and unit in the Lease Info step first to view available parking spots.
                </AlertDescription>
              </Alert>
            )}

            {/* Parking Spot Selection - SCP-2025-12-07: Only show for annual leases */}
            {propertyId && isAnnualLease && (
              <div className="space-y-4">
                <FormItem>
                  <FormLabel>Select Parking Spot (Optional)</FormLabel>
                  {isLoadingSpots ? (
                    <Skeleton className="h-10 w-full" />
                  ) : spotsError ? (
                    <Alert variant="destructive">
                      <AlertDescription>
                        Failed to load available parking spots. Please try again.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Select
                      onValueChange={(value) => handleSpotChange(value === 'none' ? null : value)}
                      value={selectedSpotId || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-parking-spot">
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Select parking spot" />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No parking needed</SelectItem>
                        {availableSpots && availableSpots.map((spot: ParkingSpot) => (
                          <SelectItem key={spot.id} value={spot.id}>
                            {spot.spotNumber} - {formatParkingFee(spot.defaultFee)}/mo
                            {spot.notes && ` (${spot.notes})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormDescription>
                    {availableSpots && availableSpots.length === 0
                      ? 'No available parking spots for this property.'
                      : 'Select one parking spot from the property inventory.'}
                  </FormDescription>
                </FormItem>

                {/* Editable Parking Fee - only show when spot is selected */}
                {selectedSpotId && (
                  <FormItem>
                    <FormLabel>Parking Fee (Monthly)</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={parkingFee}
                        onChange={(val) => setParkingFee(val)}
                        min={0}
                        placeholder="0"
                        data-testid="input-parking-fee"
                      />
                    </FormControl>
                    <FormDescription>
                      Auto-filled from spot. You can override if needed.
                    </FormDescription>
                  </FormItem>
                )}
              </div>
            )}

            {/* Selected Spot Summary - only show when spot is selected */}
            {selectedSpotId && selectedSpot && (
              <>
                {/* Mulkiya Document Upload */}
                <div className="space-y-2">
                  <Label>Mulkiya Document (Vehicle Registration)</Label>
                  {selectedFile ? (
                    <div className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleFileRemove}
                        data-testid="btn-remove-mulkiya"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                        id="mulkiya-file"
                        data-testid="input-mulkiya-file"
                      />
                      <label
                        htmlFor="mulkiya-file"
                        className="flex items-center justify-center gap-2 cursor-pointer border-2 border-dashed rounded-md p-6 hover:bg-accent transition-colors"
                      >
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Upload Mulkiya (PDF/JPG/PNG, max 5MB)
                        </span>
                      </label>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Single file only - Vehicle registration document
                  </p>
                </div>

                {/* Parking Summary */}
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <h4 className="font-medium mb-3">Parking Allocation Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Selected Spot:</span>
                        <span className="font-medium">{selectedSpot.spotNumber}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="font-medium">Monthly Fee:</span>
                        <span className="font-bold text-primary" data-testid="text-total-parking-fee">
                          {formatParkingFee(parkingFee)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Hidden fields to store values */}
            <input type="hidden" {...form.register('parkingSpots')} value={selectedSpotId ? 1 : 0} />
            <input type="hidden" {...form.register('parkingFeePerSpot')} value={parkingFee} />
            <input type="hidden" {...form.register('spotNumbers')} value={selectedSpot?.spotNumber ?? ''} />

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                data-testid="btn-back"
              >
                Back
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSkip}
                  data-testid="btn-skip"
                >
                  Skip
                </Button>
                <Button type="submit" data-testid="btn-next">
                  Next: Payment Schedule
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
