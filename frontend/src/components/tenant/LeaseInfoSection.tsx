/**
 * Lease Information Section Component
 * Displays tenant's lease details and rent breakdown (read-only)
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download } from 'lucide-react';
import type { TenantProfile } from '@/types/tenant-portal';

interface LeaseInfoSectionProps {
  profile: TenantProfile;
}

export function LeaseInfoSection({ profile }: LeaseInfoSectionProps) {
  const { lease } = profile;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getLeaseTypeBadgeColor = (leaseType: string) => {
    switch (leaseType) {
      case 'FIXED_TERM':
        return 'bg-blue-500';
      case 'MONTH_TO_MONTH':
        return 'bg-yellow-500';
      case 'YEARLY':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card data-testid="card-lease-info">
      <CardHeader>
        <CardTitle>Lease Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Property Details */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Property</label>
            <p className="text-base font-medium mt-1">{lease.propertyName}</p>
            <p className="text-sm text-muted-foreground">{lease.address}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Unit</label>
            <p className="text-base font-medium mt-1">
              {lease.unitNumber}, Floor {lease.floor}
            </p>
            <p className="text-sm text-muted-foreground">
              {lease.bedrooms} Bed, {lease.bathrooms} Bath
            </p>
          </div>
        </div>

        {/* Lease Terms */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Lease Type</label>
            <div className="mt-1">
              <Badge className={getLeaseTypeBadgeColor(lease.leaseType)}>
                {lease.leaseType.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Duration</label>
            <p className="text-base font-medium mt-1">{lease.duration} months</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Start Date</label>
            <p className="text-base font-medium mt-1">{formatDate(lease.startDate)}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">End Date</label>
            <p className="text-base font-medium mt-1">{formatDate(lease.endDate)}</p>
          </div>
        </div>

        {/* Rent Breakdown */}
        <div>
          <h3 className="text-sm font-medium mb-3">Monthly Rent Breakdown</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Base Rent</TableCell>
                <TableCell className="text-right">{formatCurrency(lease.baseRent)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Service Charge</TableCell>
                <TableCell className="text-right">{formatCurrency(lease.serviceCharge)}</TableCell>
              </TableRow>
              {lease.parkingFee > 0 && (
                <TableRow>
                  <TableCell>Parking Fee</TableCell>
                  <TableCell className="text-right">{formatCurrency(lease.parkingFee)}</TableCell>
                </TableRow>
              )}
              <TableRow className="font-semibold">
                <TableCell>Total Monthly Rent</TableCell>
                <TableCell className="text-right">{formatCurrency(lease.totalMonthlyRent)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Payment Details */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Payment Frequency</label>
            <p className="text-base font-medium mt-1">{lease.paymentFrequency}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Payment Due Date</label>
            <p className="text-base font-medium mt-1">Day {lease.paymentDueDate} of each period</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
            <p className="text-base font-medium mt-1">{lease.paymentMethod}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Security Deposit</label>
            <p className="text-base font-medium mt-1">{formatCurrency(lease.securityDeposit)}</p>
          </div>
        </div>

        {/* Download Lease */}
        <div>
          <Button
            onClick={() => window.open('/api/v1/tenant/lease/download', '_blank')}
            data-testid="btn-download-lease"
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Lease Agreement
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
