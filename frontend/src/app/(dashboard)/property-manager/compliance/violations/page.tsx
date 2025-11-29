'use client';

/**
 * Violations List Page
 * Story 7.3: Compliance and Inspection Tracking
 *
 * AC #32: Record and track violations
 * AC #33: Track fines and resolutions
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Loader2,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Pencil,
  FileWarning,
  Building2,
  Calendar,
  DollarSign,
} from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

import { complianceService } from '@/services/compliance.service';
import {
  FineStatus,
  type ViolationListItem,
  getFineStatusColor,
  getFineStatusLabel,
} from '@/types/compliance';

export default function ViolationsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [violations, setViolations] = useState<ViolationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFineStatus, setSelectedFineStatus] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Load violations
  const loadViolations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await complianceService.getViolations({
        fineStatus: selectedFineStatus !== 'all' ? (selectedFineStatus as FineStatus) : undefined,
        page,
        size: 20,
      });

      setViolations(response.data?.content || []);
      setTotalPages(response.data?.totalPages || 0);
      setTotalElements(response.data?.totalElements || 0);
    } catch (error) {
      console.error('Failed to load violations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load violations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedFineStatus, page, toast]);

  useEffect(() => {
    loadViolations();
  }, [loadViolations]);

  // Handle refresh
  const handleRefresh = () => {
    loadViolations();
  };

  // Get fine status badge
  const getFineStatusBadge = (status: FineStatus) => {
    const colorClass = getFineStatusColor(status);
    return (
      <Badge className={colorClass}>
        {getFineStatusLabel(status)}
      </Badge>
    );
  };

  // Format date
  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-6" data-testid="violations-page">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/property-manager/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/property-manager/compliance">Compliance</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Violations</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="violations-page-title">
            Violations
          </h1>
          <p className="text-muted-foreground">
            {totalElements} violation{totalElements !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => router.push('/property-manager/compliance/violations/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Record Violation
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Fine Status Filter */}
            <Select value={selectedFineStatus} onValueChange={(value) => { setSelectedFineStatus(value); setPage(0); }}>
              <SelectTrigger className="w-[180px]" data-testid="violation-fine-status-filter">
                <SelectValue placeholder="Fine Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.values(FineStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {getFineStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Violations Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : violations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileWarning className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-semibold mb-1">No violations found</h3>
              <p className="text-sm mb-4">
                {selectedFineStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No violations have been recorded'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Violation #</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Violation Date</TableHead>
                    <TableHead>Fine Amount</TableHead>
                    <TableHead>Fine Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {violations.map((violation) => (
                    <TableRow
                      key={violation.id}
                      className="cursor-pointer hover:bg-muted/50"
                      data-testid={`violation-row-${violation.id}`}
                      onClick={() => router.push(`/property-manager/compliance/violations/${violation.id}`)}
                    >
                      <TableCell className="font-mono text-sm">
                        <Link
                          href={`/property-manager/compliance/violations/${violation.id}`}
                          className="hover:underline text-primary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {violation.violationNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{violation.propertyName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{violation.requirementName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(violation.violationDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{formatCurrency(violation.fineAmount)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getFineStatusBadge(violation.fineStatus)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/property-manager/compliance/violations/${violation.id}`);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/property-manager/compliance/violations/${violation.id}/edit`);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
