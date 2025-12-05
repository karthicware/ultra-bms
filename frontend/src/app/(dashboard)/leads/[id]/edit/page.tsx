/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Edit Lead Page
 * Form for editing an existing lead with validation
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  UserIcon,
  MailIcon,
  PhoneIcon,
  GlobeIcon,
  BuildingIcon,
  MessageSquareIcon,
  SparklesIcon,
  FileTextIcon,
} from 'lucide-react';
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
import { getLeadById, updateLead } from '@/services/leads.service';
import { updateLeadSchema, type UpdateLeadFormData } from '@/lib/validations/leads';
import { LeadSource, type Lead } from '@/types';

export default function EditLeadPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const leadId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lead, setLead] = useState<Lead | null>(null);

  const form = useForm<UpdateLeadFormData>({
    resolver: zodResolver(updateLeadSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      contactNumber: '',
      leadSource: LeadSource.WEBSITE,
      notes: '',
      propertyInterest: '',
    },
  });

  useEffect(() => {
    const fetchLead = async () => {
      try {
        setIsLoading(true);
        const leadData = await getLeadById(leadId);
        setLead(leadData);

        // Populate form with existing data
        form.reset({
          fullName: leadData.fullName,
          email: leadData.email,
          contactNumber: leadData.contactNumber,
          leadSource: leadData.leadSource,
          notes: leadData.notes || '',
          propertyInterest: leadData.propertyInterest || '',
        });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.response?.data?.error?.message || 'Failed to load lead',
          variant: 'destructive',
        });
        router.push('/leads');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLead();
  }, [leadId, form, router, toast]);

  const onSubmit = async (data: UpdateLeadFormData) => {
    try {
      setIsSubmitting(true);

      await updateLead(leadId, data);

      toast({
        title: 'Success',
        description: 'Lead updated successfully',
        variant: 'success',
      });

      router.push(`/leads/${leadId}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to update lead',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/leads/${leadId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <UserIcon className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Edit Lead</h1>
            </div>
            <p className="text-muted-foreground">
              {lead?.leadNumber} - {lead?.fullName}
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-lead-edit">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic details about the lead</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-1">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <UserIcon className="size-4" />
                      </div>
                      <FormControl>
                        <Input
                          id="fullName"
                          className="pl-9"
                          placeholder="John Doe"
                          {...field}
                          data-testid="input-lead-name"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-1">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <MailIcon className="size-4" />
                        </div>
                        <FormControl>
                          <Input
                            id="email"
                            type="email"
                            className="pl-9"
                            placeholder="john@example.com"
                            {...field}
                            data-testid="input-lead-email"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label htmlFor="contactNumber" className="flex items-center gap-1">
                        Contact Number <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <PhoneIcon className="size-4" />
                        </div>
                        <FormControl>
                          <Input
                            id="contactNumber"
                            className="pl-9"
                            placeholder="+971501234567"
                            {...field}
                            data-testid="input-lead-phone"
                          />
                        </FormControl>
                      </div>
                      <p className="text-muted-foreground text-xs">E.164 format (e.g., +971501234567)</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Lead Details */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Details</CardTitle>
              <CardDescription>Source and additional information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="leadSource"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Lead Source <span className="text-destructive">*</span>
                    </Label>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-lead-source" className="w-full">
                          <SelectValue placeholder="Select lead source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={LeadSource.WEBSITE}>
                          <div className="flex items-center gap-2">
                            <GlobeIcon className="size-4 text-blue-600" />
                            <span>Website</span>
                          </div>
                        </SelectItem>
                        <SelectItem value={LeadSource.REFERRAL}>
                          <div className="flex items-center gap-2">
                            <UserIcon className="size-4 text-green-600" />
                            <span>Referral</span>
                          </div>
                        </SelectItem>
                        <SelectItem value={LeadSource.WALK_IN}>
                          <div className="flex items-center gap-2">
                            <BuildingIcon className="size-4 text-purple-600" />
                            <span>Walk In</span>
                          </div>
                        </SelectItem>
                        <SelectItem value={LeadSource.PHONE_CALL}>
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="size-4 text-orange-600" />
                            <span>Phone Call</span>
                          </div>
                        </SelectItem>
                        <SelectItem value={LeadSource.SOCIAL_MEDIA}>
                          <div className="flex items-center gap-2">
                            <SparklesIcon className="size-4 text-pink-600" />
                            <span>Social Media</span>
                          </div>
                        </SelectItem>
                        <SelectItem value={LeadSource.OTHER}>
                          <div className="flex items-center gap-2">
                            <FileTextIcon className="size-4 text-gray-600" />
                            <span>Other</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="propertyInterest"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="propertyInterest" className="flex items-center gap-1">
                      <BuildingIcon className="size-4 mr-1 text-muted-foreground" />
                      Property Interest
                    </Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <BuildingIcon className="size-4" />
                      </div>
                      <FormControl>
                        <Input
                          id="propertyInterest"
                          className="pl-9"
                          placeholder="Building name or unit type"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <p className="text-muted-foreground text-xs">Optional - specify preferred property or unit type</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="notes" className="flex items-center gap-1">
                      <MessageSquareIcon className="size-4 mr-1 text-muted-foreground" />
                      Notes
                    </Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute top-3 left-0 flex items-start pl-3">
                        <MessageSquareIcon className="size-4" />
                      </div>
                      <FormControl>
                        <Textarea
                          id="notes"
                          className="pl-9 resize-none min-h-[100px]"
                          placeholder="Any additional information about the lead..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <p className="text-muted-foreground text-xs">Optional - maximum 1000 characters</p>
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
              onClick={() => router.push(`/leads/${leadId}`)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} data-testid="btn-save-lead">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
