'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AxiosError } from 'axios';

import { useAuth } from '@/contexts/auth-context';
import { loginSchema, type LoginFormData } from '@/schemas/authSchemas';
import { AuthLayout } from '@/components/layout/auth-layout';
import { SubmitButton } from '@/components/forms';
import { PasswordInput } from '@/components/forms';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string>('');

  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: LoginFormData) => {
    setError('');

    try {
      await login(data.email, data.password, data.rememberMe);
      // Redirect immediately with full page reload to restore session via refresh token
      console.log('[LOGIN PAGE] Login successful, redirecting to:', redirectTo);
      window.location.href = redirectTo;
    } catch (err) {
      console.error('Login failed:', err);

      // Handle different error types
      if (err instanceof AxiosError) {
        const errorData = err.response?.data;
        const errorCode = errorData?.error?.code;
        const errorMessage = errorData?.error?.message;

        switch (errorCode) {
          case 'INVALID_CREDENTIALS':
            setError('Invalid email or password. Please try again.');
            break;
          case 'ACCOUNT_LOCKED':
            setError(
              'Your account has been locked due to multiple failed login attempts. Please try again later or contact support.'
            );
            break;
          case 'EMAIL_NOT_VERIFIED':
            setError('Please verify your email address before logging in.');
            break;
          default:
            setError(errorMessage || 'An error occurred during login. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <AuthLayout
      title="Sign in to your account"
      description="Enter your credentials to access Ultra BMS"
      footer={
        <div className="space-y-2 text-center text-sm">
          <p className="text-muted-foreground">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="login-form">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" data-testid="error-alert">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription data-testid="error-message">{error}</AlertDescription>
            </Alert>
          )}

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
                    autoFocus
                    disabled={isSubmitting}
                    data-testid="email-input"
                    {...field}
                  />
                </FormControl>
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
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                    tabIndex={-1}
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    data-testid="password-input"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Remember Me */}
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                    id="rememberMe"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                    Remember me for 7 days
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <SubmitButton
            isLoading={isSubmitting}
            loadingText="Signing in..."
            className="mt-6"
            data-testid="login-button"
          >
            Sign in
          </SubmitButton>
        </form>
      </Form>
    </AuthLayout>
  );
}
