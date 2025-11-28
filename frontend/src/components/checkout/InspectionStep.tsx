'use client';

/**
 * Inspection Step Component
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 * AC: #4, #5 - Unit inspection with checklist and photo upload
 */

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import {
  CalendarIcon,
  Camera,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Image,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import {
  inspectionSchema,
  type InspectionFormData,
} from '@/lib/validations/checkout';
import { checkoutService } from '@/services/checkout.service';
import type { TenantCheckout } from '@/types/checkout';
import { ItemCondition, InspectionTimeSlot, getDefaultInspectionChecklist } from '@/types/checkout';

interface InspectionStepProps {
  checkout: TenantCheckout;
  onInspectionSaved: () => void;
  onBack: () => void;
}

// Condition display configuration
const CONDITION_CONFIG: Record<ItemCondition, { label: string; color: string; icon: React.ElementType }> = {
  [ItemCondition.GOOD]: { label: 'Good', color: 'text-green-600', icon: CheckCircle },
  [ItemCondition.FAIR]: { label: 'Fair', color: 'text-amber-600', icon: AlertTriangle },
  [ItemCondition.DAMAGED]: { label: 'Damaged', color: 'text-red-600', icon: XCircle },
  [ItemCondition.MISSING]: { label: 'Missing', color: 'text-red-800', icon: XCircle },
};

export function InspectionStep({ checkout, onInspectionSaved, onBack }: InspectionStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);

  // Initialize form with existing data or defaults
  const form = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      inspectionDate: checkout.inspectionDate ? new Date(checkout.inspectionDate) : new Date(),
      inspectionTimeSlot: (checkout.inspectionTime as InspectionTimeSlot) ?? InspectionTimeSlot.MORNING,
      overallCondition: checkout.overallCondition ?? 7,
      notes: checkout.inspectionNotes ?? '',
      sections: checkout.inspectionChecklist?.length
        ? checkout.inspectionChecklist
        : getDefaultInspectionChecklist(),
    },
  });

  const watchedSections = form.watch('sections');

  // Handle photo upload
  const handlePhotoUpload = useCallback(
    async (sectionName: string, files: FileList | null) => {
      if (!files || files.length === 0) return;

      try {
        setUploadingSection(sectionName);

        await checkoutService.uploadInspectionPhotos(
          checkout.tenantId,
          checkout.id,
          Array.from(files),
          sectionName,
          'AFTER'
        );

        toast.success(`Photos uploaded for ${sectionName}`);
      } catch (error) {
        console.error('Failed to upload photos:', error);
        toast.error('Failed to upload photos');
      } finally {
        setUploadingSection(null);
      }
    },
    [checkout.id, checkout.tenantId]
  );

  // Handle item condition change
  const handleConditionChange = (sectionIndex: number, itemIndex: number, condition: ItemCondition) => {
    const sections = form.getValues('sections');
    sections[sectionIndex].items[itemIndex].condition = condition;
    form.setValue('sections', sections);
  };

  // Handle item notes change
  const handleNotesChange = (sectionIndex: number, itemIndex: number, notes: string) => {
    const sections = form.getValues('sections');
    sections[sectionIndex].items[itemIndex].notes = notes;
    form.setValue('sections', sections);
  };

  // Calculate inspection summary
  const getInspectionSummary = () => {
    let totalItems = 0;
    let goodItems = 0;
    let issueItems = 0;

    watchedSections.forEach((section) => {
      section.items.forEach((item) => {
        totalItems++;
        if (item.condition === ItemCondition.GOOD || item.condition === ItemCondition.FAIR) {
          goodItems++;
        } else if (
          item.condition === ItemCondition.DAMAGED ||
          item.condition === ItemCondition.MISSING
        ) {
          issueItems++;
        }
      });
    });

    return { totalItems, goodItems, issueItems };
  };

  const summary = getInspectionSummary();

  // Handle form submission
  const handleSubmit = async (data: InspectionFormData) => {
    try {
      setIsSubmitting(true);

      await checkoutService.saveInspection(checkout.tenantId, checkout.id, {
        inspectionDate: format(data.inspectionDate, 'yyyy-MM-dd'),
        inspectionTime: data.inspectionTimeSlot,
        overallCondition: data.overallCondition,
        inspectionNotes: data.notes ?? undefined,
        checklist: data.sections,
      });

      onInspectionSaved();
    } catch (error) {
      console.error('Failed to save inspection:', error);
      toast.error('Failed to save inspection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Inspection Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Inspection Summary</CardTitle>
          <CardDescription>Overview of the unit inspection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">{summary.totalItems}</p>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{summary.goodItems}</p>
              <p className="text-sm text-green-700">Good Condition</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">{summary.issueItems}</p>
              <p className="text-sm text-red-700">Issues Found</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inspection Form */}
      <Card>
        <CardHeader>
          <CardTitle>Unit Inspection</CardTitle>
          <CardDescription>Complete the inspection checklist for each room/area</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Inspection Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              {field.value ? format(field.value, 'PPP') : <span>Select date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inspectionTimeSlot"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Slot *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time slot" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={InspectionTimeSlot.MORNING}>
                            Morning (9:00 AM - 12:00 PM)
                          </SelectItem>
                          <SelectItem value={InspectionTimeSlot.AFTERNOON}>
                            Afternoon (12:00 PM - 5:00 PM)
                          </SelectItem>
                          <SelectItem value={InspectionTimeSlot.SPECIFIC}>
                            Specific Time
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Overall Condition Slider */}
              <FormField
                control={form.control}
                name="overallCondition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overall Unit Condition (1-10)</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[field.value]}
                          onValueChange={([value]) => field.onChange(value)}
                          className="flex-1"
                        />
                        <Badge
                          variant={
                            field.value >= 7
                              ? 'default'
                              : field.value >= 4
                                ? 'secondary'
                                : 'destructive'
                          }
                          className="min-w-[40px] justify-center"
                        >
                          {field.value}
                        </Badge>
                      </div>
                    </FormControl>
                    <FormDescription>
                      1 = Very Poor, 5 = Average, 10 = Excellent
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Inspection Checklist by Section */}
              <div className="space-y-2">
                <FormLabel>Inspection Checklist</FormLabel>
                <Accordion type="multiple" defaultValue={watchedSections.map((s) => s.name)}>
                  {watchedSections.map((section, sectionIndex) => (
                    <AccordionItem key={section.name} value={section.name}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{section.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {section.items.filter(
                              (i) =>
                                i.condition === ItemCondition.DAMAGED ||
                                i.condition === ItemCondition.MISSING
                            ).length > 0 && (
                              <span className="text-red-600">
                                {
                                  section.items.filter(
                                    (i) =>
                                      i.condition === ItemCondition.DAMAGED ||
                                      i.condition === ItemCondition.MISSING
                                  ).length
                                }{' '}
                                issues
                              </span>
                            )}
                            {section.items.filter(
                              (i) =>
                                i.condition === ItemCondition.DAMAGED ||
                                i.condition === ItemCondition.MISSING
                            ).length === 0 && (
                              <span className="text-green-600">All Good</span>
                            )}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          {section.items.map((item, itemIndex) => {
                            const conditionConfig = CONDITION_CONFIG[item.condition];
                            const ConditionIcon = conditionConfig.icon;

                            return (
                              <div
                                key={item.name}
                                className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  <ConditionIcon
                                    className={cn('h-5 w-5', conditionConfig.color)}
                                  />
                                  <span className="font-medium">{item.name}</span>
                                </div>

                                <Select
                                  value={item.condition}
                                  onValueChange={(value) =>
                                    handleConditionChange(
                                      sectionIndex,
                                      itemIndex,
                                      value as ItemCondition
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(CONDITION_CONFIG).map(([value, config]) => (
                                      <SelectItem key={value} value={value}>
                                        {config.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <Input
                                  placeholder="Notes (optional)"
                                  value={item.notes ?? ''}
                                  onChange={(e) =>
                                    handleNotesChange(sectionIndex, itemIndex, e.target.value)
                                  }
                                />
                              </div>
                            );
                          })}

                          {/* Photo Upload for Section */}
                          <div className="mt-4 p-4 border-2 border-dashed rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Camera className="h-5 w-5" />
                                <span>Photos for {section.name}</span>
                              </div>
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) =>
                                    handlePhotoUpload(section.name, e.target.files)
                                  }
                                  disabled={uploadingSection === section.name}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={uploadingSection === section.name}
                                  asChild
                                >
                                  <span>
                                    {uploadingSection === section.name ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Upload className="h-4 w-4 mr-2" />
                                    )}
                                    Upload Photos
                                  </span>
                                </Button>
                              </label>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <Separator />

              {/* Inspection Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overall Inspection Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional observations or notes about the inspection..."
                        className="resize-none"
                        rows={4}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex justify-between gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Save & Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
