'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

import * as authApi from '@/lib/auth-api';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/schemas/authSchemas';
import { AuthLayout } from '@/components/layout/auth-layout';
import { SubmitButton, PasswordInput, PasswordStrengthMeter } from '@/components/forms';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [tokenError, setTokenError] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      newPassword: '',
      confirmPassword: '',
    },
  });

  const { isSubmitting, errors } = form.formState;
  const password = form.watch('newPassword');

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenError('Reset token is missing. Please check your email link.');
        setIsValidating(false);
        return;
      }

      try {
        const response = await authApi.validateResetToken(token);
        if (response.success && response.data.valid) {
          setIsValidToken(true);
        } else {
          setTokenError(response.data.message || 'Invalid or expired reset link.');
        }
      } catch (err) {
        console.error('Token validation failed:', err);
        if (err instanceof AxiosError) {
          const errorMessage = err.response?.data?.error?.message;
          setTokenError(
            errorMessage || 'This reset link is invalid or has expired. Please request a new password reset.'
          );
        } else {
          setTokenError('Unable to validate reset link. Please try again or request a new reset link.');
        }
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError('');

    try {
      await authApi.resetPassword({
        token: data.token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      setSuccess(true);
      toast.success('Password reset successful!', {
        description: 'You can now log in with your new password.',
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login?reset=success');
      }, 3000);
    } catch (err) {
      console.error('Password reset failed:', err);

      if (err instanceof AxiosError) {
        const errorData = err.response?.data;
        const errorCode = errorData?.error?.code;
        const errorMessage = errorData?.error?.message;

        switch (errorCode) {
          case 'TOKEN_EXPIRED':
          case 'TOKEN_INVALID':
            setError('Your reset link has expired. Please request a new password reset.');
            break;
          case 'PASSWORD_TOO_WEAK':
            setError('Password does not meet security requirements.');
            break;
          default:
            setError(errorMessage || 'Unable to reset password. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md border-border">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Validating reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid token error
  if (!isValidToken) {
    return (
      <AuthLayout
        title="Invalid Reset Link"
        description={tokenError}
      >
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{tokenError}</AlertDescription>
          </Alert>

          <Link href="/forgot-password">
            <Button className="w-full">Request New Reset Link</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // Success state
  if (success) {
    return (
      <AuthLayout
        title="Password Reset Successful"
        description="Your password has been successfully reset"
      >
        <div className="space-y-4">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong className="font-semibold">Success!</strong>
              <p className="mt-1">
                You can now log in with your new password.
              </p>
            </AlertDescription>
          </Alert>

          <p className="text-center text-sm text-muted-foreground">
            Redirecting to login page...
          </p>
        </div>
      </AuthLayout>
    );
  }

  // Reset password form
  return (
    <AuthLayout
      title="Reset Your Password"
      description="Enter a new password for your account"
      footer={
        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Hidden token field */}
          <input type="hidden" {...form.register('token')} value={token} />

          {/* New Password Field */}
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    autoFocus
                    disabled={isSubmitting}
                    error={!!errors.newPassword}
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
                <FormLabel>Confirm new password</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder="Re-enter your new password"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    error={!!errors.confirmPassword}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <SubmitButton
            isLoading={isSubmitting}
            loadingText="Resetting password..."
            className="mt-6"
          >
            Reset password
          </SubmitButton>
        </form>
      </Form>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
