/**
 * Personal Information Section Component
 * Displays tenant's personal information (read-only)
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { TenantProfile } from '@/types/tenant-portal';

interface PersonalInfoSectionProps {
  profile: TenantProfile;
}

export function PersonalInfoSection({ profile }: PersonalInfoSectionProps) {
  const { tenant } = profile;

  return (
    <Card data-testid="card-personal-info">
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertDescription>
            This information is read-only. To make changes, please contact property management.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Full Name</label>
            <p className="text-base font-medium mt-1">
              {tenant.firstName} {tenant.lastName}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <p className="text-base font-medium mt-1">
              <a href={`mailto:${tenant.email}`} className="text-primary hover:underline">
                {tenant.email}
              </a>
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Phone</label>
            <p className="text-base font-medium mt-1">
              <a href={`tel:${tenant.phone}`} className="text-primary hover:underline">
                {tenant.phone}
              </a>
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
            <p className="text-base font-medium mt-1">
              {new Date(tenant.dateOfBirth).toLocaleDateString('en-AE', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">National ID</label>
            <p className="text-base font-medium mt-1">****{tenant.nationalId.slice(-4)}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Emergency Contact</label>
            <p className="text-base font-medium mt-1">{tenant.emergencyContactName}</p>
            <p className="text-sm text-muted-foreground mt-1">
              <a href={`tel:${tenant.emergencyContactPhone}`} className="text-primary hover:underline">
                {tenant.emergencyContactPhone}
              </a>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
