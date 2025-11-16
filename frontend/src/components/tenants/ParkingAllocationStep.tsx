'use client';

/**
 * Step 4: Parking Allocation (Optional)
 * Allocate parking spots and upload Mulkiya document
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

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
import { InfoIcon, Upload, X } from 'lucide-react';

import { parkingAllocationSchema, formatFileSize, type ParkingAllocationFormData } from '@/lib/validations/tenant';

interface ParkingAllocationStepProps {
  data: ParkingAllocationFormData;
  onComplete: (data: ParkingAllocationFormData) => void;
  onBack: () => void;
}

export function ParkingAllocationStep({ data, onComplete, onBack }: ParkingAllocationStepProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(data.mulkiyaFile);

  const form = useForm<ParkingAllocationFormData>({
    resolver: zodResolver(parkingAllocationSchema),
    defaultValues: data,
  });

  const parkingSpots = form.watch('parkingSpots') || 0;
  const parkingFeePerSpot = form.watch('parkingFeePerSpot') || 0;

  const totalParkingFee = parkingSpots * parkingFeePerSpot;

  const onSubmit = (values: ParkingAllocationFormData) => {
    onComplete({
      ...values,
      mulkiyaFile: selectedFile,
    });
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
            <CardTitle>Parking Allocation</CardTitle>
            <CardDescription>
              Allocate parking spots and upload vehicle document (optional)
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
                Parking can be allocated during onboarding or added later from tenant management
              </AlertDescription>
            </Alert>

            {/* Number of Parking Spots */}
            <FormField
              control={form.control}
              name="parkingSpots"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Parking Spots</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="0"
                      max="10"
                      placeholder="0"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      data-testid="input-parking-spots"
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum 10 parking spots
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {parkingSpots > 0 && (
              <>
                {/* Parking Fee Per Spot */}
                <FormField
                  control={form.control}
                  name="parkingFeePerSpot"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parking Fee Per Spot (Monthly)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground">AED</span>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-14"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-parking-fee"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Monthly parking fee per spot
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Spot Numbers */}
                <FormField
                  control={form.control}
                  name="spotNumbers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parking Spot Numbers</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="P-101, P-102"
                          data-testid="input-spot-numbers"
                        />
                      </FormControl>
                      <FormDescription>
                        Comma-separated spot numbers (e.g., P-101, P-102)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                <Alert>
                  <AlertDescription>
                    <div className="flex justify-between">
                      <span>Total Parking Fee (Monthly):</span>
                      <span className="font-semibold" data-testid="text-total-parking-fee">
                        AED {totalParkingFee.toFixed(2)}
                      </span>
                    </div>
                  </AlertDescription>
                </Alert>
              </>
            )}

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
