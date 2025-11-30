'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Settings, LogOut, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    <header className="bg-muted sticky top-0 z-50 flex h-14 items-center justify-between gap-6 px-4 py-2 sm:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="[&_svg]:!size-5" />

        {/* Breadcrumbs */}
        <Breadcrumb className="hidden md:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard" className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {breadcrumbItems.map(({ path, label, isLast }) => (
              <span key={path} className="contents">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={path}>{label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right side - Theme Toggle & Avatar */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile photo" />}
                <AvatarFallback className="bg-primary/10 text-sm font-medium">
                  {user ? getUserInitials(displayName, user.firstName, user.lastName) : '?'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end" forceMount>
            <DropdownMenuLabel className="flex items-center gap-4 px-4 py-2.5 font-normal">
              <div className="relative">
                <Avatar className="size-10">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile photo" />}
                  <AvatarFallback className="bg-primary/10 text-sm font-medium">
                    {user ? getUserInitials(displayName, user.firstName, user.lastName) : '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="ring-card absolute right-0 bottom-0 block size-2 rounded-full bg-green-600 ring-2" />
              </div>
              <div className="flex flex-1 flex-col items-start">
                <span className="text-foreground text-lg font-semibold">
                  {user ? getDisplayNameOrFullName(displayName, user.firstName, user.lastName) : 'User'}
                </span>
                <span className="text-muted-foreground text-base">{user?.email}</span>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem className="px-4 py-2.5 text-base" asChild>
                <Link href="/settings/profile">
                  <User className="text-foreground size-5" />
                  <span>My Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="px-4 py-2.5 text-base" asChild>
                <Link href="/settings">
                  <Settings className="text-foreground size-5" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem className="px-4 py-2.5 text-base" asChild>
                <Link href="/settings/users">
                  <Users className="text-foreground size-5" />
                  <span>Manage Users</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem variant="destructive" className="px-4 py-2.5 text-base" onClick={() => logout()}>
              <LogOut className="size-5" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
