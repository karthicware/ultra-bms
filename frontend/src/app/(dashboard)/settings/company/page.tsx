'use client';

/**
 * Company Profile Settings Page
 * Story 2.8: Company Profile Settings
 *
 * Allows ADMIN/SUPER_ADMIN to manage company profile information.
 * FINANCE_MANAGER/PROPERTY_MANAGER have read-only access.
 */

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Building2, Upload, Trash2, ImageIcon, AlertCircle, Check, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { usePermission } from '@/contexts/auth-context';
import {
  companyProfileSchema,
  companyProfileDefaults,
  toCompanyProfileFormData,
  type CompanyProfileFormData,
} from '@/lib/validations/company-profile';
import {
  getCompanyProfile,
  saveCompanyProfile,
  uploadCompanyLogo,
  deleteCompanyLogo,
} from '@/services/company-profile.service';
import {
  validateLogoFile,
  formatTRNDisplay,
  formatPhoneDisplay,
  MAX_LOGO_SIZE_MB,
} from '@/types/company-profile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// UAE and GCC countries for country dropdown
const COUNTRIES = [
  'United Arab Emirates',
  'Saudi Arabia',
  'Kuwait',
  'Qatar',
  'Bahrain',
  'Oman',
  // Add more as needed
];

export default function CompanyProfilePage() {
  const { hasRole } = usePermission();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [profileExists, setProfileExists] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<{ by: string | null; at: string | null }>({
    by: null,
    at: null,
  });
  const [mounted, setMounted] = useState(false);

  // Check if user has write access (ADMIN or SUPER_ADMIN)
  const canEdit = hasRole('ADMIN') || hasRole('SUPER_ADMIN');

  const form = useForm<CompanyProfileFormData>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: companyProfileDefaults,
  });

  // Load existing profile on mount
  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const profile = await getCompanyProfile();

      if (profile) {
        setProfileExists(true);
        form.reset(toCompanyProfileFormData(profile));
        setLogoUrl(profile.logoUrl);
        setLastUpdated({
          by: profile.updatedByName,
          at: profile.updatedAt,
        });
      } else {
        setProfileExists(false);
        form.reset(companyProfileDefaults);
      }
    } catch (error) {
      console.error('Failed to load company profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load company profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  useEffect(() => {
    setMounted(true);
    loadProfile();
  }, [loadProfile]);

  // Handle form submission
  const onSubmit = async (data: CompanyProfileFormData) => {
    if (!canEdit) return;

    try {
      setIsSaving(true);
      const response = await saveCompanyProfile(data);

      setProfileExists(true);
      setLastUpdated({
        by: response.updatedByName,
        at: response.updatedAt,
      });

      toast({
        title: 'Success',
        description: 'Company profile saved successfully.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to save company profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save company profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle logo upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) return;

    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const error = validateLogoFile(file);
    if (error) {
      toast({
        title: 'Invalid File',
        description: error,
        variant: 'destructive',
      });
      return;
    }

    // Ensure profile exists before uploading logo
    if (!profileExists) {
      toast({
        title: 'Profile Required',
        description: 'Please save the company profile before uploading a logo.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploadingLogo(true);
      const response = await uploadCompanyLogo(file);
      setLogoUrl(response.logoUrl);

      toast({
        title: 'Success',
        description: 'Logo uploaded successfully.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to upload logo:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload logo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingLogo(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Handle logo deletion
  const handleDeleteLogo = async () => {
    if (!canEdit || !logoUrl) return;

    try {
      setIsDeletingLogo(true);
      await deleteCompanyLogo();
      setLogoUrl(null);

      toast({
        title: 'Success',
        description: 'Logo deleted successfully.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to delete logo:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete logo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingLogo(false);
    }
  };

  // Show loading skeleton during SSR/hydration
  if (!mounted) {
    return (
      <div className="container max-w-3xl py-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="h-6 w-20 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-[600px] bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8">
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
          <Building2 className="h-8 w-8" />
          Company Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your organization details for invoices, documents, and official communications
        </p>
      </div>

      {/* Read-only notice for non-admins */}
      {!canEdit && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Read-Only Access</AlertTitle>
          <AlertDescription>
            You have view-only access to company profile settings. Contact an administrator to make changes.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Company Logo Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Company Logo</CardTitle>
              <CardDescription>
                Upload your company logo for invoices and documents. Accepts PNG or JPG up to {MAX_LOGO_SIZE_MB}MB.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                {/* Logo preview */}
                <div className="relative h-32 w-32 rounded-lg border-2 border-dashed bg-muted flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="Company logo"
                      fill
                      className="object-contain p-2"
                      data-testid="company-logo-preview"
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>

                {/* Upload/Delete buttons */}
                {canEdit && (
                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor="logo-upload"
                      className="cursor-pointer"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isUploadingLogo || !profileExists}
                        asChild
                      >
                        <span>
                          {isUploadingLogo ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          {logoUrl ? 'Change Logo' : 'Upload Logo'}
                        </span>
                      </Button>
                    </Label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      className="sr-only"
                      onChange={handleLogoUpload}
                      disabled={isUploadingLogo || !profileExists}
                      data-testid="logo-file-input"
                    />

                    {logoUrl && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteLogo}
                        disabled={isDeletingLogo}
                        data-testid="delete-logo-button"
                      >
                        {isDeletingLogo ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Remove Logo
                      </Button>
                    )}

                    {!profileExists && (
                      <p className="text-xs text-muted-foreground">
                        Save profile first to upload logo
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Company Details Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
              <CardDescription>
                Your official company information used in legal documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Legal Company Name */}
              <div className="space-y-2">
                <Label htmlFor="legalCompanyName">Legal Company Name *</Label>
                <Input
                  id="legalCompanyName"
                  {...form.register('legalCompanyName')}
                  placeholder="e.g., Ultra Building Management LLC"
                  disabled={!canEdit}
                  data-testid="input-legal-company-name"
                />
                {form.formState.errors.legalCompanyName && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.legalCompanyName.message}
                  </p>
                )}
              </div>

              {/* Company Address */}
              <div className="space-y-2">
                <Label htmlFor="companyAddress">Company Address *</Label>
                <Textarea
                  id="companyAddress"
                  {...form.register('companyAddress')}
                  placeholder="Enter your full company address"
                  rows={3}
                  disabled={!canEdit}
                  data-testid="input-company-address"
                />
                {form.formState.errors.companyAddress && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.companyAddress.message}
                  </p>
                )}
              </div>

              {/* City and Country */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    {...form.register('city')}
                    placeholder="e.g., Dubai"
                    disabled={!canEdit}
                    data-testid="input-city"
                  />
                  {form.formState.errors.city && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.city.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select
                    value={form.watch('country')}
                    onValueChange={(value) => form.setValue('country', value)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger id="country" data-testid="select-country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.country && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.country.message}
                    </p>
                  )}
                </div>
              </div>

              {/* TRN */}
              <div className="space-y-2">
                <Label htmlFor="trn">Tax Registration Number (TRN) *</Label>
                <Input
                  id="trn"
                  {...form.register('trn')}
                  placeholder="e.g., 100123456789012"
                  maxLength={15}
                  disabled={!canEdit}
                  data-testid="input-trn"
                />
                <p className="text-xs text-muted-foreground">
                  15-digit UAE TRN starting with 100
                </p>
                {form.formState.errors.trn && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.trn.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Official contact details for your company
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  {...form.register('phoneNumber')}
                  placeholder="+971XXXXXXXXX"
                  disabled={!canEdit}
                  data-testid="input-phone-number"
                />
                <p className="text-xs text-muted-foreground">
                  UAE format: +971 followed by 9 digits
                </p>
                {form.formState.errors.phoneNumber && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.phoneNumber.message}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <Label htmlFor="emailAddress">Email Address *</Label>
                <Input
                  id="emailAddress"
                  type="email"
                  {...form.register('emailAddress')}
                  placeholder="info@company.ae"
                  disabled={!canEdit}
                  data-testid="input-email-address"
                />
                {form.formState.errors.emailAddress && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.emailAddress.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          {canEdit && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {lastUpdated.at && (
                  <>
                    Last updated{' '}
                    {new Date(lastUpdated.at).toLocaleString()}
                    {lastUpdated.by && ` by ${lastUpdated.by}`}
                  </>
                )}
              </div>
              <div className="flex gap-3">
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
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
