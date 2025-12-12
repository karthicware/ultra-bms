'use client';

/**
 * Step 1: Personal Information
 * Collects tenant's personal details including emergency contact
 * Updated: shadcn-studio form styling (SCP-2025-11-30)
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CalendarIcon,
  InfoIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  CreditCardIcon,
  GlobeIcon,
} from 'lucide-react';

import { personalInfoSchema, calculateAge, type PersonalInfoFormData } from '@/lib/validations/tenant';
import { cn } from '@/lib/utils';

interface PersonalInfoStepProps {
  data: PersonalInfoFormData;
  onComplete: (data: PersonalInfoFormData) => void;
  onBack: () => void;
}

// Common nationalities in UAE (alphabetical order)
const NATIONALITIES = [
  'Afghan', 'Albanian', 'Algerian', 'American', 'Argentinian', 'Australian', 'Austrian',
  'Bahraini', 'Bangladeshi', 'Belgian', 'Brazilian', 'British', 'Bulgarian',
  'Canadian', 'Chilean', 'Chinese', 'Colombian', 'Croatian', 'Czech',
  'Danish', 'Dutch', 'Egyptian', 'Emirati', 'Estonian', 'Ethiopian',
  'Filipino', 'Finnish', 'French', 'German', 'Ghanaian', 'Greek',
  'Hungarian', 'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Irish', 'Israeli', 'Italian',
  'Japanese', 'Jordanian', 'Kenyan', 'Korean', 'Kuwaiti',
  'Lebanese', 'Libyan', 'Lithuanian', 'Malaysian', 'Mexican', 'Moroccan',
  'Nepalese', 'New Zealander', 'Nigerian', 'Norwegian',
  'Omani', 'Pakistani', 'Palestinian', 'Peruvian', 'Polish', 'Portuguese',
  'Qatari', 'Romanian', 'Russian', 'Saudi', 'Serbian', 'Singaporean', 'Slovak',
  'Slovenian', 'South African', 'Spanish', 'Sri Lankan', 'Sudanese', 'Swedish', 'Swiss', 'Syrian',
  'Thai', 'Tunisian', 'Turkish', 'Ukrainian', 'Venezuelan', 'Yemeni',
];

export function PersonalInfoStep({ data, onComplete, onBack }: PersonalInfoStepProps) {
  // SCP-2025-12-07: State for controlling datepicker popover (auto-close after selection)
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const form = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: data,
  });

  const onSubmit = (values: PersonalInfoFormData) => {
    onComplete(values);
  };

  const dateOfBirth = form.watch('dateOfBirth');
  const age = dateOfBirth ? calculateAge(dateOfBirth) : null;

  return (
    <Card data-testid="step-personal-info">
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>
          Enter the tenant's personal details and emergency contact information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* SCP-2025-12-12: Full Name Field (replaces firstName/lastName) */}
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
                        {...field}
                        placeholder="Enter full name (as on Emirates ID)"
                        data-testid="input-full-name"
                      />
                    </FormControl>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Full name as extracted from Emirates ID
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Fields */}
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
                          className="pl-9"
                          {...field}
                          type="email"
                          placeholder="tenant@example.com"
                          data-testid="input-email"
                        />
                      </FormControl>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Used for login and lease communications
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-1">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <PhoneIcon className="size-4" />
                      </div>
                      <FormControl>
                        <Input
                          id="phone"
                          className="pl-9"
                          {...field}
                          type="tel"
                          placeholder="+971501234567"
                          data-testid="input-phone"
                        />
                      </FormControl>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      E.164 format (e.g., +971501234567)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date of Birth and National ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem className="space-y-2 flex flex-col">
                    <Label className="flex items-center gap-1">
                      Date of Birth <span className="text-destructive">*</span>
                    </Label>
                    {/* SCP-2025-12-07: Controlled popover with auto-close after date selection */}
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                            data-testid="btn-date-of-birth"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={(date) => {
                            field.onChange(date);
                            setDatePickerOpen(false); // Auto-close after selection
                          }}
                          disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                          initialFocus
                          captionLayout="dropdown"
                          fromYear={1940}
                          toYear={new Date().getFullYear()}
                        />
                      </PopoverContent>
                    </Popover>
                    {age !== null && (
                      <p className="text-muted-foreground text-xs">
                        Age: {age} years old
                        {age < 18 && ' - Must be 18 or older'}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nationalId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="nationalId" className="flex items-center gap-1">
                      National ID / Passport Number <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <CreditCardIcon className="size-4" />
                      </div>
                      <FormControl>
                        <Input
                          id="nationalId"
                          className="pl-9"
                          {...field}
                          placeholder="784-1234-1234567-1"
                          data-testid="input-national-id"
                        />
                      </FormControl>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Emirates ID or Passport number
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Nationality - SCP-2025-12-12: Changed to textbox for OCR data */}
            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Nationality <span className="text-destructive">*</span>
                  </Label>
                  <FormControl>
                    <div className="relative">
                      <GlobeIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        {...field}
                        data-testid="input-nationality"
                        placeholder="Enter nationality"
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Emergency Contact Section */}
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                <strong>Emergency Contact</strong> - This person will be contacted in case of emergencies
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="emergencyContactName"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="emergencyContactName" className="flex items-center gap-1">
                      Emergency Contact Name <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <UserIcon className="size-4" />
                      </div>
                      <FormControl>
                        <Input
                          id="emergencyContactName"
                          className="pl-9"
                          {...field}
                          placeholder="Enter emergency contact name"
                          data-testid="input-emergency-contact-name"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergencyContactPhone"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="emergencyContactPhone" className="flex items-center gap-1">
                      Emergency Contact Phone <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <PhoneIcon className="size-4" />
                      </div>
                      <FormControl>
                        <Input
                          id="emergencyContactPhone"
                          className="pl-9"
                          {...field}
                          type="tel"
                          placeholder="+971501234567"
                          data-testid="input-emergency-contact-phone"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                data-testid="btn-back"
              >
                Cancel
              </Button>
              <Button type="submit" data-testid="btn-next">
                Next: Lease Information
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
