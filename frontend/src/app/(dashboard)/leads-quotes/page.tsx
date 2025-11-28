/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Leads & Quotes Dashboard
 * KPIs, sales funnel, and expiring quotations
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { getDashboardMetrics } from '@/services/quotations.service';
import type { QuotationDashboard, QuotationExpiryInfo } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, FileText, CheckCircle, Percent, Clock, AlertTriangle } from 'lucide-react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0 }).format(amount);
};

const getUrgencyColor = (urgency: 'high' | 'medium' | 'low') => {
  switch (urgency) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
  }
};

export default function LeadsQuotesDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [dashboard, setDashboard] = useState<QuotationDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const data = await getDashboardMetrics();
      setDashboard(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard metrics',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return <div>No data available</div>;
  }

  // Prepare sales funnel data for chart
  const funnelData = [
    { name: 'Quotes Issued', value: dashboard.newQuotes, fill: '#3b82f6' },
    { name: 'Quotes Accepted', value: dashboard.quotesConverted, fill: '#10b981' },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leads & Quotations Dashboard</h1>
        <p className="text-muted-foreground">Overview of leads and quotation performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card data-testid="card-kpi-new-quotes">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Quotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.newQuotes}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quotes Converted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.quotesConverted}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card data-testid="card-kpi-conversion-rate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(dashboard.conversionRate ?? 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Accepted / Sent ratio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time to Convert</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(dashboard.avgTimeToConvert ?? 0).toFixed(0)} days</div>
            <p className="text-xs text-muted-foreground">From sent to accepted</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Funnel Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Sales Funnel (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quotes Expiring Soon */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
            Quotes Expiring Soon (Next 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!dashboard.expiringQuotes || dashboard.expiringQuotes.length === 0) ? (
            <p className="text-center py-8 text-muted-foreground">
              No quotations expiring in the next 30 days
            </p>
          ) : (
            <Table data-testid="table-expiring-quotes">
              <TableHeader>
                <TableRow>
                  <TableHead>Lead Name</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Days Remaining</TableHead>
                  <TableHead>Urgency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.expiringQuotes.map((quote) => (
                  <TableRow
                    key={quote.id}
                    className={`cursor-pointer border-l-4 ${getUrgencyColor(quote.urgency)}`}
                    onClick={() => router.push(`/quotations/${quote.id}`)}
                  >
                    <TableCell className="font-medium">{quote.leadName}</TableCell>
                    <TableCell>{quote.propertyName}</TableCell>
                    <TableCell>{format(new Date(quote.validityDate), 'PP')}</TableCell>
                    <TableCell>
                      <span className="font-medium">{quote.daysRemaining} days</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          quote.urgency === 'high'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : quote.urgency === 'medium'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                        }
                      >
                        {quote.urgency.toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
