'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Settings,
  LogOut,
  User,
  Users,
  Bell,
  Search,
  ChevronRight,
  Command,
  Sparkles,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth-context';
import { useState, useEffect } from 'react';
import { getMyProfile } from '@/services/user-profile.service';
import { getUserInitials, getDisplayNameOrFullName } from '@/types/user-profile';
import { ThemeToggle } from '@/components/theme-toggle';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  properties: 'Properties',
  tenants: 'Tenants',
  leads: 'Leads',
  'leads-quotes': 'Leads & Quotes',
  quotations: 'Quotations',
  settings: 'Settings',
  security: 'Security',
  units: 'Units',
  'property-manager': 'Property Manager',
  vendors: 'Vendors',
  'work-orders': 'Work Orders',
  'pm-schedules': 'PM Schedules',
  unassigned: 'Unassigned',
  'expiring-documents': 'Expiring Documents',
  ranking: 'Ranking',
  compare: 'Compare',
  tenant: 'Tenant Portal',
  requests: 'Requests',
  profile: 'Profile',
  create: 'Create',
  new: 'New',
  edit: 'Edit',
  invoices: 'Invoices',
  expenses: 'Expenses',
  assets: 'Assets',
  compliance: 'Compliance',
  pdc: 'PDC',
  checkouts: 'Checkouts',
  leases: 'Leases',
  extensions: 'Extensions',
  announcements: 'Announcements',
  users: 'Users',
  'bank-accounts': 'Bank Accounts',
  'parking-spots': 'Parking Spots',
  reports: 'Reports',
  documents: 'Documents',
};

function formatSegment(segment: string): string {
  if (routeLabels[segment]) {
    return routeLabels[segment];
  }
  if (/^[0-9a-f-]{36}$/i.test(segment) || /^\d+$/.test(segment)) {
    return 'Details';
  }
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function Header() {
  const pathname = usePathname();
  const { user, logout, isLoading: authLoading, isAuthenticated } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (authLoading || !isAuthenticated || !user || user.role === 'TENANT') return;

      try {
        const profile = await getMyProfile();
        setAvatarUrl(profile.avatarUrl);
        setDisplayName(profile.displayName);
      } catch (error) {
        console.debug('Could not fetch user profile for avatar:', error);
      }
    };

    fetchProfile();
  }, [user, authLoading, isAuthenticated]);

  const segments = pathname.split('/').filter(Boolean);

  const breadcrumbItems = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');
    const label = formatSegment(segment);
    const isLast = index === segments.length - 1;

    return { segment, path, label, isLast };
  });

  return (
    <TooltipProvider>
      <header className="bg-muted sticky top-0 z-50 flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          {/* Sidebar Trigger */}
          <SidebarTrigger className="[&_svg]:!size-5" />

          <Separator orientation="vertical" className="hidden !h-4 md:block" />

          {/* Breadcrumbs */}
          <Breadcrumb className="hidden md:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center justify-center h-6 w-6 rounded-md bg-primary/10">
                      <Home className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="font-medium">Home</span>
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>

              {breadcrumbItems.map(({ path, label, isLast }) => (
                <span key={path} className="contents">
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-semibold text-foreground">
                        {label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link
                          href={path}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Right side - Search, Actions & Profile */}
        <div className="flex items-center gap-2">
          {/* Global Search */}
          <div className="relative hidden lg:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-64 pl-9 pr-12 h-9 rounded-lg bg-muted/50 border-transparent focus:border-border focus:bg-background transition-colors"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                  <Command className="h-3 w-3" />K
                </kbd>
              </div>
            </div>
          </div>

          <Separator orientation="vertical" className="h-6 hidden lg:block mx-2" />

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            {/* Help Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg hover:bg-muted transition-colors"
                >
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="sr-only">Help</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Help & Resources</p>
              </TooltipContent>
            </Tooltip>

            {/* Notification Bell */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9 rounded-lg hover:bg-muted transition-colors"
                >
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
                  <span className="sr-only">Notifications</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Notifications</p>
              </TooltipContent>
            </Tooltip>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>

          <Separator orientation="vertical" className="h-6 mx-2" />

          {/* User Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 gap-2 rounded-lg px-2 hover:bg-muted transition-colors"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8 rounded-lg border shadow-sm">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile photo" />}
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 text-xs font-semibold">
                      {user ? getUserInitials(displayName, user.firstName, user.lastName) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                </div>
                <div className="hidden md:flex flex-col items-start text-left">
                  <span className="text-sm font-medium truncate max-w-[120px]">
                    {user ? getDisplayNameOrFullName(displayName, user.firstName, user.lastName) : 'User'}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 rounded-xl p-2" align="end" forceMount>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-4 px-3 py-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg">
                  <div className="relative">
                    <Avatar className="h-14 w-14 rounded-xl border-2 border-background shadow-lg">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile photo" />}
                      <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 text-lg font-semibold">
                        {user ? getUserInitials(displayName, user.firstName, user.lastName) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background">
                      <Sparkles className="h-3 w-3 text-white" />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col items-start">
                    <span className="text-lg font-bold">
                      {user ? getDisplayNameOrFullName(displayName, user.firstName, user.lastName) : 'User'}
                    </span>
                    <span className="text-sm text-muted-foreground">{user?.email}</span>
                    <Badge
                      variant="secondary"
                      className="mt-2 bg-background/80 text-xs font-medium"
                    >
                      {user?.role?.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ') || 'User'}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="my-2" />

              <DropdownMenuGroup>
                <DropdownMenuItem className="px-3 py-2.5 rounded-lg cursor-pointer" asChild>
                  <Link href="/settings/profile" className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-muted/50">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">My Profile</span>
                      <span className="text-xs text-muted-foreground">View and edit your profile</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="px-3 py-2.5 rounded-lg cursor-pointer" asChild>
                  <Link href="/settings" className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-muted/50">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">Settings</span>
                      <span className="text-xs text-muted-foreground">Manage your preferences</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="my-2" />

              <DropdownMenuGroup>
                <DropdownMenuItem className="px-3 py-2.5 rounded-lg cursor-pointer" asChild>
                  <Link href="/settings/users" className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-muted/50">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">Manage Users</span>
                      <span className="text-xs text-muted-foreground">Team and permissions</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="px-3 py-2.5 rounded-lg cursor-pointer" asChild>
                  <Link href="#" className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-muted/50">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">Feedback</span>
                      <span className="text-xs text-muted-foreground">Share your thoughts</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="my-2" />

              <DropdownMenuItem
                className="px-3 py-2.5 rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => logout()}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-destructive/10">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">Sign out</span>
                    <span className="text-xs opacity-70">End your session</span>
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </TooltipProvider>
  );
}
