'use client';

/**
 * Expiring Leases Page
 * Story 3.6: Tenant Lease Extension and Renewal (AC: #1, #2)
 *
 * Displays list of expiring leases with filtering and ability to extend
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CalendarClock,
  AlertTriangle,
  AlertCircle,
  Clock,
  FileText,
  Building2,
  Phone,
  Mail,
  ArrowRight,
} from 'lucide-react';

import { getExpiringLeases } from '@/services/lease.service';
import { getProperties } from '@/services/tenant.service';
import type { ExpiringLease, ExpiringLeasesFilters } from '@/types/lease';
import type { Property } from '@/types';
import { getExpiryUrgencyLevel } from '@/lib/validations/lease';

/**
 * Get urgency badge variant
 */
function getUrgencyBadge(daysRemaining: number) {
  const level = getExpiryUrgencyLevel(daysRemaining);

  switch (level) {
    case 'critical':
      return {
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        icon: AlertCircle,
        label: 'Critical',
      };
    case 'urgent':
      return {
        variant: 'default' as const,
        className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
        icon: AlertTriangle,
        label: 'Urgent',
      };
    case 'warning':
      return {
        variant: 'default' as const,
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        icon: Clock,
        label: 'Warning',
      };
    default:
      return {
        variant: 'secondary' as const,
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        icon: CalendarClock,
        label: 'Normal',
      };
  }
}

/**
 * Expiring Lease Row Component
 */
