'use client';

/**
 * Admin User Management Page - Modern Redesign
 * Story 2.6: Admin User Management (AC #9)
 * Displays all users with search, filters, and CRUD actions
 * Inspired by leads page with executive dashboard aesthetic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import Link from 'next/link';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { getAdminUsers, getRoles, deactivateAdminUser, reactivateAdminUser } from '@/services/admin-users.service';
import type { AdminUser, Role, UserStatus } from '@/types/admin-users';
import { USER_STATUS_STYLES, ROLE_DISPLAY_NAMES } from '@/types/admin-users';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import CreateUserDialog from './create-user-dialog';
import EditUserDialog from './edit-user-dialog';
import ViewUserDialog from './view-user-dialog';
import {
  Plus,
  Search,
  Users,
  MoreHorizontal,
  Pencil,
  UserX,
  UserCheck,
  RefreshCw,
  Eye,
  Filter,
  LayoutGrid,
  List,
  Shield,
  UserCog,
  Activity,
  ArrowRight,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  Key,
  Building2,
  MoreVertical,
  ArrowUpRight,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';

/**
 * User status styles matching the aesthetic of other pages
 */
const STATUS_STYLES: Record<UserStatus, { badge: string; dot: string; icon: React.ReactNode; gradient: string }> = {
  ACTIVE: {
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    gradient: 'from-emerald-500/10 to-emerald-500/5',
  },
  INACTIVE: {
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400 border-red-200',
    dot: 'bg-red-500',
    icon: <XCircle className="h-3.5 w-3.5" />,
    gradient: 'from-red-500/10 to-red-500/5',
  },
  PENDING: {
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400 border-amber-200',
    dot: 'bg-amber-500',
    icon: <Clock className="h-3.5 w-3.5" />,
    gradient: 'from-amber-500/10 to-amber-500/5',
  },
};

/**
 * Role icons and styles
 */
