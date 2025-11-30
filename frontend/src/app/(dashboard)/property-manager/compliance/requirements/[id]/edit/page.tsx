'use client';

/**
 * Edit Compliance Requirement Page
 * Story 7.3: Compliance and Inspection Tracking
 *
 * AC #34: Manage compliance requirements
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowLeft, Save, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

import { complianceService } from '@/services/compliance.service';
import { updateRequirementSchema, type UpdateRequirementFormData } from '@/schemas/compliance.schema';
import {
  type ComplianceRequirement,
  ComplianceCategory,
  ComplianceFrequency,
  RequirementStatus,
  getCategoryLabel,
  getFrequencyLabel,
} from '@/types/compliance';

export default function EditRequirementPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const requirementId = params.id as string;

  const [requirement, setRequirement] = useState<ComplianceRequirement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateRequirementFormData>({
    resolver: zodResolver(updateRequirementSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      frequency: '',
      status: RequirementStatus.ACTIVE,
      regulatoryBody: '',
      referenceCode: '',
      notes: '',
    },
  });

  useEffect(() => {
    const fetchRequirement = async () => {
      try {
        setIsLoading(true);
        const data = await complianceService.getRequirementById(requirementId);
        setRequirement(data);

        // Populate form with existing data
        if (data) {
          form.reset({
            name: data.name || '',
            description: data.description || '',
            category: data.category || '',
            frequency: data.frequency || '',
            status: data.status || RequirementStatus.ACTIVE,
            regulatoryBody: data.regulatoryBody || '',
            referenceCode: data.referenceCode || '',
            notes: data.notes || '',
          });
        }
      } catch (error) {
        console.error('Failed to load requirement:', error);
        toast({
          title: 'Error',
          description: 'Failed to load requirement',
          variant: 'destructive',
        });
        router.push('/property-manager/compliance/requirements');
      } finally {
        setIsLoading(false);
      }
    };

    if (requirementId) {
      fetchRequirement();
    }
  }, [requirementId, toast, router, form]);

  const onSubmit = async (data: UpdateRequirementFormData) => {
    try {
      setIsSubmitting(true);

      await complianceService.updateRequirement(requirementId, {
        requirementName: data.name || undefined,
        description: data.description || undefined,
        category: data.category as ComplianceCategory,
        frequency: data.frequency as ComplianceFrequency,
        status: data.status as RequirementStatus,
        authorityAgency: data.regulatoryBody || undefined,
        penaltyDescription: data.notes || undefined,
      });

      toast({
        title: 'Requirement Updated',
        description: 'The requirement has been updated successfully.',
      });

      router.push(`/property-manager/compliance/requirements/${requirementId}`);
    } catch (error: unknown) {
      console.error('Failed to update requirement:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update requirement';
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

  if (!requirement) {
    return null;
  }

  return (
    <div className="container max-w-2xl mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/property-manager/compliance/requirements/${requirementId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Edit Requirement</h1>
            </div>
            <p className="text-muted-foreground">
              Update {requirement.name}
            </p>
          </div>
        </div>
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
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