function ExpiringLeaseRow({
  lease,
  onExtend,
}: {
  lease: ExpiringLease;
  onExtend: (tenantId: string) => void;
}) {
  const urgency = getUrgencyBadge(lease.daysRemaining);
  const UrgencyIcon = urgency.icon;

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{lease.tenantName}</span>
          <span className="text-xs text-muted-foreground font-mono">{lease.tenantNumber}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{lease.propertyName}</span>
          <span className="text-sm text-muted-foreground">Unit {lease.unitNumber}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{lease.email}</span>
        </div>
        {lease.phone && (
          <div className="flex items-center gap-2 mt-1">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{lease.phone}</span>
          </div>
        )}
      </TableCell>
      <TableCell>
        <span className="font-medium">
          AED {lease.currentRent?.toLocaleString() ?? 'N/A'}
        </span>
      </TableCell>
      <TableCell>
        <span className="font-medium">{format(new Date(lease.leaseEndDate), 'dd MMM yyyy')}</span>
      </TableCell>
      <TableCell>
        <Badge variant={urgency.variant} className={urgency.className}>
          <UrgencyIcon className="h-3 w-3 mr-1" />
          {lease.daysRemaining} days
        </Badge>
      </TableCell>
      <TableCell>
        {lease.pendingRenewalRequest ? (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Renewal Requested
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-50 text-gray-600">
            No Request
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          onClick={() => onExtend(lease.tenantId)}
          className="gap-1"
        >
          <FileText className="h-4 w-4" />
          Extend
          <ArrowRight className="h-3 w-3" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

/**
 * Lease Table Component
 */
function LeaseTable({
  leases,
  onExtend,
  emptyMessage,
}: {
  leases: ExpiringLease[];
  onExtend: (tenantId: string) => void;
  emptyMessage: string;
}) {
  if (leases.length === 0) {
    return (
      <div className="p-8 text-center">
        <CalendarClock className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tenant</TableHead>
            <TableHead>Property / Unit</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Monthly Rent</TableHead>
            <TableHead>Lease End</TableHead>
            <TableHead>Days Left</TableHead>
            <TableHead>Renewal Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leases.map((lease) => (
            <ExpiringLeaseRow key={lease.tenantId} lease={lease} onExtend={onExtend} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Main Expiring Leases Page
 */
export default function ExpiringLeasesPage() {
  const router = useRouter();

  // State
  const [expiringLeases, setExpiringLeases] = useState<{
    expiring14Days: ExpiringLease[];
    expiring30Days: ExpiringLease[];
    expiring60Days: ExpiringLease[];
    counts: { expiring14Days: number; expiring30Days: number; expiring60Days: number };
  } | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const filters: ExpiringLeasesFilters = selectedPropertyId
        ? { propertyId: selectedPropertyId }
        : {};

      const [leasesData, propertiesData] = await Promise.all([
        getExpiringLeases(filters),
        getProperties(),
      ]);

      setExpiringLeases(leasesData);
      setProperties(propertiesData);
    } catch (error) {
      console.error('Failed to fetch expiring leases:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
  const handleExtendLease = (tenantId: string) => {
    router.push(`/leases/extensions/${tenantId}`);
  };

  const handlePropertyFilter = (value: string) => {
    setSelectedPropertyId(value === 'all' ? '' : value);
  };

  // Calculate total counts
  const totalExpiring =
    (expiringLeases?.counts.expiring14Days ?? 0) +
    (expiringLeases?.counts.expiring30Days ?? 0) +
    (expiringLeases?.counts.expiring60Days ?? 0);

  // Get all leases combined for "All" tab
  const allLeases = [
    ...(expiringLeases?.expiring14Days ?? []),
    ...(expiringLeases?.expiring30Days ?? []),
    ...(expiringLeases?.expiring60Days ?? []),
  ].sort((a, b) => a.daysRemaining - b.daysRemaining);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarClock className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Expiring Leases</h1>
            <p className="text-muted-foreground">
              Manage lease extensions for tenants with expiring leases
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Critical (≤14 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold text-red-700 dark:text-red-400">
                {expiringLeases?.counts.expiring14Days ?? 0}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Urgent (≤30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">
                {expiringLeases?.counts.expiring30Days ?? 0}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Warning (≤60 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">
                {expiringLeases?.counts.expiring60Days ?? 0}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Total Expiring
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{totalExpiring}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Critical Alert */}
      {!isLoading && (expiringLeases?.counts.expiring14Days ?? 0) > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Immediate Action Required</AlertTitle>
          <AlertDescription>
            There are {expiringLeases?.counts.expiring14Days} leases expiring within 14 days.
            Please review and process extensions urgently.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>Filter expiring leases by property</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedPropertyId || 'all'} onValueChange={handlePropertyFilter}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="All Properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expiring Leases Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Expiring Leases</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b px-4">
                <TabsList className="bg-transparent h-12">
                  <TabsTrigger value="all" className="data-[state=active]:bg-muted">
                    All ({totalExpiring})
                  </TabsTrigger>
                  <TabsTrigger
                    value="critical"
                    className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700"
                  >
                    Critical ({expiringLeases?.counts.expiring14Days ?? 0})
                  </TabsTrigger>
                  <TabsTrigger
                    value="urgent"
                    className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
                  >
                    Urgent ({expiringLeases?.counts.expiring30Days ?? 0})
                  </TabsTrigger>
                  <TabsTrigger
                    value="warning"
                    className="data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-700"
                  >
                    Warning ({expiringLeases?.counts.expiring60Days ?? 0})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="mt-0">
                <LeaseTable
                  leases={allLeases}
                  onExtend={handleExtendLease}
                  emptyMessage="No expiring leases found"
                />
              </TabsContent>

              <TabsContent value="critical" className="mt-0">
                <LeaseTable
                  leases={expiringLeases?.expiring14Days ?? []}
                  onExtend={handleExtendLease}
                  emptyMessage="No leases expiring within 14 days"
                />
              </TabsContent>

              <TabsContent value="urgent" className="mt-0">
                <LeaseTable
                  leases={expiringLeases?.expiring30Days ?? []}
                  onExtend={handleExtendLease}
                  emptyMessage="No leases expiring within 30 days"
                />
              </TabsContent>

              <TabsContent value="warning" className="mt-0">
                <LeaseTable
                  leases={expiringLeases?.expiring60Days ?? []}
                  onExtend={handleExtendLease}
                  emptyMessage="No leases expiring within 60 days"
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
