'use client';

/**
 * Security Settings Page
 * Manage password and active sessions with modern executive dashboard aesthetic
 */

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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
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
  ShieldCheck,
  Lock,
  Loader2,
  LogOut,
  User,
  Settings,
  Bell,
  ChevronRight,
  Fingerprint,
  Eye,
  RefreshCw,
  Globe,
  Wifi,
} from 'lucide-react';
import { PageBackButton } from '@/components/common/PageBackButton';
import Link from 'next/link';
import type { SessionDto } from '@/types/auth';

// Quick links for navigation
const QUICK_LINKS = [
  {
    title: 'Profile Settings',
    description: 'Update your info',
    icon: User,
    href: '/settings/profile',
    color: 'text-blue-600',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    title: 'Notifications',
    description: 'Email & alerts',
    icon: Bell,
    href: '/settings/notifications',
    color: 'text-amber-600',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
  },
  {
    title: 'All Settings',
    description: 'Full settings menu',
    icon: Settings,
    href: '/settings',
    color: 'text-slate-600',
    bg: 'bg-slate-100 dark:bg-slate-900/30',
  },
];

// Security tips
const SECURITY_TIPS = [
  {
    icon: Key,
    title: 'Strong passwords',
    description: 'Use at least 12 characters with mixed case, numbers & symbols.',
  },
  {
    icon: RefreshCw,
    title: 'Regular updates',
    description: 'Change your password every 90 days for best security.',
  },
  {
    icon: Eye,
    title: 'Monitor sessions',
    description: 'Review active sessions regularly and revoke unfamiliar ones.',
  },
];

