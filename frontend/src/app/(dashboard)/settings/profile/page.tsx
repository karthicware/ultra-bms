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
import { ArrowLeft, Loader2, User, Upload, Trash2, Camera, Check } from 'lucide-react';
import Link from 'next/link';
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

  // Show loading skeleton during SSR/hydration
  if (!mounted) {
    return (
      <div className="container max-w-2xl py-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="h-6 w-20 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-[500px] bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8" data-testid="profile-settings-page">
      {/* Back navigation */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/settings" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>
        </Button>
      </div>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <User className="h-8 w-8" />
          My Profile
        </h1>
        <p className="text-muted-foreground">
          Customize your profile settings and personal information
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} data-testid="profile-form">
          {/* Avatar Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Profile Photo</CardTitle>
              <CardDescription>
                Upload a profile photo. Accepts PNG or JPG up to {MAX_AVATAR_SIZE_MB}MB.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                {/* Avatar preview */}
                <div className="relative">
                  <Avatar className="h-24 w-24" data-testid="avatar-preview">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt="Profile photo" />
                    ) : null}
                    <AvatarFallback className="text-2xl bg-primary/10">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Upload/Delete buttons */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploadingAvatar}
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
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteAvatar}
                      disabled={isDeletingAvatar}
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
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>
                Your personal information and display preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  {...form.register('displayName')}
                  placeholder={`${firstName} ${lastName}`}
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
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  {...form.register('contactPhone')}
                  placeholder="Enter personal phone number"
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

              {/* Read-only Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={email}
                  disabled
                  className="bg-muted"
                  data-testid="input-email-readonly"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact an administrator if you need to update it.
                </p>
              </div>

              {/* Read-only Role */}
              <div className="space-y-2">
                <Label>Role</Label>
                <div>
                  <Badge variant="secondary" className="text-sm" data-testid="role-badge">
                    {formatRoleName(role)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your role determines access permissions. Contact an administrator to change it.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3">
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
        </form>
      )}
    </div>
  );
}
