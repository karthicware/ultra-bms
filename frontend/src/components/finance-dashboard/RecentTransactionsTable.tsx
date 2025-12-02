'use client';

/**
 * Recent Transactions Table Component
 * Story 8.6: Finance Dashboard
 * AC-8: Recent High-Value Transactions table
 * AC-21: All currency values formatted in AED
 * AC-22: All interactive elements have data-testid attributes
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  RecentTransaction,
  TransactionType,
  formatAedCurrency,
  FINANCE_CHART_COLORS,
} from '@/types/finance-dashboard';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface RecentTransactionsTableProps {
  data: RecentTransaction[] | undefined;
  isLoading: boolean;
  threshold?: number;
}

export function RecentTransactionsTable({
  data,
  isLoading,
  threshold = 10000,
}: RecentTransactionsTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card data-testid="recent-transactions-skeleton">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card data-testid="recent-transactions-empty">
        <CardHeader>
          <CardTitle>Recent High-Value Transactions</CardTitle>
          <CardDescription>
            Transactions above {formatAedCurrency(threshold)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center text-muted-foreground">
            No recent high-value transactions
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleViewDetails = (transaction: RecentTransaction) => {
    if (transaction.type === TransactionType.INCOME) {
      router.push(`/finance/invoices/${transaction.id}`);
    } else {
      router.push(`/finance/expenses/${transaction.id}`);
    }
  };

  const handleViewAll = () => {
    router.push(`/finance/transactions?minAmount=${threshold}`);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <Card data-testid="recent-transactions-table">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent High-Value Transactions</CardTitle>
          <CardDescription>
            Last {data.length} transactions above {formatAedCurrency(threshold)}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewAll}
          data-testid="recent-transactions-view-all"
        >
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <Table data-testid="recent-transactions-data">
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((transaction) => {
              const isIncome = transaction.type === TransactionType.INCOME;

              return (
                <TableRow
                  key={transaction.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleViewDetails(transaction)}
                  data-testid={`recent-transaction-row-${transaction.id}`}
                >
                  <TableCell className="text-sm">
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        'gap-1',
                        isIncome
                          ? 'border-green-500 text-green-600 bg-green-50'
                          : 'border-red-500 text-red-600 bg-red-50'
                      )}
                      data-testid={`recent-transaction-type-${transaction.id}`}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {isIncome ? 'Income' : 'Expense'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    <div className="truncate" title={transaction.description}>
                      {transaction.description}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {transaction.referenceNumber}
                    </div>
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-medium',
                      isIncome ? 'text-green-600' : 'text-red-600'
                    )}
                    data-testid={`recent-transaction-amount-${transaction.id}`}
                  >
                    {isIncome ? '+' : '-'}{formatAedCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {transaction.category}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(transaction);
                      }}
                      data-testid={`recent-transaction-view-${transaction.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default RecentTransactionsTable;
