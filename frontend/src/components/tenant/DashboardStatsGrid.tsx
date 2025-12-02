/**
 * Dashboard Stats Grid Component
 * Displays key metrics: outstanding balance, next payment, open requests, upcoming bookings
 * Upgraded to use shadcn-studio statistics-card-03 pattern
 */
import Link from 'next/link';
import { Wallet, Calendar, Wrench, CalendarDays } from 'lucide-react';
import StatisticsCard from '@/components/shadcn-studio/blocks/statistics-card-03';
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-AE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Determine balance trend (down is good for balance)
  const balanceTrend = stats.outstandingBalance > 0 ? 'down' : 'up';
  const balanceIconClass = stats.outstandingBalance > 0
    ? 'bg-red-500/10 text-red-500'
    : 'bg-green-500/10 text-green-500';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Outstanding Balance */}
      <div data-testid="card-outstanding-balance">
        <StatisticsCard
          icon={<Wallet />}
          value={formatCurrency(stats.outstandingBalance)}
          title="Outstanding Balance"
          trend={balanceTrend}
          changePercentage={stats.outstandingBalance > 0 ? 'Due' : 'Paid'}
          badgeContent="Account Status"
          iconClassName={balanceIconClass}
        />
      </div>

      {/* Next Payment Due */}
      <div data-testid="card-next-payment">
        <StatisticsCard
          icon={<Calendar />}
          value={stats.nextPaymentDue ? formatDate(stats.nextPaymentDue.date) : 'None'}
          title="Next Payment Due"
          trend="up"
          changePercentage={stats.nextPaymentDue ? formatCurrency(stats.nextPaymentDue.amount) : 'No payments'}
          badgeContent="Payment Schedule"
          iconClassName="bg-blue-500/10 text-blue-500"
        />
      </div>

      {/* Open Maintenance Requests */}
      <Link href="/tenant/requests?filter=open">
        <div data-testid="card-open-requests" className="cursor-pointer transition-transform hover:scale-[1.02]">
          <StatisticsCard
            icon={<Wrench />}
            value={String(stats.openRequestsCount)}
            title="Open Requests"
            trend={stats.openRequestsCount > 0 ? 'up' : 'down'}
            changePercentage={stats.openRequestsCount > 0 ? 'Active' : 'None'}
            badgeContent="Maintenance"
            iconClassName="bg-orange-500/10 text-orange-500"
          />
        </div>
      </Link>

      {/* Upcoming Bookings */}
      <Link href="/tenant/amenities">
        <div data-testid="card-upcoming-bookings" className="cursor-pointer transition-transform hover:scale-[1.02]">
          <StatisticsCard
            icon={<CalendarDays />}
            value={String(stats.upcomingBookingsCount)}
            title="Upcoming Bookings"
            trend={stats.upcomingBookingsCount > 0 ? 'up' : 'down'}
            changePercentage={stats.upcomingBookingsCount > 0 ? 'Scheduled' : 'None'}
            badgeContent="Amenities"
            iconClassName="bg-purple-500/10 text-purple-500"
          />
        </div>
      </Link>
    </div>
  );
}
