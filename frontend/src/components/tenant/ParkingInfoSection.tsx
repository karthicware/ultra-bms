/**
 * Parking Information Section Component
 * Displays tenant's parking allocation details (read-only)
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { TenantProfile } from '@/types/tenant-portal';

interface ParkingInfoSectionProps {
  profile: TenantProfile;
}

export function ParkingInfoSection({ profile }: ParkingInfoSectionProps) {
  const { parking } = profile;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (parking.spots === 0) {
    return (
      <Card data-testid="card-parking-info">
        <CardHeader>
          <CardTitle>Parking Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No parking allocated to this unit.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-parking-info">
      <CardHeader>
        <CardTitle>Parking Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Number of Spots</label>
            <p className="text-base font-medium mt-1">{parking.spots}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Spot Numbers</label>
            <p className="text-base font-medium mt-1">{parking.spotNumbers || 'Not assigned'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Fee per Spot</label>
            <p className="text-base font-medium mt-1">{formatCurrency(parking.feePerSpot)}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Total Parking Fee</label>
            <p className="text-base font-medium mt-1">{formatCurrency(parking.totalFee)}</p>
          </div>
        </div>

        {parking.mulkiyaDocumentPath && (
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-2">
              Mulkiya Document
            </label>
            <Button
              onClick={() => window.open('/api/v1/tenant/parking/mulkiya/download', '_blank')}
              data-testid="btn-download-mulkiya"
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Mulkiya
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
