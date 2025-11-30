'use client';

/**
 * Create New Compliance Requirement Page
 * Story 7.3: Compliance and Inspection Tracking
 *
 * AC #34: Manage compliance requirements
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ChevronLeft, ShieldCheck } from 'lucide-react';

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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

import { complianceService } from '@/services/compliance.service';
import { createRequirementSchema, type CreateRequirementFormData } from '@/schemas/compliance.schema';
import {
  ComplianceCategory,
  ComplianceFrequency,
  RequirementStatus,
  getCategoryLabel,
  getFrequencyLabel,
} from '@/types/compliance';

export default function NewRequirementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateRequirementFormData>({
    resolver: zodResolver(createRequirementSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      frequency: '',
      status: RequirementStatus.ACTIVE,
      regulatoryBody: '',
      referenceCode: '',
      applicableProperties: [],
      notes: '',
    },
  });

  const onSubmit = async (data: CreateRequirementFormData) => {
    try {
      setIsSubmitting(true);

      const requirement = await complianceService.createRequirement({
        requirementName: data.name,
        description: data.description || undefined,
        category: data.category as ComplianceCategory,
        frequency: data.frequency as ComplianceFrequency,
        status: data.status as RequirementStatus,
        authorityAgency: data.regulatoryBody || undefined,
        applicableProperties: data.applicableProperties,
      });

      toast({
        title: 'Requirement Created',
        description: `${data.name} has been created successfully.`,
      });

      router.push(`/property-manager/compliance/requirements/${requirement?.id}`);
    } catch (error: unknown) {
      console.error('Failed to create requirement:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create requirement';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-6">      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Add Compliance Requirement</h1>
        <p className="text-muted-foreground">
          Create a new compliance requirement for your properties
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Name and description of the compliance requirement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requirement Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Fire Safety Certificate"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A clear name for this compliance requirement
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this requirement entails..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Detailed description of the compliance requirement
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ComplianceCategory).map((category) => (
                            <SelectItem key={category} value={category}>
                              {getCategoryLabel(category)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ComplianceFrequency).map((frequency) => (
                            <SelectItem key={frequency} value={frequency}>
                              {getFrequencyLabel(frequency)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How often this requirement needs renewal
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={RequirementStatus.ACTIVE}>Active</SelectItem>
                        <SelectItem value={RequirementStatus.INACTIVE}>Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Regulatory Information */}
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Information</CardTitle>
              <CardDescription>
                Details about the regulatory authority and reference codes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="regulatoryBody"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Regulatory Body</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Civil Defense"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The authority that enforces this requirement
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referenceCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., CD-FS-001"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Official code or reference number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional notes..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                  Creating...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Create Requirement
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
