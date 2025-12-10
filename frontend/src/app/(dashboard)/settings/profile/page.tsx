'use client';

/**
 * User Profile Settings Page
 * Story 2.9: User Profile Customization
 *
 * Allows authenticated staff users to customize their profile:
 * - Display name, avatar/profile photo, contact phone
 * - Read-only email and role display
 */

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  User,
  Camera,
  Trash2,
  Check,
  Mail,
  Phone,
  Shield,
  Settings,
  Key,
  Bell,
  UserCog,
  Sparkles,
  ChevronRight,
  Building2,
  Wrench,
  DollarSign,
  Home,
  HardHat,
} from 'lucide-react';
import Link from 'next/link';
import { PageBackButton } from '@/components/common/PageBackButton';
import { useToast } from '@/hooks/use-toast';
import {
  userProfileSchema,
  type UserProfileFormData,
  validateAvatarFileSync,
} from '@/lib/validations/user-profile';
import {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  deleteAvatar,
} from '@/services/user-profile.service';
import {
  getUserInitials,
  formatRoleName,
  MAX_AVATAR_SIZE_MB,
} from '@/types/user-profile';

// Role styles with icons and colors
const ROLE_STYLES: Record<string, { icon: React.ReactNode; color: string; bg: string; gradient: string }> = {
  SUPER_ADMIN: {
    icon: <Shield className="h-4 w-4" />,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    gradient: 'from-purple-500/20 to-purple-500/5',
  },
  PROPERTY_MANAGER: {
    icon: <Building2 className="h-4 w-4" />,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    gradient: 'from-blue-500/20 to-blue-500/5',
  },
  MAINTENANCE_SUPERVISOR: {
    icon: <Wrench className="h-4 w-4" />,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    gradient: 'from-amber-500/20 to-amber-500/5',
  },
  FINANCE_MANAGER: {
    icon: <DollarSign className="h-4 w-4" />,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    gradient: 'from-emerald-500/20 to-emerald-500/5',
  },
  TENANT: {
    icon: <Home className="h-4 w-4" />,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    gradient: 'from-cyan-500/20 to-cyan-500/5',
  },
  VENDOR: {
    icon: <HardHat className="h-4 w-4" />,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    gradient: 'from-orange-500/20 to-orange-500/5',
  },
};

