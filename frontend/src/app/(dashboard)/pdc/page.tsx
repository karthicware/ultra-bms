'use client';

/**
 * PDC Dashboard Page
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #6: PDC Dashboard showing KPIs and lists
 * AC #7: Dashboard API integration
 */

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { usePDCDashboard } from '@/hooks/usePDCs';
// PDCStatusBadge imported but used in child components
import { formatPDCCurrency, PDCStatus } from '@/types/pdc';
import {
  Plus,
  Clock,
  Building2,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Eye,
  CheckCircle,
  XCircle,
  ListFilter,
  Calendar,
} from 'lucide-react';

export default function PDCDashboardPage() {
  const router = useRouter();
  const { data: dashboard, isLoading, error, refetch } = usePDCDashboard();

  // Navigate to list page with status filter
  const handleViewAllWithStatus = (status: PDCStatus) => {
    router.push(`/pdc/list?status=${status}`);
  };

  // Navigate to deposit action
  const handleDeposit = (id: string) => {
    router.push(`/pdc/${id}?action=deposit`);
  };

  // Navigate to clear action
  const handleClear = (id: string) => {
    router.push(`/pdc/${id}?action=clear`);
  };

  // Navigate to bounce action
  const handleBounce = (id: string) => {
    router.push(`/pdc/${id}?action=bounce`);
  };

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load PDC dashboard. Please try again.
            <Button variant="link" onClick={() => refetch()} className="ml-2">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="page-pdc-dashboard">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PDC Management</h1>
          <p className="text-muted-foreground">
            Manage post-dated cheques, track deposits, and handle bounced cheques
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/pdc/list">
              <ListFilter className="mr-2 h-4 w-4" />
              View All PDCs
            </Link>
          </Button>
          <Button asChild>
            <Link href="/pdc/new">
              <Plus className="mr-2 h-4 w-4" />
              Register PDC
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Due This Week */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-7 w-16 mb-1" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {dashboard?.pdcsDueThisWeek?.count || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatPDCCurrency(dashboard?.pdcsDueThisWeek?.totalValue || 0)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Deposited */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deposited</CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-7 w-16 mb-1" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {dashboard?.pdcsDeposited?.count || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatPDCCurrency(dashboard?.pdcsDeposited?.totalValue || 0)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Outstanding */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-7 w-28 mb-1" />
                <Skeleton className="h-4 w-20" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatPDCCurrency(dashboard?.totalOutstandingValue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pending collection
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recently Bounced */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recently Bounced</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-7 w-12 mb-1" />
                <Skeleton className="h-4 w-20" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">
                  {dashboard?.recentlyBouncedCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming PDCs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming PDCs
                </CardTitle>
                <CardDescription>
                  PDCs due in the next 30 days
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleViewAllWithStatus(PDCStatus.DUE)}>
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : dashboard?.upcomingPDCs && dashboard.upcomingPDCs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cheque No.</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.upcomingPDCs.slice(0, 5).map((pdc) => (
                    <TableRow key={pdc.id}>
                      <TableCell className="font-medium">
                        {pdc.chequeNumber}
                      </TableCell>
                      <TableCell>{pdc.tenantName}</TableCell>
                      <TableCell className="text-right">
                        {formatPDCCurrency(pdc.amount)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(pdc.chequeDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeposit(pdc.id)}
                        >
                          <Building2 className="mr-1 h-3 w-3" />
                          Deposit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12 mb-3 opacity-50" />
                <p>No upcoming PDCs</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recently Deposited PDCs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Recently Deposited
                </CardTitle>
                <CardDescription>
                  PDCs awaiting clearance confirmation
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleViewAllWithStatus(PDCStatus.DEPOSITED)}>
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : dashboard?.recentlyDepositedPDCs && dashboard.recentlyDepositedPDCs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cheque No.</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.recentlyDepositedPDCs.slice(0, 5).map((pdc) => (
                    <TableRow key={pdc.id}>
                      <TableCell className="font-medium">
                        {pdc.chequeNumber}
                      </TableCell>
                      <TableCell>{pdc.tenantName}</TableCell>
                      <TableCell className="text-right">
                        {formatPDCCurrency(pdc.amount)}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleClear(pdc.id)}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Clear
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleBounce(pdc.id)}
                        >
                          <XCircle className="mr-1 h-3 w-3" />
                          Bounce
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="mx-auto h-12 w-12 mb-3 opacity-50" />
                <p>No deposited PDCs awaiting clearance</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/pdc/new">
                <Plus className="mr-2 h-4 w-4" />
                Register New PDC
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/pdc/list?status=BOUNCED">
                <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                View Bounced PDCs
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/pdc/withdrawals">
                <Eye className="mr-2 h-4 w-4" />
                Withdrawal History
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/pdc/list">
                <ListFilter className="mr-2 h-4 w-4" />
                All PDCs
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
