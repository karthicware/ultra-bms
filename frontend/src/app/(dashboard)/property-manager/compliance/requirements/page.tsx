'use client';

/**
 * Compliance Requirements List Page
 * Story 7.3: Compliance and Inspection Tracking
 *
 * AC #34: Manage compliance requirements
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  Loader2,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ShieldCheck,
  Calendar,
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

import { complianceService } from '@/services/compliance.service';
import {
  ComplianceCategory,
  RequirementStatus,
  ComplianceFrequency,
  type ComplianceRequirementListItem,
  getCategoryLabel,
  getCategoryColor,
  getFrequencyLabel,
} from '@/types/compliance';

export default function RequirementsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [requirements, setRequirements] = useState<ComplianceRequirementListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requirementToDelete, setRequirementToDelete] = useState<ComplianceRequirementListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load requirements
  const loadRequirements = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await complianceService.getRequirements({
        search: searchTerm || undefined,
        category: selectedCategory !== 'all' ? (selectedCategory as ComplianceCategory) : undefined,
        status: selectedStatus !== 'all' ? (selectedStatus as RequirementStatus) : undefined,
        page,
        size: 20,
      });

      setRequirements(response.data?.content || []);
      setTotalPages(response.data?.totalPages || 0);
      setTotalElements(response.data?.totalElements || 0);
    } catch (error) {
      console.error('Failed to load requirements:', error);
      toast({
        title: 'Error',
        description: 'Failed to load compliance requirements',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedCategory, selectedStatus, page, toast]);

  useEffect(() => {
    loadRequirements();
  }, [loadRequirements]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle refresh
  const handleRefresh = () => {
    loadRequirements();
  };

  // Handle delete
  const handleDeleteClick = (requirement: ComplianceRequirementListItem) => {
    setRequirementToDelete(requirement);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!requirementToDelete) return;

    try {
      setIsDeleting(true);
      await complianceService.deleteRequirement(requirementToDelete.id);
      toast({
        title: 'Requirement Deleted',
        description: `${requirementToDelete.requirementName} has been deleted successfully`,
      });
      setDeleteDialogOpen(false);
      setRequirementToDelete(null);
      loadRequirements();
    } catch (error) {
      console.error('Failed to delete requirement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete requirement',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Get category badge
  const getCategoryBadge = (category: ComplianceCategory) => {
    const colorClass = getCategoryColor(category);
    return (
      <Badge className={colorClass}>
        {getCategoryLabel(category)}
      </Badge>
    );
  };

  // Get status badge
  const getStatusBadge = (status: RequirementStatus) => {
    return (
      <Badge variant={status === RequirementStatus.ACTIVE ? 'default' : 'secondary'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-6" data-testid="requirements-page">
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
            <BreadcrumbPage>Requirements</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="requirements-page-title">
            Compliance Requirements
          </h1>
          <p className="text-muted-foreground">
            {totalElements} requirement{totalElements !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => router.push('/property-manager/compliance/requirements/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Requirement
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
                placeholder="Search requirements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                data-testid="requirement-search-input"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={(value) => { setSelectedCategory(value); setPage(0); }}>
              <SelectTrigger className="w-[180px]" data-testid="requirement-category-filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.values(ComplianceCategory).map((category) => (
                  <SelectItem key={category} value={category}>
                    {getCategoryLabel(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={(value) => { setSelectedStatus(value); setPage(0); }}>
              <SelectTrigger className="w-[150px]" data-testid="requirement-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.values(RequirementStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requirements Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : requirements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShieldCheck className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-semibold mb-1">No requirements found</h3>
              <p className="text-sm mb-4">
                {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first compliance requirement'}
              </p>
              {!searchTerm && selectedCategory === 'all' && selectedStatus === 'all' && (
                <Button onClick={() => router.push('/property-manager/compliance/requirements/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Requirement
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requirements.map((requirement) => (
                    <TableRow
                      key={requirement.id}
                      className="cursor-pointer hover:bg-muted/50"
                      data-testid={`requirement-row-${requirement.id}`}
                      onClick={() => router.push(`/property-manager/compliance/requirements/${requirement.id}`)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{requirement.requirementName}</p>
                          <p className="text-sm text-muted-foreground">
                            {requirement.requirementNumber}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryBadge(requirement.category)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{getFrequencyLabel(requirement.frequency)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(requirement.status)}</TableCell>
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
                                router.push(`/property-manager/compliance/requirements/${requirement.id}`);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/property-manager/compliance/requirements/${requirement.id}/edit`);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(requirement);
                              }}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Requirement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{requirementToDelete?.requirementName}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
