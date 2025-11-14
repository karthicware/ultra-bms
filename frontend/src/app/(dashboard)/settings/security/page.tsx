'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { formatDistanceToNow } from 'date-fns';

import * as authApi from '@/lib/auth-api';
import { changePasswordSchema, type ChangePasswordFormData } from '@/schemas/authSchemas';
import { PasswordInput, PasswordStrengthMeter, SubmitButton } from '@/components/forms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  Clock,
  Shield,
  AlertTriangle,
  Key,
  CheckCircle2,
} from 'lucide-react';
import type { SessionDto } from '@/types/auth';

export default function SecurityPage() {
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [changePasswordError, setChangePasswordError] = useState<string>('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const { isSubmitting, errors } = form.formState;
  const newPassword = form.watch('newPassword');

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authApi.getActiveSessions();
      if (response.success && response.data.sessions) {
        setSessions(response.data.sessions);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError('Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      await authApi.revokeSession(sessionId);
      toast.success('Session revoked successfully');
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    } catch (err) {
      console.error('Failed to revoke session:', err);
      toast.error('Failed to revoke session');
    }
  };

  const logoutAllOtherDevices = async () => {
    try {
      await authApi.logoutAllDevices();
      toast.success('Logged out from all other devices');
      await fetchSessions(); // Refresh the list
    } catch (err) {
      console.error('Failed to logout all:', err);
      toast.error('Failed to logout from all devices');
    }
  };

  const onSubmitPasswordChange = async (data: ChangePasswordFormData) => {
    setChangePasswordError('');
    setChangePasswordSuccess(false);

    try {
      await authApi.changePassword(data);

      setChangePasswordSuccess(true);
      toast.success('Password changed successfully', {
        description: 'Your password has been updated.',
      });

      // Reset form
      form.reset();

      // Hide success message after 5 seconds
      setTimeout(() => setChangePasswordSuccess(false), 5000);
    } catch (err) {
      console.error('Password change failed:', err);

      if (err instanceof AxiosError) {
        const errorData = err.response?.data;
        const errorCode = errorData?.error?.code;
        const errorMessage = errorData?.error?.message;

        switch (errorCode) {
          case 'INVALID_CREDENTIALS':
            setChangePasswordError('Current password is incorrect.');
            form.setError('currentPassword', {
              message: 'Incorrect password',
            });
            break;
          case 'PASSWORD_TOO_WEAK':
            setChangePasswordError('New password does not meet security requirements.');
            break;
          default:
            setChangePasswordError(errorMessage || 'Failed to change password. Please try again.');
        }
      } else {
        setChangePasswordError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
        <p className="text-muted-foreground">
          Manage your password and active sessions
        </p>
      </div>

      <div className="space-y-6">
        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent>
            {changePasswordSuccess && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Your password has been changed successfully.
                </AlertDescription>
              </Alert>
            )}

            {changePasswordError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{changePasswordError}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitPasswordChange)} className="space-y-4">
                {/* Current Password */}
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="Enter your current password"
                          autoComplete="current-password"
                          disabled={isSubmitting}
                          error={!!errors.currentPassword}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* New Password */}
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="Enter your new password"
                          autoComplete="new-password"
                          disabled={isSubmitting}
                          error={!!errors.newPassword}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />

                      {/* Password Strength Meter */}
                      {newPassword && (
                        <div className="mt-2">
                          <PasswordStrengthMeter password={newPassword} />
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                {/* Confirm Password */}
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

                <SubmitButton
                  isLoading={isSubmitting}
                  loadingText="Changing password..."
                  className="mt-6"
                >
                  Change password
                </SubmitButton>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Active Sessions Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Active Sessions
                </CardTitle>
                <CardDescription>
                  Manage where you're logged in. You can revoke access to any device at any time.
                </CardDescription>
              </div>
              {sessions.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logoutAllOtherDevices}
                  disabled={loading}
                >
                  Logout All Other Devices
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No active sessions found</p>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.sessionId}
                    className={`flex items-start justify-between rounded-lg border p-4 ${
                      session.isCurrent ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="mt-1">{getDeviceIcon(session.deviceType)}</div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {session.deviceType || 'Unknown Device'}
                          </p>
                          {session.isCurrent && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                              Current Session
                            </span>
                          )}
                        </div>
                        {session.browser && (
                          <p className="text-sm text-muted-foreground">{session.browser}</p>
                        )}
                        {session.ipAddress && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{session.ipAddress}</span>
                            {session.location && <span>({session.location})</span>}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            Last active{' '}
                            {formatDistanceToNow(new Date(session.lastActivityAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!session.isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeSession(session.sessionId)}
                        className="text-destructive hover:text-destructive"
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Sessions automatically expire after 12 hours or 30 minutes of
                inactivity.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
