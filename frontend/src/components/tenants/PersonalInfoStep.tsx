'use client';

/**
 * Step 1: Personal Information
 * Collects tenant's personal details including emergency contact
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';

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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, InfoIcon } from 'lucide-react';

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
  const form = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
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
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter first name"
                        data-testid="input-first-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter last name"
                        data-testid="input-last-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="tenant@example.com"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormDescription>
                      Used for login and lease communications
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder="+971501234567"
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormDescription>
                      E.164 format (e.g., +971501234567)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date of Birth and National ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of Birth *</FormLabel>
                    <Popover>
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
                            {field.value ? (
                              format(field.value, 'PPP')
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
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                          initialFocus
                          captionLayout="dropdown-buttons"
                          fromYear={1940}
                          toYear={new Date().getFullYear()}
                        />
                      </PopoverContent>
                    </Popover>
                    {age !== null && (
                      <FormDescription>
                        Age: {age} years old
                        {age < 18 && ' - Must be 18 or older'}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nationalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>National ID / Passport Number *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="784-1234-1234567-1"
                        data-testid="input-national-id"
                      />
                    </FormControl>
                    <FormDescription>
                      Emirates ID or Passport number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Nationality */}
            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nationality *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-nationality">
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {NATIONALITIES.map((nationality) => (
                        <SelectItem key={nationality} value={nationality}>
                          {nationality}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="emergencyContactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter emergency contact name"
                        data-testid="input-emergency-contact-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergencyContactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Phone *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder="+971501234567"
                        data-testid="input-emergency-contact-phone"
                      />
                    </FormControl>
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
