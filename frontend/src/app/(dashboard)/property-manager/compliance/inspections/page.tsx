'use client';

/**
 * Inspections List Page
 * Story 7.3: Compliance and Inspection Tracking
 *
 * AC #30: Inspection history per schedule with results
 * AC #31: Schedule new inspections
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  ArrowUpDown,
  Loader2,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Calendar,
  ClipboardCheck,
  Building2,
  User,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

import { complianceService } from '@/services/compliance.service';
import {
  InspectionStatus,
  InspectionResult,
  type InspectionListItem,
  getInspectionStatusColor,
  getInspectionStatusLabel,
  getInspectionResultColor,
  getInspectionResultLabel,
} from '@/types/compliance';

export default function InspectionsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [inspections, setInspections] = useState<InspectionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Load inspections
  const loadInspections = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await complianceService.getInspections({
        status: selectedStatus !== 'all' ? (selectedStatus as InspectionStatus) : undefined,
        page,
        size: 10,
      });

      setInspections(response.data?.content || []);
      setTotalPages(response.data?.totalPages || 0);
      setTotalElements(response.data?.totalElements || 0);
    } catch (error) {
      console.error('Failed to load inspections:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inspections',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, page, toast]);

  useEffect(() => {
    loadInspections();
  }, [loadInspections]);

  // Handle refresh
  const handleRefresh = () => {
    loadInspections();
  };

  // Get status badge
  const getStatusBadge = (status: InspectionStatus) => {
    const colorClass = getInspectionStatusColor(status);
    return (
      <Badge className={colorClass}>
        {getInspectionStatusLabel(status)}
      </Badge>
    );
  };

  // Get result badge
  const getResultBadge = (result: InspectionResult | null | undefined) => {
    if (!result) return '-';
    const colorClass = getInspectionResultColor(result);
    return (
      <Badge className={colorClass}>
        {getInspectionResultLabel(result)}
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

  return (
    <div className="container mx-auto space-y-6" data-testid="inspections-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="inspections-page-title">
            Inspections
          </h1>
          <p className="text-muted-foreground">
            {totalElements} inspection{totalElements !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => router.push('/property-manager/compliance/inspections/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Inspection
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={(value) => { setSelectedStatus(value); setPage(0); }}>
              <SelectTrigger className="w-[180px]" data-testid="inspection-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.values(InspectionStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {getInspectionStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inspections Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : inspections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-semibold mb-1">No inspections found</h3>
              <p className="text-sm mb-4">
                {selectedStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Schedule your first inspection'}
              </p>
              {selectedStatus === 'all' && (
                <Button onClick={() => router.push('/property-manager/compliance/inspections/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Inspection
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Inspector</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspections.map((inspection) => (
                    <TableRow
                      key={inspection.id}
                      className="cursor-pointer hover:bg-muted/50"
                      data-testid={`inspection-row-${inspection.id}`}
                      onClick={() => router.push(`/property-manager/compliance/inspections/${inspection.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{inspection.propertyName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{inspection.requirementName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(inspection.scheduledDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{inspection.inspectorName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(inspection.status)}</TableCell>
                      <TableCell>{getResultBadge(inspection.result)}</TableCell>
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
                                router.push(`/property-manager/compliance/inspections/${inspection.id}`);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {inspection.status === InspectionStatus.SCHEDULED && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/property-manager/compliance/inspections/${inspection.id}/record`);
                                }}
                              >
                                <ClipboardCheck className="mr-2 h-4 w-4" />
                                Record Results
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {inspections.length} of {totalElements} inspections
                </div>

                {totalPages > 1 && (
                  <Pagination className="mx-0 w-auto">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => page > 0 && setPage(page - 1)}
                          className={page === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>

                      {page > 2 && (
                        <>
                          <PaginationItem>
                            <PaginationLink onClick={() => setPage(0)} className="cursor-pointer">1</PaginationLink>
                          </PaginationItem>
                          {page > 3 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                        </>
                      )}

                      {Array.from({ length: totalPages }, (_, i) => i)
                        .filter(p => Math.abs(p - page) <= 2)
                        .map(p => (
                          <PaginationItem key={p}>
                            <PaginationLink
                              onClick={() => setPage(p)}
                              isActive={p === page}
                              className="cursor-pointer"
                            >
                              {p + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                      {page < totalPages - 3 && (
                        <>
                          {page < totalPages - 4 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                          <PaginationItem>
                            <PaginationLink onClick={() => setPage(totalPages - 1)} className="cursor-pointer">{totalPages}</PaginationLink>
                          </PaginationItem>
                        </>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => page < totalPages - 1 && setPage(page + 1)}
                          className={page >= totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}

                <div className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages || 1}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
