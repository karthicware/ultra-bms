'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

import { useAuth } from '@/contexts/auth-context';
import { registerSchema, type RegisterFormData } from '@/schemas/authSchemas';
import { AuthLayout } from '@/components/layout/auth-layout';
import { SubmitButton, PasswordInput, PasswordStrengthMeter } from '@/components/forms';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string>('');

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      termsAccepted: false,
    },
  });

  const { isSubmitting, errors } = form.formState;
  const password = form.watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setError('');

    try {
      await registerUser(data);

      toast.success('Registration successful!', {
        description: 'Your account has been created. Please check your email for verification.',
      });

      // Redirect to login page
      router.push('/login?registered=true');
    } catch (err) {
      console.error('Registration failed:', err);

      if (err instanceof AxiosError) {
        const errorData = err.response?.data;
        const errorCode = errorData?.error?.code;
        const errorMessage = errorData?.error?.message;

        switch (errorCode) {
          case 'EMAIL_ALREADY_EXISTS':
            setError('An account with this email already exists. Please sign in instead.');
            form.setError('email', {
              message: 'Email already registered',
            });
            break;
          case 'PASSWORD_TOO_WEAK':
            setError('Password does not meet security requirements.');
            break;
          default:
            setError(errorMessage || 'Registration failed. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      description="Join Ultra BMS to manage your properties efficiently"
      footer={
        <div className="space-y-2 text-center text-sm">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="register-form">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" data-testid="error-alert">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription data-testid="error-message">{error}</AlertDescription>
            </Alert>
          )}

          {/* Name Fields - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John"
                      autoComplete="given-name"
                      autoFocus
                      disabled={isSubmitting}
                      {...field}
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
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Doe"
                      autoComplete="family-name"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    disabled={isSubmitting}
                    data-testid="email-input"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone Field (Optional) */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Phone number <span className="text-muted-foreground">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="+971501234567"
                    autoComplete="tel"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Use E.164 format (e.g., +971501234567)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password Field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    error={!!errors.password}
                    data-testid="password-input"
                    {...field}
                  />
                </FormControl>
                <FormMessage />

                {/* Password Strength Meter */}
                {password && (
                  <div className="mt-2">
                    <PasswordStrengthMeter password={password} />
                  </div>
                )}
              </FormItem>
            )}
          />

          {/* Confirm Password Field */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    error={!!errors.confirmPassword}
                    data-testid="confirm-password-input"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Terms and Conditions */}
          <FormField
            control={form.control}
            name="termsAccepted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-2 space-y-0 rounded-md border p-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                    id="termsAccepted"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel htmlFor="termsAccepted" className="text-sm font-normal cursor-pointer">
                    I agree to the{' '}
                    <Link
                      href="/terms"
                      target="_blank"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <SubmitButton isLoading={isSubmitting} loadingText="Creating account..." className="mt-6" data-testid="register-button">
            Create account
          </SubmitButton>
        </form>
      </Form>
    </AuthLayout>
  );
}
