/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Step 4: Parking Allocation (Optional)
 * Story 3.8 Integration: Select from available parking spots in inventory
 * AC#14: Integration with tenant onboarding - parking allocation dropdown
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useMemo } from 'react';

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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InfoIcon, Upload, X, Car, AlertTriangle } from 'lucide-react';

import { parkingAllocationSchema, formatFileSize, type ParkingAllocationFormData } from '@/lib/validations/tenant';
import { useAvailableParkingSpots } from '@/hooks/useParkingSpots';
import type { ParkingSpot } from '@/types/parking';
import { formatParkingFee } from '@/types/parking';

interface ParkingAllocationStepProps {
  data: ParkingAllocationFormData;
  onComplete: (data: ParkingAllocationFormData) => void;
  onBack: () => void;
  propertyId?: string;
}

export function ParkingAllocationStep({ data, onComplete, onBack, propertyId }: ParkingAllocationStepProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(data.mulkiyaFile ?? null);
  const [selectedSpotIds, setSelectedSpotIds] = useState<Set<string>>(new Set());

  // Fetch available parking spots for the property
  const {
    data: availableSpots,
    isLoading: isLoadingSpots,
    error: spotsError,
  } = useAvailableParkingSpots(propertyId || '', !!propertyId);

  const form = useForm<ParkingAllocationFormData>({
    resolver: zodResolver(parkingAllocationSchema),
    defaultValues: data,
  });

  // Get selected spots details
  const selectedSpots = useMemo(() => {
    if (!availableSpots) return [];
    return availableSpots.filter((spot: ParkingSpot) => selectedSpotIds.has(spot.id));
  }, [availableSpots, selectedSpotIds]);

  // Calculate totals from selected spots
  const parkingSpots = selectedSpots.length;
  const totalParkingFee = selectedSpots.reduce((sum: number, spot: ParkingSpot) => sum + spot.defaultFee, 0);
  const avgFeePerSpot = parkingSpots > 0 ? totalParkingFee / parkingSpots : 0;
  const spotNumbers = selectedSpots.map((spot: ParkingSpot) => spot.spotNumber).join(', ');
  const spotIds = selectedSpots.map((spot: ParkingSpot) => spot.id);

  // Update form values when selection changes
  useEffect(() => {
    form.setValue('parkingSpots', parkingSpots);
    form.setValue('parkingFeePerSpot', avgFeePerSpot);
    form.setValue('spotNumbers', spotNumbers);
    // Store spot IDs for backend processing
    form.setValue('spotIds' as any, spotIds);
  }, [selectedSpots, parkingSpots, avgFeePerSpot, spotNumbers, spotIds, form]);

  const handleSpotToggle = (spotId: string, checked: boolean) => {
    setSelectedSpotIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(spotId);
      } else {
        newSet.delete(spotId);
      }
      return newSet;
    });
  };

  const onSubmit = (values: ParkingAllocationFormData) => {
    // Extend form data with spotIds for backend parking assignment
    const formData = {
      ...values,
      parkingSpots,
      parkingFeePerSpot: avgFeePerSpot,
      spotNumbers,
      mulkiyaFile: selectedFile,
      spotIds,
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
      parkingSpots: 0,
      parkingFeePerSpot: 0,
      spotNumbers: '',
      mulkiyaFile: null,
    });
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

            {/* Property Required Warning */}
            {!propertyId && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Please select a property and unit in the Lease Info step first to view available parking spots.
                </AlertDescription>
              </Alert>
            )}

            {/* Available Parking Spots */}
            {propertyId && (
              <div className="space-y-3">
                <FormLabel>Available Parking Spots</FormLabel>

                {isLoadingSpots ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : spotsError ? (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Failed to load available parking spots. Please try again.
                    </AlertDescription>
                  </Alert>
                ) : availableSpots && availableSpots.length > 0 ? (
                  <ScrollArea className="h-64 border rounded-md p-3">
                    <div className="space-y-2">
                      {availableSpots.map((spot: ParkingSpot) => (
                        <label
                          key={spot.id}
                          className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors ${
                            selectedSpotIds.has(spot.id)
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-accent'
                          }`}
                          data-testid={`parking-spot-option-${spot.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedSpotIds.has(spot.id)}
                              onCheckedChange={(checked) =>
                                handleSpotToggle(spot.id, checked as boolean)
                              }
                              data-testid={`checkbox-spot-${spot.id}`}
                            />
                            <div>
                              <span className="font-medium">{spot.spotNumber}</span>
                              {spot.notes && (
                                <p className="text-xs text-muted-foreground">{spot.notes}</p>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline">{formatParkingFee(spot.defaultFee)}/mo</Badge>
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <Alert>
                    <Car className="h-4 w-4" />
                    <AlertDescription>
                      No available parking spots for this property. You can add parking spots from the Parking Spots management page.
                    </AlertDescription>
                  </Alert>
                )}

                {availableSpots && availableSpots.length > 0 && (
                  <FormDescription>
                    Select one or more parking spots from the available inventory.
                    {selectedSpotIds.size > 0 && (
                      <span className="ml-2 font-medium text-primary">
                        {selectedSpotIds.size} spot{selectedSpotIds.size !== 1 ? 's' : ''} selected
                      </span>
                    )}
                  </FormDescription>
                )}
              </div>
            )}

            {/* Selected Spots Summary */}
            {parkingSpots > 0 && (
              <>
                {/* Mulkiya Document Upload */}
                <div className="space-y-2">
                  <FormLabel>Mulkiya Document (Vehicle Registration)</FormLabel>
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
                        <span>Selected Spots:</span>
                        <span className="font-medium">{spotNumbers || 'None'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Number of Spots:</span>
                        <span className="font-medium">{parkingSpots}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="font-medium">Total Monthly Fee:</span>
                        <span className="font-bold text-primary" data-testid="text-total-parking-fee">
                          {formatParkingFee(totalParkingFee)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Hidden fields to store values */}
            <input type="hidden" {...form.register('parkingSpots')} value={parkingSpots} />
            <input type="hidden" {...form.register('parkingFeePerSpot')} value={avgFeePerSpot} />
            <input type="hidden" {...form.register('spotNumbers')} value={spotNumbers} />

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
