'use client';

/**
 * PDC Dashboard Page
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #6: PDC Dashboard showing KPIs and lists
 * AC #7: Dashboard API integration
 * Updated: Redesigned with neutral styling and improved layout
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
import { formatPDCCurrency, PDCStatus } from '@/types/pdc';
import {
  Plus,
  Clock,
  Building2,
  AlertTriangle,
  ArrowRight,
  Eye,
  CheckCircle2,
  XCircle,
  ListFilter,
  Calendar,
  CreditCardIcon,
  ArrowUpRight,
  Wallet
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
      <div className="container mx-auto max-w-7xl p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load PDC dashboard. Please try again.
            <Button variant="link" onClick={() => refetch()} className="ml-2 text-destructive-foreground font-bold">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center hidden sm:flex">
             <CreditCardIcon className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">PDC Management</h1>
            <p className="text-muted-foreground">
              Overview of post-dated cheques and financial instruments
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/pdc/list">
              <ListFilter className="mr-2 h-4 w-4" />
              View All
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
            <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                <Clock className="h-4 w-4 text-foreground" />
            </div>
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
            <CardTitle className="text-sm font-medium">Deposited (Pending)</CardTitle>
            <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-foreground" />
            </div>
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
            <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-foreground" />
            </div>
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
                  Total value of uncashed PDCs
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recently Bounced */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recently Bounced</CardTitle>
            <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-7 w-12 mb-1" />
                <Skeleton className="h-4 w-20" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-destructive">
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
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Upcoming PDCs */}
        <Card className="flex flex-col h-full">
          <CardHeader className="bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming PDCs
                </CardTitle>
                <CardDescription>
                  Due within the next 30 days
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => handleViewAllWithStatus(PDCStatus.DUE)}>
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : dashboard?.upcomingPDCs && dashboard.upcomingPDCs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-transparent hover:bg-transparent">
                    <TableHead className="pl-6">Cheque No.</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.upcomingPDCs.slice(0, 5).map((pdc) => (
                    <TableRow key={pdc.id}>
                      <TableCell className="pl-6 font-medium">
                        {pdc.chequeNumber}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate">{pdc.tenantName}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPDCCurrency(pdc.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(pdc.chequeDate), 'MMM dd')}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => handleDeposit(pdc.id)}
                        >
                          <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
                          Deposit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mb-3 opacity-20" />
                <p>No upcoming PDCs</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recently Deposited PDCs */}
        <Card className="flex flex-col h-full">
          <CardHeader className="bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Recently Deposited
                </CardTitle>
                <CardDescription>
                  Awaiting bank clearance
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => handleViewAllWithStatus(PDCStatus.DEPOSITED)}>
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : dashboard?.recentlyDepositedPDCs && dashboard.recentlyDepositedPDCs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-transparent hover:bg-transparent">
                    <TableHead className="pl-6">Cheque No.</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.recentlyDepositedPDCs.slice(0, 5).map((pdc) => (
                    <TableRow key={pdc.id}>
                      <TableCell className="pl-6 font-medium">
                        {pdc.chequeNumber}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate">{pdc.tenantName}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPDCCurrency(pdc.amount)}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                            <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                            title="Mark as Cleared"
                            onClick={() => handleClear(pdc.id)}
                            >
                            <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-destructive hover:bg-destructive/10"
                            title="Mark as Bounced"
                            onClick={() => handleBounce(pdc.id)}
                            >
                            <XCircle className="h-4 w-4" />
                            </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mb-3 opacity-20" />
                <p>No pending deposits</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links - Simplified */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-auto py-4 justify-start px-4 gap-3 hover:border-primary/50 hover:bg-muted/50 transition-all" asChild>
            <Link href="/pdc/new">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
                <div className="font-semibold">Register PDC</div>
                <div className="text-xs text-muted-foreground">Add new cheques</div>
            </div>
            </Link>
        </Button>

        <Button variant="outline" className="h-auto py-4 justify-start px-4 gap-3 hover:border-destructive/50 hover:bg-destructive/5 transition-all" asChild>
            <Link href="/pdc/list?status=BOUNCED">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="text-left">
                <div className="font-semibold">Bounced Cheques</div>
                <div className="text-xs text-muted-foreground">Action required</div>
            </div>
            </Link>
        </Button>

        <Button variant="outline" className="h-auto py-4 justify-start px-4 gap-3 hover:border-primary/50 hover:bg-muted/50 transition-all" asChild>
            <Link href="/pdc/withdrawals">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
                <div className="font-semibold">Withdrawal History</div>
                <div className="text-xs text-muted-foreground">View past actions</div>
            </div>
            </Link>
        </Button>

         <Button variant="outline" className="h-auto py-4 justify-start px-4 gap-3 hover:border-primary/50 hover:bg-muted/50 transition-all" asChild>
            <Link href="/pdc/list">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ListFilter className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
                <div className="font-semibold">All Records</div>
                <div className="text-xs text-muted-foreground">Search and filter</div>
            </div>
            </Link>
        </Button>
      </div>
    </div>
  );
}