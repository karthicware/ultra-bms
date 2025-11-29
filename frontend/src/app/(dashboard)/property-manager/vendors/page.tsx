'use client';

/**
 * Vendor List Page
 * Story 5.1: Vendor Registration and Profile Management
 *
 * AC #1: Vendor list view with search and filters
 * AC #2: Displays vendor number, company name, contact, categories, rating, status
 * AC #3: Pagination support
 * AC #4: Filter by status and service category
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Plus,
  ArrowUpDown,
  Building2,
  Phone,
  Star,
  Loader2,
  Users,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Trophy,
  Scale,
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
import { Input } from '@/components/ui/input';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

import { getVendors, deleteVendor } from '@/services/vendors.service';
import {
  VendorStatus,
  ServiceCategory,
  type VendorListItem,
  getVendorStatusColor,
} from '@/types/vendors';

// Sort options
type SortOption = 'companyName' | 'createdAt' | 'rating';
type SortDirection = 'ASC' | 'DESC';

export default function VendorsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('companyName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('ASC');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<VendorListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load vendors
  const loadVendors = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getVendors({
        search: searchTerm || undefined,
        status: selectedStatus !== 'all' ? (selectedStatus as VendorStatus) : undefined,
        serviceCategories: selectedCategory !== 'all' ? [selectedCategory as ServiceCategory] : undefined,
        sortBy,
        sortDirection,
        page,
        size: 20,
      });

      setVendors(response.data?.content || []);
      setTotalPages(response.data?.totalPages || 0);
      setTotalElements(response.data?.totalElements || 0);
    } catch (error) {
      console.error('Failed to load vendors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vendors',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, selectedCategory, searchTerm, sortBy, sortDirection, page]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handlers
  const handleSort = (column: SortOption) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortDirection('ASC');
    }
    setPage(0);
  };

  const handleRefresh = () => {
    loadVendors();
  };

  const handleDeleteClick = (vendor: VendorListItem) => {
    setVendorToDelete(vendor);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!vendorToDelete) return;

    try {
      setIsDeleting(true);
      await deleteVendor(vendorToDelete.id);
      toast({
        title: 'Vendor Deleted',
        description: `${vendorToDelete.companyName} has been deleted successfully`,
      });
      setDeleteDialogOpen(false);
      setVendorToDelete(null);
      loadVendors();
    } catch (error) {
      console.error('Failed to delete vendor:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete vendor',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: VendorStatus) => {
    const colorClass = getVendorStatusColor(status);
    return (
      <Badge className={colorClass}>
        {status}
      </Badge>
    );
  };

  // Render rating stars
  const renderRating = (rating: number | null | undefined) => {
    if (rating === null || rating === undefined) {
      return <span className="text-muted-foreground text-sm">Not rated</span>;
    }
    return (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6" data-testid="vendors-page">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/property-manager/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Vendors</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="vendors-page-title">
            Vendors
          </h1>
          <p className="text-muted-foreground">
            {totalElements} vendor{totalElements !== 1 ? 's' : ''} registered
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/property-manager/vendors/ranking')}
            data-testid="view-rankings-button"
          >
            <Trophy className="mr-2 h-4 w-4 text-yellow-500" />
            Rankings
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/property-manager/vendors/compare')}
            data-testid="compare-vendors-button"
          >
            <Scale className="mr-2 h-4 w-4" />
            Compare
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => router.push('/property-manager/vendors/new')} data-testid="add-vendor-button">
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by company name, contact, or vendor number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                data-testid="vendor-search-input"
              />
            </div>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={(value) => { setSelectedStatus(value); setPage(0); }}>
              <SelectTrigger className="w-[180px]" data-testid="vendor-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.values(VendorStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={(value) => { setSelectedCategory(value); setPage(0); }}>
              <SelectTrigger className="w-[200px]" data-testid="vendor-category-filter">
                <SelectValue placeholder="Service Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.values(ServiceCategory).map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : vendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-semibold mb-1">No vendors found</h3>
              <p className="text-sm mb-4">
                {searchTerm || selectedStatus !== 'all' || selectedCategory !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first vendor'}
              </p>
              {!searchTerm && selectedStatus === 'all' && selectedCategory === 'all' && (
                <Button onClick={() => router.push('/property-manager/vendors/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Vendor
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Vendor #</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 -ml-2"
                        onClick={() => handleSort('companyName')}
                        data-testid="sort-company-name"
                      >
                        Company Name
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Service Categories</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 -ml-2"
                        onClick={() => handleSort('rating')}
                        data-testid="sort-rating"
                      >
                        Rating
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((vendor) => (
                    <TableRow
                      key={vendor.id}
                      className="cursor-pointer hover:bg-muted/50"
                      data-testid={`vendor-row-${vendor.id}`}
                      onClick={() => router.push(`/property-manager/vendors/${vendor.id}`)}
                    >
                      <TableCell className="font-mono text-sm">
                        <Link
                          href={`/property-manager/vendors/${vendor.id}`}
                          className="hover:underline text-primary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {vendor.vendorNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{vendor.companyName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{vendor.contactPersonName}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {vendor.serviceCategories?.slice(0, 2).map((category) => (
                            <Badge key={category} variant="outline" className="text-xs">
                              {category.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                          {vendor.serviceCategories && vendor.serviceCategories.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{vendor.serviceCategories.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{renderRating(vendor.rating)}</TableCell>
                      <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" data-testid={`vendor-actions-${vendor.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/property-manager/vendors/${vendor.id}`);
                              }}
                              data-testid={`view-vendor-${vendor.id}`}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/property-manager/vendors/${vendor.id}/edit`);
                              }}
                              data-testid={`edit-vendor-${vendor.id}`}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(vendor);
                              }}
                              data-testid={`delete-vendor-${vendor.id}`}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
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
                      data-testid="pagination-prev"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                      disabled={page >= totalPages - 1}
                      data-testid="pagination-next"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{vendorToDelete?.companyName}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete-vendor"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