export default function SecurityPage() {
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [changePasswordError, setChangePasswordError] = useState<string>('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
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

  const getDeviceColor = (deviceType: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return { bg: 'bg-purple-100 dark:bg-purple-900/30', color: 'text-purple-600' };
      case 'tablet':
        return { bg: 'bg-cyan-100 dark:bg-cyan-900/30', color: 'text-cyan-600' };
      default:
        return { bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-600' };
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      setRevokingSession(sessionId);
      await authApi.revokeSession(sessionId);
      toast.success('Session Revoked', { description: 'Session revoked successfully' });
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    } catch (err) {
      console.error('Failed to revoke session:', err);
      toast.error('Revoke Failed', { description: 'Failed to revoke session' });
    } finally {
      setRevokingSession(null);
    }
  };

  const logoutAllOtherDevices = async () => {
    try {
      setLoggingOutAll(true);
      await authApi.logoutAllDevices();
      toast.success('Devices Logged Out', { description: 'Logged out from all other devices' });
      await fetchSessions(); // Refresh the list
    } catch (err) {
      console.error('Failed to logout all:', err);
      toast.error('Logout Failed', { description: 'Failed to logout from all devices' });
    } finally {
      setLoggingOutAll(false);
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

  // Count stats
  const currentSession = sessions.find((s) => s.isCurrent);
  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container max-w-5xl py-8 space-y-6 mx-auto">
          {/* Back button */}
          <div className="flex items-center gap-2">
            <PageBackButton href="/settings" aria-label="Back to settings" />
            <span className="text-sm text-muted-foreground">Back to Settings</span>
          </div>

          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 via-red-500/5 to-background border shadow-sm">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-500/5 rounded-full translate-y-24 -translate-x-24" />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-red-500/3 rounded-full" />

            <div className="relative p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="p-4 rounded-2xl bg-red-500/10 ring-1 ring-red-500/20">
                    <ShieldCheck className="h-12 w-12 text-red-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
                    <p className="text-muted-foreground mt-1">
                      Manage your password and active sessions to keep your account secure
                    </p>
                  </div>
                </div>

                {/* Security Status Badge */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Account Secured
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full -translate-y-8 translate-x-8" />
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <Fingerprint className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{sessions.length}</p>
                    <p className="text-sm text-muted-foreground">Active Sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full -translate-y-8 translate-x-8" />
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <Shield className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">Protected</p>
                    <p className="text-sm text-muted-foreground">Password Status</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full -translate-y-8 translate-x-8" />
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                    <Globe className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{otherSessions.length}</p>
                    <p className="text-sm text-muted-foreground">Other Devices</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Left Side */}
            <div className="lg:col-span-2 space-y-6">
              {/* Change Password Card */}
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16" />
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Change Password</CardTitle>
                      <CardDescription>
                        Update your password to keep your account secure
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {changePasswordSuccess && (
                    <Alert className="mb-4 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <AlertDescription className="text-emerald-800 dark:text-emerald-400">
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
                            <FormLabel className="flex items-center gap-2">
                              <Lock className="h-4 w-4 text-muted-foreground" />
                              Current password
                            </FormLabel>
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
                            <FormLabel className="flex items-center gap-2">
                              <Key className="h-4 w-4 text-muted-foreground" />
                              New password
                            </FormLabel>
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
                            <FormLabel className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                              Confirm new password
                            </FormLabel>
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

                      <div className="pt-2">
                        <SubmitButton
                          isLoading={isSubmitting}
                          loadingText="Changing password..."
                          className="w-full sm:w-auto"
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Change password
                        </SubmitButton>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Active Sessions Card */}
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16" />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Wifi className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle>Active Sessions</CardTitle>
                        <CardDescription>
                          Manage where you&apos;re logged in. Revoke access to any device.
                        </CardDescription>
                      </div>
                    </div>
                    {otherSessions.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={logoutAllOtherDevices}
                        disabled={loading || loggingOutAll}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                      >
                        {loggingOutAll ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <LogOut className="h-4 w-4 mr-2" />
                        )}
                        Logout All Others
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
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading sessions...</p>
                      </div>
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="py-8 text-center">
                      <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
                        <Wifi className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">No active sessions found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Current Session First */}
                      {currentSession && (
                        <div className="relative rounded-xl border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-primary text-primary-foreground">
                              Current Session
                            </Badge>
                          </div>
                          <div className="flex gap-4">
                            <div className={`p-3 rounded-xl ${getDeviceColor(currentSession.deviceType).bg}`}>
                              <span className={getDeviceColor(currentSession.deviceType).color}>
                                {getDeviceIcon(currentSession.deviceType)}
                              </span>
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="font-semibold">
                                {currentSession.deviceType || 'Unknown Device'}
                              </p>
                              {currentSession.browser && (
                                <p className="text-sm text-muted-foreground">{currentSession.browser}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                {currentSession.ipAddress && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{currentSession.ipAddress}</span>
                                    {currentSession.location && <span>({currentSession.location})</span>}
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>Active now</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Other Sessions */}
                      {otherSessions.length > 0 && (
                        <>
                          <Separator className="my-4" />
                          <p className="text-sm font-medium text-muted-foreground mb-3">Other Devices</p>
                          {otherSessions.map((session) => (
                            <div
                              key={session.sessionId}
                              className="flex items-start justify-between rounded-xl border p-4 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex gap-4">
                                <div className={`p-3 rounded-xl ${getDeviceColor(session.deviceType).bg}`}>
                                  <span className={getDeviceColor(session.deviceType).color}>
                                    {getDeviceIcon(session.deviceType)}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <p className="font-semibold">
                                    {session.deviceType || 'Unknown Device'}
                                  </p>
                                  {session.browser && (
                                    <p className="text-sm text-muted-foreground">{session.browser}</p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                    {session.ipAddress && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        <span>{session.ipAddress}</span>
                                        {session.location && <span>({session.location})</span>}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1">
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
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => revokeSession(session.sessionId)}
                                disabled={revokingSession === session.sessionId}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                {revokingSession === session.sessionId ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Revoke'
                                )}
                              </Button>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}

                  <div className="mt-4 rounded-xl bg-muted/50 border p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                        <Clock className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Session Expiration</p>
                        <p className="text-sm text-muted-foreground">
                          Sessions automatically expire after 12 hours or 30 minutes of inactivity.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Right Side */}
            <div className="space-y-6">
              {/* Security Tips Card */}
              <Card className="bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    <CardTitle className="text-lg">Security Tips</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {SECURITY_TIPS.map((tip, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-background/80 border">
                        <tip.icon className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{tip.title}</p>
                        <p className="text-xs text-muted-foreground">{tip.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Links</CardTitle>
                  <CardDescription>Navigate to other settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {QUICK_LINKS.map((link) => (
                    <Tooltip key={link.href}>
                      <TooltipTrigger asChild>
                        <Link href={link.href}>
                          <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 hover:border-primary/30 transition-all group cursor-pointer">
                            <div className={`p-2 rounded-lg ${link.bg}`}>
                              <link.icon className={`h-4 w-4 ${link.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{link.title}</p>
                              <p className="text-xs text-muted-foreground">{link.description}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Go to {link.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </CardContent>
              </Card>

              {/* Two-Factor Authentication Coming Soon */}
              <Card className="border-dashed">
                <CardContent className="pt-6">
                  <div className="text-center space-y-3">
                    <div className="p-3 rounded-full bg-muted w-fit mx-auto">
                      <Fingerprint className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">Coming soon</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Enhanced Security
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
