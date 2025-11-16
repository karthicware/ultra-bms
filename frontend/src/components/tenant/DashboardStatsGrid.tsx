/**
 * Dashboard Stats Grid Component
 * Displays key metrics: outstanding balance, next payment, open requests, upcoming bookings
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import type { DashboardStats } from '@/types/tenant-portal';

interface DashboardStatsGridProps {
  stats: DashboardStats;
}

export function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Outstanding Balance */}
      <Card data-testid="card-outstanding-balance">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(stats.outstandingBalance)}
          </div>
        </CardContent>
      </Card>

      {/* Next Payment Due */}
      <Card data-testid="card-next-payment">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Next Payment Due</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.nextPaymentDue ? (
            <>
              <div className="text-lg font-semibold">
                {new Date(stats.nextPaymentDue.date).toLocaleDateString('en-AE', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatCurrency(stats.nextPaymentDue.amount)}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No upcoming payments</div>
          )}
        </CardContent>
      </Card>

      {/* Open Maintenance Requests */}
      <Link href="/tenant/requests?filter=open">
        <Card data-testid="card-open-requests" className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openRequestsCount}</div>
            <div className="text-xs text-muted-foreground">🔧 Maintenance requests</div>
          </CardContent>
        </Card>
      </Link>

      {/* Upcoming Bookings */}
      <Link href="/tenant/amenities">
        <Card data-testid="card-upcoming-bookings" className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingBookingsCount}</div>
            <div className="text-xs text-muted-foreground">🏊 Amenity bookings</div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
