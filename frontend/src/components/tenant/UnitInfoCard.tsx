/**
 * Unit Information Card Component
 * Displays current unit details and lease information
 * Upgraded to use improved visual hierarchy with lucide icons and badges
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  MapPin,
  Home,
  Layers,
  BedDouble,
  Bath,
  Calendar,
  Clock,
} from 'lucide-react';
import type { UnitInfo } from '@/types/tenant-portal';

interface UnitInfoCardProps {
  unitInfo: UnitInfo;
}

export function UnitInfoCard({ unitInfo }: UnitInfoCardProps) {
  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'EXPIRING_SOON':
        return 'secondary';
      case 'EXPIRED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-600';
      case 'EXPIRING_SOON':
        return 'bg-yellow-500/10 text-yellow-600';
      case 'EXPIRED':
        return 'bg-red-500/10 text-red-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-AE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Card data-testid="card-unit-info" className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 rounded-lg">
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">Your Unit</CardTitle>
            <p className="text-sm text-muted-foreground">{unitInfo.propertyName}</p>
          </div>
        </div>
        <Badge className={getStatusColor(unitInfo.leaseStatus)}>
          {unitInfo.leaseStatus.replace('_', ' ')}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Property Info */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Address</p>
                <p className="text-sm text-muted-foreground">{unitInfo.address}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Home className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Unit</p>
                  <p className="text-sm font-medium">{unitInfo.unitNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Floor</p>
                  <p className="text-sm font-medium">{unitInfo.floor}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <BedDouble className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bedrooms</p>
                  <p className="text-sm font-medium">{unitInfo.bedrooms}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Bath className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bathrooms</p>
                  <p className="text-sm font-medium">{unitInfo.bathrooms}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="md:hidden" />

          {/* Lease Info */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Lease Period</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(unitInfo.leaseStartDate)} — {formatDate(unitInfo.leaseEndDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Days Remaining</p>
                <p className="text-2xl font-bold">{unitInfo.daysRemaining}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