// Quick links for navigation
const QUICK_LINKS = [
  {
    title: 'Security Settings',
    description: 'Password & 2FA',
    icon: Key,
    href: '/settings/security',
    color: 'text-red-600',
    bg: 'bg-red-100 dark:bg-red-900/30',
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

export default function UserProfilePage() {
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Profile state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('');

  const form = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      displayName: '',
      contactPhone: '',
    },
  });

  // Load profile on mount
  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const profile = await getMyProfile();

      setEmail(profile.email);
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setRole(profile.role);
      setAvatarUrl(profile.avatarUrl);

      form.reset({
        displayName: profile.displayName ?? '',
        contactPhone: profile.contactPhone ?? '',
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [form, toast]);

  useEffect(() => {
    setMounted(true);
    loadProfile();
  }, [loadProfile]);

  // Handle form submission
  const onSubmit = async (data: UserProfileFormData) => {
    try {
      setIsSaving(true);
      const profile = await updateMyProfile({
        displayName: data.displayName || null,
        contactPhone: data.contactPhone || null,
      });

      // Update local state with response
      form.reset({
        displayName: profile.displayName ?? '',
        contactPhone: profile.contactPhone ?? '',
      });

      toast({
        title: 'Success',
        description: 'Profile updated successfully.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const error = validateAvatarFileSync(file);
    if (error) {
      toast({
        title: 'Invalid File',
        description: error,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const response = await uploadAvatar(file);
      setAvatarUrl(response.avatarUrl);

      toast({
        title: 'Success',
        description: 'Avatar uploaded successfully.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Handle avatar deletion
  const handleDeleteAvatar = async () => {
    if (!avatarUrl) return;

    try {
      setIsDeletingAvatar(true);
      await deleteAvatar();
      setAvatarUrl(null);

      toast({
        title: 'Success',
        description: 'Avatar removed successfully.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to delete avatar:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove avatar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  // Get initials for avatar fallback
  const initials = getUserInitials(
    form.watch('displayName') || null,
    firstName,
    lastName
  );

  // Get role styles
  const roleStyle = ROLE_STYLES[role] || ROLE_STYLES.PROPERTY_MANAGER;

  // Show loading skeleton during SSR/hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container max-w-5xl py-8 space-y-8 mx-auto">
          <div className="h-[200px] bg-muted animate-pulse rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-[300px] bg-muted animate-pulse rounded-xl" />
              <div className="h-[200px] bg-muted animate-pulse rounded-xl" />
            </div>
            <div className="h-[300px] bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20" data-testid="profile-settings-page">
        <div className="container max-w-5xl py-8 space-y-6 mx-auto">
          {/* Back button */}
          <div className="flex items-center gap-2">
            <PageBackButton href="/settings" aria-label="Back to settings" />
            <span className="text-sm text-muted-foreground">Back to Settings</span>
          </div>

          {/* Hero Header with Profile Preview */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border shadow-sm">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full translate-y-24 -translate-x-24" />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-primary/3 rounded-full" />

            <div className="relative p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Large Avatar */}
                <div className="relative group">
                  <Avatar className="h-32 w-32 ring-4 ring-background shadow-xl" data-testid="avatar-preview">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt="Profile photo" />
                    ) : null}
                    <AvatarFallback className="text-4xl font-semibold bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                  {/* Avatar overlay on hover */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Label htmlFor="avatar-upload-hero" className="cursor-pointer">
                      <Camera className="h-8 w-8 text-white" />
                    </Label>
                    <input
                      id="avatar-upload-hero"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      className="sr-only"
                      onChange={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                    />
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight">
                      {form.watch('displayName') || `${firstName} ${lastName}`}
                    </h1>
                    <Badge className={`${roleStyle.bg} ${roleStyle.color} border-0 gap-1.5`}>
                      {roleStyle.icon}
                      {formatRoleName(role)}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{email}</span>
                    </div>
                    {form.watch('contactPhone') && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{form.watch('contactPhone')}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground max-w-lg">
                    Customize your profile settings and personal information. Your display name and photo will be visible to other users in the system.
                  </p>
                </div>

                {/* Hero icon */}
                <div className="hidden lg:flex p-4 rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                  <UserCog className="h-12 w-12 text-primary" />
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading your profile...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} data-testid="profile-form">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Left Side */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Profile Photo Card */}
                  <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-12 translate-x-12" />
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Camera className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle>Profile Photo</CardTitle>
                          <CardDescription>
                            Upload a profile photo. Accepts PNG or JPG up to {MAX_AVATAR_SIZE_MB}MB.
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-6">
                        {/* Avatar preview */}
                        <div className="relative">
                          <Avatar className="h-24 w-24 ring-2 ring-border">
                            {avatarUrl ? (
                              <AvatarImage src={avatarUrl} alt="Profile photo" />
                            ) : null}
                            <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          {isUploadingAvatar && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          )}
                        </div>

                        {/* Upload/Delete buttons */}
                        <div className="flex flex-col gap-3">
                          <Label htmlFor="avatar-upload" className="cursor-pointer">
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isUploadingAvatar}
                              className="hover:bg-primary/10 hover:border-primary/50"
                              asChild
                            >
                              <span>
                                {isUploadingAvatar ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Camera className="h-4 w-4 mr-2" />
                                )}
                                {avatarUrl ? 'Change Photo' : 'Upload Photo'}
                              </span>
                            </Button>
                          </Label>
                          <input
                            id="avatar-upload"
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            className="sr-only"
                            onChange={handleAvatarUpload}
                            disabled={isUploadingAvatar}
                            data-testid="avatar-file-input"
                          />

                          {avatarUrl && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleDeleteAvatar}
                              disabled={isDeletingAvatar}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                              data-testid="delete-avatar-button"
                            >
                              {isDeletingAvatar ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              Remove Photo
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Profile Details Card */}
                  <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16" />
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle>Profile Details</CardTitle>
                          <CardDescription>
                            Your personal information and display preferences
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Display Name */}
                      <div className="space-y-2">
                        <Label htmlFor="displayName" className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Display Name
                        </Label>
                        <Input
                          id="displayName"
                          {...form.register('displayName')}
                          placeholder={`${firstName} ${lastName}`}
                          className="focus-visible:ring-primary"
                          data-testid="input-display-name"
                        />
                        <p className="text-xs text-muted-foreground">
                          How your name appears across the platform. Leave blank to use your full name.
                        </p>
                        {form.formState.errors.displayName && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.displayName.message}
                          </p>
                        )}
                      </div>

                      {/* Contact Phone */}
                      <div className="space-y-2">
                        <Label htmlFor="contactPhone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary" />
                          Contact Phone
                        </Label>
                        <Input
                          id="contactPhone"
                          {...form.register('contactPhone')}
                          placeholder="Enter personal phone number"
                          className="focus-visible:ring-primary"
                          data-testid="input-contact-phone"
                        />
                        <p className="text-xs text-muted-foreground">
                          Optional personal phone for internal directory. Accepts any format.
                        </p>
                        {form.formState.errors.contactPhone && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.contactPhone.message}
                          </p>
                        )}
                      </div>

                      <Separator />

                      {/* Read-only Email */}
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          Email Address
                          <Badge variant="outline" className="text-xs ml-2">Read-only</Badge>
                        </Label>
                        <Input
                          id="email"
                          value={email}
                          disabled
                          className="bg-muted/50"
                          data-testid="input-email-readonly"
                        />
                        <p className="text-xs text-muted-foreground">
                          Email cannot be changed. Contact an administrator if you need to update it.
                        </p>
                      </div>

                      {/* Read-only Role */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          Role
                          <Badge variant="outline" className="text-xs ml-2">Read-only</Badge>
                        </Label>
                        <div className="p-3 rounded-lg bg-muted/50 border">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-md ${roleStyle.bg}`}>
                              {roleStyle.icon}
                            </div>
                            <span className="font-medium" data-testid="role-badge">
                              {formatRoleName(role)}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Your role determines access permissions. Contact an administrator to change it.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => form.reset()}
                      disabled={isSaving}
                    >
                      Reset
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving || !form.formState.isDirty}
                      className="bg-primary hover:bg-primary/90"
                      data-testid="save-profile-button"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Sidebar - Right Side */}
                <div className="space-y-6">
                  {/* Account Summary Card */}
                  <Card className="relative overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${roleStyle.gradient} opacity-50`} />
                    <CardHeader className="relative">
                      <CardTitle className="text-lg">Account Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="relative space-y-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-background/80 backdrop-blur-sm border">
                        <div className={`p-2 rounded-lg ${roleStyle.bg}`}>
                          {roleStyle.icon}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Role</p>
                          <p className="font-medium">{formatRoleName(role)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-background/80 backdrop-blur-sm border">
                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                          <Check className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          <p className="font-medium text-emerald-600">Active</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-background/80 backdrop-blur-sm border">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <Mail className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="font-medium text-sm truncate max-w-[150px]">{email}</p>
                        </div>
                      </div>
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

                  {/* Tips Card */}
                  <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Profile Tips</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Add a photo</span> — Helps colleagues identify you quickly.
                      </p>
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Set display name</span> — Choose how you appear in notifications.
                      </p>
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Add phone number</span> — Makes it easier for team members to reach you.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
