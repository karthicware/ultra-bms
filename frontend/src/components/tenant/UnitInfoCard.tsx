 
/**
 * Unit Information Card Component
 * Displays current unit details and lease information
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { differenceInDays } from 'date-fns';
import type { UnitInfo } from '@/types/tenant-portal';

interface UnitInfoCardProps {
  unitInfo: UnitInfo;
}

export function UnitInfoCard({ unitInfo }: UnitInfoCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'EXPIRING_SOON':
        return 'bg-yellow-500';
      case 'EXPIRED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card data-testid="card-unit-info" className="col-span-full">
      <CardHeader>
        <CardTitle>Your Unit</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Property Info */}
          <div>
            <h3 className="font-semibold text-lg mb-2">{unitInfo.propertyName}</h3>
            <p className="text-sm text-muted-foreground mb-4">{unitInfo.address}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Unit:</span>
                <p className="font-medium">
                  {unitInfo.unitNumber}, Floor {unitInfo.floor}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Layout:</span>
                <p className="font-medium">
                  🛏️ {unitInfo.bedrooms} Bed, 🚿 {unitInfo.bathrooms} Bath
                </p>
              </div>
            </div>
          </div>

          {/* Lease Info */}
          <div>
            <div className="mb-4">
              <Badge className={getStatusColor(unitInfo.leaseStatus)}>
                {unitInfo.leaseStatus.replace('_', ' ')}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Lease Period:</span>
                <p className="font-medium">
                  {new Date(unitInfo.leaseStartDate).toLocaleDateString('en-AE', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                  {' - '}
                  {new Date(unitInfo.leaseEndDate).toLocaleDateString('en-AE', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Days Remaining:</span>
                <p className="font-medium text-lg">
                  {unitInfo.daysRemaining} days
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
