/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Create Lead Page - Redesigned
 * A refined, modern lead creation experience with live preview
 * Updated: 2025-12-06
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import {
  User,
  Mail,
  Phone,
  Globe,
  Building2,
  MessageSquare,
  Sparkles,
  FileText,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  MapPin,
  ChevronLeft,
} from 'lucide-react';
import { PageBackButton } from '@/components/common/PageBackButton';
import { cn } from '@/lib/utils';
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
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { createLead } from '@/services/leads.service';
import { createLeadSchema, type CreateLeadFormData } from '@/lib/validations/leads';
import { LeadSource } from '@/types';

// Lead source configuration with icons and colors
const LEAD_SOURCES = [
  { value: LeadSource.WEBSITE, label: 'Website', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-100' },
  { value: LeadSource.REFERRAL, label: 'Referral', icon: User, color: 'text-green-600', bg: 'bg-green-100' },
  { value: LeadSource.WALK_IN, label: 'Walk In', icon: Building2, color: 'text-purple-600', bg: 'bg-purple-100' },
  { value: LeadSource.PHONE_CALL, label: 'Phone Call', icon: Phone, color: 'text-orange-600', bg: 'bg-orange-100' },
  { value: LeadSource.SOCIAL_MEDIA, label: 'Social Media', icon: Sparkles, color: 'text-pink-600', bg: 'bg-pink-100' },
  { value: LeadSource.OTHER, label: 'Other', icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100' },
];

// Live Preview Component
function LeadPreview({
  fullName,
  email,
  contactNumber,
  leadSource,
  propertyInterest,
  notes,
}: {
  fullName: string;
  email: string;
  contactNumber: string;
  leadSource: LeadSource;
  propertyInterest: string;
  notes: string;
}) {
  const sourceConfig = LEAD_SOURCES.find(s => s.value === leadSource);
  const SourceIcon = sourceConfig?.icon || Globe;

  const completedFields = [
    fullName.trim().length > 0,
    email.trim().length > 0,
    contactNumber.trim().length > 0,
  ].filter(Boolean).length;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-xl">
      {/* Decorative elements */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Lead Preview
              </span>
            </div>
            <h3 className="mt-3 text-lg font-semibold">
              {fullName || 'New Lead'}
            </h3>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="text-xs">
              Draft
            </Badge>
            <p className="text-sm font-medium mt-1">{format(new Date(), 'dd MMM yyyy')}</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-6 rounded-2xl bg-muted/50 p-4 space-y-3">
          {email && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm">{email}</span>
            </div>
          )}
          {contactNumber && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm">{contactNumber}</span>
            </div>
          )}
          {!email && !contactNumber && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Contact details will appear here
            </p>
          )}
        </div>

        {/* Lead Source */}
        <div className="mt-4 flex items-center gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            sourceConfig?.bg || 'bg-muted'
          )}>
            <SourceIcon className={cn("h-5 w-5", sourceConfig?.color)} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Lead Source</p>
            <p className="font-medium">{sourceConfig?.label || 'Website'}</p>
          </div>
        </div>

        {/* Property Interest */}
        {propertyInterest && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Property Interest</p>
              <p className="font-medium">{propertyInterest}</p>
            </div>
          </div>
        )}

        {/* Notes Preview */}
        {notes && (
          <>
            <Separator className="my-4" />
            <div className="rounded-xl bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
              <p className="text-sm line-clamp-3">{notes}</p>
            </div>
          </>
        )}

        <Separator className="my-5" />

        {/* Completion Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className={cn(
              "h-5 w-5",
              completedFields === 3 ? "text-green-500" : "text-muted-foreground/40"
            )} />
            <span className="text-sm text-muted-foreground">
              {completedFields}/3 required fields
            </span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-2 w-6 rounded-full transition-colors",
                  i <= completedFields ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateLeadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateLeadFormData>({
    resolver: zodResolver(createLeadSchema),
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

  // Watch form values for live preview
  const watchedValues = form.watch();

  const onSubmit = async (data: CreateLeadFormData) => {
    try {
      setIsSubmitting(true);

      const lead = await createLead(data);

      toast({
        title: 'Success',
        description: `Lead ${lead.leadNumber} created successfully`,
        variant: 'success',
      });

      router.push(`/leads/${lead.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to create lead',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-6xl mx-auto px-4 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <PageBackButton href="/leads" aria-label="Back to leads" />
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                  Create Lead
                </h1>
              </div>
              <p className="text-lg text-muted-foreground ml-[88px]">
                Add a new potential tenant to the system
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-5 gap-8" data-testid="form-lead-create">
            {/* Left Column - Form Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Personal Information Section */}
              <div className="rounded-3xl border bg-card p-6 lg:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Personal Information</h2>
                    <p className="text-sm text-muted-foreground">Basic details about the lead</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">Full Name *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="John Doe"
                              className="h-12 pl-11 rounded-xl border-2 hover:border-primary/50 focus:border-primary transition-colors"
                              {...field}
                              data-testid="input-lead-name"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground">Email Address *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="email"
                                placeholder="john@example.com"
                                className="h-12 pl-11 rounded-xl border-2 hover:border-primary/50 focus:border-primary transition-colors"
                                {...field}
                                data-testid="input-lead-email"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground">Contact Number *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="+971501234567"
                                className="h-12 pl-11 rounded-xl border-2 hover:border-primary/50 focus:border-primary transition-colors"
                                {...field}
                                data-testid="input-lead-phone"
                              />
                            </div>
                          </FormControl>
                          <p className="text-xs text-muted-foreground mt-1">E.164 format (e.g., +971501234567)</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Lead Details Section */}
              <div className="rounded-3xl border bg-card p-6 lg:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Lead Details</h2>
                    <p className="text-sm text-muted-foreground">Source and additional information</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="leadSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">Lead Source *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger
                              className="h-12 rounded-xl border-2 hover:border-primary/50 transition-colors"
                              data-testid="select-lead-source"
                            >
                              <SelectValue placeholder="Select lead source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LEAD_SOURCES.map((source) => {
                              const Icon = source.icon;
                              return (
                                <SelectItem key={source.value} value={source.value}>
                                  <div className="flex items-center gap-3">
                                    <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", source.bg)}>
                                      <Icon className={cn("h-3.5 w-3.5", source.color)} />
                                    </div>
                                    <span>{source.label}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
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
                      <FormItem>
                        <FormLabel className="text-muted-foreground">Property Interest</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Building name or unit type"
                              className="h-12 pl-11 rounded-xl border-2 hover:border-primary/50 focus:border-primary transition-colors"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">Optional - specify preferred property or unit type</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">Notes</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MessageSquare className="absolute left-4 top-4 h-4 w-4 text-muted-foreground" />
                            <Textarea
                              placeholder="Any additional information about the lead..."
                              className="pl-11 pt-3 min-h-[120px] rounded-xl border-2 hover:border-primary/50 focus:border-primary transition-colors resize-none"
                              rows={4}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">Optional - maximum 1000 characters</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="rounded-xl"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-primary hover:bg-primary/90"
                  data-testid="btn-save-lead"
                >
                  {isSubmitting ? (
                    'Creating...'
                  ) : (
                    <>
                      Create Lead
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Right Column - Live Preview */}
            <div className="lg:col-span-2">
              <div className="sticky top-8 space-y-6">
                <LeadPreview
                  fullName={watchedValues.fullName || ''}
                  email={watchedValues.email || ''}
                  contactNumber={watchedValues.contactNumber || ''}
                  leadSource={watchedValues.leadSource || LeadSource.WEBSITE}
                  propertyInterest={watchedValues.propertyInterest || ''}
                  notes={watchedValues.notes || ''}
                />

                {/* Helper Tips */}
                <div className="rounded-2xl border bg-card/50 p-5">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Quick Tips
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>Use E.164 format for phone numbers (e.g., +971...)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>Lead source helps track marketing effectiveness</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>Adding property interest speeds up quotation creation</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
