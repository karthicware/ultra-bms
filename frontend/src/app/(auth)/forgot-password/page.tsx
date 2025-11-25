'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

import * as authApi from '@/lib/auth-api';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/schemas/authSchemas';
import { AuthLayout } from '@/components/layout/auth-layout';
import { SubmitButton } from '@/components/forms';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError('');
    setSuccess(false);

    try {
      await authApi.forgotPassword(data);

      setSuccess(true);
      toast.success('Password reset email sent', {
        description: 'Check your inbox for reset instructions.',
      });

      // Reset form
      form.reset();
    } catch (err) {
      console.error('Forgot password failed:', err);

      if (err instanceof AxiosError) {
        const errorData = err.response?.data;
        const errorMessage = errorData?.error?.message;
        setError(errorMessage || 'Failed to send reset email. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter your email address and we'll send you a link to reset your password"
      footer={
        <div className="text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      }
    >
      {success ? (
        <div className="space-y-4">
          <Alert className="border-green-200 bg-green-50" data-testid="success-alert">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800" data-testid="success-message">
              <strong className="font-semibold">Check your email!</strong>
              <p className="mt-1">
                We&apos;ve sent password reset instructions to your email address. The link will expire in 15 minutes.
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Didn&apos;t receive the email?</p>
            <ul className="list-inside list-disc space-y-1 text-xs">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>Wait a few minutes and try again</li>
            </ul>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setSuccess(false);
              form.reset();
            }}
          >
            Send another email
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <FormDescription className="text-xs">
                    Enter the email address associated with your account
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <SubmitButton
              isLoading={isSubmitting}
              loadingText="Sending reset link..."
              className="mt-6"
              data-testid="submit-button"
            >
              Send reset link
            </SubmitButton>
          </form>
        </Form>
      )}
    </AuthLayout>
  );
}
