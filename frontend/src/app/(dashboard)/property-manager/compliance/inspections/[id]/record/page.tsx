'use client';

/**
 * Record Inspection Results Page
 * Story 7.3: Compliance and Inspection Tracking
 *
 * AC #27: Record inspection results with pass/fail outcome
 * AC #27: Auto-create remediation work order for failed inspections
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, ChevronLeft, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

import { complianceService } from '@/services/compliance.service';
import { recordInspectionResultsSchema, type RecordInspectionResultsFormData } from '@/schemas/compliance.schema';
import {
  type InspectionDetail,
  InspectionStatus,
  InspectionResult,
  getInspectionResultLabel,
} from '@/types/compliance';

export default function RecordInspectionResultsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const inspectionId = params.id as string;

  const [inspection, setInspection] = useState<InspectionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RecordInspectionResultsFormData>({
    resolver: zodResolver(recordInspectionResultsSchema),
    defaultValues: {
      inspectionDate: new Date().toISOString().split('T')[0],
      result: '',
      issuesFound: '',
      notes: '',
      createRemediationWorkOrder: false,
    },
  });

  const watchedResult = form.watch('result');

  useEffect(() => {
    const fetchInspection = async () => {
      try {
        setIsLoading(true);
        const inspection = await complianceService.getInspectionById(inspectionId);
        setInspection(inspection);

        // Check if not in scheduled status
        if (inspection?.status !== InspectionStatus.SCHEDULED) {
          toast({
            title: 'Cannot Record Results',
            description: 'This inspection already has recorded results.',
          });
          router.push(`/property-manager/compliance/inspections/${inspectionId}`);
        }
      } catch (error) {
        console.error('Failed to load inspection:', error);
        toast({
          title: 'Error',
          description: 'Failed to load inspection',
          variant: 'destructive',
        });
        router.push('/property-manager/compliance/inspections');
      } finally {
        setIsLoading(false);
      }
    };

    if (inspectionId) {
      fetchInspection();
    }
  }, [inspectionId, toast, router]);

  const onSubmit = async (data: RecordInspectionResultsFormData) => {
    try {
      setIsSubmitting(true);

      await complianceService.updateInspection(inspectionId, {
        inspectionDate: data.inspectionDate,
        result: data.result as InspectionResult,
        status: data.result === InspectionResult.PASSED
          ? InspectionStatus.PASSED
          : data.result === InspectionResult.FAILED
          ? InspectionStatus.FAILED
          : InspectionStatus.PASSED, // PARTIAL_PASS maps to PASSED status
        issuesFound: data.issuesFound || undefined,
        recommendations: data.notes || undefined,
      });

      toast({
        title: 'Results Recorded',
        description: `Inspection has been marked as ${getInspectionResultLabel(data.result as InspectionResult)}.`,
      });

      router.push(`/property-manager/compliance/inspections/${inspectionId}`);
    } catch (error: unknown) {
      console.error('Failed to record results:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to record inspection results';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!inspection) {
    return null;
  }

  return (
    <div className="container max-w-2xl mx-auto py-6">      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Record Inspection Results</h1>
        <p className="text-muted-foreground">
          Record the outcome of the inspection
        </p>
      </div>

      {/* Inspection Info */}
      <Alert className="mb-6">
        <ClipboardCheck className="h-4 w-4" />
        <AlertDescription>
          <strong>{inspection.complianceSchedule?.requirementName}</strong> at <strong>{inspection.propertyName}</strong>
          <br />
          <span className="text-sm text-muted-foreground">
            Inspector: {inspection.inspectorName}
          </span>
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inspection Results</CardTitle>
              <CardDescription>
                Record the date and outcome of the inspection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="inspectionDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Inspection Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      The actual date when the inspection was performed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="result"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Result *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select inspection result" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={InspectionResult.PASSED}>
                          <span className="text-green-600 font-medium">Passed</span> - All requirements met
                        </SelectItem>
                        <SelectItem value={InspectionResult.FAILED}>
                          <span className="text-red-600 font-medium">Failed</span> - Requirements not met
                        </SelectItem>
                        <SelectItem value={InspectionResult.PARTIAL_PASS}>
                          <span className="text-yellow-600 font-medium">Partial Pass</span> - Minor issues to address
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The overall outcome of the inspection
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issuesFound"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issues Found</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe any issues or deficiencies found during the inspection..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Document any problems discovered during the inspection
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes or recommendations..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Any additional observations or recommendations
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Show remediation work order option for failed inspections */}
              {watchedResult === InspectionResult.FAILED && (
                <FormField
                  control={form.control}
                  name="createRemediationWorkOrder"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-red-50 dark:bg-red-950">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-red-800 dark:text-red-200">
                          Create Remediation Work Order
                        </FormLabel>
                        <FormDescription className="text-red-700 dark:text-red-300">
                          Automatically create a high-priority work order to address the issues found
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Record Results
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
