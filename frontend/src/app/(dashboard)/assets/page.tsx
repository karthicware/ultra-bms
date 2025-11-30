'use client';

/**
 * Asset List Page
 * Story 7.1: Asset Registry and Tracking
 * AC #18: Asset list page with table, filters, and status badges
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { assetService } from '@/services/asset.service';
import {
  AssetListItem,
  AssetCategory,
  AssetStatus,
  ASSET_CATEGORY_OPTIONS,
  ASSET_STATUS_OPTIONS,
} from '@/types/asset';
import {
  Plus,
  Search,
  Eye,
  ArrowUpDown,
  AlertTriangle,
  Package,
  Shield,
  XCircle,
} from 'lucide-react';

export default function AssetsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [assets, setAssets] = useState<AssetListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');

  // Fetch assets
  const fetchAssets = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await assetService.getAssets({
        search: searchTerm || undefined,
        category: categoryFilter === 'ALL' ? undefined : categoryFilter as AssetCategory,
        status: statusFilter === 'ALL' ? undefined : statusFilter as AssetStatus,
        page: currentPage,
        size: pageSize,
        sortBy: sortField,
        sortDirection,
      });

      setAssets(response.data?.content || []);
      setTotalPages(response.data?.totalPages || 0);
      setTotalElements(response.data?.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assets',
        variant: 'destructive',
      });
      setAssets([]);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, searchTerm, categoryFilter, statusFilter, sortField, sortDirection]);

  // Debounced search
  const debouncedFetchAssets = useMemo(
    () => debounce(fetchAssets, 300),
    [fetchAssets]
  );

  useEffect(() => {
    debouncedFetchAssets();
    return () => debouncedFetchAssets.cancel();
  }, [debouncedFetchAssets]);

  // Handlers
  const handleCreateAsset = () => {
    router.push('/assets/new');
  };

  const handleViewAsset = (id: string) => {
    router.push(`/assets/${id}`);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortField(field);
      setSortDirection('DESC');
    }
  };

  // Status badge helper
  const getStatusBadge = (status: AssetStatus, statusDisplayName: string, statusColor: string) => {
    const colorMap: Record<string, string> = {
      green: 'bg-green-100 text-green-800 border-green-200',
      amber: 'bg-amber-100 text-amber-800 border-amber-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return (
      <Badge className={`${colorMap[statusColor] || colorMap.gray} border`}>
        {statusDisplayName}
      </Badge>
    );
  };

  // Warranty status badge helper
  const getWarrantyBadge = (warrantyStatus: string | null, daysRemaining: number | null) => {
    if (!warrantyStatus || warrantyStatus === 'NO_WARRANTY') {
      return <span className="text-gray-400 text-sm" data-testid="badge-warranty-status">No warranty</span>;
    }

    const badgeConfig: Record<string, { className: string; icon: React.ReactNode }> = {
      ACTIVE: {
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: <Shield className="h-3 w-3 mr-1" />,
      },
      EXPIRING_SOON: {
        className: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: <AlertTriangle className="h-3 w-3 mr-1" />,
      },
      EXPIRED: {
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle className="h-3 w-3 mr-1" />,
      },
    };

    const config = badgeConfig[warrantyStatus] || badgeConfig.EXPIRED;
    const label = daysRemaining !== null && daysRemaining > 0
      ? `${daysRemaining} days`
      : warrantyStatus === 'EXPIRED'
        ? 'Expired'
        : warrantyStatus.replace('_', ' ');

    return (
      <Badge className={`${config.className} border flex items-center`} data-testid="badge-warranty-status">
        {config.icon}
        {label}
      </Badge>
    );
  };

  // Category badge helper
  const getCategoryBadge = (category: AssetCategory, displayName: string) => {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        {displayName}
      </Badge>
    );
  };

  return (
    <div className="space-y-6" data-testid="page-assets">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
          <p className="text-gray-500">Manage property assets and equipment</p>
        </div>
        <Button onClick={handleCreateAsset} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value);
                setCurrentPage(0);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {ASSET_CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(0);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {ASSET_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Expiring Warranties Quick Filter */}
            <Button
              variant="outline"
              onClick={() => router.push('/assets?warranty=expiring')}
              className="flex items-center"
            >
              <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
              Expiring Warranties
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('assetNumber')}
                >
                  <div className="flex items-center gap-2">
                    Asset #
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('assetName')}
                >
                  <div className="flex items-center gap-2">
                    Name
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Warranty</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Package className="h-8 w-8 mb-2" />
                      <p>No assets found</p>
                      <p className="text-sm">Create your first asset to get started</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => (
                  <TableRow
                    key={asset.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleViewAsset(asset.id)}
                  >
                    <TableCell className="font-medium">{asset.assetNumber}</TableCell>
                    <TableCell>{asset.assetName}</TableCell>
                    <TableCell>
                      {getCategoryBadge(asset.category, asset.categoryDisplayName)}
                    </TableCell>
                    <TableCell>{asset.propertyName}</TableCell>
                    <TableCell className="text-sm text-gray-600">{asset.location}</TableCell>
                    <TableCell>
                      {getStatusBadge(asset.status, asset.statusDisplayName, asset.statusColor)}
                    </TableCell>
                    <TableCell>
                      {getWarrantyBadge(asset.warrantyStatus, asset.warrantyDaysRemaining)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewAsset(asset.id);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination Footer */}
        {assets.length > 0 && (
        <CardContent className="py-4 border-t">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {assets.length} of {totalElements} assets
            </div>

            {totalPages > 1 && (
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => currentPage > 0 && setCurrentPage(currentPage - 1)}
                      className={currentPage === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>

                  {currentPage > 2 && (
                    <>
                      <PaginationItem>
                        <PaginationLink onClick={() => setCurrentPage(0)} className="cursor-pointer">1</PaginationLink>
                      </PaginationItem>
                      {currentPage > 3 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                    </>
                  )}

                  {Array.from({ length: totalPages }, (_, i) => i)
                    .filter(page => Math.abs(page - currentPage) <= 2)
                    .map(page => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={page === currentPage}
                          className="cursor-pointer"
                        >
                          {page + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                  {currentPage < totalPages - 3 && (
                    <>
                      {currentPage < totalPages - 4 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                      <PaginationItem>
                        <PaginationLink onClick={() => setCurrentPage(totalPages - 1)} className="cursor-pointer">{totalPages}</PaginationLink>
                      </PaginationItem>
                    </>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => currentPage < totalPages - 1 && setCurrentPage(currentPage + 1)}
                      className={currentPage >= totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}

            <div className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages || 1}
            </div>
          </div>
        </CardContent>
        )}
      </Card>
    </div>
  );
}
