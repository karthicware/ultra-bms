'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useTenantProfile } from '@/hooks/useTenantProfile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AccountSettingsSection } from '@/components/tenant/AccountSettingsSection';
import { PersonalInfoSection } from '@/components/tenant/PersonalInfoSection';
import { LeaseInfoSection } from '@/components/tenant/LeaseInfoSection';
import { ParkingInfoSection } from '@/components/tenant/ParkingInfoSection';
import { DocumentRepositorySection } from '@/components/tenant/DocumentRepositorySection';

// Force dynamic rendering for user-specific content
export const dynamic = 'force-dynamic';

/**
 * Tenant Profile Page
 * Displays personal info, lease details, parking, documents, and account settings
 */
export default function TenantProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useTenantProfile();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'TENANT')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || profileLoading) {
    return <ProfileSkeleton />;
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">My Profile</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Contact Banner */}
        <Alert className="mb-6">
          <AlertDescription>
            To update personal or lease information, please contact property management at{' '}
            <a href="mailto:support@ultrabms.com" className="underline">support@ultrabms.com</a>
          </AlertDescription>
        </Alert>

        {/* Profile Tabs */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="lease">Lease</TabsTrigger>
            <TabsTrigger value="parking">Parking</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            {profileLoading ? (
              <ProfileSectionSkeleton />
            ) : profile ? (
              <PersonalInfoSection profile={profile} />
            ) : null}
          </TabsContent>

          <TabsContent value="lease">
            {profileLoading ? (
              <ProfileSectionSkeleton />
            ) : profile ? (
              <LeaseInfoSection profile={profile} />
            ) : null}
          </TabsContent>

          <TabsContent value="parking">
            {profileLoading ? (
              <ProfileSectionSkeleton />
            ) : profile ? (
              <ParkingInfoSection profile={profile} />
            ) : null}
          </TabsContent>

          <TabsContent value="documents">
            {profileLoading ? (
              <ProfileSectionSkeleton />
            ) : profile ? (
              <DocumentRepositorySection profile={profile} />
            ) : null}
          </TabsContent>

          <TabsContent value="settings">
            <AccountSettingsSection />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/**
 * Loading skeleton for profile sections
 */
function ProfileSectionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Skeleton className="h-8 w-32" />
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <Skeleton className="h-64" />
      </main>
    </div>
  );
}