const ROLE_STYLES: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  SUPER_ADMIN: {
    icon: <Shield className="h-4 w-4" />,
    color: 'text-purple-600',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
  },
  PROPERTY_MANAGER: {
    icon: <Building2 className="h-4 w-4" />,
    color: 'text-blue-600',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  MAINTENANCE_SUPERVISOR: {
    icon: <Settings className="h-4 w-4" />,
    color: 'text-orange-600',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
  },
  FINANCE_MANAGER: {
    icon: <Activity className="h-4 w-4" />,
    color: 'text-green-600',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
  TENANT: {
    icon: <Users className="h-4 w-4" />,
    color: 'text-cyan-600',
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
  VENDOR: {
    icon: <UserCog className="h-4 w-4" />,
    color: 'text-pink-600',
    bg: 'bg-pink-100 dark:bg-pink-900/30',
  },
};

const DEFAULT_ROLE_STYLE = {
  icon: <Users className="h-4 w-4" />,
  color: 'text-gray-600',
  bg: 'bg-gray-100 dark:bg-gray-800/30',
};

export default function UsersPage() {
  const { toast } = useToast();

  // Data State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Dialog State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setSearchTerm(value);
      setCurrentPage(0);
    }, 300),
    []
  );

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await getAdminUsers({
        search: searchTerm || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: currentPage,
        size: pageSize,
      });

      setUsers(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again.',
        variant: 'destructive',
      });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, roleFilter, statusFilter, toast]);

  // Fetch roles for dropdowns
  const fetchRoles = useCallback(async () => {
    try {
      const rolesData = await getRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error('[UsersPage] Failed to fetch roles:', error);
      setRoles([]);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Calculate stats from users
  const stats = useMemo(() => {
    const activeCount = users.filter(u => u.status === 'ACTIVE').length;
    const inactiveCount = users.filter(u => u.status === 'INACTIVE').length;
    const pendingCount = users.filter(u => u.status === 'PENDING').length;

    return {
      total: totalElements,
      active: activeCount,
      inactive: inactiveCount,
      pending: pendingCount,
    };
  }, [users, totalElements]);

  // Handlers
  const handleCreateUser = () => {
    setCreateDialogOpen(true);
  };

  const handleViewUser = (user: AdminUser) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDeactivateClick = (user: AdminUser) => {
    setSelectedUser(user);
    setDeactivateDialogOpen(true);
  };

  const handleReactivateClick = (user: AdminUser) => {
    setSelectedUser(user);
    setReactivateDialogOpen(true);
  };

  const handleDeactivateConfirm = async () => {
    if (!selectedUser) return;

    try {
      setIsActionLoading(true);
      await deactivateAdminUser(selectedUser.id);
      toast({
        title: 'User Deactivated',
        description: `${selectedUser.firstName} ${selectedUser.lastName} has been deactivated.`,
        variant: 'success',
      });
      fetchUsers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to deactivate user';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
      setDeactivateDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleReactivateConfirm = async () => {
    if (!selectedUser) return;

    try {
      setIsActionLoading(true);
      await reactivateAdminUser(selectedUser.id);
      toast({
        title: 'User Reactivated',
        description: `${selectedUser.firstName} ${selectedUser.lastName} has been reactivated.`,
        variant: 'success',
      });
      fetchUsers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reactivate user';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
      setReactivateDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleUserCreated = () => {
    setCreateDialogOpen(false);
    fetchUsers();
  };

  const handleUserUpdated = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
    fetchUsers();
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return '-';
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    const style = STATUS_STYLES[status] || STATUS_STYLES.ACTIVE;
    return (
      <Badge variant="secondary" className={cn("shadow-sm", style.badge)}>
        <div className={cn("h-1.5 w-1.5 rounded-full mr-1.5", style.dot)} />
        {USER_STATUS_STYLES[status]?.label || status}
      </Badge>
    );
  };

  const getRoleDisplayName = (roleName: string) => {
    return ROLE_DISPLAY_NAMES[roleName] || roleName;
  };

  const getRoleStyle = (roleName: string) => {
    return ROLE_STYLES[roleName] || DEFAULT_ROLE_STYLE;
  };

  // Get user initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (isLoading && users.length === 0) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
          <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">

          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border shadow-sm">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
            <div className="relative px-8 py-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                      <p className="text-muted-foreground">
                        Manage system users, roles, and access permissions
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={fetchUsers}
                    className="gap-2"
                  >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    Refresh
                  </Button>
                  <Button
                    onClick={handleCreateUser}
                    size="lg"
                    className="gap-2 shadow-lg shadow-primary/20"
                  >
                    <Plus className="h-5 w-5" />
                    Create User
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Dashboard */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All registered users
                </p>
              </CardContent>
            </Card>

            {/* Active Users */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">{stats.active}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Can log in
                </p>
              </CardContent>
            </Card>

            {/* Inactive Users */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Inactive
                </CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{stats.inactive}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Deactivated accounts
                </p>
              </CardContent>
            </Card>

            {/* Pending Users */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending
                </CardTitle>
                <Clock className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">{stats.pending}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting activation
                </p>
              </CardContent>
            </Card>
          </div>

          {/* User Status Pipeline */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  User Status Overview
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="flex items-center gap-2 flex-wrap">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setStatusFilter('ACTIVE')}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors border",
                        statusFilter === 'ACTIVE'
                          ? "bg-emerald-100 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-700"
                          : "bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800"
                      )}
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{stats.active} Active</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Users who can log in</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setStatusFilter('PENDING')}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors border",
                        statusFilter === 'PENDING'
                          ? "bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700"
                          : "bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/30 border-amber-200 dark:border-amber-800"
                      )}
                    >
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">{stats.pending} Pending</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Awaiting activation</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setStatusFilter('INACTIVE')}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors border",
                        statusFilter === 'INACTIVE'
                          ? "bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700"
                          : "bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/30 border-red-200 dark:border-red-800"
                      )}
                    >
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-semibold text-red-700 dark:text-red-400">{stats.inactive} Inactive</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Deactivated accounts</TooltipContent>
                </Tooltip>

                {statusFilter !== 'all' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                    className="text-muted-foreground"
                  >
                    Clear filter
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Filters & Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Status Tabs */}
                <Tabs
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  className="w-full lg:w-auto"
                >
                  <TabsList className="grid w-full lg:w-auto grid-cols-4 h-10">
                    <TabsTrigger value="all" className="gap-1.5 px-3 text-xs lg:text-sm">
                      <Filter className="h-3.5 w-3.5" />
                      All
                    </TabsTrigger>
                    <TabsTrigger value="ACTIVE" className="gap-1.5 px-3 text-xs lg:text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Active
                    </TabsTrigger>
                    <TabsTrigger value="PENDING" className="gap-1.5 px-3 text-xs lg:text-sm">
                      <Clock className="h-3.5 w-3.5" />
                      Pending
                    </TabsTrigger>
                    <TabsTrigger value="INACTIVE" className="gap-1.5 px-3 text-xs lg:text-sm">
                      <XCircle className="h-3.5 w-3.5" />
                      Inactive
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex-1 flex flex-col sm:flex-row gap-3">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      defaultValue={searchTerm}
                      onChange={(e) => debouncedSearch(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>

                  {/* Role Filter */}
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px] h-10">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {getRoleDisplayName(role.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* View Toggle */}
                  <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="h-8 px-3"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-8 px-3"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                `${users.length} of ${totalElements} users`
              )}
            </span>
          </div>

          {/* Content Area */}
          {users.length === 0 && !isLoading ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No users found</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
                    ? "Try adjusting your search or filters."
                    : "Get started by creating your first user."}
                </p>
                {!searchTerm && statusFilter === 'all' && roleFilter === 'all' && (
                  <Button onClick={handleCreateUser} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create User
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-64" />
                ))
              ) : (
                users.map((user) => {
                  const statusStyles = STATUS_STYLES[user.status];
                  const roleStyle = getRoleStyle(user.role);

                  return (
                    <Card
                      key={user.id}
                      className="overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
                      onClick={() => handleViewUser(user)}
                    >
                      {/* Header */}
                      <div className={cn("relative h-24 bg-gradient-to-br", statusStyles.gradient, "to-muted")}>
                        {/* Status Badge */}
                        <div className="absolute top-3 left-3">
                          {getStatusBadge(user.status)}
                        </div>

                        {/* Actions Menu */}
                        <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 bg-background/90 backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === 'ACTIVE' ? (
                                <DropdownMenuItem
                                  onClick={() => handleDeactivateClick(user)}
                                  className="text-destructive"
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleReactivateClick(user)}>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Reactivate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Avatar */}
                        <div className="absolute -bottom-6 left-4">
                          <div className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-xl ring-4 ring-background shadow-lg text-sm font-bold",
                            roleStyle.bg, roleStyle.color
                          )}>
                            {getInitials(user.firstName, user.lastName)}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <CardContent className="p-4 pt-8 flex-1 flex flex-col">
                        <div className="mb-1">
                          <h3 className="font-semibold text-base truncate">
                            {user.firstName} {user.lastName}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>

                        <div className="space-y-1.5 mt-3 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-xs gap-1">
                              <span className={roleStyle.color}>{roleStyle.icon}</span>
                              {getRoleDisplayName(user.role)}
                            </Badge>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              {user.phone}
                            </div>
                          )}
                        </div>

                        <div className="mt-auto pt-3 border-t">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(user.createdAt)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          ) : (
            /* List View - Table */
            <Card>
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    users.map((user) => {
                      const roleStyle = getRoleStyle(user.role);

                      return (
                        <TableRow
                          key={user.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleViewUser(user)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold shrink-0",
                                roleStyle.bg, roleStyle.color
                              )}>
                                {getInitials(user.firstName, user.lastName)}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              <span className={roleStyle.color}>{roleStyle.icon}</span>
                              {getRoleDisplayName(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(user.status)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {user.status === 'ACTIVE' ? (
                                  <DropdownMenuItem
                                    onClick={() => handleDeactivateClick(user)}
                                    className="text-destructive"
                                  >
                                    <UserX className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleReactivateClick(user)}>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Reactivate
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {!isLoading && totalPages > 1 && (
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t max-sm:flex-col md:max-lg:flex-col">
                  <p className="text-muted-foreground text-sm whitespace-nowrap">
                    Page {currentPage + 1} of {totalPages}
                  </p>

                  <Pagination className="mx-0 w-auto">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => currentPage > 0 && handlePageChange(currentPage - 1)}
                          className={currentPage === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>

                      {currentPage > 2 && (
                        <>
                          <PaginationItem>
                            <PaginationLink onClick={() => handlePageChange(0)} className="cursor-pointer">1</PaginationLink>
                          </PaginationItem>
                          {currentPage > 3 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                        </>
                      )}

                      {Array.from({ length: totalPages }, (_, i) => i)
                        .filter(page => Math.abs(page - currentPage) <= 2)
                        .map(page => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
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
                            <PaginationLink onClick={() => handlePageChange(totalPages - 1)} className="cursor-pointer">{totalPages}</PaginationLink>
                          </PaginationItem>
                        </>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => currentPage < totalPages - 1 && handlePageChange(currentPage + 1)}
                          className={currentPage >= totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </Card>
          )}

          {/* Quick Links */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto py-4 justify-start px-4 gap-3 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all"
              onClick={handleCreateUser}
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Create User</div>
                <div className="text-xs text-muted-foreground">Add new system user</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 justify-start px-4 gap-3 hover:border-purple-500/50 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-all"
              asChild
            >
              <Link href="/settings/roles">
                <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Manage Roles</div>
                  <div className="text-xs text-muted-foreground">Configure permissions</div>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 justify-start px-4 gap-3 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all"
              asChild
            >
              <Link href="/settings/security">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Key className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Security Settings</div>
                  <div className="text-xs text-muted-foreground">Password policies</div>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 justify-start px-4 gap-3 hover:border-primary/50 hover:bg-muted/50 transition-all"
              asChild
            >
              <Link href="/settings">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">All Settings</div>
                  <div className="text-xs text-muted-foreground">System configuration</div>
                </div>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Create User Dialog */}
      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        roles={roles}
        onSuccess={handleUserCreated}
      />

      {/* View User Dialog */}
      <ViewUserDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        user={selectedUser}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={selectedUser}
        roles={roles}
        onSuccess={handleUserUpdated}
      />

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate{' '}
              <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>?
              <br /><br />
              This user will no longer be able to log in. You can reactivate them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateConfirm}
              disabled={isActionLoading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isActionLoading ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reactivate Confirmation Dialog */}
      <AlertDialog open={reactivateDialogOpen} onOpenChange={setReactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reactivate{' '}
              <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>?
              <br /><br />
              This user will be able to log in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivateConfirm}
              disabled={isActionLoading}
            >
              {isActionLoading ? 'Reactivating...' : 'Reactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
